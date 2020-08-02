const { remote, ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');

/* REMOTE WINDOWS */
///////////////////
let progressWindow = remote.getCurrentWindow(),
  secWindow = progressWindow.getParentWindow();

/* DOM ELEMENTS */
/////////////////
let progressBar = document.getElementById('progress');

/* PYTHON PROCESSING FUNCTION */
///////////////////////////////

let count = 0,
  timer = setInterval(() => {
    count++;
    progressBar.value = count;
    if (count === 100) {
      clearInterval(timer);
      let message = {
        channel: 'progress-end',
        message: 'close',
        destination: 'sec',
      };
      ipcRenderer.send('progress-end', message);
      progressWindow.close();
    }
  }, 100);
