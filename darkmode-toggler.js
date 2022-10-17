// toggle dark mode
const darkModeToggle = document.querySelector('#darkmode-toggle');

// listen for a click on the dark mode button
darkModeToggle.addEventListener('click', function() {
    // Then toggle (add/remove) the .dark-theme class to the body
    document.body.classList.toggle('dark-theme');  
})