/* MODULE IMPORTS */
const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* WINDOW VARIABLES */
let homeWindow, secWindow, tray, childWindow, loadingWindow, emailWindow;

////////////////
/* FUNCTIONS */
////////////////

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray(`${dir}/renderer/icons/trayTemplate.png`);
  tray.setContextMenu(trayMenu);
}

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
  createChildWindow(message);
  /* SEND THE FILE TO PYTHON SHELL TO GET CONVERTED */
  childWindow.webContents.on('did-finish-load', (e) => {
    childWindow.webContents.send('convert-python', message.jsonObject);
  });
});

/* MESSAGE FROM PROGRESS WINDOW ON COMPLETION AND CLOSE */
ipcMain.on('progress-end', (e, message) => {
  /* SEND MESSAGE TO CLOSE THE PROGRES BAR */
  createLoadingWindow();
  secWindow.webContents.send('progress-end', message.filePaths);
});

/* MESSAGE TO SYNC DB AFTER FILES HAVE BEEN WRITTEN TO LOCAL DB */
ipcMain.on('db-sync', (e, message) => {
  /* SEND MESSAGE TO UPDATE THE DB */
  homeWindow.webContents.send('sync-db', null);
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

////////////////////////////////
/* WINDOW CREATION FUNCTIONS */
//////////////////////////////

/* TRAY MENU LAYOUT TEMPLATE */
let trayMenu = Menu.buildFromTemplate([
  { label: 'P2Sys()' },
  { role: 'minimize' },
  { role: 'reload' },
  { role: 'toggleDevTools' },
]);

/* MAIN WINDOW CREATION */
function createWindow() {
  createTray();
  homeWindow = new BrowserWindow({
    width: 450,
    height: 550,
    resizable: false,
    spellCheck: false,
    center: true,
    show: false,
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
  homeWindow.once('ready-to-show', () => {
    homeWindow.show();
  });

  //   Event listener for closing
  homeWindow.on('closed', () => {
    homeWindow = null;
  });
}

/* SECWINDOW CREATION */
function createSecWindow(message) {
  secWindow = new BrowserWindow({
    height: 650,
    width: 400,
    autoHideMenuBar: true,
    center: true,
    show: false,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   Load html page
  secWindow.loadFile(`${dir}/renderer/startPage/startPage.html`);

  // Only show on load completion
  secWindow.once('ready-to-show', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
    secWindow.show();
  });

  //   Load dev tools
  // secWindow.webContents.openDevTools();

  //   Event listener for closing
  secWindow.on('closed', () => {
    secWindow = null;
    homeWindow.show();
  });
}

/* CHILD WINDOW CREATION */
function createChildWindow(message) {
  // Window State windowStateKeeper
  if (message.emit === 'startPage') {
    childWindow = new BrowserWindow({
      parent: secWindow,
      height: 655,
      width: 300,
      resizable: false,
      x: message.dimensions[0] - 300,
      y: message.dimensions[1],
      autoHideMenuBar: true,
      opacity: 0,
      show: false,
      center: true,
      frame: false,
      spellCheck: false,
      transparent: true,
      webPreferences: { nodeIntegration: true, enableRemoteModule: true },
      icon: `${dir}/renderer/icons/trayTemplate.png`,
    });
  } else {
    childWindow = new BrowserWindow({
      parent: secWindow,
      height: 450,
      width: 500,
      show: false,
      spellCheck: false,
      resizable: false,
      autoHideMenuBar: true,
      center: true,
      frame: false,
      transparent: true,
      webPreferences: { nodeIntegration: true, enableRemoteModule: true },
      icon: `${dir}/renderer/icons/trayTemplate.png`,
    });
  }

  //   Load html page
  message.emit === 'startPage'
    ? childWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`)
    : childWindow.loadFile(message.html);

  //   Load dev tools
  // childWindow.webContents.openDevTools();

  // Only show on load completion
  childWindow.once('ready-to-show', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
    childWindow.show();
  });

  //   Event listener for closing
  childWindow.on('closed', () => {
    childWindow = null;
  });
}

/* LOADING WINDOW */
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    height: 500,
    width: 500,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   Load html page
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

  //   Load dev tools
  // loadingWindow.webContents.openDevTools();

  //   Event listener for closing
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
    frame: false,
    show: false,
    spellCheck: false,
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   Load html page
  emailWindow.loadFile(`${dir}/renderer/email/email.html`);

  emailWindow.webContents.once('did-finish-load', (e) => {
    // console.log(message);
    emailWindow.webContents.send('email-popup', message);
  });

  //   Load dev tools
  // emailWindow.webContents.openDevTools();

  // Only show on load completion
  emailWindow.once('ready-to-show', () => {
    emailWindow.show();
    setTimeout(() => {
      if (loadingWindow) {
        loadingWindow.close();
      }
    }, 3000);
  });

  //   Event listener for closing
  emailWindow.on('closed', () => {
    emailWindow = null;
  });
}

/* APP READY --> CREATE MAIN WINDOW */
app.on('ready', () => {
  setTimeout(() => {
    createWindow();
  }, 300);
});

/* QUIT APP WHEN ALL WINDOWS ARE CLOSED */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
