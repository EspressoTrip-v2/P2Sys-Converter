/* MODULE IMPORTS */
const { app, BrowserWindow, ipcMain, Tray, Menu, dialog } = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

/* LOCAL MODULES */
const {
  customerPricesModel,
  customerPricelistNumberModel,
  customerNumberNameModel,
  customerBackUpModel,
} = require(`${dir}/database/mongoDbConnect.js`);

/* GLOBAL VARIABLES */
let homeWindow,
  secWindow,
  tray,
  childWindow,
  loadingWindow,
  emailWindow,
  progressWindow,
  dbLoaderWindow,
  customerBackUp,
  customerNumberName,
  customerNameNumber,
  customerPricelistNumber,
  customerPrices;

////////////////
/* FUNCTIONS */
////////////////

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray(`${dir}/renderer/icons/trayTemplate.png`);
  tray.setContextMenu(trayMenu);
}

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${dir}/error-log.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Database ${message}\n`, (err) => console.log(err));
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Database ${message}\n`, (err) =>
      console.log(err)
    );
  }
}

//////////////////////////
/* DATABASE CONNECTION */
////////////////////////
function mongooseConnect() {
  mongoose
    .connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.61lij.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    .catch((err) => {
      /* INITIAL EROR CONNECTION */
      dialog
        .showMessageBox(dbLoaderWindow, {
          type: 'error',
          title: 'DATABASE CONNECTION ERROR',
          icon: `${dir}/renderer/icons/trayTemplate.png`,
          message:
            'P2Sys Converter was unable to connect to the database. Please try again when a connection is available',
          buttons: ['EXIT'],
        })
        .then(() => {
          dbLoaderWindow.close();
        });

      let fileDir = `${dir}/error-log.txt`;
      /* CHECK IF IT EXISTS */
      fs.existsSync(fileDir)
        ? fs.appendFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          )
        : fs.writeFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          );
    });
}

////////////////////
/* DB  LISTENERS */
//////////////////
const db = mongoose.connection;

/* DOWNLOAD DB ONCE CONNECTED */
db.once('connected', async () => {
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Downloading CB-Db',
      percentage: 10,
    });

    customerBackUpObj = await customerBackUpModel.findById('customerBackUp').exec();
    customerBackUp = customerBackUpObj._doc;
    delete customerBackUp['_id'];
  } catch (err) {
    logfileFunc(err);
  }

  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Downloading CNN-Db',
      percentage: 35,
    });
    customerNumberNameObj = await customerNumberNameModel
      .findById('customerNumberName')
      .exec();
    customerNumberName = customerNumberNameObj._doc;
    delete customerNumberName['_id'];

    /* CREATE REVERSE OBJECT FOR DOCK */
    customerNameNumber = {};
    Object.entries(customerNumberName).forEach((el) => {
      customerNameNumber[el[1]] = el[0];
    });
  } catch (err) {
    logfileFunc(err);
  }
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Downloading CPN-Db',
      percentage: 65,
    });

    let customerPricelistNumberObj = await customerPricelistNumberModel
      .findById('customerPricelistNumber')
      .exec();
    customerPricelistNumber = customerPricelistNumberObj._doc;
    delete customerPricelistNumber['_id'];
  } catch (err) {
    logfileFunc(err);
  }
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Downloading CP-Db',
      percentage: 90,
    });

    let customerPricesObj = await customerPricesModel.findById('customerPrices').exec();
    customerPrices = customerPricesObj._doc;
    delete customerPrices['_id'];
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Success',
      percentage: 100,
    });
  } catch (err) {
    logfileFunc(err);
  }
  createWindow();
});

////////////////////////////////
/* WINDOW CREATION FUNCTIONS */
//////////////////////////////

/* TRAY MENU LAYOUT TEMPLATE */
let trayMenu = Menu.buildFromTemplate([{ label: 'P2Sys App' }, { role: 'minimize' }]);

