// Setup canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight

// Holds all objects and all selected objects in canvas
const objects = []
const selectedObjects = []

// Holds the arc lines that are generated when shift is held
const tempArcLines = []

// State booleans
let primaryMouseButtonDown = false
let dragSelectInAction = false
let shiftHeld = false
let ctrlHeld = false
let dragInAction = false

// Location variables for mouse related properties
let mouseX = 0
let mouseY = 0
let prevMouseX = 0
let prevMouseY = 0
let mouseDownX = 0
let mouseDownY = 0

// Visual adjustments, eventually user should be able to adjust
let vertexRadius = 13

// Handles drawing frames, in an infinite loop
function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    objects.forEach((object) => {
        object.update()
    })

    // Draws potential arcs (lines from all selected vertices)
    if (shiftHeld) {
        // !!!! ADD CHECK FOR ELEMENT TO BE A VERTEX !!!!
        for (const element of selectedObjects) {
            c.strokeStyle = 'black'
            c.lineWidth = 5

            c.beginPath()
            c.moveTo(element.x, element.y)
            c.lineTo(mouseX, mouseY)
            c.stroke()
        }
    }

    if (dragSelectInAction) {
        c.strokeStyle = 'black'
        c.lineWidth = 1

        c.beginPath()
        c.rect(mouseDownX, mouseDownY, mouseX - mouseDownX, mouseY - mouseDownY)
        c.stroke()
    }
}

/* Vertices are one half of a graph. The location variables (x and y) are the at the 
centre of the vertex. Each vertex holds a list of its arcs so its neighbours can be 
easily traversed */
class Vertex {
    constructor(x, y, radius, colour, selectedColour) {
        this.id = Math.floor(Math.random() * 100)
        this.x = x
        this.y = y
        this.radius = radius
        this.colour = colour
        this.selectedColour = selectedColour
        this.isSelected = false
        this.arcs = []
    }

    closestPointOnCircleToGivenPoint(x, y) {
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
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        if (this.isSelected) {
            c.fillStyle = this.selectedColour
        }
        else {
            c.fillStyle = this.colour
        }
        c.fill()
    }

    update() {
        this.draw()
    }
}

class Edge {
    constructor(vertex1, vertex2, colour, selectedColour) {
        this.id = Math.floor(Math.random() * 100)
        this.vertex1 = vertex1
        this.vertex2 = vertex2
        this.colour = colour
        this.selectedcolour = selectedColour
        this.isSelected = false
    }

    // !!!! Implement this !!!!
    containsPoint() {
        return false;
    }

    draw() {
        /* Draws a line between the locations of the parents of the arc */
        c.strokeStyle = 'black'
        c.lineWidth = 5

        c.beginPath()
        c.moveTo(this.vertex1.x, this.vertex1.y)
        c.lineTo(this.vertex2.x, this.vertex2.y)
        c.stroke()

        c.fillStyle = 'black'
        c.beginPath()
        c.arc(this.vertex1.x, this.vertex1.y, 2, 0, Math.PI * 2, false)
        c.arc(this.vertex2.x, this.vertex2.y, 2, 0, Math.PI * 2, false)
        c.fill()
    }

    update() {
        this.draw()
    }
}

function selectObject(x, y) {
    for (const element of objects) {
        if (element.containsPoint(x, y)) {
            return element;
        }
    }

    return null;
}

function crossBrowserElementPos(e) {
    e = e || window.event;
    var obj = e.target || e.srcElement;
    var x = 0, y = 0;
    while (obj.offsetParent) {
        x += obj.offsetLeft;
        y += obj.offsetTop;
        obj = obj.offsetParent;
    }
    return { 'x': x, 'y': y };
}

function crossBrowserMousePos(e) {
    e = e || window.event;
    return {
        'x': e.pageX || e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
        'y': e.pageY || e.clientY + document.body.scrollTop + document.documentElement.scrollTop,
    };
}

function crossBrowserRelativeMousePos(e) {
    var element = crossBrowserElementPos(e);
    var mouse = crossBrowserMousePos(e);
    return {
        'x': mouse.x - element.x,
        'y': mouse.y - element.y
    };
}

