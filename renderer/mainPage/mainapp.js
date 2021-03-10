/* MODULES */
////////////

const { remote, ipcRenderer } = require('electron');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

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
  showSchedulesBtn = document.getElementById('show-schedules'),
  soundClick = document.getElementById('click'),
  minimizeBtn = document.getElementById('minimize'),
  muteBtn = document.getElementById('mute'),
  muteLogo = document.getElementById('mute-logo'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  scheduleDatesSelector = document.getElementById('schedule-dates'),
  customerList = document.getElementById('customer-list'),
  scheduleDatesBackBtn = document.getElementById('schedule-exit-btn'),
  scheduleContainer = document.getElementById('schedule-container'),
  scheduleDates = document.getElementById('schedule-dates'),
  loadingContainer = document.getElementsByClassName('loading-container')[0],
  loadingDateBox = document.getElementById('loading-dates'),
  systemSettingsMenu = document.getElementsByClassName('system-settings')[0],
  onlineWarning = document.getElementById('connection-container'),
  closeAppBtn = document.getElementById('connection-close');

/* GLOBAL VARIABLES */
let scheduleDatesArr, customerScheduleList, customerNumbersScheduleList, dateValue;

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
/* HIDE LOADER */
function hideLoader() {
  loadingContainer.style.visibility = 'hidden';
  loadingDateBox.style.visibility = 'hidden';
}

/* HIDE LOADER */
function showLoader() {
  loadingContainer.style.visibility = 'visible';
  loadingDateBox.style.visibility = 'visible';
}

/* CLEAR CURRENT LIST OF CLICKS FUNCTION */
function clearList() {
  if (customerNumbersScheduleList) {
    customerNumbersScheduleList.forEach((el) => {
      el.setAttribute('class', 'context-container');
    });
    resetListenersContext();
  }
}

/* EVENT LISTENER FOR SCHEDULE LIST */
function scheduleEvent() {
  clearList();
}

/* CONTEXT CANCEL EVENT */
async function editEvent(e) {
  let parent = e.target.parentNode;
  let buttons = parent.children;
  /* HIDE ALL THE BUTTONS */
  buttons[0].style.visibility = 'hidden';
  buttons[1].style.visibility = 'hidden';

  buttons[0].removeEventListener('click', deleteEvent);
  buttons[1].removeEventListener('click', this);

  /* SET CLICKED COLOR */
  parent.setAttribute('class', 'context-container');

  let scheduleObj = {
    dateValue,
    customerNumber: parent.id,
  };

  showLoader();
  let schedulePriceList = await ipcRenderer.invoke('edit-schedule-price-list', scheduleObj);
  ipcRenderer.send('start', { schedulePriceList, flag: 'edit' });
  setTimeout(() => {
    hideLoader();
    scheduleContainer.style.visibility = 'hidden';
    systemSettingsMenu.style.visibility = 'hidden';
  }, 500);
}

/* CONTEXT DELETE EVENT */
async function deleteEvent(e) {
  let customerNumber = e.target.parentNode.id;
  showLoader();
  let updateObj = {
    dateValue,
    customerNumber,
  };
  let result = await ipcRenderer.invoke('update-scheduled-items', updateObj);
  if (result) {
    getScheduleDates();
  }
}

/* RESET LISTENERS ON CONTEXT MENU */
function resetListenersContext() {
  let allContextContainers = Array.from(document.getElementsByClassName('context-container'));
  allContextContainers.forEach((el) => {
    /* RESET ALL CONTEXT */
    try {
      el.removeEventListener('click', scheduleEvent);
    } catch (err) {
      console.log(err);
    }
    el.addEventListener('click', scheduleEvent);

    let buttons = el.children;
    buttons[0].style.visibility = 'hidden';
    buttons[0].removeEventListener('click', deleteEvent);
    buttons[1].style.visibility = 'hidden';
    buttons[1].removeEventListener('click', editEvent);
  });
}

/* PAUSED CONTEXT MENU FUNCTION */
function showScheduleContextMenu(e) {
  scheduleEvent();
  resetListenersContext();

  let el = e.target;
  /* REMOVE THE EVENT LISTENER */
  el.removeEventListener('click', scheduleEvent);
  let customerNumber = el.innerText;
  let cancelBtnId = `${customerNumber}-edit`;
  let deleteBtnId = `${customerNumber}-delete`;

  let tempBtnCancel = document.getElementById(cancelBtnId);
  let tempBtnDelete = document.getElementById(deleteBtnId);

  /* SHOW THE BUTTONS */
  tempBtnCancel.style.visibility = 'visible';
  tempBtnDelete.style.visibility = 'visible';

  /* ADD EVENT LISTENERS */
  tempBtnDelete.addEventListener('click', deleteEvent);
  tempBtnCancel.addEventListener('click', editEvent);

  /* SET CLICKED COLOR */
  el.setAttribute('class', 'context-container-clicked');
}

/* ADD EVENT LISTENERS TO PAUSED LIST ITEMS */
function addScheduleListListeners() {
  /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
  customerNumbersScheduleList = Array.from(customerList.children);
  // CLICK EVENT ON CUSTOMER LIST ITEM
  customerNumbersScheduleList.forEach((el) => {
    el.addEventListener('click', scheduleEvent);
    el.addEventListener('contextmenu', (e) => {
      showScheduleContextMenu(e);
    });
  });
  hideLoader();
}

/* POPULATE THE CUSTOMER NUMBERS IN LIST */
function populateCustomerList() {
  customerList.innerHTML = '';
  customerScheduleList.forEach((el) => {
    let html = `
    <div id="${el}" class="context-container"><button id="${el}-delete" class="context-delete" >Delete</button>${el}<button id="${el}-edit" class="context-edit" >Edit</button></div>
      `;
    customerList.insertAdjacentHTML('beforeend', html);
    addScheduleListListeners();
  });
}

/* POPULATE THE DATES IN THE SCHEDULES SELECTOR */
async function getScheduledCustomers(date) {
  let schedule = await ipcRenderer.invoke('show-single-customer-schedule', date);
  customerScheduleList = schedule;
  populateCustomerList();
}

/* POPULATE THE CUSTOMER-LIST AND ADD CORRECT CLASSES */
function populateDateOptions() {
  scheduleDates.innerHTML = '';
  customerList.innerHTML = '';

  if (scheduleDatesArr.length < 1) {
    let html = '<div id="no-schedules">No scheduled items</div>';
    customerList.insertAdjacentHTML('beforeend', html);
    loadingDateBox.style.visibility = 'visible';
    loadingContainer.style.visibility = 'hidden';
  } else {
    scheduleDatesArr.forEach((el) => {
      let html = `
      <option value="${el}">${el}</option>
        `;
      scheduleDates.insertAdjacentHTML('beforeend', html);
      dateValue = scheduleDatesArr[0];
      getScheduledCustomers(dateValue);
    });
  }
}

/* GET SCHEDULE DATES AND SORT */
async function getScheduleDates() {
  scheduleDatesArr = await ipcRenderer.invoke('get-schedule-dates-update', null);
  scheduleDatesArr.sort((dateA, dateB) => {
    return new Date(`1/${dateA}`) - new Date(`1/${dateB}`);
  });
  populateDateOptions();
}

/* MAIN PAGE EVENTS */
/////////////////////
closeAppBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-app', null);
  }, 300);
});