/* MAIN WINDOW CREATION */
function createWindow() {
  createTray();
  homeWindow = new BrowserWindow({
    width: 400,
    height: 520,
    resizable: false,
    spellCheck: false,
    center: true,
    alwaysOnTop: true,
    backgroundColor: '#00FFFFFF',
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   Load html page
  homeWindow.loadFile(`${dir}/renderer/mainPage/main.html`);

  //   Load dev tools
  // homeWindow.webContents.openDevTools();

  // Only show on load completion
  homeWindow.webContents.on('did-finish-load', () => {
    dbLoaderWindow.close();
    homeWindow.webContents.send('show', null);
  });

  //   Event listener for closing
  homeWindow.on('closed', () => {
    homeWindow = null;
  });
}

/* SECWINDOW CREATION */
function createSecWindow(message) {
  secWindow = new BrowserWindow({
    height: 600,
    width: 365,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    spellCheck: false,
    backgroundColor: '#00FFFFFF',
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   Load html page
  secWindow.loadFile(`${dir}/renderer/startPage/startPage.html`);

  // Only show on load completion
  secWindow.webContents.once('did-finish-load', () => {
    /* CREATE DATABASE OBJECT TO SEND TO WINDOW */
    let dbObj = {
      customerPrices,
      customerPricelistNumber,
      customerNumberName,
      customerBackUp,
    };
    secWindow.webContents.send('database-object', dbObj);

    if (loadingWindow) {
      loadingWindow.close();
    }
    // secWindow.show();
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
  // Window State windowStateKeeper
  if (message.emit === 'startPage') {
    childWindow = new BrowserWindow({
      parent: secWindow,
      height: 600,
      width: 300,
      resizable: false,
      x: message.dimensions[0] - 300,
      y: message.dimensions[1],
      autoHideMenuBar: true,
      backgroundColor: '#00FFFFFF',
      center: true,
      frame: false,
      spellCheck: false,
      transparent: true,
      webPreferences: { nodeIntegration: true, enableRemoteModule: true },
      icon: `${dir}/renderer/icons/trayTemplate.png`,
    });
  }

  //   Load html page
  childWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`);

  //   Load dev tools
  // childWindow.webContents.openDevTools();

  // Only show on load completion
  childWindow.webContents.once('did-finish-load', () => {
    childWindow.webContents.send('customer-name-number', customerNameNumber);
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
  loadingWindow = new BrowserWindow({
    height: 400,
    width: 400,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    center: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   LOAD HTML PAGE
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

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
    parent: secWindow,
    height: 750,
    width: 550,
    autoHideMenuBar: true,
    center: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   Load html page
  emailWindow.loadFile(`${dir}/renderer/email/email.html`);

  emailWindow.webContents.once('did-finish-load', (e) => {
    // console.log(message);
    if (loadingWindow) {
      loadingWindow.close();
    }
    emailWindow.webContents.send('email-popup', message);
  });

  //   Load dev tools
  // emailWindow.webContents.openDevTools();

  // Only show on load completion

  //   Event listener for closing
  emailWindow.on('closed', () => {
    emailWindow = null;
  });
}

/* PROGRESS WINDOW */
function createProgressWindow() {
  progressWindow = new BrowserWindow({
    parent: secWindow,
    height: 400,
    width: 400,
    // show: false,
    spellCheck: false,
    resizable: false,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   LOAD HTML PAGE
  progressWindow.loadFile(`${dir}/renderer/progress/progress.html`);

  //   LOAD DEV TOOLS
  // progressWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  progressWindow.on('closed', () => {
    progressWindow = null;
  });
}

/* DBLOADER WINDOW */
function createDbLoaderWindow() {
  dbLoaderWindow = new BrowserWindow({
    height: 400,
    width: 400,
    spellCheck: false,
    resizable: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   LOAD HTML PAGE
  dbLoaderWindow.loadFile(`${dir}/renderer/dbloader/dbloader.html`);

  //   LOAD DEV TOOLS
  // dbLoaderWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  dbLoaderWindow.on('closed', () => {
    dbLoaderWindow = null;
  });
}

/* APP READY --> CREATE MAIN WINDOW */
app.on('ready', () => {
  setTimeout(() => {
    /* CREATE CONNECTION */
    mongooseConnect();
    /* START LOADER */
    createDbLoaderWindow();
  }, 300);
});

/* QUIT APP WHEN ALL WINDOWS ARE CLOSED */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

////////////////////
/* IPC LISTENERS */
//////////////////

/* MESSENGER SERVICE BETWEEN RENDERERS */
ipcMain.on('dock-sec', (event, message) => {
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
  /* SEND MESSAGE TO CLOSE THE PROGRES BAR */
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
ipcMain.on('error', (e, message) => {
  secWindow.webContents.send('error', null);
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