// Double click event creates a vertex
canvas.ondblclick = function (e) {
    var mousePos = crossBrowserRelativeMousePos(e);
    selectedObject = selectObject(mousePos.x, mousePos.y);

    if (selectedObject == null) {
        selectedObject = new Vertex(mousePos.x, mousePos.y, vertexRadius, 'green', 'red');
        selectedObject.isSelected = true;
        selectedObjects.push(selectedObject);
        objects.push(selectedObject);
    }
}

// Mouse down event - selects a vertex
canvas.onmousedown = function (e) {
    if (e.button == 0) {
        primaryMouseButtonDown = true

        var mousePos = crossBrowserRelativeMousePos(e);
        mouseDownX = mousePos.x;
        mouseDownY = mousePos.y;
        let selectedObject = selectObject(mousePos.x, mousePos.y);

        if (selectedObject != null) {
            // If shift is held when a vertex is clicked we must add an arc between it and all selected vertices
            if (shiftHeld) {
                for (let j = 0; j < selectedObjects.length; j++) {
                    if (selectedObjects[j] instanceof Vertex) {

                        // Create a new arc between vertices
                        let arc = new Edge(selectedObjects[j], element, 'black', 'red');

                        // Add the arc to the vertices list of arcs
                        selectedObjects[j].arcs.push(arc);
                        element.arcs.push(arc);

                        // Push arc to objects array so it is persistant and drawn
                        objects.push(arc);
                    }
                }
            }

            // Ensuring the clicked on element is selected and in selected list
            if (!selectedObject.isSelected) {
                selectObject.isSelected = true;
                selectedObjects.push(selectedObject);
            }

            // Begins a drag action
            dragInAction = true;
        }

        if (!ctrlHeld) {
            // Deselecting all objects bar the one possibly just clicked on 
            for (const element of selectedObjects) {
                element.isSelected = false
            }
            selectedObjects.length = 0

            // Re-selecting the object clicked on (if one was clicked on)
            if (selectedObject != null) {
                selectedObject.isSelected = true
                selectedObjects.push(selectedObject)
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

canvas.onmousemove = function (e) {

    var mousePos = crossBrowserRelativeMousePos(e);
    


    // Calculating the distance the mouse has travelled since the previous mouse movement
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = mousePos.x;
    mouseY = mousePos.y;
    const xdif = e.clientX - prevMouseX;
    const ydif = e.clientY - prevMouseY;

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
    // Shift is used to draw arcs from selected nodes
    if (e.code == 'ShiftLeft') {
        shiftHeld = true
    }
    // Ctrl is used for multi select
    else if (e.code == 'ControlLeft') {
        ctrlHeld = true
    }

})

addEventListener('keyup', (e) => {
    // Shift allows the creation of arcs
    if (e.code == 'ShiftLeft') {
        shiftHeld = false
    }
    // Ctrl allows multi selection
    else if (e.code == 'ControlLeft') {
        ctrlHeld = false
    }
    else if (e.code == 'Delete') {

        // Deleting all selected objects
        for (let i = 0; i < objects.length; i++) {

            if (objects[i].isSelected) {

                // Deleting selected vertices
                if (objects[i] instanceof Vertex) {
                    objects.splice(i, 1)
                    i--
                }
            }

            // deleting arc if it is selected or if either of its vertices are selected
            if (objects[i] instanceof Edge && (objects[i].isSelected || objects[i].vertex1.isSelected || objects[i].vertex2.isSelected)) {
                objects.splice(i, 1)
                i--
            }
        }

        // Clearing selected objects so no instances of deleted objects remain
        while (selectedObjects.length > 0) {
            selectedObjects.pop()
        }
    }

})

// Determines if a point (x,y) is within a rectangle (z1, z2, z3, z4)
function isInside(x, y, z1, z2, z3, z4) {
    let x1 = Math.min(z1, z3)
    let x2 = Math.max(z1, z3)
    let y1 = Math.min(z2, z4)
    let y2 = Math.max(z2, z4)
    return !!((x1 <= x) && (x <= x2) && (y1 <= y) && (y <= y2))
}

// Called to initiate the animation loop
animate()


