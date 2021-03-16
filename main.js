/* MODULE IMPORTS */
const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  dialog,
  Notification,
  screen,
} = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');
const homedir = require('os').homedir();
const os = require('os');
require('dotenv').config();

/* DISABLE GPU RENDERING FOR APP */
app.disableHardwareAcceleration();

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

/* LOCAL MODULES */
const {
  queryBackUpDate,
  queryExmillPrice,
  queryAllPriceListNumbers,
  queryAllCustomerNumbers,
  querySinglePriceList,
  queryCustomerName,
  querySinglePriceListNumber,
  querySingleCustomerBackup,
  queryAllScheduleDates,
  querySingleSchedule,
  createScheduleItem,
  removeScheduleItems,
  editSingleScheduledPriceList,
  createPausedPriceList,
  queryAllPaused,
  querySinglePaused,
  removePausedItem,
  removePausedItemSync,
  updatePriceListDataBase,
  addCustomerNameAndNumbers,
  queryAllPausedQuantity,
  queryAllScheduleDatesQuantity,
} = require(`${dir}/database/mongoDbConnect.js`);
const { updater } = require(`${dir}/updater.js`);

const { logFileFunc } = require(`${dir}/logFile.js`);

/* GLOBAL VARIABLES */
let homeWindow,
  secWindow,
  tray,
  childWindow,
  loadingWindow,
  emailWindow,
  multiWindow,
  progressWindow,
  copySelectionWindow,
  customerNumberAllKeys,
  customerNumberNameResult,
  customerNumberNameJson,
  customerNameNumberJson,
  exmillPrice,
  scheduleDates,
  customerPricesNumbersArr,
  screenHeight,
  screenWidth,
  backUpYear,
  version,
  trayMenu,
  passwordGenerate,
  passwordEnter,
  checkScheduleDateFlag,
  updateInfoWindow;

/* GET THE YEAR */
let date = new Date();
const yearNow = date.getFullYear();
const monthNow = date.getMonth() + 1;
const dateString = `${monthNow}/${yearNow}`;
/* GET TEMP FOLDER AND DESKTOP FOLDER */
let tempPath = os.tmpdir();

/* ICON FILE */
let iconImage = `${dir}/renderer/icons/icon.ico`;

////////////////
/* FUNCTIONS */
////////////////

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray(iconImage);
  tray.setContextMenu(trayMenu);
}

/* CREATE NAME NUMBER JSON FOR SEARCH WINDOW */
function convertNumberName() {
  let newObjA = {};
  let newObjB = {};
  customerNumberNameResult.forEach((obj) => {
    newObjA[obj.name] = obj._id;
    newObjB[obj._id] = obj.name;
  });
  customerNameNumberJson = newObjA;
  customerNumberNameJson = newObjB;
}

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let connectionString;

