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
require('dotenv').config();

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
  queryCustomerExists,
  querySinglePricelistNumber,
  querySingleCustomerBackup,
  queryAllScheduleDates, //TODO:  Finish schedule conversion
} = require(`${dir}/database/mongoDbConnect.js`);
const { updater } = require(`${dir}/updater.js`);

/* GLOBAL VARIABLES */
let homeWindow,
  secWindow,
  tray,
  childWindow,
  loadingWindow,
  updateWindow,
  emailWindow,
  progressWindow,
  // dbLoaderWindow,
  copySelectionWindow,
  customerNumberAllKeys,
  customerNumberNameResult,
  customerNumberNameJson,
  customerNameNumberJson,
  exmillPrice,
  customerPricesNumbersArr,
  screenHeight,
  screenWidth,
  iconImage,
  backUpYear,
  version,
  trayMenu,
  secWindowState,
  mainWindowState;

/* GET THE YEAR */
const yearNow = new Date().getFullYear();

/* ICON FILE */
if (process.platform === 'win32') {
  iconImage = `${dir}/renderer/icons/icon.ico`;
} else {
  iconImage = `${dir}/renderer/icons/trayTemplate.png`;
}

////////////////
/* FUNCTIONS */
////////////////

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray(iconImage);
  tray.setContextMenu(trayMenu);
}

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${appData}/error-log.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}: ${message}\n`, (err) => console.log(err));
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: ${message}\n`, (err) => console.log(err));
  }
}

/* CREATE NAME NUMBER JSON FOR SEARCH WINDOW */
function convertNumberName() {
  let newObjA = {};
  let newObjB = {};
  // let dupes = [];
  customerNumberNameResult.forEach((obj) => {
    // if (newObjA[obj.name]) {
    //   dupes.push(obj.name);
    // }
    newObjA[obj.name] = obj._id;
    newObjB[obj._id] = obj.name;
  });
  customerNameNumberJson = newObjA;
  customerNumberNameJson = newObjA;
  // console.log(dupes);
}

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
let connectionString, connectionName;

//////////////////////////
/* CONNECTION ERROR */
////////////////////////
function mongooseConnect() {
  /* TEST DATABASE */
  connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.z0sd1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
  connectionName = 'Test Database';

  /* AC WHITCHER DATABASE */
  // connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.61lij.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
  // connectionName = 'A.C Whitcher Database';

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
          icon: `${dir}/renderer/icons/error.png`,
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
    let result = await queryExmillPrice();
    exmillPrice = result;
  } catch (err) {
    logfileFunc(err.stack);
  }

  /* CHECK BACKUPS CLEAN DATE */
  try {
    queryBackUpDate();
  } catch (err) {
    logfileFunc(err.stack);
  }

  /* QUERY ALL NAMES */
  try {
    customerNumberNameResult = await queryCustomerName(null, true);
  } catch (err) {
    logfileFunc(err.stack);
  }

  /* FETCH PRICELIST INDEXES */
  try {
    customerPricesNumbersArr = await queryAllPriceListNumbers();
  } catch (err) {
    logfileFunc(err.stack);
  }

  /* FETCH ALL CUSTOMER NAME INDEXES */
  try {
    customerNumberAllKeys = await queryAllCustomerNumbers();
    /* SEND COMPLETE NOTIFICATION */
  } catch (err) {
    logfileFunc(err.stack);
  }

  /* TRAY MENU LAYOUT TEMPLATE */
  trayMenu = Menu.buildFromTemplate([{ label: `Converter v${version}` }]);
  createWindow();
  convertNumberName();
});

db.on('disconnected', () => {
  if (secWindow && secWindow.isVisible()) {
    dialog.showMessageBoxSync(secWindow, {
      type: 'info',
      title: 'P2SYS DATABASE CONNECTION LOST',
      message: 'The connection to the database has been lost',
      detail:
        'If reconnecting fails please PAUSE your work and update when a connection is available.',
      icon: `${dir}/renderer/icons/info.png`,
      buttons: ['OK'],
    });
  } else if (homeWindow && homeWindow.isVisible()) {
    dialog.showMessageBoxSync(homeWindow, {
      type: 'info',
      title: 'P2SYS DATABASE CONNECTION LOST',
      message: 'The connection to the database has been lost',
      detail:
        'If reconnecting fails please PAUSE your work and update when a connection is available.',
      icon: `${dir}/renderer/icons/info.png`,
      buttons: ['OK'],
    });
  } else if (emailWindow && emailWindow.isVisible()) {
    dialog.showMessageBoxSync(emailWindow, {
      type: 'info',
      title: 'P2SYS DATABASE CONNECTION LOST',
      message: 'The connection to the database has been lost',
      detail: 'The email will fail on send, however it will be sent on the next restart',
      icon: `${dir}/renderer/icons/info.png`,
      buttons: ['OK'],
    });
  } else {
    /* CHECK TO SEE IF THERE IS AN AVAILABLE WINDOW */
    if (homeWindow | secWindow) {
      let notification = new Notification({
        title: 'P2SYS CONNECTION LOST',
        body: 'The connection to the database has been lost',
        icon: `${dir}/renderer/icons/info.png`,
      });
      notification.show();
    }
  }
});

