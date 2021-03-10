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
let pauseFlag,
  createNewScheduleFlag,
  customerNumber,
  newScheduleDate,
  OldScheduleDate,
  customerData,
  removeOldScheduleFlag,
  newFlag,
  custDetail,
  priceListNumber,
  priceList,
  createExcelSchedule,
  updateDbFlag;

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
  removeOldScheduleFlag = message.removeOldScheduleFlag;
  createNewScheduleFlag = message.createNewScheduleFlag;
  newScheduleDate = message.newScheduleDate;
  OldScheduleDate = message.OldScheduleDate;
  newFlag = message.newFlag;
  customerNumber = message.custDetail.customerNumber;
  custDetail = message.custDetail;
  priceListNumber = message.custDetail.priceListNumber;
  priceList = customerData['price-list'];
  updateDbFlag = message.updateDbFlag;
  let createExcelSchedule = message.createExcelSchedule;

  /* CREATE A PRICING OBJECT TO CONVERT IN PYTHON */
  let pythonPricingObj = {
    'price-list': {
      ...priceList,
      customerNumber,
      priceListNumber,
    },
  };

  let data = JSON.stringify(pythonPricingObj);
  /* PYTHON PROCESSING FUNCTION */
  ///////////////////////////////
  let serverPath;
  if (newScheduleDate === null) {
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
    args: [data, serverPath, createExcelSchedule, newScheduleDate],
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
        removeOldScheduleFlag,
        createNewScheduleFlag,
        newScheduleDate,
        customerNumber,
        OldScheduleDate,
        newFlag,
        updateDbFlag,
        custDetail,
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
        icon: `${dir}/renderer/icons/converter-logo.png`,
        buttons: ['OK'],
        message: 'P2SYS CONVERSION ERROR:',
        detail:
          'There was an problem during the file conversion.\nPlease contact your developer.',
      });
      ipcRenderer.send('reset-form', false);
      progressWindow.close();
    }
  });
});
