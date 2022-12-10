// Find toggle dark mode button
const darkModeToggle = document.querySelector('#darkmode-toggle');

// Get if dark mode is user defualt setting
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

// Set darkmode and toggle if user colour scheme has it selected
if (prefersDarkScheme.matches) {
  document.body.classList.toggle("dark-theme");
  darkModeToggle.checked = true;
}

// Listen for a click on the dark mode toggle
darkModeToggle.addEventListener('click', function() {
    // Then toggle (add/remove) the .dark-theme class to the body
    document.body.classList.toggle('dark-theme');  
})