const { remote } = require('electron');
const { ipcRenderer, shell } = require('electron');

// DOM nodes
let newCusbtn = document.getElementById('new-cus'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('about-btn'),
  backbtn = document.getElementById('back-btn'),
  mailbtn = document.getElementById('mail-btn');

let homeWindow = remote.getCurrentWindow();

// Event listeners
newCusbtn.addEventListener('click', (e) => {
  homeWindow.hide();
  ipcRenderer.send('new-customer', 'newCus');
});

exitbtn.addEventListener('click', (e) => {
  homeWindow.close();
  homeWindow = null;
});

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
