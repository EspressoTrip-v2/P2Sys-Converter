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
    muteflag: true,
  };
  localStorage.setItem('notifications', JSON.stringify(notObject));
}

//////////////////
/* DOM ELEMENTS*/
////////////////

let startBtn = document.getElementById('start'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('info'),
  backbtn = document.getElementById('back-btn-system'),
  clearCachedEmailsBtnSettings = document.getElementById('clear-cached-emails'),
  clearPausedPricelistsBtnSettings = document.getElementById('clear-cached-pricelists'),
  soundClick = document.getElementById('click'),
  sentSound = document.getElementById('sent'),
  minimizeBtn = document.getElementById('minimize'),
  dbContainer = document.getElementById('db'),
  dbLogo = document.getElementById('db-logo'),
  muteBtn = document.getElementById('mute'),
  muteLogo = document.getElementById('mute-logo'),
  audioTag = Array.from(document.getElementsByTagName('audio'));

/* FUNCTIONS */
///////////////
/* FUNCTION CHECK THE MUTE FLAG */
let storage = JSON.parse(localStorage.getItem('notifications'));
function checkMuteFlag() {
  if (!storage.muteflag) {
    /* SET FLAG TO FALSE AND TURN OFF ALL SOUND */
    storage.muteflag = false;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = true;
    });
    muteLogo.style.fill = 'var(--main)';
    muteBtn.title = 'Sound Off';
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    storage.muteflag = true;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = false;
    });
    soundClick.play();
    muteLogo.style.fill = 'darkgrey';
    muteBtn.title = 'Sound On';
  }
}

if (!storage.muteflag) {
  checkMuteFlag();
}

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

minimizeBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    homeWindow.minimize();
  }, 300);
});

/* ABOUT BUTTON */
aboutbtn.addEventListener('click', (e) => {
  soundClick.play();
  document.querySelector('.system-settings').style.display = 'flex';
  document.querySelector('.system-settings').style.opacity = 1;
});

backbtn.addEventListener('click', () => {
  soundClick.play();
  document.querySelector('.system-settings').style.opacity = 0;
  document.querySelector('.system-settings').style.display = 'none';
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

/* MUTE SOUNDS BUTTON */
muteBtn.addEventListener('click', (e) => {
  setTimeout(() => {
    if (storage.muteflag) {
      storage.muteflag = false;
      localStorage.setItem('notifications', JSON.stringify(storage));
      checkMuteFlag();
    } else {
      storage.muteflag = true;
      localStorage.setItem('notifications', JSON.stringify(storage));
      checkMuteFlag();
    }
  }, 300);
});

/* IPC LISTENERS */
//////////////////

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
