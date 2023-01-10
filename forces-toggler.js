// Find toggle forces mode button
const forcesModeToggle = document.querySelector('#forcesmode-toggle');

// Set default value to toggle
forcesModeToggle.checked = true;

// Listen for a click on the forces mode toggle
forcesModeToggle.addEventListener('click', function() {
    enableForces = !enableForces;
    if (enableForces) {
        startWorker();
    }
    else {
        stopWorker();
    }
})