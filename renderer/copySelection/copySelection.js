// Import modules
const { remote, ipcRenderer } = require('electron');
const { PythonShell } = require('python-shell');
const fs = require('fs');
const os = require('os');
const homedir = require('os').homedir();
const archiver = require('archiver');

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

const { logFileFunc } = require(`${dir}/logFile.js`);
/* GET WINDOW */
let copySelectionWindow = remote.getCurrentWindow();

/* GLOBAL VARIABLES */
/////////////////////
let customerNameNumberJson,
  customerPricesNumbersArr,
  customerName,
  customerNumber,
  priceListTemplate,
  priceListNumberValue,
  customerBackUpJson,
  customerNumberNameJson,
  customerNameLists,
  customerMultiArr,
  listElements,
  multiZipPath,
  tempPath;

/* ZIP VARIABLE REQUIREMENTS */
let date = new Date();
let zipDateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

tempPath = `${os.tmpdir()}\\P2Sys_conversion_${zipDateString}`;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container'),
  soundClick = document.getElementById('click'),
  border = document.getElementById('border'),
  userAsk = document.getElementById('ask-user'),
  buttonSelectSearch = document.getElementById('select'),
  buttonCreateMultiSearch = document.getElementById('create'),
  buttonDisabledSearch = document.getElementById('disabled'),
  buttonBackSearch = document.getElementById('back'),
  buttonSelectCancel = document.getElementById('select-back'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  existingCustomerBtn = document.getElementById('existing-customer-btn'),
  multipleCustomerBtn = document.getElementById('copy-to-multiple'),
  newCustomerBtn = document.getElementById('new-customer-btn'),
  searchDock = document.getElementById('customer-search'),
  loadingAsk = document.getElementById('loader-ask'),
  loadingSearch = document.getElementById('loader-customer-search'),
  onlineWarning = document.getElementById('connection-container'),
  closeAppBtn = document.getElementById('connection-close'),
  convertContainer = document.getElementById('convert-container'),
  convertListContainer = document.getElementById('list-container'),
  askHeaderInnerText = document.getElementById('p2s-logo-ask'),
  excelContainer = document.getElementById('excel'),
  successLabel = document.getElementById('success-label');

/* COPY TYPE SELECTION BOX CONTROLS */
function showSelector() {
  userAsk.style.visibility = 'visible';
}
function hideSelector() {
  userAsk.style.visibility = 'hidden';
}

function showSearch() {
  border.style.visibility = 'visible';
}

function hideSearch() {
  border.style.visibility = 'hidden';
}

/* BUTTON DISPLAY CONTROLS */
function hideSelectBtn() {
  buttonSelectSearch.style.display = 'none';
  buttonDisabledSearch.style.display = 'flex';
}

function showSelectBtn() {
  buttonDisabledSearch.style.display = 'none';
  buttonSelectSearch.style.display = 'flex';
}

function hideCreateBtn() {
  buttonSelectSearch.style.display = 'none';
  buttonCreateMultiSearch.style.display = 'none';
  buttonDisabledSearch.style.display = 'flex';
}

function showCreateBtn() {
  buttonDisabledSearch.style.display = 'none';
  buttonSelectSearch.style.display = 'none';
  buttonCreateMultiSearch.style.display = 'flex';
}

function showBackBtn() {
  buttonBackSearch.style.display = 'flex';
}

/* LOADING CONTAINER CONTROLS */
function showLoadingAsk() {
  loadingAsk.style.visibility = 'visible';
}
function hideLoadingAsk() {
  loadingAsk.style.visibility = 'hidden';
}
function showLoadingSearch() {
  loadingSearch.style.visibility = 'visible';
}

function clearCustomerList() {
  customerListContainer.innerHTML = '';
}

function showListContainer() {
  askHeaderInnerText.innerText = 'Converting';
  askHeaderInnerText.style.backgroundColor = 'var(--button-green)';
  convertContainer.style.visibility = 'visible';
}

function hideListContainer() {
  askHeaderInnerText.innerText = 'What do you want to copy?';
  askHeaderInnerText.style.backgroundColor = 'var(--sec-blue)';
  convertContainer.style.visibility = 'hidden';
}

function showExcelAnimation() {
  excelContainer.style.top = '15vh';
  setTimeout(() => {
    successLabel.style.opacity = '1';
  }, 500);
}

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

function buildMessage(element) {
  /* MATCH THE OBJECT STRUCTURE OF NORMAL CREATION */
  let customerData = {
    'price-list': priceListTemplate.jsonFile,
    _id: element.id,
  };
  /* BUILD THE OBJECT FOR PYTHON */
  let message = {
    customerData,
    customerNumber: element.id,
    priceListNumber: null,
    multiZipPath,
    newScheduleDate: null,
    OldScheduleDate: null,
    createExcelSchedule: false,
    customerName: null,
    custDetail: null,
    removeOldScheduleFlag: false,
    createNewScheduleFlag: false,
    pauseFlag: false,
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
    logFileFunc(err);
  });
  archive.on('end', () => {
    hideListContainer();
    ipcRenderer.send('email-popup', { multiZipPath: desktopPath });

    copySelectionWindow.close();
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
        element.className = element.className + ' convert-item-hide';
        hideLoadingAsk();
        setTimeout(() => {
          element.setAttribute('class', 'convert-item-busy');
        }, 600);
      }, 500);
    } else {
      element.className = element.className + ' convert-item-hide';

      setTimeout(() => {
        element.setAttribute('class', 'convert-item-busy');
      }, 500);
    }
    buildMessage(element);
  } else {
    showExcelAnimation();
    setTimeout(() => {
      zipFileContents(multiZipPath);
    }, 1500);
  }
}

