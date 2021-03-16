/* MODULES */
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

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

const { logFileFunc } = require(`${dir}/logFile.js`);

/*  CREATE HTML FOR THE PROGRESS WINDOW */
exports.updater = (window) => {
  /* SET PROPERTIES */
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.checkForUpdates().catch((err) => {
    logFileFunc(err);
  });

  autoUpdater.on('update-available', (info) => {
    window.webContents.send('start-update', null);
    autoUpdater.downloadUpdate();
  });

  /* SEND MESSAGE ON UPDATE READY TO INSTALL */
  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('download-complete', null);
  });

  autoUpdater.on('download-progress', (info) => {
    let percent = Math.floor(info.percent);
    window.webContents.send('update-progress', percent);
  });

  autoUpdater.on('error', (err) => {
    logFileFunc(err);
  });
};
