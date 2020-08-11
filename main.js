/* MODULE IMPORTS */
const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
const fs = require('fs');

/* WINDOW VARIABLES */
let homeWindow, secWindow, tray, childWindow, loadingWindow;

////////////////
/* FUNCTIONS */
////////////////

/* WINDOW MESSENGER FUNCTION */
function messengerService(channel, message, destination, jsonObject = null) {
  if (!message) {
    message = jsonObject;
  }
  if (destination === 'sec') {
    secWindow.webContents.send(channel, message);
  } else if (destination === 'child') {
    childWindow.webContents.on('did-finish-load', (e) => {
      childWindow.webContents.send(channel, message);
    });
  }
}

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray('./renderer/icons/trayTemplate.png');
  tray.setContextMenu(trayMenu);
}

////////////////////
/* IPC LISTENERS */
//////////////////

/* ##### MESSAGE CONSTRUCTOR LEGEND ################ */
/*       emit: message originate                     */
/*       channel: channel of message                 */
/*       message: actual message content             */
/*       destination: window message is intended for */
/*       jsonObject: json object file attached       */
/*       relayChannel: channel to relay message on   */
/* ################################################# */

/* MESSENGER SERVICE BETWEEN RENDERERS */
ipcMain.on('window-message', (event, message) => {
  messengerService(message.channel, message.message, message.destination);
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
  createChildWindow(message);
  messengerService(message.relayChannel, null, message.destination, message.jsonObject);
});

/* MESSAGE FROM PROGRESS WINDOW ON COMPLETION AND CLOSE */
ipcMain.on('progress-end', (event, message) => {
  messengerService(message.channel, message.message, message.destination);
});

ipcMain.on('db-status', (event, message) => {
  if (secWindow) {
    message === 1
      ? secWindow.webContents.send('db-status', message)
      : secWindow.webContents.send('db-status', message);
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
    width: 410,
    height: 490,
    resizable: false,
    spellCheck: false,
    center: true,
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    icon: './renderer/icons/trayTemplate.png',
  });

  //   Load html page
  homeWindow.loadFile('./renderer/mainPage/main.html');

  //   Load dev tools
  // homeWindow.webContents.openDevTools();

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
    icon: './renderer/icons/trayTemplate.png',
  });

  //   Load html page
  secWindow.loadFile('./renderer/startPage/startPage.html');

  // Only show on load completion
  secWindow.on('ready-to-show', () => {
    loadingWindow.close();
    loadingWindow = null;
    secWindow.show();
  });

  //   Load dev tools
  // secWindow.webContents.openDevTools();

  //   Event listener for closing
  secWindow.on('closed', () => {
    secWindow = null;
    homeWindow.show();
    homeWindow.webContents.send('sync-db', null);
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
      center: true,
      frame: false,
      spellCheck: false,
      transparent: true,
      webPreferences: { nodeIntegration: true, enableRemoteModule: true },
      icon: './renderer/icons/trayTemplate.png',
    });
  } else {
    childWindow = new BrowserWindow({
      parent: secWindow,
      height: 450,
      width: 500,

      spellCheck: false,
      resizable: false,
      autoHideMenuBar: true,
      center: true,
      frame: false,
      transparent: true,
      webPreferences: { nodeIntegration: true, enableRemoteModule: true },
      icon: './renderer/icons/trayTemplate.png',
    });
  }

  //   Load html page
  message.emit === 'startPage'
    ? childWindow.loadFile('./renderer/cusNameSearch/customerName.html')
    : childWindow.loadFile(message.html);

  //   Load dev tools
  // childWindow.webContents.openDevTools();

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
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: './renderer/icons/trayTemplate.png',
  });

  //   Load html page
  loadingWindow.loadFile('./renderer/loader/loader.html');

  //   Load dev tools
  // loadingWindow.webContents.openDevTools();

  //   Event listener for closing
  loadingWindow.on('closed', () => {
    loadingWindow = null;
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
  db.close();
});
