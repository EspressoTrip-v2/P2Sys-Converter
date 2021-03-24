const { remote, ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

const { logFileFunc } = require(`${dir}/logFile.js`);

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
  updateDbFlag,
  multiZipPath;

/* FUNCTIONS */
//////////////

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
  multiZipPath = message.multiZipPath;
  createExcelSchedule = message.createExcelSchedule;

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
    args: [data, serverPath, createExcelSchedule, newScheduleDate, multiZipPath],
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
        multiZipPath,
      };
      ipcRenderer.send('progress-end', message);
      progressWindow.close();
    }
  });

  pyshell.end(function (err, code, signal) {
    if (err) {
      logFileFunc(err.stack);
      progressWindow.hide();
      remote.dialog.showMessageBoxSync(secWindow, {
        type: 'warning',
        icon: `${dir}/renderer/icons/converter-logo.png`,
        buttons: ['OK'],
        message: 'P2Sys conversion error:',
        detail:
          'There was an problem during the file conversion.\nPlease contact your developer.',
      });
      ipcRenderer.send('reset-form', false);
      progressWindow.close();
    }
  });
});