db.on('reconnected', () => {
  let notification = new Notification({
    title: 'P2SYS DB CONNECTED',
    body: 'Reconnected to the database',
    icon: `${dir}/renderer/icons/info.png`,
  });
  notification.show();
  if (secWindow) {
    secWindow.webContents.send('reconnected', null);
  }
  if (homeWindow) {
    homeWindow.webContents.send('db', connectionName);
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
    width: 180,
    height: 200,
    maxWidth: 300,
    maxHeight: 300,
    minHeight: 200,
    minWidth: 180,
    spellCheck: false,
    center: true,
    show: false,
    maximizable: false,
    alwaysOnTop: true,
    backgroundColor: '#00FFFFFF',
    webPreferences: {
      // devTools: false,
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
    loadingWindow.close();
    homeWindow.show();
    homeWindow.webContents.send('db', connectionName);
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
function createSecWindow() {
  secWindow = new BrowserWindow({
    height: 270,
    width: 200,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    transparent: true,
    webPreferences: {
      // devTools: false,
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
    /* CREATE DATABASE OBJECT TO SEND TO WINDOW */
    let dbObj = {
      customerNumberAllKeys,
      customerPricesNumbersArr,
      customerNameNumberJson,
      customerNumberNameJson,
      exmillPrice,
    };
    secWindow.webContents.send('database-object', dbObj);

    if (loadingWindow) {
      loadingWindow.close();
    }
    secWindow.focus();
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
    center: true,
    skipTaskbar: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
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
    height: 100,
    width: 100,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    center: true,
    frame: false,
    skipTaskbar: true,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
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
    height: 355,
    width: 285,
    autoHideMenuBar: true,
    center: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    maximizable: false,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: `${dir}/renderer/icons/mailTemplate.png`,
  });

  //   Load html page
  emailWindow.loadFile(`${dir}/renderer/email/email.html`);

  emailWindow.webContents.once('did-finish-load', (e) => {
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
    height: 250,
    width: 250,
    spellCheck: false,
    resizable: false,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    center: true,
    skipTaskbar: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
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

/* UPDATING WINDOW */
function createUpdateWindow() {
  xPos = screenWidth / 2 - 115;
  updateWindow = new BrowserWindow({
    height: 80,
    width: 240,
    x: xPos,
    y: 0,
    spellCheck: false,
    resizable: false,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: `${dir}/renderer/icons/updateTemplate.png`,
  });
  //   LOAD HTML PAGE
  updateWindow.loadFile(`${dir}/renderer/update/update.html`);

  //   LOAD DEV TOOLS
  // updateWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  updateWindow.on('closed', () => {
    updateWindow = null;
  });
}

/* COPY SELECTION WINDOW */
function createCopySelectionWindow() {
  copySelectionWindow = new BrowserWindow({
    parent: secWindow,
    height: 480,
    width: 300,
    spellCheck: false,
    resizable: false,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
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
    copySelectionWindow.webContents.send('copy-selection', {
      // customerPricesNumbersArr,
      // customerNameNumber,
    });
  });

  //   LOAD DEV TOOLS
  // copySelectionWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  copySelectionWindow.on('closed', () => {
    copySelectionWindow = null;
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
      /* CREATE CONNECTION */
      mongooseConnect();
      /* START LOADER */
      createLoadingWindow();
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

/* OPEN COPY SELECTION WINDOW */
ipcMain.on('open-copySelection', (e, message) => {
  createCopySelectionWindow();
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
  setTimeout(() => createSecWindow(message), 200);
});

/* POSITION OF SECWINDOW TO GENERATE DOCK NEXT TO IT */
ipcMain.on('position', (e, message) => {
  createChildWindow(message);
});

/* MESSAGE FROM SAVE BUTTON TO CREATE PROGRESS WINDOW */
ipcMain.on('progress', (e, message) => {
  /* CREATE THE PROGRESS WINDOW */
  createProgressWindow();
  /* SEND THE FILE TO PYTHON SHELL TO GET CONVERTED */
  progressWindow.webContents.on('did-finish-load', (e) => {
    progressWindow.webContents.send('convert-python', message);
  });
});

/* MESSAGE FROM PROGRESS WINDOW ON COMPLETION AND CLOSE */
ipcMain.on('progress-end', (e, message) => {
  /* SEND MESSAGE TO CLOSE THE PROGRESS BAR */
  createLoadingWindow();
  secWindow.webContents.send('progress-end', message.filePaths);
});

/* SEND DB STATUS TO UPDATE OTHER DATABASE INDICATORS */
ipcMain.on('db-status', (event, message) => {
  if (secWindow) {
    secWindow.webContents.send('db-status', message);
  }
});

/* MESSAGE TO CREATE EMAIL POPUP CHILD WINDOW */
ipcMain.on('email-popup', (e, message) => {
  createEmailWindow(message);
});

/* SEND MESSAGE SEND AND FORM CAN BE RESET MESSAGE FROM EMAIL POPUP */
ipcMain.on('email-close', (e, message) => {
  secWindow.webContents.send('email-close', null);
});

/* SEND MESSAGE TO CLOSE TABLE WINDOW ON ERROR */
ipcMain.on('reset-form', (e, message) => {
  secWindow.webContents.send('reset-form', null);
});

/* LOADER CLOSE MESSAGE */
ipcMain.on('close-loader', (e, message) => {
  if (loadingWindow) {
    loadingWindow.close();
  }
});

/* CLOSE DOCK WINDOW */
ipcMain.on('close-window-dock', (e, message) => {
  if (secWindow) {
    childWindow.webContents.send('close-window-dock', null);
    setTimeout(() => {
      childWindow.close();
    }, 300);
  }
});

/* CLOSE LOADER */
ipcMain.on('loader-close', (e, message) => {
  if (loadingWindow) {
    loadingWindow.close();
  }
});

/* CLOSE UPDATE WINDOW */
ipcMain.on('close-updatewindow', (e, message) => {
  if (updateWindow) {
    updateWindow.close();
  }
});

/* RESTART SEC WINDOW */
ipcMain.on('restart-sec', (e, message) => {
  setTimeout(() => {
    createLoadingWindow();
    createSecWindow(message);
  }, 300);
});

/* SHOW HOME WINDOW */
ipcMain.on('show-home', (e, message) => {
  secWindow.close();
  homeWindow.show();
});

/* SEND CUSTOMER NAME AND NUMBER TO TABLE */
ipcMain.on('form-contents', (e, message) => {
  if (secWindow) {
    secWindow.webContents.send('form-contents', message);
  }
});

/* REMOVE FADE FROM SECWINDOW */
ipcMain.on('remove-fade', (e, message) => {
  if (secWindow) {
    secWindow.webContents.send('remove-fade', message);
  }
});

/* START UPDATE WINDOW */
ipcMain.on('create-download-window', (e, message) => {
  createUpdateWindow();
});

ipcMain.on('update-progress', (e, message) => {
  if (updateWindow) {
    updateWindow.webContents.send('download-percent', message);
    if (message === 100) {
      setTimeout(() => {
        updateWindow.close();
      }, 1000);
    }
  }
});

/* CLOSE MAIN WINDOW & CHECK TO SEE IF UPDATE IS DOWNLOADING */
ipcMain.on('close-main', (e, message) => {
  if (updateWindow) {
    let answer = dialog.showMessageBoxSync(homeWindow, {
      type: 'question',
      title: 'DOWNLOAD IN PROGRESS',
      icon: `${dir}/renderer/icons/updateTemplate.png`,
      message: `A update is being downloaded, are you sure you want to exit?`,
      detail:
        'Exiting will cause the download to be cancelled. You will have to download the update when asked on the next restart',
      buttons: ['EXIT', 'CANCEL'],
    });
    if (answer === 0) {
      updateWindow.close();
      setTimeout(() => {
        homeWindow.close();
      }, 50);
    }
  } else {
    setTimeout(() => {
      homeWindow.close();
    }, 200);
  }
});

/* QUERIES FOR DATABASE */
ipcMain.handle('get-price-list', async (e, message) => {
  let result = await querySinglePriceList(message);
  console.log(result);
  return result;
});

/* CHECK IF CUSTOMER PRICE-LIST EXISTS */
ipcMain.handle('customer-exists', async (e, message) => {
  let result = await queryCustomerExists(message);
  return result;
});

/* GET THE PRICE-LIST NUMBER */
ipcMain.handle('get-pricelist-number', async (e, message) => {
  let result = await querySinglePricelistNumber(message);
  return result;
});

/* GET THE CUSTOMER BACKUP DATA */
ipcMain.handle('get-customer-backup', async (e, message) => {
  let result = await querySingleCustomerBackup(message);
  return result;
});
