if (!localStorage.getItem('nodesData')) {
    localStorage.setItem('nodesData', JSON.stringify(data));
} else {
    data = JSON.parse(localStorage.getItem('nodesData'));
}

const draw = SVG().addTo('#drawing').size(window.innerWidth, window.innerHeight);
const nodes = [];
let clickedNode;

function calcBezierCPX (parentNode, thisNode) {
    if (thisNode.cx() < parentNode.x()) {
        return parentNode.x() + parentNode.width() / 2 - 60;
    } else if (thisNode.cx() > parentNode.x() && thisNode.cx() < parentNode.cx()) {
        return parentNode.x() + parentNode.width() / 2 - 10;
    } else if (thisNode.cx() === parentNode.cx()) {
        return parentNode.x() + parentNode.width() / 2;
    } else if (thisNode.cx() > parentNode.cx() && thisNode.cx() < parentNode.x() + parentNode.width()) {
        return parentNode.x() + parentNode.width() / 2 + 10;
    } else if (thisNode.cx() > parentNode.x() + parentNode.width()) {
        return parentNode.x() + parentNode.width() / 2 + 60;
    }
}

function createNode ({ parent, cx, cy, color, label, id }) {
    const group = draw.group()
    const parentNode = !!parent ? parent : null;
    const node = group.rect(100, 32).radius(16).addClass(color).data('id', id);
    const text = group.text(label);
    const calculatedWidth = text.node.getComputedTextLength() + 40;    
    node.width(calculatedWidth).center(cx, cy);    
    text.center(node.cx(), node.cy());
    const line = parentNode ? renderCurve(parentNode, node) : null;
    return {
        group,
        node,
        text,
        line,
        parent,
        data: {
            parentId: parent ? parent.data('id') : null,
            cx,
            cy,
            color,
            text: label,
            id
        }
    };
};

function renderCurve (parentNode, node) {
    return draw.path(`
        M ${parentNode.x() + parentNode.width() / 2} ${parentNode.y() + parentNode.height()}
        C ${calcBezierCPX(parentNode, node)} ${parentNode.y() + parentNode.height() + 40},
        ${node.x() + node.width() / 2} ${node.y() - 100},
        ${node.x() + node.width() / 2} ${node.y()}
    `).back();
}

function makeDraggable (thisNode) {
    thisNode.group.draggable()
        .on('dragstart.namespace', () => onDragStart(thisNode))
        .on('dragmove.namespace', () => onDragMove(thisNode, nodes))
        .on('dragend.namespace', () => onDragEnd(thisNode));
}

function findNode (id) {
    return nodes.find(elem => elem.node.data('id') === id).node;
}

function onDragStart (currentNode) {
    currentNode.node.addClass('clicked');
    clickedNode = currentNode;
}

function onDragMove (currentNode, allNodes) {
    if (currentNode.line) {
        currentNode.line.remove();
        currentNode.line = renderCurve(currentNode.parent, currentNode.node);
    }
    const children = allNodes.filter(elem => {
        if (elem.parent) {
            return elem.parent.data('id') === currentNode.data.id
        }
    });
    children.forEach((child) => {
        child.line.remove();
        child.line = renderCurve(currentNode.node, child.node);
    });
}

function onDragEnd (currentNode) {
    currentNode.data.cx = currentNode.node.cx();
    currentNode.data.cy = currentNode.node.cy();
}

function onClick (event) {
    clickedNode = findNode(this.data('id'));
    this.addClass('clicked');
}

function addNewNode (nodeData, allNodes) {
    const newNode = createNode(nodeData);
    allNodes.push(newNode);
    makeDraggable(newNode);
    newNode.node.click(onClick);
};




data.forEach((dataElem) => {
    let parent = !!dataElem.parentId
        ? nodes.find(elem => elem.node.data('id') === dataElem.parentId)
        : null;
    const newNode = createNode({
        parent: !!parent ? parent.node : null,
        cx: dataElem.cx,
        cy: dataElem.cy,
        label: dataElem.text,
        color: dataElem.color,
        id: dataElem.id
    });
    nodes.push(newNode);
});

nodes.forEach((thisNode) => {
    thisNode.node.click(onClick);
    makeDraggable(thisNode);
});

document.addEventListener('click', (evt) => {
    if (clickedNode) {
        nodes.forEach(node => node.node.removeClass('clicked'));
        clickedNode.addClass('clicked');        
    }
    if (evt.target.tagName !== 'rect') {
        nodes.forEach(node => node.node.removeClass('clicked'));
    }
    
});

document.addEventListener('dblclick', (evt) => {
    const criterias = document.querySelector('#section3');
    if (evt.offsetY > criterias.offsetTop
        && evt.offsetY < criterias.offsetTop + criterias.offsetHeight) {
        if (!!clickedNode && clickedNode.hasClass('blue')) {
            const label = prompt('New node label:');
            if (label) {
                addNewNode({ parent: clickedNode, cx: evt.pageX, cy: evt.pageY, color: 'purple', label}, nodes);
            }
        }
    }
});

document.querySelector('#save-btn').addEventListener('click', () => {
    const newData = [];
    nodes.forEach((node) => {
        newData.push(node.data);
    });
    localStorage.setItem('nodesData', JSON.stringify(newData));
});