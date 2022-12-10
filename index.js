// Setup canvas
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

// Holds all objects and all selected objects in canvas
const objects = [];
const selectedObjects = [];

// Holds the arc lines that are generated when shift is held
const tempArcLines = [];

// State booleans
let primaryMouseButtonDown = false;
let dragSelectInAction = false;
let shiftHeld = false;
let ctrlHeld = false;
let dragInAction = false;
let enableWeights = true;
let directedEdges = false;

// Location variables for mouse related properties
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseDownX = 0;
let mouseDownY = 0;
let clickedObjectPadding = 5;

// Visual adjustments, eventually user should be able to adjust
let defaultVertexRadius = 20;

// Limits and constants
const MAX_WEIGHT = 9999;

// Handles drawing frames, in an infinite loop
function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach((object) => {
        object.update();
    })

    // Draws potential arcs (lines from all selected vertices)
    if (shiftHeld) {
        for (const element of selectedObjects) {
            if (element.type == 'vertex') {
                if (!element.containsPoint(mouseX, mouseY)) {
                    c.strokeStyle = 'black';
                    // Set the line width relative to the size of vertices, wider than final edge size
                    c.lineWidth = defaultVertexRadius / 3;
                    var edgeOfVertex = element.closestPointOnVertexToGivenPoint(mouseX, mouseY);

                    c.beginPath();
                    c.moveTo(edgeOfVertex.x, edgeOfVertex.y);
                    c.lineTo(mouseX, mouseY);
                    c.stroke();
                }
            }
        }
    }

    if (dragSelectInAction) {
        c.strokeStyle = 'black';
        c.lineWidth = 1;

        c.beginPath();
        c.rect(mouseDownX, mouseDownY, mouseX - mouseDownX, mouseY - mouseDownY);
        c.stroke();
    }
}

/* Vertices are one half of a graph. The location variables (x and y) are the at the 
centre of the vertex. Each vertex holds a list of its arcs so its neighbours can be 
easily traversed */
class Vertex {
    constructor(x, y) {
        this.id = Math.floor(Math.random() * 100);
        this.type = 'vertex';
        this.x = x;
        this.y = y;
        this.radius = defaultVertexRadius;
        this.colour = 'green';
        this.selectedColour = 'red';
        this.isSelected = false;
        this.arcs = [];
    }

    /* Gets the closest point to a given point that is on the vertex, usually the edge of the vertex, 
    primarilly used when drawing arcs so that they do not draw above the vertex to its centre */
    closestPointOnVertexToGivenPoint(x, y) {
        var dx = x - this.x;
        var dy = y - this.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.x + dx * this.radius / scale,
            'y': this.y + dy * this.radius / scale,
        };
    }

    // Gets whether the vertex contains a given point, used to determine if the vertext has been clicked
    containsPoint(x, y) {
        return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) < this.radius * this.radius;
    }

    draw() {
        /* Draws an arc of angle 2pi (circle) and fills it with the colour specified by 
        whether the vertex is selected or not */
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        if (this.isSelected) {
            c.fillStyle = this.selectedColour;
        }
        else {
            c.fillStyle = this.colour;
        }
        c.fill();
    }

    update() {
        this.draw();
    }
}

/* Edges are the other half of a graph, they connect vertices. Rendered from the edge of vertices */
class Edge {
    constructor(vertex1, vertex2) {
        this.id = Math.floor(Math.random() * 100);
        this.type = 'edge';
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.colour = 'black';
        this.selectedcolour = 'red';
        this.isSelected = false;
        this.weight = 0;
    }

    // Returns if given coords are on the line (with padding)
    containsPoint(x, y) {
        var dx = this.vertex1.x - this.vertex2.x;
        var dy = this.vertex1.y - this.vertex2.y;
        var length = Math.sqrt(dx * dx + dy * dy);
        var percent = (dx * (x - this.vertex1.x) + dy * (y - this.vertex1.y)) / (length * length);
        var distance = (dx * (y - this.vertex1.y) - dy * (x - this.vertex1.x)) / length;
        return (percent < 0 && percent > -1 && Math.abs(distance) < clickedObjectPadding);
    }

    draw() {
        /* Draws a line between the parents of the arc */
        if (!this.isSelected) {
            c.strokeStyle = this.colour;
        }
        else {
            c.strokeStyle = this.selectedcolour;
        }

        // Scales the width of the edge with the size of the vertices
        c.lineWidth = defaultVertexRadius / 4;

        var v1ClosePoint = this.vertex1.closestPointOnVertexToGivenPoint(this.vertex2.x, this.vertex2.y);
        var v2ClosePoint = this.vertex2.closestPointOnVertexToGivenPoint(this.vertex1.x, this.vertex1.y);

        c.beginPath();
        c.moveTo(v1ClosePoint.x, v1ClosePoint.y);
        c.lineTo(v2ClosePoint.x, v2ClosePoint.y);
        c.stroke();

        if (enableWeights) {
            c.fillStyle = 'green';
            c.font = '60px ui-sans-serif';
            c.fillText(this.weight, (this.vertex1.x + this.vertex2.x) / 2, (this.vertex1.y + this.vertex2.y) / 2);
        }
    }

