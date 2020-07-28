// Module Imports
const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const dotenv = require('dotenv');

// Config file
dotenv.config({ path: './config.env' });

// Create Window instance
let homeWindow, secWindow, tray, childWindow;

// Messenger service for windows
const messengerService = (message, window) => {
  if (window === 'sec') {
    secWindow.webContents.send('sec-main', message);
  } else {
    childWindow.webContents.send('child-main', message);
  }
};

// Message listener
ipcMain.on('window-message', (event, message) => {
  messengerService(message.message, message.source);
});

// Tray menu
let trayMenu = Menu.buildFromTemplate([
  { label: 'P2Sys()' },
  { role: 'minimize' },
  { role: 'reload' },
  { role: 'toggleDevTools' },
]);

function createTray() {
  tray = new Tray('./renderer/icons/trayTemplate.png');
  tray.setContextMenu(trayMenu);
}

// IPC message listeners
// Listen for new customer button
ipcMain.on('new-customer', (e, message) => {
  createSecWindow(message);
});

// Listen for dimemsions of secWindow
ipcMain.on('position', (e, message) => {
  createChildWindow(message);
});

// Create MainWindow function
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

// Create secWindow function
function createSecWindow(message) {
  // Window State windowStateKeeper
  secWindow = new BrowserWindow({
    height: 800,
    width: 400,
    autoHideMenuBar: true,
    center: true,
    show: false,
    frame: false,
    spellCheck: false,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
    icon: './renderer/icons/trayTemplate.png',
  });

  //   Load html page
  secWindow.loadFile('./renderer/newCus/newCus.html');

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

// Create childWindow function
function createChildWindow(message) {
  // Window State windowStateKeeper
  if (message.emit === 'newCus') {
    childWindow = new BrowserWindow({
      parent: secWindow,
      height: 800,
      width: 300,
      minHeight: 800,
      minWidth: 300,
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
      height: 800,
      width: 300,
      minHeight: 800,
      minWidth: 300,
      spellCheck: false,
      resizable: false,
      autoHideMenuBar: true,
      opacity: 0,
      center: true,
      // frame: false,
      // transparent: true,
      webPreferences: { nodeIntegration: true, enableRemoteModule: true },
      icon: './renderer/icons/trayTemplate.png',
    });
  }

  //   Load html page
  message.emit === 'newCus'
    ? childWindow.loadFile('./renderer/cusNameSearch/customerName.html')
    : childWindow.loadFile(message.html);

  //   Load dev tools
  // childWindow.webContents.openDevTools();

  //   Event listener for closing
  childWindow.on('closed', () => {
    childWindow = null;
  });
}

// App ready initiator
app.on('ready', () => {
  setTimeout(() => {
    createWindow();
  }, 300);
});

// Quit when all windows are closed - (Not macOS - Darwin)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
