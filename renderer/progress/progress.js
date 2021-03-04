const { remote, ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir;
function envFileChange() {
  let fileName = `${process.cwd()}/resources/app.asar`;
  /* LOCAL MODULES */
  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = fileName.replace(pattern, '/');
  } else dir = fileName;
}
if (!process.env.NODE_ENV) {
  envFileChange();
} else {
  dir = process.cwd();

  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = dir.replace(pattern, '/');
  }
}

/* GET APPDATA DIR */
let appData;
if (process.platform === 'win32') {
  appData = `${process.env.APPDATA}/P2Sys-Converter`;
} else {
  appData = process.cwd();
}

/* REMOTE WINDOWS */
///////////////////
let progressWindow = remote.getCurrentWindow();
secWindow = progressWindow.getParentWindow();

/* GLOBAL VARIABLES */
let pauseFlag, scheduleFlag, customerNumber, scheduleDate, oldDate, customerData, editFlag;

/* FUNCTIONS */
//////////////

/* LOGFILE CREATION FUNCTION */
function logfileFunc(error) {
  const fileDir = `${appData}/error-log.txt`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}: Conversion Error -> [${error}]\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Conversion Error -> [${error}]\n`, (err) =>
      console.log(err)
    );
  }
}

ipcRenderer.on('convert-python', (event, message) => {
  customerData = message.customerData;
  pauseFlag = message.pauseFlag;
  editFlag = message.editFlag;
  scheduleFlag = message.scheduleFlag;
  scheduleDate = message.scheduleDate;
  oldDate = message.oldDate;
  customerNumber = customerData['price-list']['customerNumber'];
  let data = JSON.stringify(customerData);

  /* PYTHON PROCESSING FUNCTION */
  ///////////////////////////////
  let serverPath;
  if (scheduleDate === null) {
    if (fs.existsSync(process.env.SERVER_PATH)) {
      serverPath = process.env.SERVER_PATH;
    } else {
      serverPath = 'none';
    }
  } else {
    serverPath = 'none';
  }

  /* CREATE OPTIONS OBJECT FOR PYSHELL */
  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: `${process.cwd()}/python/`,
    args: [data, serverPath, scheduleFlag, scheduleDate],
  };

  /* CREATE PYSHELL  */
  let pyshell = new PythonShell('conversion.py', options);

  /* CREATE THE PATHS VARIABLE */
  let filePaths;

  pyshell.on('message', (message) => {
    // console.log(message);
    /* SEPARATE THE PATHS INTO USABLE ARRAY */
    let value = parseInt(message);
    if (isNaN(value)) {
      filePaths = message.split(',');
    }
    if (value === 100) {
      let message = {
        customerData,
        filePaths,
        pauseFlag,
        editFlag,
        scheduleFlag,
        scheduleDate,
        customerNumber,
        oldDate,
      };
      ipcRenderer.send('progress-end', message);
      progressWindow.close();
    }
  });

  pyshell.end(function (err, code, signal) {
    if (err) {
      logfileFunc(err.stack);
      progressWindow.hide();
      remote.dialog.showMessageBoxSync(secWindow, {
        type: 'warning',
        icon: `${dir}/renderer/icons/error.png`,
        buttons: ['OK'],
        message: 'P2SYS CONVERSION ERROR:',
        detail:
          'There was an problem during the file conversion.\nPlease contact your developer.',
      });
      ipcRenderer.send('reset-form', null);
      progressWindow.close();
    }
  });
});
