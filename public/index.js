if (!localStorage.getItem('nodesData')) {
    localStorage.setItem('nodesData', JSON.stringify(data));
} else {
    data = JSON.parse(localStorage.getItem('nodesData'));
}

const draw = SVG().addTo('#drawing').size(window.innerWidth, window.innerHeight);
let nodes = [];
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
    return nodes.find(elem => elem.node.data('id') === id);
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

function makeSelectedLines() {
    nodes.forEach((elem) => {
        if (elem.data.parentId === clickedNode.node.data('id')) {
            elem.line.addClass('selected');
        } 
    });
    clickedNode.line.addClass('selected');
}

function deselectLines() {
    nodes.forEach((elem) => {
        if (elem.line) {
            elem.line.removeClass('selected');
        }
    });
}

function deleteSelected() {
    const newNodes = nodes.filter((elem) => {
        return elem.data.id !== clickedNode.data.id && elem.data.parentId !== clickedNode.data.id;
    });
    nodes = newNodes;
    draw.clear();
    nodes.forEach((elem) => {
        const parent = findNode(elem.data.parentId) ? findNode(elem.data.parentId).node : null
        const newNode = createNode({
            ...elem.data,
            parent: parent,
            label: elem.data.text
        });
        newNode.node.click(onClick);
        makeDraggable(newNode);
    });
    clickedNode = null;
    /*******
    /* TODO should save and reload everything after deletion
    */
}


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
        deselectLines();
        nodes.forEach(node => node.node.removeClass('clicked'));
        clickedNode.node.addClass('clicked'); 
        makeSelectedLines();       
    }
    if (evt.target.tagName !== 'rect') {
        nodes.forEach(node => node.node.removeClass('clicked'));
        deselectLines();
    }
});

document.addEventListener('dblclick', (evt) => {
    const criterias = document.querySelector('#section3');
    const stakeholders = document.querySelector('#section2');
    if (evt.offsetY > criterias.offsetTop
        && evt.offsetY < criterias.offsetTop + criterias.offsetHeight) {
        if (!!clickedNode && clickedNode.node.hasClass('blue')
            || !!clickedNode && clickedNode.node.hasClass('purple')) {
            const label = prompt('New node label:');
            if (label) {
                addNewNode({ parent: clickedNode.node, cx: evt.pageX, cy: evt.pageY, color: 'purple', label, id: new Date().getTime()}, nodes);
            }
        } 
    } else if (evt.offsetY > stakeholders.offsetTop
        && evt.offsetY < stakeholders.offsetTop + stakeholders.offsetHeight) {
        if (!!clickedNode && clickedNode.node.hasClass('yellow')) {
            const label = prompt('New node label:');
            if (label) {
                addNewNode({ parent: clickedNode.node, cx: evt.pageX, cy: evt.pageY, color: 'blue', label, id: new Date().getTime() }, nodes);
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

document.addEventListener('keyup', (evt) => {
    console.log(clickedNode);
    console.log(evt.key);
    if (evt.key === 'Delete' && !!clickedNode) {
        deleteSelected();
    }
});