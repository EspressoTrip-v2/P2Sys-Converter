/* MODULES */
////////////

const { remote, ipcRenderer } = require('electron');
const os = require('os');
const fs = require('fs');
const { PythonShell } = require('python-shell');
const homedir = require('os').homedir();
const archiver = require('archiver');

/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

const { logFileFunc } = require(`${dir}/logFile.js`);

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
  createAllPausedBtn = document.getElementById('create-all-paused'),
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
  closeAppBtn = document.getElementById('connection-close'),
  excelLogo = document.getElementById('excel-logo'),
  excelContainer = document.getElementById('excel'),
  successLabel = document.getElementById('success-label'),
  convertContainerHeader = document.getElementById('convert-container-header'),
  convertContainer = document.getElementById('convert-container'),
  convertListContainer = document.getElementById('list-container'),
  loadingContainerConvert = document.getElementById('loading-round'),
  loadingContainerSchedule = document.getElementById('loading-schedule'),
  scheduleNotify = document.getElementById('schedule-logo'),
  scheduleNotifyContainer = document.getElementById('schedule-notif'),
  pauseNotify = document.getElementById('pause-logo'),
  pauseNotifyContainer = document.getElementById('pause-notif'),
  downloadContainer = document.getElementById('download-notif');

/* GLOBAL VARIABLES */
let scheduleDatesArr,
  customerScheduleList,
  customerNumbersScheduleList,
  dateValue,
  customerMultiArr,
  convertColor,
  convertText,
  tempPath,
  multiZipPath,
  typeOfCovert,
  jsonFile,
  OldScheduleDate = null;

/* ZIP VARIABLE REQUIREMENTS */
let date = new Date();
let zipDateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

tempPath = `${os.tmpdir()}\\P2Sys_conversion_${zipDateString}`;

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
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    storage.muteflag = true;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = false;
    });
    soundClick.play();
    muteLogo.style.fill = '#d1d1d1';
  }
}

if (!storage.muteflag) {
  checkMuteFlag();
}

/* NOTIFICATIONS CONTROL */
async function checkNotifications() {
  let countObj = await ipcRenderer.invoke('get-paused-schedule-count', null);
  pauseNotifyContainer.setAttribute('count', countObj.pCount > 0 ? countObj.pCount : '');
  scheduleNotifyContainer.setAttribute('count', countObj.sCount > 0 ? countObj.sCount : '');
  if (countObj.pCount > 0) {
    showPausedNotify(countObj.pCount);
  } else {
    hidePausedNotify();
  }

  if (countObj.sCount > 0) {
    showScheduleNotify(countObj.sCount);
  } else {
    hideScheduleNotify();
  }
}

function showPausedNotify(count) {
  pauseNotify.style.fill = '#000';
}

function hidePausedNotify() {
  pauseNotify.style.fill = '#d1d1d1 ';
}

function showScheduleNotify(count) {
  scheduleNotify.style.fill = '#000';
}

function hideScheduleNotify() {
  scheduleNotify.style.fill = '#d1d1d1 ';
}

function showUpdateNotify() {
  pauseNotifyContainer.style.left = '28vw';
  setTimeout(() => {
    downloadContainer.style.visibility = 'visible';
  }, 1200);
}

function hideUpdateNotify() {
  downloadContainer.style.visibility = 'hidden';
  setTimeout(() => {
    pauseNotifyContainer.style.left = '43vw';
  }, 500);
}

/* HIDE LOADER */
function hideLoader() {
  loadingContainer.style.visibility = 'hidden';
}

/* SHOW LOADER */
function showLoader() {
  loadingContainer.style.visibility = 'visible';
}

/* SHOW LOADER */
function showLoaderConvert() {
  loadingContainerConvert.style.visibility = 'visible';
  convertContainerHeader.innerText = '';
}

/* HIDE LOADER */
function hideLoaderConvert() {
  loadingContainerConvert.style.visibility = 'hidden';
  convertContainerHeader.innerText = convertText;
}

/* SHOW LOADER */
function showLoaderSchedule() {
  loadingContainerSchedule.style.visibility = 'visible';
  loadingDateBox.style.visibility = 'visible';
}

/* HIDE LOADER */
function hideLoaderSchedule() {
  loadingContainerSchedule.style.visibility = 'hidden';
  loadingDateBox.style.visibility = 'hidden';
}

function showListContainer() {
  excelLogo.style.fill = convertColor;
  convertContainerHeader.style.backgroundColor = convertColor;
  convertContainerHeader.innerText = convertText;
  convertContainer.style.visibility = 'visible';
}

function hideListContainer() {
  loadingContainerConvert.style.visibility = 'hidden';
  convertContainer.style.visibility = 'hidden';
  convertContainerHeader.innerText = '';

  excelContainer.style.top = '10vh';
  successLabel.style.opacity = '0';
}