//////////////////////////
/* CONNECTION ERROR */
////////////////////////
function mongooseConnect(message) {
  /* TEST DATABASE */
  connectionString = `mongodb+srv://${message.username}:${message.password}@cluster0.z0sd1.mongodb.net/acwhitcher?retryWrites=true&w=majority`;

  /* AC WHITCHER DATABASE */
  // connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.61lij.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

  mongoose
    .connect(connectionString, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
    .catch((err) => {
      /* INITIAL ERROR CONNECTION */
      dialog
        .showMessageBox(loadingWindow, {
          type: 'error',
          title: 'P2SYS ERROR',
          icon: `${dir}/renderer/icons/converter-logo.png`,
          message:
            'P2Sys Converter was unable to connect to the database. Please try again when a connection is available',
          buttons: ['EXIT'],
        })
        .then(() => {
          loadingWindow.close();
        });

      let fileDir = `${appData}/error-log.txt`;
      /* CHECK IF IT EXISTS */
      fs.existsSync(fileDir)
        ? fs.appendFileSync(
            fileDir,
            `${new Date()} -> Connection failure: ${err}\n`,
            'utf8',
            () => console.log('Logfile write error')
          )
        : fs.writeFileSync(
            fileDir,
            `${new Date()} -> Connection failure: ${err}\n`,
            'utf8',
            () => console.log('Logfile write error')
          );
    });
}

////////////////////
/* DB  LISTENERS */
//////////////////
const db = mongoose.connection;

/* DOWNLOAD DB ONCE CONNECTED */
db.once('connected', async () => {
  /* GET LATEST EXMILL PRICE */
  try {
    let result = await queryExmillPrice(notifyMain);
    exmillPrice = result;
  } catch (err) {
    logFileFunc(err);
  }

  /* NOTIFICATION FUNCTION */
  function notifyMain(message) {
    let notification = new Notification({
      title: message.title,
      body: message.body,
      icon: `${dir}/renderer/icons/converter-logo.png`,
    });
    notification.show();
  }

  /* CHECK BACKUPS CLEAN DATE */
  try {
    let result = await queryBackUpDate(notifyMain);
    if (result) {
      let notification = new Notification({
        title: 'Cleaning Backup database',
        body: 'Out of date entries are being removed from the Backup Database.',
        icon: `${dir}/renderer/icons/converter-logo.png`,
      });
      notification.show();
    }
  } catch (err) {
    logFileFunc(err);
  }

  /* GET ALL THE SCHEDULE DATES */
  try {
    scheduleDates = await queryAllScheduleDates(notifyMain);
    checkScheduleDateFlag = scheduleDates.includes(dateString) ? true : false;
    if (checkScheduleDateFlag) {
      let schedulePrices = await querySingleSchedule(dateString, notifyMain);
      schedulePriceListsToConvert = {
        schedulePrices,
        dateString,
      };
    }
  } catch (err) {
    logFileFunc(err);
  }

  /* QUERY ALL NAMES */
  try {
    customerNumberNameResult = await queryCustomerName(null, true, notifyMain);
  } catch (err) {
    logFileFunc(err);
  }

  /* FETCH ALL CUSTOMER NAME INDEXES */
  try {
    customerNumberAllKeys = await queryAllCustomerNumbers(notifyMain);
  } catch (err) {
    logFileFunc(err);
  }

  /* TRAY MENU LAYOUT TEMPLATE */
  trayMenu = Menu.buildFromTemplate([{ label: `Converter v${version}` }]);
  createWindow();
  convertNumberName();
});

db.on('disconnected', () => {
  if (secWindow && secWindow.isVisible()) {
    secWindow.webContents.send('connection-lost', null);
  } else if (homeWindow && homeWindow.isVisible()) {
    homeWindow.webContents.send('connection-lost', null);
  } else if (emailWindow && emailWindow.isVisible()) {
    dialog.showMessageBoxSync(emailWindow, {
      type: 'info',
      title: 'P2SYS DATABASE CONNECTION LOST',
      message: 'The connection to the database has been lost',
      detail: 'The email will fail on send, you will have to resend it manually.',
      icon: `${dir}/renderer/icons/converter-logo.png`,
      buttons: ['OK'],
    });
  } else if (copySelectionWindow && copySelectionWindow.isVisible()) {
    copySelectionWindow.webContents.send('connection-lost', null);
  }
});

db.on('error', () => {
  if (secWindow && secWindow.isVisible()) {
    secWindow.webContents.send('connection-lost', null);
  } else if (homeWindow && homeWindow.isVisible()) {
    homeWindow.webContents.send('connection-lost', null);
  } else if (emailWindow && emailWindow.isVisible()) {
    dialog.showMessageBoxSync(emailWindow, {
      type: 'info',
      title: 'P2SYS DATABASE CONNECTION LOST',
      message: 'The connection to the database has been lost',
      detail: 'The email will fail on send, you will have to resend it manually.',
      icon: `${dir}/renderer/icons/converter-logo.png`,
      buttons: ['OK'],
    });
  } else if (copySelectionWindow && copySelectionWindow.isVisible()) {
    copySelectionWindow.webContents.send('connection-lost', null);
  }
});

db.on('reconnected', () => {
  let notification = new Notification({
    title: 'P2Sys database info',
    body: 'Reconnected to the database',
    icon: `${dir}/renderer/icons/converter-logo.png`,
  });
  notification.show();
  if (secWindow && secWindow.isVisible()) {
    secWindow.webContents.send('connection-found', null);
  } else if (homeWindow && homeWindow.isVisible()) {
    homeWindow.webContents.send('connection-found', null);
  } else if (copySelectionWindow && copySelectionWindow.isVisible()) {
    copySelectionWindow.webContents.send('connection-found', null);
  }
});

////////////////////////////////
/* WINDOW CREATION FUNCTIONS */
//////////////////////////////
/* MAIN WINDOW CREATION */
function createWindow() {
  createTray();
  /* SORT THE BACKUPS IF LAST CHECKED YEAR BEHIND CURRENT */
  if (backUpYear < yearNow) {
    removeBackups(customerBackUp);
  }
  homeWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.18),
    maxWidth: Math.floor(screenWidth * 0.16),
    maxHeight: Math.floor(screenWidth * 0.22),
    minHeight: Math.floor(screenWidth * 0.18),
    minWidth: Math.floor(screenWidth * 0.13),
    spellCheck: false,
    center: true,
    maximizable: false,
    alwaysOnTop: true,
    backgroundColor: '#00FFFFFF',
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    icon: iconImage,
  });

  //   Load html page
  homeWindow.loadFile(`${dir}/renderer/mainPage/main.html`);

  setTimeout(() => {
    updater(homeWindow);
  }, 2000);

  //   Load dev tools
  // homeWindow.webContents.openDevTools();

  // Only show on load completion
  homeWindow.webContents.on('did-finish-load', () => {
    homeWindow.webContents.send('get-notifications-main-app', null);
    if (checkScheduleDateFlag) {
      homeWindow.webContents.send('convert-schedule', schedulePriceListsToConvert);
    }
    if (loadingWindow) {
      loadingWindow.close();
    }
  });

  //   Event listener for closing
  homeWindow.on('closed', () => {
    homeWindow = null;
    if (!emailWindow) {
      app.quit();
    }
  });
}

