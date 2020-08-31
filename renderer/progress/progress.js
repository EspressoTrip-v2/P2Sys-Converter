const { remote, ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

/* REMOTE WINDOWS */
///////////////////
let progressWindow = remote.getCurrentWindow();
secWindow = progressWindow.getParentWindow();

/* DOM ELEMENTS */
/////////////////
let progressBar = document.getElementById('progress');

/* FUNCTIONS */
//////////////

/* LOGFILE CREATION FUNCTION */
function logfileFunc(error) {
  const fileDir = `${dir}/data/logfiles/conversion-logfile.txt'`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Conversion Error -> [${error}]\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Conversion Error -> [${error}]\n`, (err) =>
      console.log(err)
    );
  }
}

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

  /* CREATE THE PATHS VARIABLE */
  let filePaths;

  pyshell.on('message', (message) => {
    // console.log(message);
    let value = parseInt(message);

    /* SEPARATE THE PATHS INTO USABLE ARRAY */
    if (isNaN(value)) {
      filePaths = message.split(',');
    }
    if (value < 100) {
      /* PUSH THE STDIN VALUE FROM PYTHON TO THE PERCENTAGE OF THE PROGRESS BAR */
      progressBar.style.setProperty('--width', value);
    } else if (value === 100) {
      progressBar.style.setProperty('--width', value);

      setTimeout(() => {
        let message = {
          channel: 'progress-end',
          filePaths,
          destination: 'sec',
        };
        ipcRenderer.send('progress-end', message);
        progressWindow.close();
      }, 500);
    }
  });
  pyshell.end(function (err, code, signal) {
    if (err) {
      logfileFunc(err);
      progressWindow.hide();
      remote.dialog.showMessageBoxSync(secWindow, {
        type: 'warning',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        buttons: ['OK'],
        message: 'PYTHON CONVERSION ERROR:',
        detail:
          'There was an problem during the file conversion.\nPlease contact your developer.',
      });
      ipcRenderer.send('error', null);
      progressWindow.close();
    }
  });
});