function showExcelAnimation() {
  excelContainer.style.top = '30vh';
  setTimeout(() => {
    successLabel.style.color = convertColor;
    successLabel.style.opacity = '1';
  }, 500);
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

  showLoaderSchedule();
  let schedulePriceList = await ipcRenderer.invoke('edit-schedule-price-list', scheduleObj);
  ipcRenderer.send('start', { schedulePriceList, flag: 'edit' });
  setTimeout(() => {
    hideLoaderSchedule();
    scheduleContainer.style.visibility = 'hidden';
    systemSettingsMenu.style.visibility = 'hidden';
  }, 500);
}

/* CONTEXT DELETE EVENT */
async function deleteEvent(e) {
  let customerNumber = e.target.parentNode.id;
  showLoaderSchedule();
  let updateObj = {
    dateValue,
    customerNumber,
  };
  let result = await ipcRenderer.invoke('update-scheduled-items', updateObj);
  if (result) {
    getScheduleDates();
    checkNotifications();
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
      logFileFunc(err.stack);
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
  hideLoaderSchedule();
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
    loadingContainerSchedule.style.visibility = 'hidden';
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
  showLoaderSchedule();
  scheduleContainer.style.visibility = 'visible';
  getScheduleDates();
});

/* SCHEDULE DATES BACK BUTTON */
scheduleDatesBackBtn.addEventListener('click', (e) => {
  soundClick.play();
  clearList();
  hideLoaderSchedule();
  scheduleContainer.style.visibility = 'hidden';
  systemSettingsMenu.style.visibility = 'hidden';
});

/* SCHEDULE SELECTOR EVENT LISTENER */
scheduleDatesSelector.addEventListener('change', (e) => {
  dateValue = scheduleDates.value;
  showLoader();
  getScheduledCustomers(dateValue);
});