/* START BUTTON */
startBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('start', null);
  }, 200);
});

/* EXIT BUTTON */
exitbtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-main', null);
  }, 300);
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
  systemSettingsMenu.style.visibility = 'visible';
});

backbtn.addEventListener('click', () => {
  soundClick.play();
  systemSettingsMenu.style.visibility = 'hidden';
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

showSchedulesBtn.addEventListener('click', async (e) => {
  soundClick.play();
  showLoader();
  scheduleContainer.style.visibility = 'visible';
  getScheduleDates();
});

/* SCHEDULE DATES BACK BUTTON */
scheduleDatesBackBtn.addEventListener('click', (e) => {
  soundClick.play();
  clearList();
  hideLoader();
  scheduleContainer.style.visibility = 'hidden';
  systemSettingsMenu.style.visibility = 'hidden';
});

/* SCHEDULE SELECTOR EVENT LISTENER */
scheduleDatesSelector.addEventListener('change', (e) => {
  dateValue = scheduleDates.value;
  showLoader();
  getScheduledCustomers(dateValue);
});

/* IPC LISTENERS */
//////////////////
/* MESSAGE TO CREATE DOWNLOAD WINDOW */
ipcRenderer.on('create-download-window', (e, message) => {
  ipcRenderer.send('create-download-window', null);
});

/* MESSAGE TO SEND PERCENTAGE DOWNLOADED */
ipcRenderer.on('update-progress', (e, message) => {
  ipcRenderer.send('update-progress', message);
});

/* CONNECTION MONITORING */
ipcRenderer.on('connection-lost', (e) => {
  onlineWarning.style.visibility = 'visible';
});
ipcRenderer.on('connection-found', (e) => {
  onlineWarning.style.visibility = 'hidden';
});
