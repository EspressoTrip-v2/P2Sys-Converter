/* MODULES */
////////////

const { remote, ipcRenderer, shell } = require('electron');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
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

const { sendFailedMail } = require(`${dir}/renderer/email/failedMail.js`);

/* GLOBAL VARIABLES */
/////////////////////
let homeWindow = remote.getCurrentWindow();

/* CHECK TO SEE IF FIRST TIME DISPLAY NOTIFICATIONS HAVE BEEN INITIATED */
if (!localStorage.getItem('notifications')) {
  let notObject = {
    lockbutton: true,
    autocca: true,
    roundall: true,
    copy: true,
    calculate: true,
    pausedprices: true, //Not used in popup now maybe in future, still checks to see if set
  };
  localStorage.setItem('notifications', JSON.stringify(notObject));
}

//////////////////
/* DOM ELEMENTS*/
////////////////

let startBtn = document.getElementById('start'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('info'),
  backbtn = document.getElementById('back-btn'),
  backBtnSettings = document.getElementById('back-btn-system'),
  configView = document.getElementById('config-view'),
  clearCachedEmailsBtnSettings = document.getElementById('clear-cached-emails'),
  clearPausedPricelistsBtnSettings = document.getElementById('clear-cached-pricelists'),
  mailbtn = document.getElementById('mail-btn'),
  systemSettingsBtn = document.getElementById('settings-button'),
  soundClick = document.getElementById('click'),
  versionInfo = document.getElementById('version-info'),
  mainContainer = document.getElementById('container'),
  sentSound = document.getElementById('sent'),
  minimizeBtn = document.getElementById('minimize'),
  dbContainer = document.getElementById('db'),
  dbLogo = document.getElementById('db-logo'),
  soundPop = document.getElementById('pop');

///////////////////////
/* DOM MANIPULATIONS */
///////////////////////
versionInfo.innerText = `P2Sys-Converter (v${remote.app.getVersion()})`;

/* MAIN PAGE EVENTS */
/////////////////////

/* START BUTTON */
startBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('start', 'startPage');
  }, 200);
});

/* EXIT BUTTON */
exitbtn.addEventListener('click', (e) => {
  soundClick.play();

  ipcRenderer.send('close-main', null);
});

/* ABOUT PAGE EVENTS */
//////////////////////
minimizeBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    homeWindow.minimize();
  }, 300);
});

/* ABOUT BUTTON */
aboutbtn.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.about-screen').style.display = 'flex';
  setTimeout(() => {
    document.querySelector('.about-screen').style.visibility = 'visible';
    document.querySelector('.about-screen').style.opacity = 1;
  }, 200);
});
backbtn.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.about-screen').style.visibility = 'hidden';
  document.querySelector('.about-screen').style.opacity = 0;
});
mailbtn.addEventListener('click', (e) => {
  soundClick.play();

  shell.openExternal('mailto:juanbo.jb@gmail.com?subject=P2Sys() Inquiry/ Bug report');
});

/* SYSTEM BUTTONS */
backBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.system-settings').style.visibility = 'hidden';
  document.querySelector('.system-settings').style.opacity = 0;
});

/* EMAIL SETUP BUTTON */
configView.addEventListener('click', (e) => {
  soundClick.play();

  shell.openPath(`${process.cwd()}/.env`);
});

/* CLEAR LOCALSTORAGE FILES */
clearCachedEmailsBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  /* CHECK TO SEE I THERE ARE EMAILS TO REMOVE */
  if (localStorage.getItem('failedEmail')) {
    localStorage.removeItem('failedEmail');
    if (!localStorage.getItem('failedEmail')) {
      new Notification('Emails Cleared', {
        icon: `${dir}/renderer/icons/mailDeleteTemplate.png`,
        body: 'All unsent emails removed',
        requireInteraction: true,
      });
    }
  } else {
    new Notification('Emails Cleared', {
      icon: `${dir}/renderer/icons/info.png`,
      body: 'No emails to remove',
      requireInteraction: true,
    });
  }
});

/* PAUSED PRICES NOTIFICATION */
let pausedPricesPop = document.getElementById('removepausedprices-popup'),
  pausedPricesPopYes = document.getElementById('removepausedprices-yes'),
  pausedPricesPopNo = document.getElementById('removepausedprices-no');
function notificationPausePrices() {
  notObject = JSON.parse(localStorage.getItem('notifications'));
  if (notObject.pausedprices) {
    soundPop.play();
    pausedPricesPop.show();
    pausedPricesPopYes.addEventListener('click', (e) => {
      soundPop.play();
      pausedPricesPop.close();
      pausedPricesPress();
    });
    pausedPricesPopNo.addEventListener('click', (e) => {
      soundPop.play();
      pausedPricesPop.close();
    });
  }
}

/* PAUSED EMAIL BUTTON FUNCTION */
function pausedPricesPress() {
  soundClick.play();
  /* GET THE LOCAL STORAGE KEYS */
  let localStorageKeys = Object.keys(localStorage);
  let numbers = '';

  localStorageKeys.forEach((el) => {
    if (el !== 'notifications' && el !== 'failedEmail') {
      numbers += ` ${el},`;
      localStorage.removeItem(el);
    }
  });

  if (numbers.length > 1) {
    new Notification('PRICE-LISTS REMOVED', {
      body: `Paused price-lists ${numbers} have been removed`,
      icon: `${dir}/renderer/icons/info.png`,
    });
  } else {
    new Notification('PRICE-LISTS REMOVED', {
      body: 'There are no pricelists to remove.',
      icon: `${dir}/renderer/icons/info.png`,
    });
  }
}

/* CLEAR PAUSED PRICELISTS FILES */
clearPausedPricelistsBtnSettings.addEventListener('click', (e) => {
  notificationPausePrices();
});

/* ONLINE LISTENER */
window.addEventListener('offline', (e) => {
  dbContainer.title = 'Connection Lost';
  dbLogo.style.fill = 'var(--button-red';
  dbLogo.style.animation = 'none';

  if (homeWindow.isVisible()) {
    new Notification('P2SYS OFFLINE', {
      icon: `${dir}/renderer/icons/error.png`,
      body: 'There is no available internet connection.',
      requireInteraction: true,
    });
  }
});

/* SYSTEM SETTINGS PAGE EVENTS */
/////////////////////////////////
systemSettingsBtn.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.about-screen').style.visibility = 'hidden';
  document.querySelector('.about-screen').style.opacity = 0;

  document.querySelector('.system-settings').style.display = 'flex';
  setTimeout(() => {
    document.querySelector('.system-settings').style.visibility = 'visible';
    document.querySelector('.system-settings').style.opacity = 1;
  }, 200);
});

/* IPC LISTENERS */
//////////////////

/* SHOW WINDOW */
ipcRenderer.on('show', (e, message) => {
  mainContainer.style.opacity = '1';
});

/* DB CONNECTION */
ipcRenderer.on('db', (e, message) => {
  dbContainer.title = message;
  dbLogo.style.animation = 'connect 0.1s linear infinite alternate';
});

/* MESSAGE TO CREATE DOWNLOAD WINDOW */
ipcRenderer.on('create-download-window', (e, message) => {
  ipcRenderer.send('create-download-window', null);
});

/* MESSAGE TO SEND PERCENTAGE DOWNLOADED */
ipcRenderer.on('update-progress', (e, message) => {
  ipcRenderer.send('update-progress', message);
});

/* RESEND EMAILS */
homeWindow.webContents.on('did-finish-load', () => {
  if (localStorage['failedEmail']) {
    sendFailedMail(sentSound);
  }
});
