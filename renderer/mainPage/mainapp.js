/* MODULES */
////////////

const { remote } = require('electron');
const { ipcRenderer, shell } = require('electron');

//////////////////
/* DOM ELEMENTS*/
////////////////

/* MAIN WINDOW */
////////////////
let startBtn = document.getElementById('start'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('about-btn'),
  backbtn = document.getElementById('back-btn'),
  mailbtn = document.getElementById('mail-btn');

/* REMOTE WINDOWS */
///////////////////
let homeWindow = remote.getCurrentWindow();

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* MAIN PAGE EVENTS */
/////////////////////

/* START BUTTON */
startBtn.addEventListener('click', (e) => {
  homeWindow.hide();
  ipcRenderer.send('start', 'startPage');
});

/* EXIT BUTTON */
exitbtn.addEventListener('click', (e) => {
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
  shell.openExternal('mailto:projects.juan@gmail.com?subject=P2Sys() Inquiry/ Bug report');
});
