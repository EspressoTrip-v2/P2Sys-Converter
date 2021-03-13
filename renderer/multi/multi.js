// Import modules
const { remote, ipcRenderer } = require('electron');

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

/* GET WINDOW */
let multiWindow = remote.getCurrentWindow();

/* DOM ELEMENTS */
let container = document.getElementById('container'),
  clearAllBtn = document.getElementById('clear-list-btn'),
  customerListContainer = document.getElementById('customer-list'),
  soundClick = document.getElementById('click'),
  audioTag = Array.from(document.getElementsByTagName('audio'));

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
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    storage.muteflag = true;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = false;
    });
  }
}

if (!storage.muteflag) {
  checkMuteFlag();
}

/* GLOBAL VARIABLES */
let createCustomerArr = [];

/* FUNCTIONS */
///////////////
function resetList(e) {
  let listItems = Array.from(customerListContainer.children);
  listItems.forEach((el) => {
    let button = el.children[0];
    button.style.visibility = 'hidden';
    el.setAttribute('class', 'customer-name');
  });
}

/* CLEAR ALL */
function clearAll() {
  ipcRenderer.send('clear-copy-selection-click', null);
  multiWindow.close();
}

function removeCopySelectionSelect(customerNumber) {
  ipcRenderer.send('unselect-item-copy-selection', customerNumber);
}

/* DELETE EVENT */
function deleteEvent(e) {
  let listItems = Array.from(customerListContainer.children);
  if (listItems.length > 1) {
    let parent = e.target.parentNode;
    let id = parent.id;
    let idx = createCustomerArr.indexOf(id);
    if (idx !== -1) {
      createCustomerArr.splice(idx, 1);
      removeCopySelectionSelect(id);
    }
    parent.remove();
  } else {
    clearAll();
  }
}

/* CONTEXT MENU EVENT */
function showContext(e) {
  soundClick.play();
  resetList();
  let parent = e.target;
  let button = e.target.children[0];
  button.style.visibility = 'visible';
  parent.setAttribute('class', 'customer-name-clicked');
}

/* ADD LIST ITEM */
function addListItem(customerNumber) {
  if (!createCustomerArr.includes(customerNumber)) {
    createCustomerArr.push(customerNumber);
    let html = `<div id="${customerNumber}" class="customer-name">${customerNumber.toUpperCase()}<button class="delete" id="${customerNumber}-delete">Remove</button></div>`;
    customerListContainer.insertAdjacentHTML('beforeend', html);

    /* ADD EVENT LISTENERS */
    let item = document.getElementById(customerNumber);
    let tempButton = document.getElementById(`${customerNumber}-delete`);
    tempButton.addEventListener('click', deleteEvent);

    /* ADD CONTEXT EVENT */
    item.addEventListener('contextmenu', showContext);
  }
}

clearAllBtn.addEventListener('click', () => {
  soundClick.play();
  setTimeout(() => {
    clearAll();
  }, 300);
});

ipcRenderer.on('add-customer-number', (e, message) => {
  addListItem(message);
});

ipcRenderer.on('get-customer-selection-arr', (e, message) => {
  ipcRenderer.send('return-customer-selection-arr', createCustomerArr);
  ipcRenderer.send('clear-copy-selection-click', null);
  multiWindow.close();
});
