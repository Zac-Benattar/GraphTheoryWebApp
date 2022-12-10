// Find toggle dark mode button
const weightedModeToggle = document.querySelector('#weightedmode-toggle');

// Set default value to toggle
weightedModeToggle.checked = true;

// Listen for a click on the weights mode toggle
weightedModeToggle.addEventListener('click', function() {
    enableWeights = !enableWeights;
})