/* SECWINDOW CREATION */
function createSecWindow(message) {
  secWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.18),
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  secWindow.loadFile(`${dir}/renderer/startPage/startPage.html`);

  // Only show on load completion
  secWindow.webContents.once('did-finish-load', () => {
    secWindow.moveTop();
    /* CREATE DATABASE OBJECT TO SEND TO WINDOW */
    let dbObj = {
      customerNumberAllKeys,
      customerNameNumberJson,
      customerNumberNameJson,
      exmillPrice,
    };
    secWindow.webContents.send('database-object', dbObj);
    if (message === null) {
      if (loadingWindow) {
        loadingWindow.close();
      }
    } else if (message.flag === 'edit') {
      /* SEND ITEMS FROM SCHEDULED PRICE LIST TO UPDATE */
      secWindow.webContents.send('edit-schedule-price-list', message.schedulePriceList);

      if (loadingWindow) {
        loadingWindow.close();
      }
    } else if (message.flag === 'copy') {
      /* SEND ITEMS FROM COPY PRICE LIST TO UPDATE */
      secWindow.webContents.send('copy-price-list', message.copyPriceList);
      if (loadingWindow) {
        loadingWindow.close();
      }
    } else if (message.flag === 'new') {
      /* SEND ITEMS FROM COPY PRICE LIST TO UPDATE */
      secWindow.webContents.send('new-price-list', message.copyPriceList);
      if (loadingWindow) {
        loadingWindow.close();
      }
    }
  });

  //   Load dev tools
  // secWindow.webContents.openDevTools();

  //   Event listener for closing
  secWindow.on('closed', () => {
    secWindow = null;
  });
}

