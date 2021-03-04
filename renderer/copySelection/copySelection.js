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
  buttonDisabledSearch = document.getElementById('disabled'),
  buttonBackSearch = document.getElementById('back'),
  buttonSelectCancel = document.getElementById('select-back'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  existingCustomerBtn = document.getElementById('existing-customer-btn'),
  searchDock = document.getElementById('customer-search'),
  loadingContainer = document.getElementsByClassName('loading-container')[0];

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
/* LOADING CONTAINER CONTROLS */
function showLoading() {
  loadingContainer.style.visibility = 'visible';
}
function hideLoading() {
  loadingContainer.style.visibility = 'hidden';
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
async function populatePriceListObject(priceListTemplate) {
  priceListNumberValue = await ipcRenderer.invoke('get-pricelist-number', customerNumber);
  customerBackUpJson = await ipcRenderer.invoke('get-customer-backup', customerNumber);
  let priceListObj = { ...priceListTemplate };
  priceListObj.customerNameValue = customerName;
  priceListObj.customerBackUpJson = customerBackUpJson;
  priceListObj.priceListNumber = priceListNumberValue;
  priceListObj.customerNumber = customerNumber;

  return priceListObj;
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

function addEventListeners(flag) {
  customerNameLists = Array.from(document.getElementsByClassName('customer-name'));

  if (flag === 'existing') {
    customerNameLists.forEach((el) => {
      el.addEventListener('click', (e) => {
        soundClick.play();
        showSelectBtn();
        /* ASSIGN NUMBERS AND NAME */
        customerNumber = customerNameNumberJson[e.target.innerText];
        customerName = e.target.innerText;
        clearClickedCustomers();
        // SET THE HIGHLIGHT ON CURRENT CLICKED ITEM
        el.setAttribute('class', 'customer-name-clicked');
        if (window.getComputedStyle(buttonDisabledSearch).display === 'flex') {
          hideSelectBtn();
        }
      });
    });

    hideSelector();
    hideLoading();
    showSearch();
    searchDock.focus();
  } else if (flag === 'multi') {
    // ADD CODE
  }
}

/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

function populateCustomerNames() {
  let customersNames = Object.keys(customerNameNumberJson);
  (() => {
    customersNames.forEach((el) => {
      let html = `<div title="${
        customerNameNumberJson[el.toLocaleUpperCase()]
      }" class="customer-name">${el.toUpperCase()}</div>`;
      customerListContainer.insertAdjacentHTML('beforeend', html);
    });
    addEventListeners('existing');
  })();
}

/* SELECT BUTTON SEARCH */
buttonSelectSearch.addEventListener('click', async (e) => {
  soundClick.play();
  /* ADD LOADER HERE */
  let copyPriceList = await populatePriceListObject(priceListTemplate);
  border.style.opacity = '0';
  /* SEND THE OBJECT TO RENDER IN TABLE */
  ipcRenderer.send('start', { copyPriceList, flag: 'copy' });
  copySelectionWindow.close();
});

/* BACK BUTTON SEARCH */
buttonBackSearch.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    hideSearch();
    searchDock.value = null;
    clearClickedCustomers();
    hideSelectBtn();
    showSelector();
  }, 200);
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
  showLoading();
  soundClick.play();
  populateCustomerNames();
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
