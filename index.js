// setup canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight

// holds all objects and all selected objects in canvas
const objects = []
const selectedObjects = []

// holds the arc lines that are generated when shift is held
const tempArcLines = []

// state booleans
let primaryMouseButtonDown = false
let dragSelectInAction = false
let shiftHeld = false
let ctrlHeld = false
let dragInAction = false

// location variables for mouse related properties
let mouseX = 0
let mouseY = 0
let prevMouseX = 0
let prevMouseY = 0
let mouseDownX = 0
let mouseDownY = 0

// visual adjustments
let vertexRadius = 13

// handles drawing frames, in an infinite loop
function animate() {
    requestAnimationFrame(animate)
    c.clearRect(0, 0, canvas.width, canvas.height)
    objects.forEach((object) => {
        object.update()
    })

    if (shiftHeld) {
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

    draw() {
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

class Arc {
    constructor(vertex1, vertex2, colour, selectedColour) {
        this.id = Math.floor(Math.random() * 100)
        this.vertex1 = vertex1
        this.vertex2 = vertex2
        this.colour = colour
        this.selectedcolour = selectedColour
        this.isSelected = false
    }

    draw() {
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

addEventListener('mousedown', (event) => {
    if (event.button == 0) {
        primaryMouseButtonDown = true

        let selectedObject = null
        mouseDownX = event.clientX
        mouseDownY = event.clientY
    
        // determining if an object has been clicked on, with small extra margin
        for (const element of objects) {
            const xdif = event.clientX - element.x
            const ydif = event.clientY - element.y

            if (Math.sqrt(Math.pow(xdif, 2) + Math.pow(ydif, 2)) < vertexRadius + 2) {
    
                // if shift is held when a vertex is clicked we must add an arc between it and all selected vertices
                if (shiftHeld) {
                    for (let j = 0; j < selectedObjects.length; j++) {
                        if (selectedObjects[j] instanceof Vertex) {
    
                            // create a new arc between vertices
                            let arc = new Arc(selectedObjects[j], element, 'black', 'red')

                            // add the arc to the vertices list of arcs
                            selectedObjects[j].arcs.push(arc)
                            element.arcs.push(arc)
    
                            // push arc to objects array so it is persistant and drawn
                            objects.push(arc)
                        }
                    }
                }
    
                // selecting the object we clicked on, add it to the selected array if its not already there
                if (!element.isSelected) {
                    element.isSelected = true
                    selectedObjects.push(element)
                }
                selectedObject = element
                dragInAction = true
    
                break
            }
        }
    
        if (!ctrlHeld) {
            // deselecting all objects bar the one possibly just clicked on 
            for (const element of selectedObjects) {
                element.isSelected = false
            }
            selectedObjects.length = 0
            if (selectedObject != null) {
                selectedObject.isSelected = true
                selectedObjects.push(selectedObject)
            }
        }

    }

})

addEventListener('mouseup', (event) => {

    if (event.button == 0) {
        primaryMouseButtonDown = false

        // if no object was clicked on and no drag action performed then we create a new node
        if (!dragInAction && !dragSelectInAction) {
            const vert = new Vertex(event.clientX - vertexRadius / 2, event.clientY - vertexRadius / 2, vertexRadius, 'green', 'red')
            vert.isSelected = true
            selectedObjects.push(vert)
            objects.push(vert)
        }
        dragInAction = false
        dragSelectInAction = false
    }

})

addEventListener('mousemove', (event) => {

    // calculating the distance the mouse has travelled since the previous mouse movement
    prevMouseX = mouseX
    prevMouseY = mouseY
    mouseX = event.clientX
    mouseY = event.clientY
    const xdif = event.clientX - prevMouseX
    const ydif = event.clientY - prevMouseY

    // moving each selected object
    if (dragInAction) {
        for (const element of selectedObjects) {
            element.x = element.x + xdif
            element.y = element.y + ydif
        }
    }
    else if (primaryMouseButtonDown) {
        dragSelectInAction = true
        for (const element of objects) {
            if (isInside(element.x, element.y, mouseDownX, mouseDownY, mouseX, mouseY)) {
                element.isSelected = true
                selectedObjects.push(element)
            }
            else if (!ctrlHeld) {
                if (element.isSelected) {
                    element.isSelected = false
                    for (let j = 0; j < selectedObjects.length; j++) {
                        if (selectedObjects[j] == element)
                        {
                            selectedObjects.splice(j, 1)
                            break
                        }
                    }
                }
            }
        }
    }
})

addEventListener('keydown', (event) => {
    // shift is used to draw arcs from selected nodes
    if (event.code == 'ShiftLeft') {
        shiftHeld = true
    }
    // ctrl is used for multi select
    else if (event.code == 'ControlLeft') {
        ctrlHeld = true
    }

})

addEventListener('keyup', (event) => {
    if (event.code == 'ShiftLeft') {
        shiftHeld = false
    }
    else if (event.code == 'ControlLeft') {
        ctrlHeld = false
    }
    else if (event.code == 'Backspace') {

        // deleting all selected objects
        for (let i = 0; i < objects.length; i++) {

            if (objects[i].isSelected) {

                // deleting selected vertices
                if (objects[i] instanceof Vertex) {
                    objects.splice(i, 1)
                    i--
                }
            }

            // deleting arc if it is selected or if either of its vertices are selected
            if (objects[i] instanceof Arc && (objects[i].isSelected || objects[i].vertex1.isSelected || objects[i].vertex2.isSelected)) {
                objects.splice(i, 1)
                i--
            }  
        }

        // clearing selected objects so no instances of deleted objects remain
        while (selectedObjects.length > 0) {
            selectedObjects.pop()
        }
    }

})

function isInside(x, y, z1, z2, z3, z4) {
    let x1 = Math.min(z1, z3)
    let x2 = Math.max(z1, z3)
    let y1 = Math.min(z2, z4)
    let y2 = Math.max(z2, z4)
    return !!((x1 <= x ) && ( x <= x2) && (y1 <= y) && (y <= y2))
}

animate()


