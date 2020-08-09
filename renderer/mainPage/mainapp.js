/* MODULES */
////////////

const { remote, ipcRenderer, shell } = require('electron');

//////////////////
/* DOM ELEMENTS*/
////////////////

/* MAIN WINDOW */
////////////////
let startBtn = document.getElementById('start'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('about-btn'),
  backbtn = document.getElementById('back-btn'),
  mailbtn = document.getElementById('mail-btn'),
  dbLight = document.getElementsByClassName('db-light')[0],
  databaseText = document.getElementsByClassName('text')[0];

/* REMOTE WINDOWS */
///////////////////
let homeWindow = remote.getCurrentWindow(),
  dbStateTimer;

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* MAIN PAGE EVENTS */
/////////////////////

/* START BUTTON */
startBtn.addEventListener('click', (e) => {
  ipcRenderer.send('start', 'startPage');
});

/* EXIT BUTTON */
exitbtn.addEventListener('click', (e) => {
  clearInterval(dbStateTimer);
  homeWindow.close();
  homeWindow = null;
});

/* ABOUT PAGE EVENTS */
//////////////////////

/* ABOUT BUTTON */
aboutbtn.addEventListener('click', (e) => {
  document.querySelector('.about-screen').style.display = 'flex';
  document.querySelector('.about-screen').style.visibility = 'visible';
  document.querySelector('.about-screen').style.opacity = 1;
});
backbtn.addEventListener('click', (e) => {
  document.querySelector('.about-screen').style.visibility = 'hidden';
  document.querySelector('.about-screen').style.opacity = 0;
});
mailbtn.addEventListener('click', (e) => {
  shell.openExternal('mailto:price.to.sys@gmail.com?subject=P2Sys() Inquiry/ Bug report');
});

////////////////////
/* IPC LISTENERS */
//////////////////
ipcRenderer.once('sync-database', (e, message) => {
  databaseText.setAttribute('data-label', 'UPDATING');
});

ipcRenderer.on('db-status', (e, message) => {
  if (message === 1) {
    dbLight.classList[1]
      ? dbLight.classList.replace('db-fail', 'db-connected')
      : dbLight.classList.add('db-connected');
  } else if (message === 0) {
    dbLight.classList[1]
      ? dbLight.classList.replace('db-connected', 'db-fail')
      : dbLight.classList.add('db-fail');
  }
});
