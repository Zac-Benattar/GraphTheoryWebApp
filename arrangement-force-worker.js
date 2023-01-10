var i = 0;

function timedCount() {
  i = i + 1;
  postMessage(i);
  setTimeout("timedCount()",500);
}

onmessage = (e) => {
    console.log('Message received from main script');
    const workerResult = `Result: ${e.data[0] * e.data[1]}`;
    console.log('Posting message back to main script');
    postMessage(workerResult);
}
  

timedCount(); 