const { remote, ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* REMOTE WINDOWS */
///////////////////
let progressWindow = remote.getCurrentWindow();

/* DOM ELEMENTS */
/////////////////
let progressBar = document.getElementById('progress');

/* VARIABLES */
//////////////

//TODO: FINNISH PROCESS AFTER CONVERSION

ipcRenderer.on('convert-python', (event, message) => {
  let file = message;
  let data = JSON.stringify(file);

  /* PYTHON PROCESSING FUNCTION */
  ///////////////////////////////

  /* CREATE OPTIONS OBJECT FOR PYSHELL */
  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: `${dir}/python/`,
    args: [data],
  };

  /* CREATE PYSHELL  */
  let pyshell = new PythonShell('conversion.py', options);

  pyshell.on('message', (message) => {
    let value = parseInt(message);
    if (value < 100) {
      /* PUSH THE STDIN VALUE FROM PYTHON TO THE PERCENTAGE OF THE PROGRESS BAR */
      progressBar.style.setProperty('--width', value);
    } else if (value === 100) {
      progressBar.style.setProperty('--width', value);

      setTimeout(() => {
        let message = {
          channel: 'progress-end',
          message: 'close',
          destination: 'sec',
        };
        ipcRenderer.send('progress-end', message);
        progressWindow.close();
      }, 500);
    }
  });
});