    update() {
        this.draw();
    }
}

// Returns the object at a specified point, null if none there
function selectObject(x, y) {
    for (const element of objects) {
        if (element.containsPoint(x, y)) {
            return element;
        }
    }

    return null;
}

// Returns the mouse position within the canvas when given a mouse event
function getMousePos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

// Double click event creates a vertex
canvas.ondblclick = function (e) {
    var mousePos = getMousePos(e);
    selectedObject = selectObject(mousePos.x, mousePos.y);

    if (selectedObject == null) {
        selectedObject = new Vertex(mousePos.x, mousePos.y);
        selectedObject.isSelected = true;
        selectedObjects.push(selectedObject);
        objects.push(selectedObject);
    }
}

// Mouse down event - selects a vertex or edge
canvas.onmousedown = function (e) {
    if (e.button == 0) {
        // Getting mouse position and the object under it
        primaryMouseButtonDown = true;
        var mousePos = getMousePos(e);
        mouseDownX = mousePos.x;
        mouseDownY = mousePos.y;
        var selectedObject = selectObject(mousePos.x, mousePos.y);

        // Holds whether clicked object is already selected - janky way to make deselecting all other objects easier/faster
        var isAlreadySelected = false;
        if (selectedObject != null) {
            isAlreadySelected = selectedObject.isSelected;
        }

        // NULL and type check
        if (selectedObject != null && selectedObject.type == 'vertex') {
            // If shift is held when a vertex is clicked we must add an arc between it and all selected vertices
            if (shiftHeld) {
                for (let j = 0; j < selectedObjects.length; j++) {
                    if (selectedObjects[j].type == 'vertex') {
                        // Create a new edge between vertices
                        let edge = new Edge(selectedObject, selectedObjects[j]);

                        // Add the edge to the vertices list of arcs
                        selectedObject.arcs.push(edge);
                        selectedObjects[j].arcs.push(edge);

                        // Push edge to objects array so it is persistant and drawn
                        objects.push(edge);
                    }
                }
            }

            // Begins a drag action
            dragInAction = true;
        }

        // Deselecting all objects if ctrl not held
        if (!ctrlHeld) {
            for (const element of selectedObjects) {
                element.isSelected = false;
            }
            selectedObjects.length = 0;
        }

        if (selectedObject != null) {
            /* If ctrl is held and the object is already selected, 
                we want to deselect it when we click on it,
                this deselection should be done when mouse click is lifted
                but this is not implemented yet so this is temporary */
            if (ctrlHeld && isAlreadySelected) {
                // Toggle whether the clicked object is selected and in selected list
                selectedObject.isSelected = false;
                selectedObjects.splice(selectedObjects.findIndex(p => p.id == selectedObject.id));
            } else {
                // Selecting the object we clicked on
                selectedObject.isSelected = true;
                selectedObjects.push(selectedObject);
            }
        }


    }
}

canvas.onmouseup = function (e) {
    // Determine if mouse1 has been lifted
    if (e.button == 0) {
        primaryMouseButtonDown = false;
        dragInAction = false;
        dragSelectInAction = false;
    }
}

// Handles moving of objects and computing drag selects
canvas.onmousemove = function (e) {

    var mousePos = getMousePos(e);

    // Calculating the distance the mouse has travelled since the previous mouse movement
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = mousePos.x;
    mouseY = mousePos.y;
    const xdif = mouseX - prevMouseX;
    const ydif = mouseY - prevMouseY;

    // Moving each selected object
    if (dragInAction) {
        for (const element of selectedObjects) {
            element.x = element.x + xdif;
            element.y = element.y + ydif;
        }
    }

    /* If the user is not dragging objects then they are performing a drag select,
    hence we draw a rectange (in animate()) and here select all objects within */
    else if (primaryMouseButtonDown) {
        dragSelectInAction = true;
        // Loop through all objects to determine if selected, probably a fast way of doing this
        for (const element of objects) {
            // Selected objects in rectangle
            if (isInside(element.x, element.y, mouseDownX, mouseDownY, mouseX, mouseY)) {
                element.isSelected = true;
                selectedObjects.push(element);
            }

            // De-selected objects outside of the rectange if ctrl not held
            else if (!ctrlHeld) {
                if (element.isSelected) {
                    element.isSelected = false;
                    for (let j = 0; j < selectedObjects.length; j++) {
                        if (selectedObjects[j] == element) {
                            selectedObjects.splice(j, 1);
                            break;
                        }
                    }
                }
            }
        }
    }
}

