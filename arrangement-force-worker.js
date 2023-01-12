var i = 0;

// Every 50ms calculate forces and update locations, then send back data to main script
function timedCount() {
  i = i + 1;
  setTimeout("timedCount()", 50);
  postMessage(i);
}

// Handle messages from main script, update objects data? or implement shared memory thing?
onmessage = (e) => {
  console.log('Message received from main script');
}

timedCount(); 