function getListElements() {
  listElements = Array.from(document.getElementsByClassName('convert-item'));
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

/* FUNCTION TO CREATE OBJECT TO POPULATE THE PRICE LIST TABLE */
async function populatePriceListObject(priceListTemplate, detailsFlag) {
  if (detailsFlag) {
    priceListNumberValue = await ipcRenderer.invoke('get-pricelist-number', customerNumber);
    customerBackUpJson = await ipcRenderer.invoke('get-customer-backup', customerNumber);
    let priceListObj = { ...priceListTemplate };
    priceListObj.customerNameValue = customerName;
    priceListObj.customerBackUpJson = customerBackUpJson;
    priceListObj.priceListNumber = priceListNumberValue;
    priceListObj.customerNumber = customerNumber;
    return priceListObj;
  } else {
    return priceListTemplate;
  }
}

//////////////////////
/* EVENT LISTENERS */
////////////////////
function clearClickedCustomers() {
  // CLEAR ANY EXISTING HIGHLIGHTED NUMBER IN CASE OF RE-CLICK
  customerNameLists.forEach((el) => {
    el.setAttribute('class', 'customer-name');
  });
}

function existsEvent(e) {
  soundClick.play();
  showSelectBtn();
  /* ASSIGN NUMBERS AND NAME */
  customerNumber = customerNameNumberJson[e.target.innerText];
  customerName = e.target.innerText;
  clearClickedCustomers();
  // SET THE HIGHLIGHT ON CURRENT CLICKED ITEM
  e.target.setAttribute('class', 'customer-name-clicked');
}

function getDimensions(e) {
  let dimensions = copySelectionWindow.getPosition(),
    size = copySelectionWindow.getSize();
  let messageObj = {
    dimensions,
    size,
    customerNumber: e.target.id,
  };
  return messageObj;
}

function multiEvent(e) {
  let messageObj = getDimensions(e);
  soundClick.play();
  e.target.setAttribute('class', 'customer-name-clicked');
  ipcRenderer.send('ask-window-multi', messageObj);
}

function addEventListeners(flag) {
  customerNameLists = Array.from(document.getElementsByClassName('customer-name'));

  if (flag === 'existing') {
    customerNameLists.forEach((el) => {
      el.addEventListener('click', existsEvent);
    });
    showBackBtn();
    hideSelector();
    hideLoadingAsk();
    showSearch();
    searchDock.focus();
  } else if (flag === 'multi') {
    customerNameLists.forEach((el) => {
      el.addEventListener('click', multiEvent);
    });
    showBackBtn();
    hideSelector();
    hideLoadingAsk();
    showSearch();
    showCreateBtn();
  }
}

function closeMultiWindow() {
  ipcRenderer.send('close-multi-window', null);
}

/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

function populateCustomerNames(flag) {
  let customersNames = Object.keys(customerNameNumberJson);

  customersNames.forEach((el) => {
    let html = `<div title="${customerNameNumberJson[el.toLocaleUpperCase()]}" id="${
      customerNameNumberJson[el.toLocaleUpperCase()]
    }" class="customer-name">${el.toUpperCase()}</div>`;
    customerListContainer.insertAdjacentHTML('beforeend', html);
  });
  /* CHANGE EVENT LISTENERS IF MULTI BUTTON CLICKED */
  if (flag === 'existing') {
    addEventListeners('existing');
  } else if (flag === 'multi') {
    addEventListeners('multi');
  }
}

/* CLOSE APP BUTTON */
closeAppBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-app', null);
  }, 300);
});