/* CREATE ALL PAUSED BUTTON */
createAllPausedBtn.addEventListener('click', async (e) => {
  soundClick.play();
  customerMultiArr = await ipcRenderer.invoke('get-all-paused', null);
  if (customerMultiArr.length > 0) {
    typeOfCovert = 'pause';
    convertColor = 'var(--button-gold)';
    convertText = 'Converting all paused';
    populateSelectionList();
  } else {
    new Notification('No paused items', {
      icon: `${dir}/renderer/icons/converter-logo.png`,
      body: 'You have no paused items in the database.',
    });
  }
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

/* SCHEDULE CONVERT IF DATE EXISTS */
ipcRenderer.on('convert-schedule', (e, message) => {
  customerMultiArr = message.schedulePrices;
  OldScheduleDate = message.dateString;

  typeOfCovert = 'schedule';
  convertColor = 'var(--sec-blue)';
  convertText = `Scheduled ${OldScheduleDate}`;

  populateSelectionList();
});

ipcRenderer.on('get-notifications-main-app', async (e, message) => {
  checkNotifications();
});

ipcRenderer.on('start-update', (e, message) => {
  showUpdateNotify();
  ipcRenderer.send('open-update-window', null);
});

ipcRenderer.on('download-complete', (e, message) => {
  hideUpdateNotify();
  ipcRenderer.send('close-update-window', null);
});

/* PYTHON CONVERT SECTION */
////////////////////////////

function removeProcessedElement(element) {
  element.style.transform = 'scaleY(0)';
  element.style.opacity = '0';
  if (listElements.length >= 1) {
    element.className = element.className + ' convert-item-busy-hide';
    setTimeout(() => {
      element.remove();
      listElements.splice(0, 1);
      setElementToProcessing(listElements[0], false);
    }, 600);
  }
}

async function buildMessage(element, typeOfCovert) {
  if (typeOfCovert === 'pause') {
    jsonFile = await ipcRenderer.invoke('get-single-paused', element.id);
  } else if (typeOfCovert === 'schedule') {
    jsonFile = await ipcRenderer.invoke('get-schedule-price-list', {
      dateValue: OldScheduleDate,
      customerNumber: element.id,
    });
  }
  /* MATCH THE OBJECT STRUCTURE OF NORMAL CREATION */
  let customerData = {
    'price-list': jsonFile['price-list'],
    _id: jsonFile._id,
  };
  /* BUILD THE OBJECT FOR PYTHON */
  let message = {
    customerData,
    customerNumber: element.id,
    multiZipPath,
    newScheduleDate: null,
    OldScheduleDate,
    createExcelSchedule: false,
    customerName: null,
    custDetail: null,
    removeOldScheduleFlag: typeOfCovert === 'schedule' ? true : false,
    createNewScheduleFlag: false,
    pauseFlag: typeOfCovert === 'pause' ? true : false,
    newFlag: false,
    updateDbFlag: true,
  };

  convertPythonFunction(message);
}

/* ZIP FUNCTION */
function zipFileContents(directoryPath) {
  let date = new Date();
  let zipDateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let desktopPath = `${homedir}\\Desktop\\P2Sys_conversion_${zipDateString}.zip`;
  let output = fs.createWriteStream(desktopPath);
  let archive = archiver('zip', { zlib: { level: 9 } });

  archive.on('error', (err) => {
    logFileFunc(err.stack);
  });
  archive.on('end', () => {
    hideListContainer();
    systemSettingsMenu.style.visibility = 'hidden';
    homeWindow.minimize();
    ipcRenderer.send('email-popup', { multiZipPath: desktopPath });
  });

  archive.pipe(output);
  archive.directory(directoryPath, false);
  archive.finalize();
}

/* CHANGE ELEMENT TO PROCESSING */
async function setElementToProcessing(element, startFlag) {
  if (listElements.length >= 1) {
    if (startFlag) {
      multiZipPath = tempPath;
      setTimeout(() => {
        hideLoaderConvert();
        element.className = element.className + ' convert-item-hide';
        setTimeout(() => {
          element.style.backgroundColor = convertColor;
          element.setAttribute('class', 'convert-item-busy');
        }, 600);
      }, 500);
    } else {
      element.className = element.className + ' convert-item-hide';
      setTimeout(() => {
        element.style.backgroundColor = convertColor;
        element.setAttribute('class', 'convert-item-busy');
      }, 600);
    }
    buildMessage(element, typeOfCovert);
  } else {
    showExcelAnimation();
    setTimeout(() => {
      showLoaderConvert();
      zipFileContents(multiZipPath);
    }, 1500);
  }
}

function getListElements() {
  listElements = Array.from(document.getElementsByClassName('convert-item'));
  showLoaderConvert();
  showListContainer();
  setElementToProcessing(listElements[0], true);
}

/* CONVERSION LIST */
function populateSelectionList() {
  customerMultiArr.forEach((el) => {
    let html = `<div class="convert-item" id="${el}">${el}</div>`;
    convertListContainer.insertAdjacentHTML('beforeend', html);
  });
  getListElements();
}

/* PYTHON CONVERSION MULTI */
/////////////////////////////
async function convertPythonFunction(message) {
  /* SET VARIABLES */
  let pauseFlag = message.pauseFlag;
  let createNewScheduleFlag = message.createNewScheduleFlag;
  let customerNumber = message.customerNumber;
  let newScheduleDate = message.newScheduleDate;
  let OldScheduleDate = message.OldScheduleDate;
  let customerData = message.customerData;
  let removeOldScheduleFlag = message.removeOldScheduleFlag;
  let newFlag = message.newFlag;
  let custDetail = message.custDetail;
  let priceListNumber = await ipcRenderer.invoke('get-pricelist-number', customerNumber);
  let priceList = message.customerData['price-list'];
  let createExcelSchedule = message.createExcelSchedule;
  let updateDbFlag = message.updateDbFlag;
  let multiZipPath = message.multiZipPath;

  /* CREATE A PRICING OBJECT TO CONVERT IN PYTHON */
  let pythonPricingObj = {
    'price-list': {
      ...priceList,
      customerNumber,
      priceListNumber,
    },
  };

  let data = JSON.stringify(pythonPricingObj);
  /* PYTHON PROCESSING FUNCTION */
  ///////////////////////////////
  let serverPath;
  if (newScheduleDate === null) {
    if (fs.existsSync(process.env.SERVER_PATH)) {
      serverPath = process.env.SERVER_PATH;
    } else {
      serverPath = 'none';
    }
  } else {
    serverPath = 'none';
  }

  /* CREATE OPTIONS OBJECT FOR PYSHELL */
  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: `${process.cwd()}/python/`,
    args: [data, serverPath, createExcelSchedule, newScheduleDate, multiZipPath],
  };

  /* CREATE PYSHELL  */
  let pyshell = new PythonShell('conversion.py', options);

  /* CREATE THE PATHS VARIABLE */
  let filePaths;

  pyshell.on('message', (message) => {
    /* SEPARATE THE PATHS INTO USABLE ARRAY */
    let value = parseInt(message);
    if (isNaN(value)) {
      filePaths = message.split(',');
    }
    if (value === 100) {
      let message = {
        customerData,
        filePaths,
        pauseFlag,
        removeOldScheduleFlag,
        createNewScheduleFlag,
        newScheduleDate,
        customerNumber,
        OldScheduleDate,
        newFlag,
        updateDbFlag,
        custDetail,
        multiZipPath,
      };
      ipcRenderer.send('progress-end-multi', message);
      removeProcessedElement(listElements[0]);
    }
  });

  pyshell.end(function (err, code, signal) {
    if (err) {
      logFileFunc(err.stack);
      new Notification(`Failure to convert ${customerNumber}`, {
        icon: `${dir}/renderer/icons/converter-logo.png`,
        body: `Customer ${customerNumber} will not be converted as it is incomplete.`,
      });
      fs.rmdir(`${multiZipPath}\\${customerNumber}`, (err) => {
        logFileFunc(err.stack);
      });
      removeProcessedElement(listElements[0]);
    }
  });
}