addEventListener('keydown', (e) => {
    // Shift is used to draw edges from selected nodes and for alt keys
    if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
        shiftHeld = true;
    }
    // Ctrl is used for multi select
    else if (e.code == 'ControlLeft') {
        ctrlHeld = true;
    }

    // When a single edge is selected read for numeric inputs to change the weighting
    if (enableWeights && selectedObjects.length == 1 && selectedObjects[0].type == 'edge') {
        // Backspace resets the weight to 0
        if (e.code == 'Backspace') {
            selectedObjects[0].weight = 0;
        } else {
            // Convert the input ket to a number and get the previous weight
            var num = parseInt(e.key);
            var previousWeight = selectedObjects[0].weight;

            // Check if the input was a number, if so append this number to the end of the weight if it will not exceed max val
            if (!isNaN(num)) {
                if (previousWeight >= 0) {
                    var newWeight = previousWeight * 10 + num;
                } else {
                    var newWeight = previousWeight * 10 - num;
                }
                if (Math.abs(newWeight) <= MAX_WEIGHT) {
                    selectedObjects[0].weight = newWeight;
                }
            }
            // Minus sets the number to be negative
            else if (e.code == 'Minus' && previousWeight > 0) {
                selectedObjects[0].weight = -previousWeight;
            }
            // Plus sets the number to be positive, plus is an alt key so need to check for shift held
            else if (e.code == 'Equal' && shiftHeld && previousWeight < 0) {
                selectedObjects[0].weight = -previousWeight;
            }
        }
    }
})

addEventListener('keyup', (e) => {
    // Shift allows the creation of edges
    if (e.code == 'ShiftLeft') {
        shiftHeld = false;
    }
    // Ctrl allows multi selection
    else if (e.code == 'ControlLeft') {
        ctrlHeld = false;
    }
    else if (e.code == 'Delete') {

        // Deleting all selected objects
        for (let i = 0; i < objects.length; i++) {

            if (objects[i].isSelected) {

                // Deleting selected vertices
                if (objects[i] instanceof Vertex) {
                    objects.splice(i, 1);
                    i--;
                }
            }

            // Deleting edge if it is selected or if either of its vertices are selected
            if (objects[i] instanceof Edge && (objects[i].isSelected || objects[i].vertex1.isSelected || objects[i].vertex2.isSelected)) {
                objects.splice(i, 1);
                i--;
            }
        }

        // Clearing selected objects so no instances of deleted objects remain
        while (selectedObjects.length > 0) {
            selectedObjects.pop();
        }
    }

})

/* Performs a resize of all elements in the canvas. Used when the canvas changes size in order to ensure all objects
    remain in the same location relative to each other object, by scaling the size of each and locations. */
function resizeCanvas() {
    // Calculate how much the window size has reduced by
    xScalingFactor = (window.innerWidth - 100) / canvas.width;
    yScalingFactor = window.innerHeight / canvas.height;

    // Resize the canvas relative to the new window size
    canvas.width = window.innerWidth - 100;
    canvas.height = window.innerHeight;

    // Calculate the new default vertex radius from the new canvas size
    oldDefaultVertexRadius = defaultVertexRadius;
    defaultVertexRadius = (canvas.width + canvas.height) / 100;

    // Update the size of each vertex relative to its previous size and the new vertex radius
    for (let i = 0; i < objects.length; i++) {
        if (objects[i] instanceof Vertex) {
            objects[i].radius = Math.max(objects[i].radius / oldDefaultVertexRadius * defaultVertexRadius, 5);
            objects[i].x = Math.max(objects[i].x * xScalingFactor, 0);
            objects[i].y = Math.max(objects[i].y * yScalingFactor, 0);
        }
    }
}

// Handle the window resize event by calling the resize canvas function
window.addEventListener('resize', (e) => {
    resizeCanvas();
})

// Determines if a point (x,y) is within a rectangle (z1, z2, z3, z4)
function isInside(x, y, z1, z2, z3, z4) {
    let x1 = Math.min(z1, z3);
    let x2 = Math.max(z1, z3);
    let y1 = Math.min(z2, z4);
    let y2 = Math.max(z2, z4);
    return !!((x1 <= x) && (x <= x2) && (y1 <= y) && (y <= y2));
}

// Adjust canvas size to screen size
resizeCanvas();

// Called to initiate the animation loop
animate();


