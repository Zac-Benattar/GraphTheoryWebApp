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
let forceArrangement = true;

// Location variables for mouse related properties
let mouseX = 0;
let mouseY = 0;
let prevMouseX = 0;
let prevMouseY = 0;
let mouseDownX = 0;
let mouseDownY = 0;
let clickedObjectPadding = 5;

// Visual adjustments, eventually user should be able to adjust
let vertexRadius = 20;

// Handles drawing frames, in an infinite loop
function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach((object) => {
        object.update();
    })

    // Performs a force-directed graph drawing step if the user has the option selected
    if (forceArrangement) {
        forceArrangementStep();
    }

    // Draws potential arcs (lines from all selected vertices)
    if (shiftHeld) {
        for (const element of selectedObjects) {
            if (element.type == 'vertex') {
                if (!element.containsPoint(mouseX, mouseY)) {
                    c.strokeStyle = 'black';
                    // Set the line width relative to the size of vertices, wider than final edge size
                    c.lineWidth = vertexRadius / 3;
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

// Calculates and applies the forces to be applied to each vertex in force-directed graph drawing
function forceArrangementStep() {
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].type == 'vertex') {

            var ax, ay = 0; // Attractive force between vertices
            var ex, ey = 0; // Edge attractive force between vertices
            var rx, ry = 0; // Repulsive force between vertices
            var cx, cy = 0; // Attractive force between vertex and centre

            for (let j = 0; j < objects.length; j++) {
                if (objects[j].type == 'vertex' && i != j) {
                    /* Computing forces a and r. Get difference in x and y coords, calculate the square of the distance between vertices,
                    and find the percent of the distance is in each of the x and y directions */
                    var dx = objects[i].x - objects[j].x;
                    var dy = objects[i].y - objects[j].y;
                    var distanceSquare = distanceSquared(objects[i].x, objects[i].y, objects[j].x, objects[j].y);
                    var angle = Math.atan2(dy, dx);

                    // Constant * Component of force in x/y direction * Strength of force
                    ax += 0.5 * Math.cos(angle) * Math.log(Math.sqrt(distanceSquare));
                    ay += 0.5 * Math.sin(angle) * Math.log(Math.sqrt(distanceSquare));
                    rx += 1 / distanceSquare * Math.cos(angle);
                    ry += 1 / distanceSquare * Math.sin(angle);
                }
            }

            // Computes force e
            for (let j = 0; j < objects[i].edges.length; j++) {
                if (objects[i].edges[j] != objects[i]) {

                }
            }

            // Computes force c
            var cForce = distance(objects[i].x, objects[i].y, canvas.width / 2, canvas.height / 2) / 1000;
            var dx = objects[i].x - canvas.width / 2;
            var dy = objects[i].y - canvas.height / 2;
            var angle = Math.atan2(dy, dx);
            cx = Math.cos(angle) * cForce;
            cy = Math.sin(angle) * cForce;

            // Sums the forces in each component, and applies them to the vertex
            var resultantStepX = (ax + ex + cx - rx) / 5;
            var resultantStepY = (ay + ey + cy - ry) / 5;
            if (Math.abs(resultantStepX) > 2) {
                objects[i].x = objects[i].x + (resultantStepX);
            }
            if (Math.abs(resultantStepY) > 2) { 
                objects[i].y = objects[i].y + (resultantStepY);
            }
            console.log(resultantStepX, resultantStepY);
        }
    }
}

// Returns the distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(distanceSquared(x1, y1, x2, y2));
}

// Returns the square of the distance between two points
function distanceSquared(x1, y1, x2, y2) {
    return (Math.pow(x1 - x2, 2)) + (Math.pow(y1 - y2, 2));
}

/* Vertices are one half of a graph. The location variables (x and y) are the at the 
centre of the vertex. Each vertex holds a list of its arcs so its neighbours can be 
easily traversed */
class Vertex {
    constructor(x, y) {
        this.id = Math.floor(Math.random() * 10000);
        this.type = 'vertex';
        this.x = x;
        this.y = y;
        this.radius = vertexRadius;
        this.colour = 'green';
        this.selectedColour = 'red';
        this.isSelected = false;
        this.edges = [];
    }

    closestPointOnVertexToGivenPoint(x, y) {
        var dx = x - this.x;
        var dy = y - this.y;
        var scale = Math.sqrt(dx * dx + dy * dy);
        return {
            'x': this.x + dx * this.radius / scale,
            'y': this.y + dy * this.radius / scale,
        };
    }

    containsPoint(x, y) {
        return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) < vertexRadius * vertexRadius;
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
        this.id = Math.floor(Math.random() * 10000);
        this.type = 'edge';
        this.vertex1 = vertex1;
        this.vertex2 = vertex2;
        this.colour = 'black';
        this.selectedcolour = 'red';
        this.isSelected = false;
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
        c.lineWidth = vertexRadius / 4;

        var v1ClosePoint = this.vertex1.closestPointOnVertexToGivenPoint(this.vertex2.x, this.vertex2.y);
        var v2ClosePoint = this.vertex2.closestPointOnVertexToGivenPoint(this.vertex1.x, this.vertex1.y);

        c.beginPath();
        c.moveTo(v1ClosePoint.x, v1ClosePoint.y);
        c.lineTo(v2ClosePoint.x, v2ClosePoint.y);
        c.stroke();
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
            // Toggle whether the clicked object is selected and in selected list
            if (isAlreadySelected) {
                selectedObject.isSelected = false;
                selectedObjects.splice(selectedObjects.findIndex(p => p.id == selectedObject.id));
            }
            else {
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
    // Shift is used to draw edges from selected nodes
    if (e.code == 'ShiftLeft') {
        shiftHeld = true;
    }
    // Ctrl is used for multi select
    else if (e.code == 'ControlLeft') {
        ctrlHeld = true;
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

// Determines if a point (x,y) is within a rectangle (z1, z2, z3, z4)
function isInside(x, y, z1, z2, z3, z4) {
    let x1 = Math.min(z1, z3);
    let x2 = Math.max(z1, z3);
    let y1 = Math.min(z2, z4);
    let y2 = Math.max(z2, z4);
    return !!((x1 <= x) && (x <= x2) && (y1 <= y) && (y <= y2));
}

// Called to initiate the animation loop
animate();


