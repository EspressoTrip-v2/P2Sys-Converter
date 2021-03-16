/* MODULES */
////////////
const { ipcRenderer } = require('electron');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { windowsStore } = require('process');

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

/* DOM ELEMENTS */
let userInput = document.getElementById('username'),
  userPassword = document.getElementById('password'),
  userPasswordRetype = document.getElementById('password-retype'),
  closeAppBtnDisabled = document.getElementById('close-btn-disabled'),
  closeAppBtn = document.getElementById('close-btn'),
  generateBtnDisabled = document.getElementById('generate-btn-disabled'),
  generateBtn = document.getElementById('generate-btn'),
  soundClick = document.getElementById('click'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  loadingContainer = document.getElementsByClassName('loading-container')[0],
  creationContainer = document.getElementById('creation-container'),
  creationCountDown = document.getElementById('restarting-info'),
  passwordLabel = document.getElementById('password-label'),
  usernameLabel = document.getElementById('username-label'),
  passwordLabelRetype = document.getElementById('password-label-retype');

function passwordMatch() {
  passwordLabel.style.color = 'var(--button-red)';
  passwordLabelRetype.style.color = 'var(--button-red)';

  passwordLabel.innerText = "Passwords don't match.";
  passwordLabelRetype.innerText = "Passwords don't match.";

  userPassword.value = null;
  userPasswordRetype.value = null;
}

function runCountDown() {
  loadingContainer.style.visibility = 'hidden';
  creationContainer.style.visibility = 'visible';
  creationCountDown.setAttribute('count', 3);
  let count = 3;
  let interval = setInterval(() => {
    count--;
    creationCountDown.setAttribute('count', count);
    if (count === 0) {
      clearInterval(interval);
      ipcRenderer.send('restart-app', null);
    }
  }, 1000);
}

function generateHash() {
  let username = userInput.value;
  let password = userPassword.value;

  let totalPassword = `${username}${password}`;
  bcrypt.genSalt(12, (err, salt) => {
    bcrypt.hash(totalPassword, salt, (err, hash) => {
      let obj = {
        hash,
      };

      fs.writeFile(`${appData}/ps_bin.dat`, JSON.stringify(obj), (err) => {
        runCountDown();
      });
    });
  });
}

function showLoader() {
  loadingContainer.style.visibility = 'visible';
  generateBtn.style.display = 'none';
  generateBtnDisabled.style.display = 'flex';
  closeAppBtn.style.display = 'none';
  closeAppBtnDisabled.style.display = 'flex';
}

function showUsernameError() {
  usernameLabel.style.color = 'var(--button-red';
  usernameLabel.innerText = 'Username min length 4.';
}

function showPasswordError() {
  passwordLabel.style.color = 'var(--button-red';
  passwordLabel.innerText = 'Password min length 4.';
}

function resetLabels() {
  usernameLabel.style.color = '#000';
  usernameLabel.innerText = 'New username:';
  passwordLabel.style.color = '#000';
  passwordLabel.innerText = 'New password:';
  passwordLabelRetype.style.color = '#000';
  passwordLabelRetype.innerText = 'Retype password:';
}

/* GENERATE BUTTON */
generateBtn.addEventListener('click', (e) => {
  resetLabels();
  soundClick.play();
  if (userInput.value.length >= 4 && userPassword.value.length >= 4) {
    if (userPassword.value === userPasswordRetype.value) {
      showLoader();
      /* GENERATE HASH FUNCTION */
      generateHash();
    } else {
      passwordMatch();
    }
  } else if (userInput.value.length < 4) {
    showUsernameError();
  } else if (userPassword.value.length < 4) {
    showPasswordError();
  }
});

window.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    generateBtn.click();
  }
});

/* CLOSE APPLICATION BUTTON */
closeAppBtn.addEventListener('click', (e) => {
  soundClick.play();
  ipcRenderer.send('close-app', null);
});