/* SELECT BUTTON SEARCH */
buttonSelectSearch.addEventListener('click', async (e) => {
  soundClick.play();
  showLoadingSearch();
  let copyPriceList = await populatePriceListObject(priceListTemplate, true);
  border.style.opacity = '0';
  /* SEND THE OBJECT TO RENDER IN TABLE */
  ipcRenderer.send('start', { copyPriceList, flag: 'copy' });
  copySelectionWindow.close();
});

/* BACK EVENT FOR BACK BUTTON */
function backEventSearch() {
  closeMultiWindow();
  hideSearch();
  clearCustomerList();
  setTimeout(() => {
    searchDock.value = null;
    hideSelectBtn();
    hideCreateBtn();
    showSelector();
  }, 200);
}

/* BACK BUTTON SEARCH */
buttonBackSearch.addEventListener('click', (e) => {
  soundClick.play();
  backEventSearch();
});

/* CREATE MUTLI SEARCH */
buttonCreateMultiSearch.addEventListener('click', async () => {
  soundClick.play();
  ipcRenderer.send('get-customer-selection-arr', null);
});

/* CANCEL BUTTON SELECTION BOX */
buttonSelectCancel.addEventListener('click', () => {
  soundClick.play();
  setTimeout(() => {
    hideSelector();
    ipcRenderer.send('start', null);
    copySelectionWindow.close();
  }, 300);
});

/* EXISTING CUSTOMER BUTTON */
existingCustomerBtn.addEventListener('click', () => {
  showLoadingAsk();
  soundClick.play();
  populateCustomerNames('existing');
});

/* MULTIPLE CUSTOMER BUTTON */
multipleCustomerBtn.addEventListener('click', () => {
  showLoadingAsk();
  soundClick.play();
  populateCustomerNames('multi');
});

/* NEW CUSTOMER BUTTON */
newCustomerBtn.addEventListener('click', async () => {
  soundClick.play();
  let copyPriceList = await populatePriceListObject(priceListTemplate, false);
  setTimeout(() => {
    border.style.opacity = '0';
    /* SEND THE OBJECT TO RENDER IN TABLE */
    ipcRenderer.send('start', { copyPriceList, flag: 'new' });
    copySelectionWindow.close();
  }, 300);
});

//////////////////
/* SEARCH CODE */
////////////////
searchDock.addEventListener('keyup', (e) => {
  searchDock.value = searchDock.value.toUpperCase();
  customerNameLists.forEach((el) => {
    let elMatch = el.innerText.includes(searchDock.value);
    el.style.display = elMatch ? 'flex' : 'none';
  });
});

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

/* GET CUSTOMER OBJECT */
ipcRenderer.on('copy-selection', (e, message) => {
  customerNameNumberJson = message.customerNameNumberJson;
  customerPricesNumbersArr = message.customerPricesNumbersArr;
  priceListTemplate = message.template;
  customerNumberNameJson = message.customerNumberNameJson;
  showSelector();
});

ipcRenderer.on('clear-copy-selection-click', (e, message) => {
  clearClickedCustomers();
});

ipcRenderer.on('unselect-item-copy-selection', (e, message) => {
  document.getElementById(message).setAttribute('class', 'customer-name');
});

/* CONNECTION MONITORING */
ipcRenderer.on('connection-lost', (e) => {
  clearClickedCustomers();
  closeMultiWindow();
  onlineWarning.style.visibility = 'visible';
});
ipcRenderer.on('connection-found', (e) => {
  onlineWarning.style.visibility = 'hidden';
});

ipcRenderer.on('get-customer-selection-arr', (e, message) => {
  customerMultiArr = message;
  backEventSearch();
  setTimeout(() => {
    showLoadingAsk();
    populateSelectionList();
  }, 200);
});

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
      logFileFunc(err);
      new Notification(`Failure to convert ${customerNumber}`, {
        icon: `${dir}/renderer/icons/converter-logo.png`,
        body: `Please double check all entries on the price list you are trying to convert.`,
      });
      fs.rmdir(`${multiZipPath}\\${customerNumber}`, (err) => {
        logFileFunc(err);
      });
      removeProcessedElement(listElements[0]);
    }
  });
}
