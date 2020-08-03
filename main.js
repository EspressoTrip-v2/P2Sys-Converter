/* MODULE IMPORTS */
const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const dotenv = require('dotenv');

/* CONFIG FILE FOR ENV PROCESSES */
dotenv.config({ path: './config.env' });

/* WINDOW VARIABLES */
let homeWindow, secWindow, tray, childWindow;

////////////////
/* FUNCTIONS */
////////////////

/* WINDOW MESSENGER FUNCTION */
const messengerService = (channel, message, destination) => {
  if (destination === 'sec') {
    secWindow.webContents.send(channel, message);
  } else if (destination === 'child') {
    childWindow.webContents.send(channel, message);
  }
};

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray('./renderer/icons/trayTemplate.png');
  tray.setContextMenu(trayMenu);
}

////////////////////
/* IPC LISTENERS */
//////////////////

/* MESSENGER SERVIVE BETWEEN RENDERERS */
ipcMain.on('window-message', (event, message) => {
  messengerService(message.channel, message.message, message.destination);
});

/* MESSAGE FROM START BUTTON */
/* Create new customer number search window */
ipcMain.on('start', (e, message) => {
  createSecWindow(message);
});

/* POSITION OF SECWINDOW TO GENERATE DOCK NEXT TO IT */
ipcMain.on('position', (e, message) => {
  createChildWindow(message);
});

/* MESSAGE FROM SAVE BUTTON TO CREATE PROGRESS WINDOW */
ipcMain.on('progress', (e, message) => {
  createChildWindow(message);
});

/* MESSAGE FROM PROGRESS WINDOW ON COMPLETION AND CLOSE */
ipcMain.on('progress-end', (event, message) => {
  messengerService(message.channel, message.message, message.destination);
});

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
    width: 400,
    height: 460,
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
    secWindow.show();
  });

  //   Load dev tools
  // secWindow.webContents.openDevTools();

  //   Event listener for closing
  secWindow.on('closed', () => {
    secWindow = null;
    homeWindow.show();
    homeWindow.reload();
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
