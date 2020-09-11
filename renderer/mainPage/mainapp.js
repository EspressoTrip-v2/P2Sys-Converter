/* MODULES */
////////////

const { remote, ipcRenderer, shell } = require('electron');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

const { sendFailedMail } = require(`${dir}/renderer/email/failedMail.js`);
if (localStorage['failedEmail']) {
  sendFailedMail();
}

/* GLOBAL VARIABLES */
/////////////////////
let homeWindow = remote.getCurrentWindow(),
  stateInterval,
  sendStatus;

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
  forceDbUpdateBtnSettings = document.getElementById('db-update'),
  mailbtn = document.getElementById('mail-btn'),
  dbLight = document.getElementById('db'),
  databaseText = document.getElementById('dbtext'),
  systemSettingsBtn = document.getElementById('settings-button'),
  soundClick = document.getElementById('click'),
  versionInfo = document.getElementById('version-info'),
  mainContainer = document.getElementById('container');

///////////////////////
/* DOM MANIPULATIONS */
///////////////////////
versionInfo.innerText = `P2Sys-Converter (v${remote.app.getVersion()})`;

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* ONLINE STATUS MONITORING */
window.addEventListener('online', (e) => {
  startInterval();
});

window.addEventListener('offline', (e) => {
  new Notification('DATABASE CONNECTION ERROR', {
    icon: `${dir}/renderer/icons/trayTemplate.png`,
    body: 'Internet connection failure. Unable to connect to database.',
    requireInteraction: true,
  });
  /* CLEAR THE STATE INTERVAL */
  clearInterval(stateInterval);
  /* SET DB STATUS TO ERROR */
  dbLight.setAttribute('class', 'db-fail');
  databaseText.setAttribute('data-label', 'ERROR');
  /* SEND TO OTHER WINDOWS IF AVAILABLE */
  clearInterval(sendStatus);

  sendDbStatus('getStatus');
});

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
  setTimeout(() => {
    homeWindow.close();
    homeWindow = null;
  }, 200);
});

/* ABOUT PAGE EVENTS */
//////////////////////

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

  shell.openPath(`${dir}/.env`);
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

/* CLEAR PAUSED PRICELISTS FILES */
clearPausedPricelistsBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  /* CHECK TO SEE I THERE ARE EMAILS TO REMOVE */
  let localStorageKeys = Object.keys(localStorage),
    keys = '';

  if (localStorageKeys.includes('failedEmail')) {
    localStorageKeys.splice(localStorageKeys.indexOf('failedEmail'), 1);
    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
      keys += `${key}, `;
    });

    new Notification('Price-lists removed', {
      icon: `${dir}/renderer/icons/info.png`,
      body: `Price-lists for:\n${keys}Have been removed.`,
      requireInteraction: true,
    });
  } else {
    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
      keys += `${key}, `;
    });

    let message =
      keys.length > 0 ? `Price-lists for:\n${keys}Have been removed.` : 'No price-lists found';

    localStorage.clear();
    new Notification('Price-lists removed', {
      icon: `${dir}/renderer/icons/info.png`,
      body: message,
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