/* CHILD WINDOW CREATION */
function createChildWindow(message) {
  childWindow = new BrowserWindow({
    parent: secWindow,
    height: message.size[1],
    width: message.size[0],
    resizable: false,
    x: message.dimensions[0] - message.size[0],
    y: message.dimensions[1],
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    skipTaskbar: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  childWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`);

  //   Load dev tools
  // childWindow.webContents.openDevTools();

  // Only show on load completion
  childWindow.webContents.once('did-finish-load', () => {
    /* SEND NAME-NUMBER JSON AND PRICE-LIST NAMES */
    childWindow.webContents.send('name-search', {
      customerNameNumberJson,
      customerPricesNumbersArr,
    });
    if (loadingWindow) {
      loadingWindow.close();
    }
  });

  //   Event listener for closing
  childWindow.on('closed', () => {
    childWindow = null;
  });
}

/* LOADING WINDOW */
function createLoadingWindow() {
  let parentWin;
  if (secWindow) {
    parentWin = secWindow;
  } else {
    parentWin = null;
  }

  loadingWindow = new BrowserWindow({
    parent: parentWin,
    width: Math.floor(screenWidth * 0.052),
    height: Math.floor(screenWidth * 0.052),
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    center: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   LOAD HTML PAGE
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

  loadingWindow.webContents.on('did-finish-load', () => {
    loadingWindow.moveTop();
  });

  //   LOAD DEV TOOLS
  // loadingWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  loadingWindow.on('closed', () => {
    loadingWindow = null;
  });
}

/* EMAIL POPUP WINDOW */
function createEmailWindow(message) {
  emailWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.29),
    height: Math.floor(screenWidth * 0.36),
    maxWidth: Math.floor(screenWidth * 0.39),
    maxHeight: Math.floor(screenWidth * 0.45),
    autoHideMenuBar: true,
    center: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    maximizable: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: `${dir}/renderer/icons/mailTemplate.png`,
  });

  //   Load html page
  emailWindow.loadFile(`${dir}/renderer/email/email.html`);

  emailWindow.webContents.once('did-finish-load', (e) => {
    if (loadingWindow) {
      loadingWindow.close();
    }
    emailWindow.webContents.send('email-popup', message);
    emailWindow.moveTop();
  });

  //   Load dev tools
  // emailWindow.webContents.openDevTools();

  //   Event listener for closing
  emailWindow.on('closed', () => {
    emailWindow = null;
  });
}

/* PROGRESS WINDOW */
function createProgressWindow() {
  progressWindow = new BrowserWindow({
    parent: secWindow,
    width: Math.floor(screenWidth * 0.052),
    height: Math.floor(screenWidth * 0.052),
    spellCheck: false,
    resizable: false,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    center: true,
    skipTaskbar: true,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   LOAD HTML PAGE
  progressWindow.loadFile(`${dir}/renderer/progress/progress.html`);

  progressWindow.webContents.on('did-finish-load', () => {
    progressWindow.moveTop();
  });

  //   LOAD DEV TOOLS
  // progressWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  progressWindow.on('closed', () => {
    progressWindow = null;
  });
}

/* COPY SELECTION WINDOW */
function createCopySelectionWindow(message) {
  copySelectionWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.18),
    maxWidth: Math.floor(screenWidth * 0.16),
    maxHeight: Math.floor(screenWidth * 0.24),
    minHeight: Math.floor(screenWidth * 0.18),
    minWidth: Math.floor(screenWidth * 0.13),
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });
  //   LOAD HTML PAGE
  copySelectionWindow.loadFile(`${dir}/renderer/copySelection/copySelection.html`);

  // Only show on load completion
  copySelectionWindow.webContents.once('did-finish-load', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
    copySelectionWindow.webContents.send('copy-selection', {
      customerPricesNumbersArr,
      customerNameNumberJson,
      template: message,
      customerNumberNameJson,
    });
  });

  //   LOAD DEV TOOLS
  // copySelectionWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  copySelectionWindow.on('closed', () => {
    copySelectionWindow = null;
  });
}

/* CREATE MULTI WINDOW */
function createMultiWindow(message) {
  multiWindow = new BrowserWindow({
    parent: copySelectionWindow,
    height: message.size[1],
    width: Math.floor(message.size[0] * 0.8),
    resizable: false,
    x: message.dimensions[0] - Math.floor(message.size[0] * 0.8),
    y: message.dimensions[1],
    resizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    skipTaskbar: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });
  //   LOAD HTML PAGE
  multiWindow.loadFile(`${dir}/renderer/multi/multi.html`);

  // Only show on load completion
  multiWindow.webContents.once('did-finish-load', () => {
    multiWindow.webContents.send('add-customer-number', message.customerNumber);
  });

  //   LOAD DEV TOOLS
  // copySelectionWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  multiWindow.on('closed', () => {
    multiWindow = null;
  });
}

/* UPDATE CORNER INFO */
function createUpdateInfo() {
  updateInfoWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.03),
    height: Math.floor(screenWidth * 0.03),
    x: screenWidth - 60,
    y: screenHeight - 100,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  updateInfoWindow.loadFile(`${dir}/renderer/updateInfo/updateInfo.html`);

  //   Load dev tools
  // updateInfoWindow.webContents.openDevTools();

  //   Event listener for closing
  updateInfoWindow.on('closed', () => {
    updateInfoWindow = null;
  });
}

/* PASSWORD ASK WINDOW CREATION */
function createPasswordGenerateWindow(message) {
  passwordGenerate = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.19),
    maxWidth: Math.floor(screenWidth * 0.16),
    maxHeight: Math.floor(screenWidth * 0.24),
    minHeight: Math.floor(screenWidth * 0.15),
    minWidth: Math.floor(screenWidth * 0.1),
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  passwordGenerate.loadFile(`${dir}/renderer/passwordGenerate/passwordGenerate.html`);

  // Only show on load completion
  passwordGenerate.webContents.once('did-finish-load', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
  });

  //   Load dev tools
  // passwordGenerate.webContents.openDevTools();

  //   Event listener for closing
  passwordGenerate.on('closed', () => {
    passwordGenerate = null;
  });
}

/* PASSWORD ASK WINDOW CREATION */
function createPasswordEnterWindow(hash) {
  passwordEnter = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.16),
    maxWidth: Math.floor(screenWidth * 0.18),
    maxHeight: Math.floor(screenWidth * 0.22),
    minHeight: Math.floor(screenWidth * 0.125),
    minWidth: Math.floor(screenWidth * 0.1),
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  passwordEnter.loadFile(`${dir}/renderer/passwordEnter/passwordEnter.html`);

  // Only show on load completion
  passwordEnter.webContents.once('did-finish-load', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
    passwordEnter.webContents.send('hash', hash);
  });

  //   Load dev tools
  // passwordEnter.webContents.openDevTools();

  //   Event listener for closing
  passwordEnter.on('closed', () => {
    passwordEnter = null;
  });
}

function checkPassword() {
  if (!fs.existsSync(`${appData}/ps_bin.dat`)) {
    createPasswordGenerateWindow();
  } else if (fs.existsSync(`${appData}/ps_bin.dat`)) {
    fs.readFile(`${appData}/ps_bin.dat`, 'utf8', (err, data) => {
      createPasswordEnterWindow(JSON.parse(data).hash);
    });
  }
}

function deleteUnusedFiles() {
  let filesToDelete = [];
  fs.readdir(tempPath, (err, files) => {
    let psysFiles = files.forEach((el) => {
      if (el.includes('P2Sys_conversion')) {
        filesToDelete.push(el);
      }
    });
    filesToDelete.forEach((el) => {
      fs.rmdir(`${tempPath}\\${el}`, { recursive: true }, (err) => {
        if (err) {
          logFileFunc(err);
        }
      });
    });
  });
}

/* APP READY --> CREATE MAIN WINDOW */
app.on('ready', () => {
  /* CHECK TO SEE IF APP ALREADY RUNNING */
  if (!app.requestSingleInstanceLock()) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'APP ALREADY RUNNING',
      message: 'Converter is already running, please check the taskbar.',
      buttons: ['OK'],
    });
    app.quit();
  } else {
    /* SET APP NAME FOR WINDOWS NOTIFICATIONS*/
    app.setAppUserModelId('P2Sys-Converter');
    /* SET VERSION VARIABLE */
    version = app.getVersion();

    /* GET SCREEN SIZE */
    let res = screen.getPrimaryDisplay().size;
    screenHeight = res.height;
    screenWidth = res.width;
    setTimeout(() => {
      createLoadingWindow();
      checkPassword();
    }, 300);
  }
});

/* QUIT APP WHEN ALL WINDOWS ARE CLOSED */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

////////////////////
/* IPC LISTENERS */
//////////////////

/* IPC FUNCTIONS */
async function reloadData() {
  customerNumberNameResult = await queryCustomerName(null, true, notifyMain);
  customerNumberAllKeys = await queryAllCustomerNumbers(notifyMain);
  convertNumberName();
}

/* OPEN COPY SELECTION WINDOW */
ipcMain.on('open-copy-selection', (e, message) => {
  createLoadingWindow();
  createCopySelectionWindow(message);
});

/* MESSENGER SERVICE BETWEEN RENDERERS */
ipcMain.on('dock-sec', (e, message) => {
  secWindow.webContents.send('dock-sec', message);
});

/* MESSAGE FROM START BUTTON */
/* Create new customer number search window */
ipcMain.on('start', (e, message) => {
  homeWindow.hide();
  createLoadingWindow();
  createSecWindow(message);
});

/* POSITION OF SECWINDOW TO GENERATE DOCK NEXT TO IT */
ipcMain.on('position', (e, message) => {
  createChildWindow(message);
});

/* MESSAGES FROM SAVE BUTTON TO CREATE PROGRESS WINDOW */
ipcMain.on('progress-create', (e, message) => {
  /* CREATE THE PROGRESS WINDOW */
  createProgressWindow();
  /* SEND THE FILE TO PYTHON SHELL TO GET CONVERTED */
  progressWindow.webContents.on('did-finish-load', (e) => {
    progressWindow.webContents.send('convert-python', message);
  });
});

function getNewScheduleItem(message) {
  let scheduleData = {
    [message.customerNumber]: message.customerData['price-list'],
  };
  return scheduleData;
}

/* DATABASE BACKUP */
async function databaseBackupControl(message) {
  let customerNumber = message.customerNumber;
  let pauseFlag = message.pauseFlag;
  let newScheduleDate = message.newScheduleDate;
  let OldScheduleDate = message.OldScheduleDate;
  let priceList = message.customerData['price-list'];
  let newFlag = message.newFlag;
  let custDetail = message.custDetail;
  let removeOldScheduleFlag = message.removeOldScheduleFlag;
  let createNewScheduleFlag = message.createNewScheduleFlag;
  let updateDbFlag = message.updateDbFlag;

  /* REMOVE PAUSED ITEM FROM DB IF TRUE */
  if (pauseFlag) {
    removePausedItem(customerNumber, notifyMain);
  }

  /* REMOVED OLD SCHEDULE AND CREATE A NEW ONE (EDIT) */
  if (removeOldScheduleFlag && createNewScheduleFlag) {
    /* CHECK IF DATES ARE THE SAME */
    if (OldScheduleDate === newScheduleDate) {
      let obj = getNewScheduleItem(message);
      createScheduleItem(obj, newScheduleDate, notifyMain);
      /* CHECK IF DATES ARE DIFFERENT */
    } else if (OldScheduleDate !== newScheduleDate) {
      let result = await removeScheduleItems(
        { dateValue: OldScheduleDate, customerNumber },
        notifyMain
      );
      if (result) {
        let obj = getNewScheduleItem(message);
        createScheduleItem(obj, newScheduleDate, notifyMain);
      }
    }
    /* CHECK IF REMOVE FLAG IS TRUE AND CREATE IS FALSE THEN JUST REMOVE */
  } else if (removeOldScheduleFlag && !createNewScheduleFlag) {
    removeScheduleItems({ dateValue: OldScheduleDate, customerNumber }, notifyMain);
  } else if (!removeOldScheduleFlag && createNewScheduleFlag) {
    let obj = getNewScheduleItem(message);
    createScheduleItem(obj, newScheduleDate, notifyMain);
  }

  /* UPDATE PRICE-LIST AND BACKUP ALSO IF NEW CUSTOMER UPDATE THE NAMES */
  if (newFlag && updateDbFlag) {
    await updatePriceListDataBase(
      { customerNumber, 'price-list': priceList, custDetail },
      notifyMain
    );
    reloadData();
  } else if (updateDbFlag) {
    await updatePriceListDataBase(
      {
        customerNumber,
        'price-list': priceList,
        custDetail: null,
      },
      notifyMain
    );
    reloadData();
  }
}

/* MESSAGE FROM PROGRESS WINDOW ON COMPLETION AND CLOSE */
ipcMain.on('progress-end', (e, message) => {
  /* SEND MESSAGE TO CLOSE THE PROGRESS BAR */
  secWindow.webContents.send('progress-end', message);
  databaseBackupControl(message);
});

/* MESSAGE FROM MULTI CONVERT PROGRESS */
ipcMain.on('progress-end-multi', async (e, message) => {
  databaseBackupControl(message);
});

/* MESSAGE TO CREATE EMAIL POPUP CHILD WINDOW */
ipcMain.on('email-popup', (e, message) => {
  createLoadingWindow();
  createEmailWindow(message);
});

/* SEND MESSAGE SEND AND FORM CAN BE RESET MESSAGE FROM EMAIL POPUP */
ipcMain.on('email-close', (e, message) => {
  if (secWindow) {
    secWindow.webContents.send('email-close', null);
  } else {
    createLoadingWindow();
    createSecWindow(null);
  }
});

/* SEND MESSAGE TO CLOSE TABLE WINDOW ON ERROR */
ipcMain.on('reset-form', (e, message) => {
  secWindow.webContents.send('reset-form', null);
});

/* CLOSE DOCK WINDOW */
ipcMain.on('close-window-dock', (e, message) => {
  if (childWindow) {
    childWindow.webContents.send('close-window-dock', null);
    childWindow.close();
  }
});

/* CLOSE LOADER */
ipcMain.on('loader-close', (e, message) => {
  if (loadingWindow) {
    loadingWindow.close();
  }
});

/* RESTART SEC WINDOW */
ipcMain.on('restart-sec', async (e, message) => {
  createLoadingWindow();
  if (secWindow) {
    secWindow.hide();
    secWindow.close();
    setTimeout(() => {
      createSecWindow(null);
    }, 500);
  }
});

/* SHOW HOME WINDOW */
ipcMain.on('show-home', (e, message) => {
  if (secWindow) {
    secWindow.close();
  }
  if (homeWindow) {
    homeWindow.webContents.send('get-notifications-main-app', null);
    homeWindow.show();
  }
});

/* REMOVE FADE FROM SECWINDOW */
ipcMain.on('show-sec-window', (e, message) => {
  if (secWindow) {
    secWindow.setFullScreen(true);
  }
});

/* CLOSE MAIN WINDOW & CHECK TO SEE IF UPDATE IS DOWNLOADING */
ipcMain.on('close-main', (e, message) => {
  if (homeWindow) {
    homeWindow.close();
  }
}); // TODO: FINNISH CLOSE

/* QUERIES FOR DATABASE */
ipcMain.handle('get-price-list', async (e, message) => {
  let result = await querySinglePriceList(message, notifyMain);
  return result;
});

/* GET THE PRICE-LIST NUMBER */
ipcMain.handle('get-pricelist-number', async (e, message) => {
  let result = await querySinglePriceListNumber(message, notifyMain);
  return result;
});

/* GET THE CUSTOMER BACKUP DATA */
ipcMain.handle('get-customer-backup', async (e, message) => {
  let result = await querySingleCustomerBackup(message, notifyMain);
  return result;
});

ipcMain.on('create-name-numbers', (e, message) => {
  addCustomerNameAndNumbers(message, notifyMain);
});

/* SAVE PAUSED PRICE-LIST */
ipcMain.on('save-paused-price-list', async (e, message) => {
  await createPausedPriceList(message.pausedJson, notifyMain);
  reloadData();
});

/* QUERY ALL PAUSED PRICE-LIST CUSTOMER NUMBERS */
ipcMain.handle('get-all-paused', async (e, message) => {
  let result = queryAllPaused(notifyMain);
  return result;
});

/* QUERY SINGLE PAUSED PRICE-LIST CUSTOMER NUMBERS */
ipcMain.handle('get-single-paused', async (e, message) => {
  let result = await querySinglePaused(message, notifyMain);
  return result;
});

/* REMOVE PAUSED ITEM */
ipcMain.handle('remove-pause-item-sync', async (e, message) => {
  return await removePausedItemSync(message, notifyMain);
});

/* QUERY ALL SCHEDULED PRICE-LISTS */
ipcMain.handle('get-schedule-dates-update', async (e, message) => {
  return await queryAllScheduleDates(notifyMain);
});

/* QUERY SINGLE SCHEDULED PRICE-LISTS */
ipcMain.handle('show-single-customer-schedule', async (e, message) => {
  return await querySingleSchedule(message, notifyMain);
});

ipcMain.handle('update-scheduled-items', async (e, message) => {
  return await removeScheduleItems(message, notifyMain);
});

ipcMain.handle('edit-schedule-price-list', async (e, message) => {
  let priceList = await editSingleScheduledPriceList(message, notifyMain);
  let priceListNumber = await querySinglePriceListNumber(message.customerNumber, notifyMain);
  let customerBackUpJson = await querySingleCustomerBackup(message.customerNumber, notifyMain);
  let customerNumber = message.customerNumber;
  let customerNameValue = customerNumberNameJson[message.customerNumber];

  let schedulePriceListObj = {
    OldScheduleDate: message.dateValue,
    priceList,
    priceListNumber,
    customerNumber,
    customerNameValue,
    customerBackUpJson,
  };

  return schedulePriceListObj;
});

/* GET A SINGLE SCHEDULE PRICE-LIST FOR CONVERSION */
ipcMain.handle('get-schedule-price-list', async (e, message) => {
  let priceList = await editSingleScheduledPriceList(message, notifyMain);
  let jsonFile = {
    'price-list': priceList,
    _id: message.customerNumber,
  };

  return jsonFile;
});

ipcMain.on('close-email-window', (e, message) => {
  if (emailWindow) {
    emailWindow.close();
  }
  if (updateInfoWindow) {
    updateInfoWindow.show();
  }
  deleteUnusedFiles();
});

ipcMain.on('ask-window-multi', (e, message) => {
  if (multiWindow) {
    multiWindow.webContents.send('add-customer-number', message.customerNumber);
  } else {
    createMultiWindow(message);
  }
});

ipcMain.on('close-multi-window', (e, message) => {
  if (multiWindow) {
    multiWindow.close();
  }
});

ipcMain.on('clear-copy-selection-click', (e, message) => {
  if (copySelectionWindow) {
    copySelectionWindow.webContents.send('clear-copy-selection-click', null);
  }
});

ipcMain.on('unselect-item-copy-selection', (e, message) => {
  if (copySelectionWindow) {
    copySelectionWindow.webContents.send('unselect-item-copy-selection', message);
  }
});

ipcMain.handle('customer-prices-array', async (e, message) => {
  customerPricesNumbersArr = await queryAllPriceListNumbers(notifyMain);
  return customerPricesNumbersArr;
});

ipcMain.on('close-app', (e, message) => {
  app.exit();
});

ipcMain.on('restart-app', (e, message) => {
  app.relaunch();
  app.exit();
});

ipcMain.on('connect-to-database', (e, message) => {
  createLoadingWindow();
  mongooseConnect(message);
});

ipcMain.on('get-customer-selection-arr', (e, message) => {
  if (multiWindow) {
    multiWindow.webContents.send('get-customer-selection-arr', null);
  }
});

ipcMain.on('return-customer-selection-arr', (e, message) => {
  copySelectionWindow.webContents.send('get-customer-selection-arr', message);
});

ipcMain.handle('get-paused-schedule-count', async (e, message) => {
  let pCount = await queryAllPausedQuantity(notifyMain);
  let sCount = await queryAllScheduleDatesQuantity(notifyMain);
  return { pCount, sCount };
});

/* OPEN UPDATE WINDOW */
ipcMain.on('open-update-window', (e, message) => {
  createUpdateInfo();
});

/* UPDATE DOWNLOADED */
ipcMain.on('close-update-window', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.close();
  }
});

/* UPDATE DOWNLOADED */
ipcMain.on('update-progress', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.webContents.send('update-percent', message);
  }
});

/* HIDE UPDATER IF OPEN */
ipcMain.on('hide-updater', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.hide();
  }
});

/* SHOW UPDATER IF OPEN */
ipcMain.on('show-updater', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.show();
  }
});
