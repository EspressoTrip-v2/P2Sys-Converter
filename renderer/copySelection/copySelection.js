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
  customerNameLists;

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
  closeAppBtn = document.getElementById('connection-close');

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

function hideBackBtn() {
  buttonBackSearch.style.display = 'none';
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
    console.log(customerBackUpJson);
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

/* BACK BUTTON SEARCH */
buttonBackSearch.addEventListener('click', (e) => {
  closeMultiWindow();
  hideSearch();
  clearCustomerList();
  soundClick.play();
  setTimeout(() => {
    searchDock.value = null;
    hideSelectBtn();
    hideCreateBtn();
    showSelector();
  }, 200);
});

/* CREATE MUTLI SEARCH */
buttonCreateMultiSearch.addEventListener('click', () => {
  soundClick.play();

  // ADD CODE
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
