// Find toggle dark mode button
const directedModeToggle = document.querySelector('#directedmode-toggle');

// Set default value to toggle
directedModeToggle.checked = false;

// Listen for a click on the directed mode toggle
directedModeToggle.addEventListener('click', function() {
    directedEdges = !directedEdges;
})