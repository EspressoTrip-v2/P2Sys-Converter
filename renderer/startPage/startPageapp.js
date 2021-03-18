/* MODULES */
////////////
const { remote, ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
let dir;

if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

/* LOCAL MODULES */
const { dataObjects } = require(`${dir}/objects.js`);
const { tablePopulate } = require(`${dir}/renderer/startPage/tablePopulate`);
const { logFileFunc } = require(`${dir}/logFile.js`);

/* CREATE DATE INSTANCE */
let mainDate = new Date();
let dateString = `${mainDate.getMonth() + 1}/${mainDate.getFullYear()}`;

/* GET SCREEN SIZE */
/////////////////////
/* GET SCREEN SIZE */
let res = remote.screen.getPrimaryDisplay().size;
screenWidth = res.width;

/* REMOTE WINDOWS */
///////////////////
let secWindow = remote.getCurrentWindow();

// GLOBAL VARIABLES FOR USAGE ON NECESSARY CODE
let searchValue,
  jsonFile,
  htmlContent,
  customerData,
  priceListNumber,
  customerPricesNumbersArr,
  customerNameValue,
  customerNumberAllKeys,
  customerNameNumberJson,
  customerNumberNameJson,
  customerBackUpJson,
  cusNum,
  bundleSizeColumn,
  bundleSizeHeading,
  exmillPrice = null,
  exmillTransportCost,
  untreatedColumnClass,
  treatedColumnClass,
  customerNumbersSearchList,
  dateValue,
  OldScheduleDate,
  existingCustomerListArr;

///////////////////
/* DOM ELEMENTS */
/////////////////

/* HTML TABLE DOM*/
//////////////////
let backBtn = document.getElementById('back-to-main-btn'),
  createBtn = document.getElementById('create-btn'),
  createBtnPause = document.getElementById('create-btn-pause'),
  createBtnNew = document.getElementById('create-btn-new'),
  createBtnEdit = document.getElementById('create-btn-edit'),
  pauseBtn = document.getElementById('pause-btn'),
  pauseBtnNew = document.getElementById('pause-btn-new'),
  scheduleBtn = document.getElementById('schedule-button'),
  scheduleBtnPause = document.getElementById('schedule-button-pause'),
  scheduleBtnEdit = document.getElementById('schedule-button-edit'),
  scheduleBtnNew = document.getElementById('schedule-button-new'),
  customerName = document.getElementById('customer-name'),
  overflow = document.getElementById('overflow'),
  customerPriceList = document.getElementById('pricelist'),
  customerNumberValue = document.getElementById('customer-number'),
  ccaPrice = document.getElementById('cca-price'),
  manCaaBtn = document.getElementById('cca-man'),
  autoCaaBtn = document.getElementById('cca-auto'),
  lengthLockBtn = document.getElementById('lock'),
  lengthUnlockBtn = document.getElementById('unlock'),
  lockSvg = document.getElementById('lock-svg'),
  unlockSvg = document.getElementById('unlock-svg'),
  lengthColumn = document.getElementById('len'),
  soundClick = document.getElementById('click'),
  soundPop = document.getElementById('pop'),
  minimizeTableBtn = document.getElementById('minimize-table'),
  calculateBtn = document.getElementById('calculate'),
  neverShowAgainBtn = Array.from(document.getElementsByClassName('never-show')),
  exmillBtn = document.getElementById('exmill'),
  exmillBtnDisabled = document.getElementById('exmill-disabled'),
  exmillContainer = document.getElementById('exmill-transport-container'),
  exmillApplyBtn = document.getElementById('exmill-transport-apply'),
  exmillTransportValue = document.getElementById('exmill-transport-value'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  /* TABLE COMPONENT DOMS */
  /////////////////////////
  table = document.getElementById('table'),
  existingCustomerNameContainer = document.getElementById('existing-customer-numbers'),
  existingCustomerList = document.getElementById('existing-list'),
  priceListLoading = document.getElementById('price-list-number-loader'),
  customerNumberDisabled = document.getElementById('customer-number-disabled'),
  customerNumberSubmitForm = document.getElementById('customer-number-submit'),
  customerNameMinimumAlert = document.getElementById('short-name-alert'),
  /* MAIN PAGE ELEMENTS */
  ///////////////////////
  html = document.getElementsByTagName('html')[0],
  /* TABLE COLUMNS DOM*/
  /////////////////////
  treatedColumns = document.getElementById('treated'),
  /* PROGRESS FADE DOM */
  //////////////////////
  progressFade = document.getElementById('progress-fade'),
  dateSelectionBox = document.getElementById('date-select'),
  dateSelectionMonth = document.getElementById('month'),
  dateSelectionYear = document.getElementById('year'),
  dateCancelStandardBtn = document.getElementById('date-cancel-standard-btn'),
  dateSelectStandardBtn = document.getElementById('date-select-standard-btn'),
  dateSelectPausedBtn = document.getElementById('date-select-paused-btn'),
  dateSelectEditBtn = document.getElementById('date-select-edit-btn'),
  /* CUSTOMER SEARCH DOM */
  /////////////////////////
  checkCustomer = document.getElementById('check-customer'),
  customerSearch = document.getElementById('customer-search'),
  customerNumberList = document.getElementById('customer-list'),
  checkUpdateBtn = document.getElementById('check-update-btn'),
  checkCancelBtn = document.getElementById('check-cancel-btn'),
  checkResetBtn = document.getElementById('view-reset'),
  disabledBtn = document.getElementById('disabled'),
  loadingContainer = document.getElementsByClassName('loading-container')[0],
  searchDisabledBox = document.getElementById('search-disabled'),
  maxWindow = document.getElementsByClassName('max'),
  customerFindBtn = document.getElementById('assist-btn'),
  checkResumeEditingBtn = document.getElementById('resume-editing-btn'),
  checkCopyBtn = document.getElementById('copy-btn'),
  minimizeCheckBtn = document.getElementById('minimize-search'),
  /* CUSTOMER DISPLAY BOX IN TABLE */
  viewPauseBtn = document.getElementById('view-pause'),
  onlineWarningCustomer = document.getElementById('connection-internal-customer'),
  onlineWarningTable = document.getElementById('connection-internal'),
  closeAppBtnCustomer = document.getElementById('connection-close-customer'),
  closeAppBtnTable = document.getElementById('connection-close');

//////////////
/*FUNCTIONS*/
////////////

/* POPULATE YEAR SELECTION */
function addYears() {
  let date = new Date();
  let year = date.getFullYear();
  let html = `
  <option value="${year}">${year}</option>
  <option value="${year + 1}">${year + 1}</option>
  <option value="${year + 2}">${year + 2}</option>
  `;
  dateSelectionYear.insertAdjacentHTML('beforeend', html);
}

/* RESET BUTTON FUNCTIONS */
function resetButtonsStart() {
  searchDisabledBox.style.display = 'none';
  disabledBtn.style.display = 'flex';
  viewPauseBtn.style.display = 'flex';
  checkResumeEditingBtn.style.display = 'none';
  customerFindBtn.style.display = 'flex';
  checkResetBtn.style.display = 'none';
  checkUpdateBtn.style.display = 'none';
  checkCopyBtn.style.display = 'none';
}

function resetButtonsClicked() {
  searchDisabledBox.style.display = 'none';
  disabledBtn.style.display = 'none';
  viewPauseBtn.style.display = 'none';
  checkResumeEditingBtn.style.display = 'none';
  customerFindBtn.style.display = 'none';
  checkResetBtn.style.display = 'flex';
  checkUpdateBtn.style.display = 'flex';
  checkCopyBtn.style.display = 'flex';
}

function resetButtonsPaused() {
  customerSearch.value = '';
  searchDisabledBox.style.display = 'flex';
  disabledBtn.style.display = 'flex';
  checkResumeEditingBtn.style.display = 'none';
  viewPauseBtn.style.display = 'flex';
  customerFindBtn.style.display = 'none';
  checkResetBtn.style.display = 'flex';
  checkUpdateBtn.style.display = 'none';
  checkCopyBtn.style.display = 'none';
}

function resetButtonsPausedClicked() {
  searchDisabledBox.style.display = 'flex';
  disabledBtn.style.display = 'none';
  checkResumeEditingBtn.style.display = 'flex';
  viewPauseBtn.style.display = 'flex';
  customerFindBtn.style.display = 'none';
  checkResetBtn.style.display = 'flex';
  checkUpdateBtn.style.display = 'none';
  checkCopyBtn.style.display = 'none';
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

/* CCA AUTO/MAN FUNCTION CONTROL FOR KEYUP IN CELLS */
// THIS FUNCTION IS CREATED SO THAT THE EVENT CAN BE REMOVED ON MANUAL MODE
function ccaAutoMan() {
  let value = parseInt(this.value) + parseInt(ccaPrice.value),
    /* CREATE ADJACENT TREATED ID FROM UNTREATED POSITION */
    treatedId = 'T' + this.id.slice(1);
  if (value) {
    document.getElementById(treatedId).value = value;
  }
}

/* CREATE THE JSON OBJECT FROM HTML TABLE DATA */
function createObjectFromHtml() {
  /* SET VARIABLES */
  let tableRows, columns, tableData, jsonObject, customerNum, cutomerPriceListNum;
  customerNum = customerNumberValue.value.toUpperCase();
  cutomerPriceListNum = customerPriceList.value;
  /* RETRIEVE ALL INFO AND CREATE JSON OBJECT FROM TABLE */
  jsonObject = {};
  jsonObjectData = {};
  tableRows = Array.from(document.getElementsByTagName('tr'));
  tableData = tableRows.slice(1);

  /* COLUMNS & INDEX */
  columns = Array.from(document.getElementsByTagName('th'));

  /* POPULATE THE JSON OBJECT WITH DATA */
  /* TABLE ROW INNER ID FOR BUNDLE SIZE: BR, DIMENSIONS: DR, LENGTH: ER, UNTREATED: USER, TREATED: TSER */
  for (var i = 0; i < tableData.length; i++) {
    jsonObjectData[i] = [
      document.getElementById(`BR${i}`).value,
      document.getElementById(`DR${i}`).value,
      document.getElementById(`ER${i}`).value,
      parseInt(document.getElementById(`USER${i}`).value),
      parseInt(document.getElementById(`TSER${i}`).value),
    ];
  }
  jsonObject['_id'] = customerNum;
  jsonObject['price-list'] = jsonObjectData;
  jsonObject['price-list']['COLUMNS'] = columns.map((el) => el.innerText);
  jsonObject['price-list']['CCA'] = parseInt(ccaPrice.value);
  jsonObject['price-list']['EMAIL'] = '';
  jsonObject['price-list']['TEL'] = '';

  return jsonObject;
}

function resetForm() {
  ipcRenderer.send('restart-sec', null);
}

/* GET PRICE-LIST FROM DATABASE */
async function getPriceList(customerNumber) {
  // Get the price list number
  let pricelistNumberResult = await ipcRenderer.invoke('get-pricelist-number', customerNumber);
  priceListNumber = pricelistNumberResult;

  // Get the price list from the db
  let priceListResult = await ipcRenderer.invoke('get-price-list', customerNumber);
  jsonFile = priceListResult['price-list'];
  searchValue = priceListResult._id;

  // Get the backup db for the customer
  customerBackUpJson = await ipcRenderer.invoke('get-customer-backup', customerNumber);

  // Get the name from db
  customerNameValue = customerNumberNameJson[customerNumber];

  // ONLY SHOW UPDATE BUTTON ONCE ALL DATA IS AVAILABLE
  hideLoading(true);
  resetButtonsClicked();
}

/* GET PAUSED PRICE-LIST FROM DATABASE */
async function getPausedPriceList(customerNumber) {
  // Get the price list number
  let pricelistNumberResult = await ipcRenderer.invoke('get-pricelist-number', customerNumber);
  priceListNumber = pricelistNumberResult;

  // Get the price list from the db
  let priceListResult = await ipcRenderer.invoke('get-single-paused', customerNumber);
  jsonFile = priceListResult['price-list'];
  searchValue = priceListResult._id;

  // Get the backup db for the customer
  customerBackUpJson = await ipcRenderer.invoke('get-customer-backup', customerNumber);

  // Get the name from db
  customerNameValue = customerNumberNameJson[customerNumber];

  // ONLY SHOW UPDATE BUTTON ONCE ALL DATA IS AVAILABLE
  hideLoading();
  resetButtonsPausedClicked();
}

/* BLUR TABLE */
function blurTable() {
  progressFade.style.visibility = 'visible';
  progressFade.style.backdropFilter = 'blur(2px)';
}
/* UNBLUR TABLE */
function unBlurTable() {
  progressFade.style.visibility = 'hidden';
  progressFade.style.backdropFilter = 'none';
}

/* LOADING CONTAINER CONTROLS */
function showLoading(flag) {
  if (flag) {
    loadingContainer.style.visibility = 'visible';
    viewPauseBtn.disabled = true;
  } else {
    loadingContainer.style.visibility = 'visible';
    searchDisabledBox.style.visibility = 'visible';
  }
}

function hideLoading(flag) {
  if (flag) {
    loadingContainer.style.visibility = 'hidden';
    viewPauseBtn.disabled = false;
  } else {
    loadingContainer.style.visibility = 'hidden';
    searchDisabledBox.style.visibility = 'visible';
  }
}

/* CUSTOMER NUMBER DISABLED CONTAINER CONTROL */
function showCustomerNumberDisabled() {
  customerNumberDisabled.style.visibility = 'visible';
}

function hideCustomerNumberDisabled() {
  customerNumberDisabled.style.visibility = 'hidden';
}

/* SELECTOR SHOW PAUSED VERSION */
function showPauseSelector() {
  /* SHOW CORRECT BUTTONS */
  dateSelectStandardBtn.style.display = 'none';
  dateSelectEditBtn.style.display = 'none';
  dateCancelStandardBtn.style.display = 'flex';
  dateSelectPausedBtn.style.display = 'flex';
  /* BLUR BACKGROUND */
  blurTable();
  addYears();
  dateSelectionBox.style.visibility = 'visible';
  dateSelectionBox.style.opacity = 1;
}

/* SELECTOR SHOW EDIT VERSION */
function showEditSelector() {
  /* SHOW CORRECT BUTTONS */
  dateSelectStandardBtn.style.display = 'none';
  dateSelectEditBtn.style.display = 'flex';
  dateCancelStandardBtn.style.display = 'flex';
  dateSelectPausedBtn.style.display = 'none';
  /* BLUR BACKGROUND */
  blurTable();
  addYears();
  dateSelectionBox.style.visibility = 'visible';
  dateSelectionBox.style.opacity = 1;
}

/* SELECTOR SHOW STANDARD VERSION */
function showStandardSelector() {
  /* SHOW CORRECT BUTTONS */
  dateSelectStandardBtn.style.display = 'flex';
  dateCancelStandardBtn.style.display = 'flex';
  dateSelectPausedBtn.style.display = 'none';
  dateSelectEditBtn.style.display = 'none';

  /* BLUR BACKGROUND */
  blurTable();
  addYears();
  dateSelectionBox.style.visibility = 'visible';
  dateSelectionBox.style.opacity = 1;
}

/* DATE SECLECTOR FUNCTION FOR SCHEDULES */
function showDateSelector(flag) {
  switch (flag) {
    case 'standard':
      showStandardSelector();
      break;
    case 'pause':
      showPauseSelector();
      break;
    case 'edit':
      showEditSelector();
      break;
  }
}

/* DATE SECLECTOR FUNCTION FOR SCHEDULES */
function hideDateSelector() {
  /* BLUR BACKGROUND */
  dateSelectionBox.style.opacity = 0;
}

/* SORT DATES FUNCTION */
function sortDate(datesArr) {
  /* SET THE DATES */
  let arr = datesArr.map((el) => {
    return `1/${el}`;
  });
  arr.sort((dateA, dateB) => new Date(dateA) - new Date(dateB));
  return arr.map((el) => {
    return el.toString().slice(2);
  });
}

/* CREATE THE POPUP DATA FOR PREVIOUS PRICELISTS */
function getBackupDateStrings(cumenu, ctmenu) {
  let dateFlag = true;

  /* MAKE SURE BACKUP IS NOT NULL */
  if (customerBackUpJson !== null) {
    let keys = Object.keys(customerBackUpJson);
    if (keys.length === 1) {
      dateFlag = keys[0] === dateString ? false : true;
    }
  }

  if (customerBackUpJson !== null && dateFlag) {
    /* GET THE PRICELIST DATES FROM DATAFRAME */
    let datesArray = Array.from(Object.keys(customerBackUpJson)),
      cudateList,
      priceListDates,
      ctdatelist;

    /* SORT THE DATES FOR DISPLAY */
    priceListDates = sortDate(datesArray);

    /* GET THE CURRENT DATE INDEX IF EXISTS AND REMOVE */
    let curDate = priceListDates.indexOf(dateString);
    if (curDate !== -1) {
      priceListDates.splice(curDate, 1);
    }
    if (priceListDates.length >= 1) {
      /* UNTREATED COLUMNS POPUP */
      for (i = 0; i < cumenu.length; i++) {
        cudateList = '';
        priceListDates.forEach((el) => {
          let val = customerBackUpJson[el][i][3];
          cudateList += ` ${el}: ${val}`;
        });
        cumenu[i].setAttribute('data-label', cudateList);
        cumenu[i].style.setProperty('--vis', 'visible');
      }
      /* TREATED COLUMNS POPUP */
      for (i = 0; i < ctmenu.length; i++) {
        ctdatelist = '';
        priceListDates.forEach((el) => {
          let val = customerBackUpJson[el][i][4];
          ctdatelist += ` ${el}: ${val}`;
        });
        ctmenu[i].setAttribute('data-label', ctdatelist);
        ctmenu[i].style.setProperty('--vis', 'visible');
      }
    }
  } else {
    for (i = 0; i < cumenu.length; i++) {
      cudateList = 'No History';
      cumenu[i].setAttribute('data-label', cudateList);
      cumenu[i].style.setProperty('--vis', 'visible');
    }
    /* TREATED COLUMNS POPUP */
    for (i = 0; i < ctmenu.length; i++) {
      ctdatelist = 'No History';
      ctmenu[i].setAttribute('data-label', ctdatelist);
    }
  }
}

/* CUSTOMER NAME EXISTING FILTERING */
function filterNames(e) {
  if (customerName.innerText.length > 0) {
    existingCustomerListArr.forEach((el) => {
      let elMatch = el.innerText.includes(customerName.innerText);
      if (elMatch) {
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });

    existingCustomerNameContainer.style.visibility = 'visible';
  } else {
    existingCustomerNameContainer.style.visibility = 'hidden';
  }
}

/* INNER TABLE HTM FUNCTION */
function htmlInnerFill(html, categoryModification) {
  let innerTableColumns = html.htmlColumns,
    innerTable = html.htmlInner;
  table.insertAdjacentHTML(
    'beforeend',
    `<tbody id="table-body" ><tr id="row-columns">${innerTableColumns}</tr>${innerTable}</tbody>`
  );

  let tableEntryClass = Array.from(document.getElementsByClassName('table-entries')),
    cuMenu = Array.from(document.getElementsByClassName('CU')),
    ctMenu = Array.from(document.getElementsByClassName('CT'));

  tableEntryClass.forEach((el) => {
    el.addEventListener('focusout', () => {
      let submit = document.getElementById(`S${el.id}`);
      submit.click();
    });
    el.addEventListener('keyup', (e) => {
      el.value = el.value.toUpperCase();
    });
  });

  // POPUP MENUS FOR THE BACKUP PRICES
  getBackupDateStrings(cuMenu, ctMenu);
  if (categoryModification === 'new') {
    showCustomerNumberDisabled();
    customerNumberValue.disabled = true;
    customerName.addEventListener('keyup', filterNames);
    customerName.addEventListener('keyup', enterEvent);
    customerNumberValue.addEventListener('keyup', paddingAddPriceListNum);
  }
}

/* ACTIVATE EXMILL BUTTON FUNCTION */
function activateExmillBtn() {
  /* ACTIVATE THE EXMILL BUTTON */
  if (exmillPrice != null) {
    exmillBtn.style.display = 'block';
    exmillBtnDisabled.style.display = 'none';
  }
}

/* FUNCTION TO FILL THE TABLE PAGE IF UPDATE OR COPY IS SELECTED */
function tablePageCreate(existingOrCopy, categoryModification) {
  /* SHOW THE CORRECT CREAT BUTTON FOR PAUSE OR UPDATE */
  if (categoryModification === 'pause') {
    /* RESUME VERSION */
    createBtn.style.display = 'none';
    createBtnEdit.style.display = 'none';
    scheduleBtnEdit.style.display = 'none';
    scheduleBtn.style.display = 'none';
    createBtnPause.style.display = 'flex';
    scheduleBtnPause.style.display = 'flex';
    createBtnNew.style.display = 'none';
    scheduleBtnNew.style.display = 'none';
    createBtnNew.style.display = 'none';
    pauseBtn.style.display = 'flex';
    pauseBtnNew.style.display = 'none';
  } else if (categoryModification === 'update') {
    /* UPDATE VERSION */
    createBtn.style.display = 'flex';
    createBtnPause.style.display = 'none';
    scheduleBtn.style.display = 'flex';
    scheduleBtnPause.style.display = 'none';
    createBtnEdit.style.display = 'none';
    scheduleBtnEdit.style.display = 'none';
    createBtnNew.style.display = 'none';
    scheduleBtnNew.style.display = 'none';
    createBtnNew.style.display = 'none';
    pauseBtn.style.display = 'flex';
    pauseBtnNew.style.display = 'none';
  } else if (categoryModification === 'edit') {
    /* UPDATE VERSION */
    createBtn.style.display = 'none';
    createBtnPause.style.display = 'none';
    scheduleBtn.style.display = 'none';
    scheduleBtnPause.style.display = 'none';
    createBtnEdit.style.display = 'flex';
    scheduleBtnEdit.style.display = 'flex';
    createBtnNew.style.display = 'none';
    scheduleBtnNew.style.display = 'none';
    createBtnNew.style.display = 'none';
    pauseBtn.style.display = 'flex';
    pauseBtnNew.style.display = 'none';
  } else if (categoryModification === 'new') {
    /* UPDATE VERSION */
    createBtnNew.style.display = 'flex';
    scheduleBtnNew.style.display = 'flex';
    createBtnNew.style.display = 'flex';
    createBtn.style.display = 'none';
    createBtnPause.style.display = 'none';
    scheduleBtn.style.display = 'none';
    scheduleBtnPause.style.display = 'none';
    createBtnEdit.style.display = 'none';
    scheduleBtnEdit.style.display = 'none';
    pauseBtn.style.display = 'none';
    pauseBtnNew.style.display = 'flex';
  }
  if (existingOrCopy) {
    customerPriceList.value = priceListNumber;
    customerPriceList.disabled = true;

    // FILL TABLE INFO
    customerNumberValue.value = searchValue;
    customerNumberValue.disabled = true;

    customerName.innerText = customerNameValue;
    customerName.contentEditable = false;
  } else {
    customerNumberValue.value = null;
    customerNumberValue.disabled = false;
    customerName.innerText = null;
    customerName.contentEditable = true;
    setTimeout(() => {
      customerName.focus();
    }, 500);
  }

  ccaPrice.value = jsonFile['CCA'];
  customerPriceList.disabled = true;

  // POPULATE HTML TABLE
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(htmlContent, categoryModification);

  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';

  // ADD BACKGROUND TO HTML ELEMENT
  setTimeout(() => {
    html.style.backgroundColor = '#fff';
  }, 300);

  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(950, 700);
    setTimeout(() => {
      customerNumberValue.focus();
    }, 300);
  }, 300);

  /* CHECK TO ACTIVATE EXMILL BTN */
  activateExmillBtn();
}

///////////////////////////////////
/* HEADER BUTTON RESET FUNCTION */
/////////////////////////////////
/* GET CUSTOMER DETAIL */
function getCustomerDetail() {
  return {
    customerName: customerName.innerText,
    customerNumber: customerNumberValue.value.toUpperCase(),
    priceListNumber: customerPriceList.value.toUpperCase(),
  };
}

/* CREATE PRICELIST OBJECT FROM HTML */
function createPriceListFromHtml(flag) {
  /* MAKE SURE BUNDLE SIZES ARE NOT SHOWING EXMILL */
  repopulateBundleSize();
  /* CHECK ALL VALUE ENTRIES AND WARN IF MISSING */
  let treatedMissingBool = [],
    untreatedMissingBool = [];
  untreatedColumnClass = Array.from(
    document.getElementsByClassName('price-entries-untreated')
  );
  treatedColumnClass = Array.from(document.getElementsByClassName('price-entries-treated'));

  /* SEND HTML ELEMENTS WITH NO VALUES TO ARRAY */
  treatedColumnClass.forEach((el) => {
    if (!el.value) {
      treatedMissingBool.push(el);
    }
  });
  untreatedColumnClass.forEach((el) => {
    if (!el.value) {
      untreatedMissingBool.push(el);
    }
  });

  /* SET CCA PRICE TO ZERO IF NO ENTRY */
  if (ccaPrice.value.length < 1) {
    ccaPrice.VALUE = 0;
  }
  if (treatedMissingBool.length > 0 || untreatedMissingBool.length > 0) {
    /* CHECK THE LENGTHS OF THOSE ARRAY AND HIGHLIGHT THE MISSING INPUTS */
    treatedMissingBool.forEach((el) => {
      el.style.backgroundColor = '#ffa60079';
      el.style.border = '1px solid #ffa500';
      el.style.color = 'black';
      el.placeholder = '';
    });

    untreatedMissingBool.forEach((el) => {
      el.style.backgroundColor = '#ffa60079';
      el.style.border = '1px solid #ffa500';
      el.style.color = 'black';
      el.placeholder = '';
    });
    /* CREATE MESSAGE POPUP */
    remote.dialog.showMessageBoxSync(secWindow, {
      type: 'warning',
      icon: `${dir}/renderer/icons/converter-logo.png`,
      buttons: ['OK'],
      message: 'Missing Values:',
      detail: 'Please complete the highlighted fields.',
    });
    return;
  }
  if (customerName.innerText.length === 0 || customerNumberValue.value.length < 6) {
    /* HIGHLIGHT THE FIELDS THAT ARE MISSING */
    if (customerName.innerText.length === 0 || customerName === 'Enter customer number') {
      customerName.style.fontWeight = 'bolder';
      customerName.style.animation = 'cca-flash .5s linear 4';
      overflow.style.animation = 'cca-flash .5s linear 4';
      setTimeout(() => {
        customerName.style.fontWeight = 'normal';
        overflow.style.animation = 'none';
        customerName.style.animation = 'none';
      }, 2050);
      return;
    } else {
      customerName.style.backgroundColor = '#fff';
      customerName.style.border = '1px solid #fff';
      overflow.style.backgroundColor = '#fff';
      overflow.style.border = '1px solid #fff';
    }
    if (customerNumberValue.value.length < 6) {
      customerNumberValue.style.fontWeight = 'bolder';
      customerNumberValue.style.animation = 'cca-flash .5s linear 4';
      setTimeout(() => {
        customerNumberValue.style.fontWeight = 'normal';
        customerNumberValue.style.animation = 'none';
      }, 2050);
      return;
    } else {
      customerNumberValue.style.backgroundColor = '#fff';
      customerNumberValue.style.border = '1px solid #fff';
    }
  } else {
    /* CHECK FLAG */
    switch (flag) {
      /* PAUSED SCHEDULE BUTTON - SCHEDULES A PAUSED PRICE-LIST AND REMOVES THE PAUSED ITEM */
      case 'schedule-pause':
        customerData = createObjectFromHtml();
        showDateSelector('pause');
        break;
      /* STANDARD SCHEDULE BUTTON - SCHEDULES A PRICE-LIST */
      case 'schedule':
        customerData = createObjectFromHtml();
        showDateSelector('standard');
        break;

      /* SCHEDULE EDIT SCHEDULE BUTTON - RESCHEDULES A SCHEDULED PRICE-LIST AND REMOVES THE OLD SCHEDULE */
      case 'schedule-edit':
        customerData = createObjectFromHtml();
        showDateSelector('edit');
        break;

      /* PAUSE CREATE BUTTON - MAKES SYSTEM AND ORDER SHEET ALSO REMOVES PAUSED ITEM  */
      case 'create-pause':
        customerData = createObjectFromHtml();
        ipcRenderer.send('progress-create', {
          customerData,
          pauseFlag: true,
          removeOldScheduleFlag: false,
          createNewScheduleFlag: false,
          createExcelSchedule: false,
          newScheduleDate: null,
          OldScheduleDate: null,
          newFlag: false,
          updateDbFlag: true,
          custDetail: getCustomerDetail(),
          multiZipPath: null,
        });
        secWindow.hide();
        break;

      /* SCHEDULE EDIT CREATE BUTTON - MAKES SYSTEM AND ORDER SHEET ALSO REMOVES SCHEDULE */
      case 'create-schedule-edit':
        customerData = createObjectFromHtml();
        ipcRenderer.send('progress-create', {
          customerData,
          pauseFlag: false,
          removeOldScheduleFlag: true,
          createNewScheduleFlag: false,
          createExcelSchedule: false,
          newScheduleDate: null,
          OldScheduleDate,
          newFlag: false,
          updateDbFlag: true,
          custDetail: getCustomerDetail(),
          multiZipPath: null,
        });
        secWindow.hide();
        break;

      /* STANDARD CREATE BUTTON - MAKES SYSTEM AND ORDER SHEET */
      case 'create-standard':
        customerData = createObjectFromHtml();
        ipcRenderer.send('progress-create', {
          customerData,
          pauseFlag: false,
          removeOldScheduleFlag: false,
          createNewScheduleFlag: false,
          createExcelSchedule: false,
          newScheduleDate: null,
          OldScheduleDate: null,
          newFlag: false,
          updateDbFlag: true,
          custDetail: getCustomerDetail(),
          multiZipPath: null,
        });
        secWindow.hide();
        break;

      case 'create-new':
        customerData = createObjectFromHtml();
        ipcRenderer.send('progress-create', {
          customerData,
          pauseFlag: false,
          removeOldScheduleFlag: false,
          createNewScheduleFlag: false,
          createExcelSchedule: false,
          newScheduleDate: null,
          OldScheduleDate: null,
          updateDbFlag: true,
          newFlag: true,
          custDetail: getCustomerDetail(),
          multiZipPath: null,
        });
        secWindow.hide();
        break;
    }
  }
}

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* HTML TABLE EVENTS */
//////////////////////

/* DATE SELECTOR STANDARD CANCEL BUTTON */
dateCancelStandardBtn.addEventListener('click', (e) => {
  soundClick.play();
  hideDateSelector();
  unBlurTable();
});

/* DATE SELECTOR PAUSED SELECT BUTTON */
dateSelectPausedBtn.addEventListener('click', (e) => {
  soundClick.play();
  let month = dateSelectionMonth.value;
  let year = dateSelectionYear.value;
  dateValue = `${month}/${year}`;
  hideDateSelector();
  customerData = createObjectFromHtml('python');
  ipcRenderer.send('progress-create', {
    customerData,
    pauseFlag: true,
    removeOldScheduleFlag: false,
    createNewScheduleFlag: true,
    newScheduleDate: dateValue,
    OldScheduleDate: null,
    newFlag: false,
    updateDbFlag: false,
    custDetail: getCustomerDetail(),
    multiZipPath: null,
  });
  secWindow.hide();
});

/* DATE SELECTOR EDIT SELECT BUTTON */
dateSelectEditBtn.addEventListener('click', (e) => {
  soundClick.play();
  let month = dateSelectionMonth.value;
  let year = dateSelectionYear.value;
  dateValue = `${month}/${year}`;
  hideDateSelector();
  customerData = createObjectFromHtml('python');
  ipcRenderer.send('progress-create', {
    customerData,
    pauseFlag: false,
    removeOldScheduleFlag: true,
    createNewScheduleFlag: true,
    createExcelSchedule: true,
    newScheduleDate: dateValue,
    OldScheduleDate,
    newFlag: false,
    updateDbFlag: false,
    custDetail: getCustomerDetail(),
    multiZipPath: null,
  });
  secWindow.hide();
});

/* DATE SELECTOR STANDARD SELECT BUTTON */
dateSelectStandardBtn.addEventListener('click', (e) => {
  soundClick.play();
  let month = dateSelectionMonth.value;
  let year = dateSelectionYear.value;
  dateValue = `${month}/${year}`;
  hideDateSelector();

  customerData = createObjectFromHtml('python');
  ipcRenderer.send('progress-create', {
    customerData,
    pauseFlag: false,
    removeOldScheduleFlag: false,
    createNewScheduleFlag: true,
    newScheduleDate: dateValue,
    createExcelSchedule: true,
    OldScheduleDate: null,
    newFlag: false,
    updateDbFlag: false,
    custDetail: getCustomerDetail(),
    multiZipPath: null,
  });
  secWindow.hide();
});

/* TO MAIN BUTTON */
backBtn.addEventListener('click', () => {
  soundClick.play();
  /* RESET THE TABLE FORM TO ZERO DATA */
  setTimeout(() => {
    resetForm();
  }, 200);
});

/* SCHEDULE BUTTON */
scheduleBtn.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('schedule');
});

/* SCHEDULE PAUSE BUTTON */
scheduleBtnPause.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('schedule-pause');
});

/* SCHEDULE EDIT BUTTON */
scheduleBtnEdit.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('schedule-edit');
});

/* CREATE BUTTON */
createBtn.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('create-standard');
});

/* CREATE NEW BUTTON */
createBtnNew.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('create-new');
});

/* CREATE PAUSE BUTTON */
createBtnPause.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('create-pause');
});

/* CREATE EDIT BUTTON */
createBtnEdit.addEventListener('click', (e) => {
  soundClick.play();
  createPriceListFromHtml('create-schedule-edit');
});

/* PAUSE BUTTON TO SAVE TO DATABASE */
pauseBtn.addEventListener('click', () => {
  repopulateBundleSize();
  soundClick.play();
  setTimeout(() => {
    if (
      customerName.innerText.length !== 0 &&
      customerName.innerText !== 'ENTER CUSTOMER NAME'
    ) {
      let pausedJson = createObjectFromHtml();
      ipcRenderer.send('save-paused-price-list', { pausedJson });
      resetForm();
    } else {
      remote.dialog.showMessageBoxSync(secWindow, {
        type: 'error',
        title: 'Customer name is required',
        message: 'Please enter a customer name before pausing',
        buttons: ['OK'],
        icon: `${dir}/renderer/icons/converter-logo.png`,
      });
      customerName.focus();
    }
  }, 300);
});

/* PAUSE NEW BUTTON TO SAVE TO DATABASE */
pauseBtnNew.addEventListener('click', () => {
  repopulateBundleSize();
  soundClick.play();
  setTimeout(() => {
    if (
      customerName.innerText.length !== 0 &&
      customerName.innerText !== 'ENTER CUSTOMER NAME'
    ) {
      let pausedJson = createObjectFromHtml();
      let custDetail = getCustomerDetail();
      ipcRenderer.send('create-name-numbers', custDetail);
      ipcRenderer.send('save-paused-price-list', { pausedJson });
      resetForm();
    } else {
      remote.dialog.showMessageBoxSync(secWindow, {
        type: 'error',
        title: 'Customer name is required',
        message: 'Please enter a customer name before pausing',
        buttons: ['OK'],
        icon: `${dir}/renderer/icons/converter-logo.png`,
      });
      customerName.focus();
    }
  }, 300);
});

/* LENGTH LOCK BUTTON */
lengthLockBtn.addEventListener('click', (e) => {
  soundClick.play();

  if (lengthLockBtn.classList.value === 'lock-out') {
    lengthLockBtn.setAttribute('class', 'lock-in');
    lockSvg.style.fill = '#fff';
    lengthColumn.style.backgroundColor = 'var(--auto)';

    lengthUnlockBtn.setAttribute('class', 'unlock-out');
    unlockSvg.style.fill = 'var(--button-green)';

    /* ENABLE CELLS */
    for (let i = 0; i < 30; i++) {
      document.getElementById(`ER${i}`).disabled = true;
    }
  }
});

function unlockLength() {
  soundClick.play();
  if (lengthUnlockBtn.classList.value === 'unlock-out') {
    lengthUnlockBtn.setAttribute('class', 'unlock-in');
    unlockSvg.style.fill = '#fff';
    lengthColumn.style.backgroundColor = 'var(--man)';

    lengthLockBtn.setAttribute('class', 'lock-out');
    lockSvg.style.fill = 'var(--button-gold)';

    /* ENABLE CELLS */
    for (let i = 0; i < 30; i++) {
      document.getElementById(`ER${i}`).disabled = false;
    }
  }
}

/* LENGTH UNLOCK BUTTON */

lengthUnlockBtn.addEventListener('click', (e) => {
  soundClick.play();
  unlockLength();
});

/* FUNCTION TO SWITCH CCA */
function CCAAutoSwitch() {
  // soundClick.play();
  // Check to see if there is an entry in the cca price and the button is out
  if (autoCaaBtn.classList.value === 'cca-auto-out' && ccaPrice.value) {
    autoCaaBtn.setAttribute('class', 'cca-auto-in');
    autoCaaBtn.disabled = true;
    ccaPrice.disabled = true;
    treatedColumns.style.backgroundColor = 'var(--auto)';

    // Disable all treated cells
    for (let i = 0; i < 30; i++) {
      document.getElementById(`TSER${i}`).disabled = true;
    }

    // Run through all cells once and calculate existing values
    for (let i = 0; i < 30; i++) {
      if (document.getElementById(`USER${i}`).value) {
        document.getElementById(`TSER${i}`).value =
          parseInt(document.getElementById(`USER${i}`).value) + parseInt(ccaPrice.value);
      }
    }

    manCaaBtn.setAttribute('class', 'cca-man-out');
    manCaaBtn.disabled = false;

    // Add event listeners for keyup on untreated entries to fill treated entries
    let = untreatedColumnClass = Array.from(
      document.getElementsByClassName('price-entries-untreated')
    );
    untreatedColumnClass.forEach((el) => {
      el.addEventListener('keyup', ccaAutoMan);
    });
  } else if (ccaPrice.value.length < 1) {
    ccaPrice.type = 'text';
    ccaPrice.style.fontWeight = 'bolder';
    ccaPrice.value = 'ENTER PRICE';
    ccaPrice.style.animation = 'cca-flash .5s linear 4';
    setTimeout(() => {
      ccaPrice.style.fontWeight = 'normal';
      ccaPrice.value = 'none';
      ccaPrice.type = 'number';
      ccaPrice.style.animation = 'none';
    }, 2050);
  }
}

/* AUTO CCA BUTTON */

autoCaaBtn.addEventListener('click', (e) => {
  soundClick.play();
  CCAAutoSwitch();
});

function CCAManualSwitch() {
  soundClick.play();

  if (manCaaBtn.classList.value === 'cca-man-out') {
    // Set man button in
    manCaaBtn.setAttribute('class', 'cca-man-in');
    manCaaBtn.disabled = true;
    ccaPrice.disabled = false;
    treatedColumns.style.backgroundColor = 'var(--man)';

    // Make treated cell active
    for (let i = 0; i < 30; i++) {
      document.getElementById(`TSER${i}`).disabled = false;
    }
    // Set auto button to be out
    autoCaaBtn.setAttribute('class', 'cca-auto-out');
    autoCaaBtn.disabled = false;

    // remove event listeners for keyup on untreated entries to fill treated entries
    let = untreatedColumnClass = Array.from(
      document.getElementsByClassName('price-entries-untreated')
    );
    untreatedColumnClass.forEach((el) => {
      el.removeEventListener('keyup', ccaAutoMan);
    });
  }
}

/* MANUAL CCA BUTTON */
manCaaBtn.addEventListener('click', (e) => {
  CCAManualSwitch();
  repopulateBundleSize();
});

/* EXMILL FUNCTIONS AND BUTTON */
/* FUNCTION TO REPOPULATE THE BUNDLE SIZE WITH ORIGINAL INFO AND CHANGE BACK THE BACKGROUND */
function repopulateBundleSize() {
  /* ASSIGN CREATED DOM ELEMENTS */
  bundleSizeColumn = document.getElementById('bundle');
  bundleSizeHeading = document.getElementById('bundle-size');
  bundleSizeHeading.innerText = 'BUNDLE SIZE';
  bundleSizeHeading.style.backgroundColor = 'var(--main)';
  bundleSizeColumn.setAttribute('class', 'standard');

  let br, element;
  for (let i = 0; i < 30; i++) {
    /* CREATE BUNDLE SIZE ENTRY ID */
    br = `BR${i}`;
    element = document.getElementById(br);
    element.style.color = '#000';
    element.style.fontWeight = 'normal';
    /* GET THE BUNDLE SIZES FROM THE OBJECT TEMPLATE */
    element.value = dataObjects['template-pricelist'][i][0];
  }
}

/* FUNCTION TO CREATE THE PERCENTAGE STRING FOR EXMILL */
function createExmillPercent(pricelistvalue, exmillvalue) {
  let newInt;
  let value = (pricelistvalue / exmillvalue - 1) * 100;
  if (value > 1) {
    newInt = value.toFixed(2);
    return `+${newInt}%`;
  } else if (value < 1) {
    newInt = value.toFixed(2);
    return `${newInt}%`;
  }
}

/* FUNCTION TO LIVE CALCULATE THE EXMILL VALUE */
function exmillKeyUp() {
  /* GET BUNDLE SIZE ELEMENT BY REPLACING LETTERS IN ID */
  let br = document.getElementById(this.id.replace('USER', 'BR')),
    /* GET EXMILL VALUE BY REPLACING LETTERS IN ID */
    exmillValue = exmillPrice[parseInt(this.id.replace('USER', ''))][4];
  /* CALCULATE TREATED VALUE BY ADDING CCA PRICE */
  let ctValue =
    parseInt(this.value) + parseInt(ccaPrice.value) - parseInt(exmillTransportCost);

  /* CHECK TO SEE IF VALUE IS UNDEFINED AND SEND TO INPUT */
  let calcValue = createExmillPercent(ctValue, exmillValue);
  if (calcValue) {
    br.value = calcValue;
  } else if (calcValue === undefined) {
    br.value = '-';
    br.style.color = '#000';
    br.style.fontWeight = 'normal';
  }

  /* CHANGE COLOR OF TEXT */
  if ((ctValue / exmillValue - 1) * 100 > 0) {
    br.style.color = 'var(--dark-green)';
    br.style.fontWeight = 'bold';
  } else if ((ctValue / exmillValue - 1) * 100 < 0) {
    br.style.color = 'var(--button-red';
    br.style.fontWeight = 'bold';
  }
}

/* FUNCTION TO MAKE EXMILL COMPARISON */
function compareExmill() {
  /* SET THE COLOR AND HEADING */
  bundleSizeHeading.innerText = 'EX-MILL %';
  bundleSizeHeading.style.backgroundColor = 'var(--main)';
  bundleSizeColumn.setAttribute('class', 'exm');

  let brInput, ctInputValue, element, exmillValue;
  for (let i = 0; i < 30; i++) {
    /* CREATE BUNDLE SIZE ENTRY ID */
    /* PRICELIST TREATED VALUE */
    ctInputValue =
      parseInt(document.getElementById(`TSER${i}`).value) - parseInt(exmillTransportCost);
    /* EXMILL TREATED VALUE */
    exmillValue = parseInt(exmillPrice[i][4]);

    /* PARSE BUNDLE SIZE ID */
    brInput = `BR${i}`;
    element = document.getElementById(brInput);

    /* CHECK IF VALUE IS UNDEFINED AND SEND TO INPUT */
    let calcValue = createExmillPercent(ctInputValue, exmillValue);
    if (calcValue) {
      element.value = calcValue;
    } else if (calcValue === undefined) {
      element.value = '-';
    }

    /* CHANGE THE COLOR  */
    if ((ctInputValue / exmillValue - 1) * 100 > 0) {
      element.style.color = 'var(--dark-green)';
      element.style.fontWeight = 'bold';
    } else if ((ctInputValue / exmillValue - 1) * 100 < 0) {
      element.style.color = 'var(--button-red';
      element.style.fontWeight = 'bold';
    }
  }
}

/* EXMILL BUTTON FUNCTION */
function exmillClick() {
  if (window.getComputedStyle(exmillContainer).transform === 'matrix(0, 0, 0, 1, 0, 0)') {
    /* RESET THE TRANSPORT VALUE IF VISIBLE */
    /* SET CCA AUTO */
    CCAAutoSwitch();
    /* OPEN DOCK */
    exmillContainer.style.transform = 'scaleX(1)';
    exmillTransportValue.focus();
    /* ADD KEYUP EVENTS FOR LIVE ADJUSTMENT */
    untreatedColumnClass.forEach((el) => {
      el.addEventListener('keyup', exmillKeyUp);
    });
    /* RESET THE BUNDLE COLUMN TO RESET CALCULATION IF ALREADY DONE */
    setTimeout(() => {
      repopulateBundleSize();
    }, 300);
  } else {
    /* SET CCA MANUAL */
    CCAManualSwitch();
    /* REMOVE THE EVENT LISTENERS */
    untreatedColumnClass.forEach((el) => {
      el.removeEventListener('keyup', exmillKeyUp);
    });
    /* CLOSE THE DOCK */
    exmillContainer.style.transform = 'scaleX(0)';
    exmillTransportValue.value = '';
    /* DISABLE THE APPLY BUTTON */
    exmillApplyBtn.setAttribute('class', 'exmill-btn-disabled');
  }
}

/* EXMILL BUTTON  */
exmillBtn.addEventListener('click', (e) => {
  soundClick.play();

  exmillClick();
});

/* EVENT LISTENER FOR EXMILL INPUT TO ACTIVATE APPLY BUTTON */
exmillTransportValue.addEventListener('keyup', (e) => {
  /* ACTIVATE APPLY BUTTON ONLY WHEN VALUE IS ENTERED */
  if (exmillTransportValue.value.length < 2) {
    exmillApplyBtn.setAttribute('class', 'exmill-btn-disabled');
    exmillApplyBtn.disabled = true;
  } else {
    exmillApplyBtn.setAttribute('class', 'exmill-enabled-apply');
    exmillApplyBtn.disabled = false;
  }
});

/* EXMILL APPLY BUTTON */
exmillApplyBtn.addEventListener('click', (e) => {
  soundClick.play();
  exmillTransportCost = exmillTransportValue.value;
  setTimeout(() => {
    compareExmill();
    setTimeout(() => {
      exmillContainer.style.transform = 'scaleX(0)';
      exmillTransportValue.value = '';
      exmillApplyBtn.setAttribute('class', 'exmill-btn-disabled');
      exmillTransportValue.value = '';
      exmillApplyBtn.setAttribute('class', 'exmill-btn-disabled');
    }, 200);
  }, 200);
});

/* CUSTOMER NUMBER SEARCH BOX EVENTS */
//////////////////////////////////////

/* POPULATE CUSTOMER NUMBER LIST IN SEARCH */
////////////////////////////////////////////

/* CLEAR CURRENT LIST OF CLICKS FUNCTION */
/* SET A FLAG FOR THE PUSE VIEW BUTTON */

function clearList(flag) {
  if (flag) {
    customerNumbersSearchList.forEach((el) => {
      el.setAttribute('class', 'cusnum');
      resetButtonsStart();
    });
  } else {
    customerNumbersSearchList.forEach((el) => {
      el.setAttribute('class', 'context-container');
      resetButtonsPaused();
    });
  }
}

/* SHOW ONLY PAUSED ITEMS FUNCTION */
async function showPausedItems() {
  let pausedList = await ipcRenderer.invoke('get-all-paused', null);
  if (pausedList.length > 0) {
    customerNumberList.innerHTML = '';
    pausedList.forEach((el) => {
      let html = `
      <div id="${el}" class="context-container"><button id="${el}-delete" class="context-delete">Delete</button>${el}<button id="${el}-cancel" class="context-cancel" >Cancel</button></div>
        `;
      customerNumberList.insertAdjacentHTML('beforeend', html);
    });
    resetButtonsPaused();
    addPausedListListeners();
    hideLoading();
  } else {
    customerNumberList.innerHTML = '';
    let html = `
    <div class="no-paused">No paused items</div>
    `;
    customerNumberList.insertAdjacentHTML('beforeend', html);
    resetButtonsPaused();
    hideLoading();
  }
}

/* ADD EVENT LISTENERS TO LIST FUNCTION */
function addListListeners() {
  /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
  customerNumbersSearchList = Array.from(customerNumberList.children);
  // CLICK EVENT ON CUSTOMER LIST ITEM
  customerNumbersSearchList.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      // CLEAR ANY EXISTING CLICKED ELEMENTS THAT WERE PREVIOUSLY CLICKED
      clearList(true);
      // SET THE CLICKED CLASS ON THE SELECTED ELEMENT
      el.setAttribute('class', 'cusnum-clicked');
      customerSearch.value = el.textContent;
      cusNum = customerSearch.value;

      /* POPULATE VARIABLES RELATING TO THE PRICELIST */
      showLoading(true);
      getPriceList(cusNum);
      customerSearch.dispatchEvent(new Event('keyup'));
      customerSearch.dispatchEvent(new Event('keyup'));
    });
  });
}

/* CONTEXT DELETE EVENT */
async function deleteEvent(e) {
  let customerNumber = e.target.parentNode.id;
  showLoading();
  let result = await ipcRenderer.invoke('remove-pause-item-sync', customerNumber);
  if (result) {
    showPausedItems();
  }
}

/* CONTEXT CANCEL EVENT */
function cancelEvent(e) {
  let parent = e.target.parentNode;
  let buttons = parent.children;
  /* HIDE ALL THE BUTTONS */
  buttons[0].style.visibility = 'hidden';
  buttons[1].style.visibility = 'hidden';

  buttons[0].removeEventListener('click', deleteEvent);
  buttons[1].removeEventListener('click', cancelEvent);
  clearList(false);
  setTimeout(() => {
    parent.addEventListener('click', pausedEvent);
  }, 300);
}

/* RESET LISTENERS ON CONTEXT MENU */
function resetListenersContext() {
  let allContextContainers = Array.from(document.getElementsByClassName('context-container'));
  allContextContainers.forEach((el) => {
    /* RESET ALL CONTEXT */
    try {
      el.removeEventListener('click', pausedEvent);
    } catch (err) {
      logFileFunc(err);
    }
    el.addEventListener('click', pausedEvent);

    let buttons = el.children;
    buttons[0].style.visibility = 'hidden';
    buttons[0].removeEventListener('click', deleteEvent);
    buttons[1].style.visibility = 'hidden';
    buttons[1].removeEventListener('click', cancelEvent);
  });
}

/* PAUSED CONTEXT MENU FUNCTION */
function showPausedContextMenu(e) {
  clearList(false);
  resetListenersContext();

  let el = e.target;
  /* REMOVE THE EVENT LISTENER */
  el.removeEventListener('click', pausedEvent);
  let customerNumber = el.innerText;
  let cancelBtnId = `${customerNumber}-cancel`;
  let deleteBtnId = `${customerNumber}-delete`;

  let tempBtnCancel = document.getElementById(cancelBtnId);
  let tempBtnDelete = document.getElementById(deleteBtnId);

  /* SHOW THE BUTTONS */
  tempBtnCancel.style.visibility = 'visible';
  tempBtnDelete.style.visibility = 'visible';

  /* ADD EVENT LISTENERS */
  tempBtnDelete.addEventListener('click', deleteEvent);
  tempBtnCancel.addEventListener('click', cancelEvent);

  /* SET CLICKED */
  el.setAttribute('class', 'context-container-clicked');
}

/* EVENT LISTENER FOR PAUSED LIST */
function pausedEvent(e) {
  let el = e.target;
  soundClick.play();
  clearList(false);
  // SET THE CLICKED CLASS ON THE SELECTED ELEMENT
  el.setAttribute('class', 'context-container-clicked');
  customerSearch.value = el.innerText;
  cusNum = customerSearch.value;
  /* POPULATE VARIABLES RELATING TO THE PRICELIST */
  showLoading();
  getPausedPriceList(cusNum);
  customerSearch.dispatchEvent(new Event('keyup'));
}

/* ADD EVENT LISTENERS TO PAUSED LIST ITEMS */
function addPausedListListeners() {
  /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
  customerNumbersSearchList = Array.from(customerNumberList.children);
  // CLICK EVENT ON CUSTOMER LIST ITEM
  customerNumbersSearchList.forEach((el) => {
    el.addEventListener('click', pausedEvent);

    el.addEventListener('contextmenu', (e) => {
      showPausedContextMenu(e);
    });
  });
}

/* POPULATE THE CUSTOMER-LIST AND ADD CORRECT CLASSES */
async function populateList() {
  showLoading();
  customerPricesNumbersArr = await ipcRenderer.invoke('customer-prices-array', null);
  customerNumberList.innerHTML = '';
  customerPricesNumbersArr.forEach((el) => {
    let html = `
      <dl class="cusnum" id="${el}">${el}</dl>
      `;
    customerNumberList.insertAdjacentHTML('beforeend', html);
  });

  /* RESET THE BUTTONS */
  resetButtonsStart();
  addListListeners();
  hideLoading();
}

/* CUSTOMER NAME ENTER EVENT */
function enterEvent(e) {
  if (e.key === 'Enter') {
    customerName.innerText = customerName.innerText.trimEnd();
    if (customerName.innerText.length < 4) {
      customerName.innerText = null;
      customerNameMinimumAlert.style.visibility = 'visible';
      setTimeout(() => {
        customerNameMinimumAlert.style.visibility = 'hidden';
      }, 1000);
    } else {
      hideCustomerNumberDisabled();
      customerNumberValue.disabled = false;
      customerNumberValue.focus();
    }
  }
}

async function existingEvent(e) {
  soundClick.play();
  priceListLoading.style.visibility = 'visible';
  createBtnNew.disabled = true;
  pauseBtnNew.disabled = true;
  hideCustomerNumberDisabled();
  customerName.innerText = e.target.innerText;
  customerName.contentEditable = false;
  customerNumberValue.value = e.target.id;
  customerNumberValue.disabled = true;
  existingCustomerNameContainer.style.visibility = 'hidden';
  customerPriceList.value = await ipcRenderer.invoke('get-pricelist-number', e.target.id);
  priceListLoading.style.visibility = 'hidden';

  createBtnNew.disabled = false;
  pauseBtnNew.disabled = false;

  /* REMOVE EVENT LISTENERS FROM CUSTOMER NUMBER AND NAME */
  customerName.removeEventListener('keyup', filterNames);
  customerName.removeEventListener('keyup', enterEvent);

  customerNumberValue.removeEventListener('keyup', paddingAddPriceListNum);
}

/* ADD EXISTING LISTENERS TO PAUSED LIST ITEMS */
function addExistingListListeners() {
  /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
  existingCustomerListArr = Array.from(existingCustomerList.children);
  // CLICK EVENT ON CUSTOMER LIST ITEM
  existingCustomerListArr.forEach((el) => {
    el.addEventListener('click', existingEvent);
  });
}

/* POPULATE EXISTING NAME LIST */
function populateExistingList() {
  let customerNames = Object.keys(customerNameNumberJson);
  existingCustomerList.innerHTML = '';
  customerNames.forEach((el) => {
    let html = `
      <div class="cusnum-existing" id="${customerNameNumberJson[el]}">${el}</div>
      `;
    existingCustomerList.insertAdjacentHTML('beforeend', html);
  });
  addExistingListListeners();
}

/* CLOSE CUSTOMER DOCK */
function closeCustomerDock() {
  ipcRenderer.send('close-window-dock', null);
}

/* ADD PADDING TO SHORT CUSTOMER */
function paddingAddPriceListNum(e) {
  if (e.target.value.length > 0) {
    let pattern = /\w+|\s+/g;
    let match = e.target.value.match(pattern).join('');
    let value = match.toUpperCase().replace(' ', '');

    let newValue;
    // let value = e.target.value;
    if (value.length < 6) {
      customerNumberSubmitForm.click();
      newValue = value.padEnd(6, ' ');
      customerPriceList.value = newValue;
    } else if (value.length === 7) {
      newValue = value.slice(0, 6);
      customerPriceList.value = newValue;
    } else {
      customerPriceList.value = value;
    }
  }
}

/* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
customerSearch.addEventListener('keyup', (e) => {
  // USE REGEX TO REMOVE ANY UNWANTED CHAR
  let matchStop = /[.]/g;
  customerSearch.value = customerSearch.value.replace(matchStop, '');

  // REHIDE THE UPDATE BUTTON AND RESUME IF SEARCH CHANGES
  if (customerSearch.value.length < 6) {
    // REMOVE ANY MOUSE CLICKED ITEMS
    clearList(true);
    resetButtonsStart();
    target = null;
  }

  // SORTING CODE
  customerNumbersSearchList.forEach((el) => {
    // CHECK TO SEE IF THE ELEMENT CONTAINS THE SEARCH VALUE
    let hasMatch = el.innerText.includes(customerSearch.value.toUpperCase());
    el.style.display = hasMatch ? 'flex' : 'none';
  });
});

/* RESET BUTTON */
checkResetBtn.addEventListener('click', (e) => {
  soundClick.play();
  customerSearch.value = '';
  populateList();
});

/* UPDATE BUTTON */
checkUpdateBtn.addEventListener('click', (e) => {
  soundClick.play();
  closeCustomerDock();
  tablePageCreate(true, 'update');
});

/* RESUME BUTTON */
checkResumeEditingBtn.addEventListener('click', (e) => {
  soundClick.play();
  closeCustomerDock();
  tablePageCreate(true, 'pause');
});

/* CANCEL BUTTON */
checkCancelBtn.addEventListener('click', () => {
  soundClick.play();

  /* CLOSE DOCK IF OPEN */
  if (secWindow.getChildWindows()[0]) {
    secWindow.getChildWindows()[0].close();
  }
  /* FADE OUT WINDOW */
  checkCustomer.style.opacity = '0';
  /* SHOW MAIN WINDOW */
  setTimeout(() => {
    ipcRenderer.send('show-home', null);
  }, 650);
});

/* VIEW PAUSED BUTTON */
viewPauseBtn.addEventListener('click', (e) => {
  soundClick.play();
  closeCustomerDock();
  showLoading();
  showPausedItems();
});

/* CUSTOMER FIND DOCK BUTTON */
customerFindBtn.addEventListener('click', (e) => {
  soundClick.play();
  // Get window posiiton to send to main process
  let dimensions = secWindow.getPosition(),
    size = secWindow.getSize(),
    message = {
      dimensions,
      size,
    };

  if (secWindow.getChildWindows().length > 0) {
    closeCustomerDock();
    customerSearch.focus();
  } else {
    ipcRenderer.send('position', message);
  }
});
/* MAIN PAGE EVENTS */
/////////////////////
closeAppBtnCustomer.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-app', null);
  }, 300);
});

/* MAIN PAGE EVENTS */
/////////////////////
closeAppBtnTable.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-app', null);
  }, 300);
});

/* NEVER SHOW AGAIN BUTTON */
neverShowAgainBtn.forEach((el) => {
  el.addEventListener('click', (e) => {
    soundPop.play();
    let pnode = e.target.parentNode.id;
    if (pnode === 'copy-popup') {
      let storage = JSON.parse(localStorage.getItem('notifications'));
      storage.copy = false;
      localStorage.setItem('notifications', JSON.stringify(storage));
      copyPop.close();
    }
    if (pnode === 'lockbutton-popup') {
      let storage = JSON.parse(localStorage.getItem('notifications'));
      storage.lockbutton = false;
      localStorage.setItem('notifications', JSON.stringify(storage));
      lockbuttonPop.close();
    }
    if (pnode === 'CCA-popup') {
      let storage = JSON.parse(localStorage.getItem('notifications'));
      storage.autocca = false;
      localStorage.setItem('notifications', JSON.stringify(storage));
      CCAPop.close();
    }
    if (pnode === 'calculatebutton-popup') {
      let storage = JSON.parse(localStorage.getItem('notifications'));
      storage.calculate = false;
      localStorage.setItem('notifications', JSON.stringify(storage));
      calculateButtonPop.close();
    }
    if (pnode === 'roundall-popup') {
      let storage = JSON.parse(localStorage.getItem('notifications'));
      storage.roundall = false;
      localStorage.setItem('notifications', JSON.stringify(storage));
      roundAllPop.close();
    }
  });
});

/* COPY BUTTON EVENTS */
checkCopyBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    /* GET THE CUSTOMER PRICE LIST WITHOUT THE NAME/ CUSTOMER NUMBER & PRICE LIST NUMBER */
    let customerObj = {
      jsonFile,
      customerNumber: null,
      customerBackUpJson: null,
      customerNameValue: null,
      priceListNumber: null,
    };

    closeCustomerDock();
    // secWindow.minimize();
    ipcRenderer.send('open-copy-selection', customerObj);
    secWindow.close();
  }, 300);
});

/////////////////////////////
/* WINDOW CONTROL ELEMENTS */
////////////////////////////
maxWindow[0].addEventListener('click', (e) => {
  soundClick.play();

  if (secWindow.getSize()[0] === screenWidth) {
    setTimeout(() => {
      secWindow.unmaximize();
      setTimeout(() => {
        secWindow.center();
      }, 300);
    }, 300);
  } else {
    setTimeout(() => {
      secWindow.maximize();
    }, 300);
  }
});

minimizeCheckBtn.addEventListener('click', () => {
  soundClick.play();
  setTimeout(() => {
    secWindow.minimize();
  }, 300);
});

minimizeTableBtn.addEventListener('click', () => {
  soundClick.play();
  setTimeout(() => {
    secWindow.minimize();
  }, 500);
});

/* CHANGE OPACITY AFTER LOAD */
secWindow.webContents.on('did-finish-load', () => {
  // clearList(true);
  checkCustomer.style.opacity = '1';
});

//////////////////////////////////
/* PERCENTAGE ADJUST SLIDER BOX */
//////////////////////////////////
let v3838 = 0,
  v3850 = 0,
  v3876 = 0,
  v38114 = 0,
  v38152 = 0,
  v38228 = 0,
  v5076 = 0,
  v50152 = 0,
  v50228 = 0,
  v76228 = 0;

/* SLIDERS */
let slider3838 = document.getElementById('3838'),
  slider3850 = document.getElementById('3850'),
  slider3876 = document.getElementById('3876'),
  slider38114 = document.getElementById('38114'),
  slider38152 = document.getElementById('38152'),
  slider38228 = document.getElementById('38228'),
  slider5076 = document.getElementById('5076'),
  slider50152 = document.getElementById('50152'),
  slider50228 = document.getElementById('50228'),
  slider76228 = document.getElementById('76228');
sliderAll = document.getElementById('all');

/* SLIDER VALUES */
let value3838 = document.getElementById('l3838'),
  value3850 = document.getElementById('l3850'),
  value3876 = document.getElementById('l3876'),
  value38114 = document.getElementById('l38114'),
  value38152 = document.getElementById('l38152'),
  value38228 = document.getElementById('l38228'),
  value5076 = document.getElementById('l5076'),
  value50152 = document.getElementById('l50152'),
  value50228 = document.getElementById('l50228'),
  value76228 = document.getElementById('l76228'),
  valueAll = document.getElementById('Lall');

let percentageContainer = document.getElementById('percentage-adjust'),
  applyCancelBtn = document.getElementById('cancelBtn'),
  applyConfirmBtn = document.getElementById('applyBtn'),
  roundAllBox = document.getElementById('round-all-tick'),
  roundAllCheckMark = document.getElementById('round-all-tick-img'),
  roundAllCheckbox = document.getElementById('round-all-select');

/* SLIDER EVENT LISTENERS */
slider3838.addEventListener('input', (e) => {
  value3838.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v3838 = e.target.value;
});
slider3850.addEventListener('input', (e) => {
  value3850.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v3850 = e.target.value;
});
slider3876.addEventListener('input', (e) => {
  value3876.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v3876 = e.target.value;
});
slider38114.addEventListener('input', (e) => {
  value38114.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v38114 = e.target.value;
});

slider38152.addEventListener('input', (e) => {
  value38152.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v38152 = e.target.value;
});
slider38228.addEventListener('input', (e) => {
  value38228.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v38228 = e.target.value;
});
slider5076.addEventListener('input', (e) => {
  value5076.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v5076 = e.target.value;
});
slider50152.addEventListener('input', (e) => {
  value50152.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v50152 = e.target.value;
});
slider50228.addEventListener('input', (e) => {
  value50228.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v50228 = e.target.value;
});
slider76228.addEventListener('input', (e) => {
  value76228.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v76228 = e.target.value;
});
sliderAll.addEventListener('input', (e) => {
  valueAll.innerText = e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  /* 38 X 38 */
  value3838.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v3838 = e.target.value;
  slider3838.value = e.target.value;
  /* 38 X 50 */
  value3850.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v3850 = e.target.value;
  slider3850.value = e.target.value;
  /* 38 X 76 */
  value3876.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v3876 = e.target.value;
  slider3876.value = e.target.value;
  /* 38 X 114 */
  value38114.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v38114 = e.target.value;
  slider38114.value = e.target.value;
  /* 38 X 152 */
  value38152.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v38152 = e.target.value;
  slider38152.value = e.target.value;
  /* 38 X 228 */
  value38228.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v38228 = e.target.value;
  slider38228.value = e.target.value;
  /* 50 X 76 */
  value5076.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v5076 = e.target.value;
  slider5076.value = e.target.value;
  /* 50 X 152 */
  value50152.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v50152 = e.target.value;
  slider50152.value = e.target.value;
  /* 50 X 228 */
  value50228.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v50228 = e.target.value;
  slider50228.value = e.target.value;
  /* 70 X 228 */
  value76228.innerText =
    e.target.value <= 0 ? e.target.value + '%' : '+' + e.target.value + '%';
  v76228 = e.target.value;
  slider76228.value = e.target.value;
});

/* ROUNDALL CHECKBOX EVENTS */
roundAllCheckbox.addEventListener('change', (e) => {
  soundClick.play();
  if (e.target.checked) {
    roundAllBox.style.border = '2px solid var(--main)';
    roundAllCheckMark.style.animation = 'check 0.2s linear forwards';
  } else {
    soundClick.play();
    roundAllBox.style.border = '2px solid var(--main)';
    roundAllCheckMark.style.animation = 'none';
  }
});

function calculateButtonPress() {
  /* PRESS CCA BUTTON FUNCTION */
  CCAAutoSwitch();
  /* SHOW PERCENTAGE CALCULATOR*/
  blurTable();
  percentageContainer.style.transform = 'scale(1)';
}

/* CALCULATE BUTTON */
calculateBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    calculateButtonPress();
  }, 300);
});

/* FUNCTION FOR PERCENTAGE CALC */
function calculatePercent(untreated) {
  /* SET VALUES THAT NEED TO BE CYCLED */
  let valueA = parseInt(v3838),
    tempNum,
    tempNumEnd,
    endValue;

  /* UNTREATED CALCULATIONS */
  untreated.forEach((el) => {
    let totalA,
      inputValA = parseInt(el.value);
    if (el.id.includes('USER3')) valueA = parseInt(v3850);
    if (el.id.includes('USER6')) valueA = parseInt(v3876);
    if (el.id.includes('USER9')) valueA = parseInt(v38114);
    if (el.id.includes('USER12')) valueA = parseInt(v38152);
    if (el.id.includes('USER15')) valueA = parseInt(v38228);
    if (el.id.includes('USER18')) valueA = parseInt(v5076);
    if (el.id.includes('USER21')) valueA = parseInt(v50152);
    if (el.id.includes('USER24')) valueA = parseInt(v50228);
    if (el.id.includes('USER27')) valueA = parseInt(v76228);

    /* SET COLOR FOR INDICATION */
    if (valueA < 0) {
      el.style.color = 'var(--button-red';
      el.style.fontWeight = 'bold';
    } else if (valueA > 0) {
      el.style.color = 'var(--dark-green)';
      el.style.fontWeight = 'bold';
    }

    /* CALCULATE PERCENTAGE */
    totalA = Math.round((valueA / 100) * inputValA);

    /* CHECK IF ROUND ALL BOX IS CHECKED */
    if (roundAllCheckbox.checked) {
      /* ROUND TO NEAREST 10 */
      tempNum = (totalA + inputValA).toString();
      tempNumEnd = parseInt(tempNum[tempNum.length - 1]);
      /* CONVERT TO STRING */
      if (tempNumEnd >= 5) {
        endValue = totalA + inputValA - tempNumEnd + 10;
      } else {
        endValue = totalA + inputValA - tempNumEnd;
      }

      el.value = endValue;
      el.dispatchEvent(new Event('keyup'));
    } else {
      if (totalA !== 0) {
        /* ROUND TO NEAREST 10 */
        tempNum = (totalA + inputValA).toString();
        tempNumEnd = parseInt(tempNum[tempNum.length - 1]);
        /* CONVERT TO STRING */
        if (tempNumEnd >= 5) {
          endValue = totalA + inputValA - tempNumEnd + 10;
        } else {
          endValue = totalA + inputValA - tempNumEnd;
        }

        el.value = endValue;
        el.dispatchEvent(new Event('keyup'));
      }
    }
  });
}

/* RESET ALL SLIDERS TO ZERO */
function resetSlider() {
  valueAll.innerText = '0%';
  sliderAll.value = 0;
  /* 38 X 38 */
  value3838.innerText = '0%';
  v3838 = 0;
  slider3838.value = 0;
  /* 38 X 50 */
  value3850.innerText = '0%';
  v3850 = 0;
  slider3850.value = 0;
  /* 38 X 76 */
  value3876.innerText = '0%';
  v3876 = 0;
  slider3876.value = 0;
  /* 38 X 114 */
  value38114.innerText = '0%';
  v38114 = 0;
  slider38114.value = 0;
  /* 38 X 152 */
  value38152.innerText = '0%';
  v38152 = 0;
  slider38152.value = 0;
  /* 38 X 228 */
  value38228.innerText = '0%';
  v38228 = 0;
  slider38228.value = 0;
  /* 50 X 76 */
  value5076.innerText = '0%';
  v5076 = 0;
  slider5076.value = 0;
  /* 50 X 152 */
  value50152.innerText = '0%';
  v50152 = 0;
  slider50152.value = 0;
  /* 50 X 228 */
  value50228.innerText = '0%';
  v50228 = 0;
  slider50228.value = 0;
  /* 70 X 228 */
  value76228.innerText = '0%';
  v76228 = 0;
  slider76228.value = 0;
}

/* RESET ROUNDALL CHECKBOX */
function resetRoundAllCheckbox() {
  roundAllBox.style.border = '2px solid var(--main)';
  roundAllCheckMark.style.animation = 'none';
  roundAllCheckbox.checked = false;
}

/* APPLY CONFIRM BUTTON */
applyConfirmBtn.addEventListener('click', (e) => {
  let untreatedColumnClass = Array.from(
    document.getElementsByClassName('price-entries-untreated')
  );

  calculatePercent(untreatedColumnClass);

  /* test */
  progressFade.style.visibility = 'hidden';
  progressFade.style.backdropFilter = 'none';
  percentageContainer.style.transform = 'scale(0)';
  manCaaBtn.click();
  /* RESET SLIDERS AND ROUND ALL CHECK BOX */
  resetSlider();
  resetRoundAllCheckbox();
});

/* APPLY CANCEL BUTTON */
applyCancelBtn.addEventListener('click', (e) => {
  manCaaBtn.click();
  setTimeout(() => {
    progressFade.style.visibility = 'hidden';
    progressFade.style.backdropFilter = 'none';
    percentageContainer.style.transform = 'scale(0)';
    /* RESET SLIDERS AND ROUND ALL CHECK BOX */
    resetSlider();
    resetRoundAllCheckbox();
  }, 300);
});
//////////////////
/*IPC LISTENERS*/
////////////////

/* RECEIVE THE DATABASE OBJECTS THAT WERE DOWNLOADED */
ipcRenderer.once('database-object', (e, message) => {
  customerNumberAllKeys = message.customerNumberAllKeys;
  customerNameNumberJson = message.customerNameNumberJson;
  customerNumberNameJson = message.customerNumberNameJson;

  exmillPrice = message.exmillPrice;
  populateList();
});

/* COMMUNICATION FOR CUSTOMER DOCK */
ipcRenderer.on('dock-sec', (event, message) => {
  showLoading(true);

  /* FILL SEARCH BOX WITH CUSTOMER NUMBER */
  customerSearch.value = message;
  customerSearch.dispatchEvent(new Event('keyup'));

  /* GET THE PRICELIST FROM THE DATABASE */
  getPriceList(message);

  secWindow.focus();
  customerSearch.focus();

  /* SEND THE NUMBER TO THE CUSTOMER SEARCH MAKE THE ITEM CLICKED AND SHOW UPDATE BUTTON */
  let item = document.getElementById(message);
  item.setAttribute('class', 'cusnum-clicked');

  /* KEYUP EVENT TO FORCE SORT ALGORITHM  */
  customerSearch.dispatchEvent(new Event('keyup'));
  /* DISPLAY THE ITEM AS CLICKED */
  item.style.display = 'flex';
});

/* COMMUNICATION FOR PROGRESS WINDOW END */
ipcRenderer.on('progress-end', (event, message) => {
  /* SEND MESSAGE WITH FILE PATHS TO MAIN TO OPEN EMAIL CHILDWINDOW */
  let newMessage = {
    ...message,
  };
  /* CALL EMAIL POPUP */
  ipcRenderer.send('email-popup', newMessage);

  /* WAIT FOR MESSAGE SENT TO CLOSE EMAIL POPUP AND RESET */
  ipcRenderer.once('email-close', (e, message) => {
    // CLICK BACK BUTTON
    resetForm();
  });
});

/* MESSAGE TO CLICK BACK BUTTON IF THERE IS AN ERROR IN PYTHON CONVERSION */
ipcRenderer.on('reset-form', (e, message) => {
  resetForm();
});

ipcRenderer.on('edit-schedule-price-list', (e, message) => {
  jsonFile = message.priceList;

  priceListNumber = message.priceListNumber;
  searchValue = message.customerNumber;
  delete jsonFile['priceListNumber'];
  delete jsonFile['customerNumber'];

  customerNameValue = message.customerNameValue;
  customerBackUpJson = message.customerBackUpJson;
  OldScheduleDate = message.OldScheduleDate;
  tablePageCreate(true, 'edit');
});

ipcRenderer.on('copy-price-list', (e, message) => {
  jsonFile = message.jsonFile;

  priceListNumber = message.priceListNumber;
  searchValue = message.customerNumber;

  customerNameValue = message.customerNameValue;
  customerBackUpJson = message.customerBackUpJson;
  OldScheduleDate = message.OldScheduleDate;
  tablePageCreate(true, 'update');
});

ipcRenderer.on('new-price-list', (e, message) => {
  populateExistingList();
  jsonFile = message.jsonFile;

  priceListNumber = message.priceListNumber;
  searchValue = message.customerNumber;

  customerNameValue = message.customerNameValue;
  customerBackUpJson = message.customerBackUpJson;
  OldScheduleDate = message.OldScheduleDate;
  tablePageCreate(false, 'new');
});

/* CONNECTION MONITORING */
function showOnlineWarning() {
  if (window.getComputedStyle(checkCustomer).visibility === 'visible') {
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(2px)';
    onlineWarningCustomer.style.visibility = 'visible';
    closeCustomerDock();
  } else {
    percentageContainer.style.transform = 'scale(0)';
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(2px)';
    onlineWarningTable.style.visibility = 'visible';
  }
}

function hideOnlineWarning() {
  progressFade.style.visibility = 'hidden';
  progressFade.style.backdropFilter = 'none';
  onlineWarningCustomer.style.visibility = 'hidden';
  onlineWarningTable.style.visibility = 'hidden';
}

ipcRenderer.on('connection-lost', (e) => {
  showOnlineWarning();
});
ipcRenderer.on('connection-found', (e) => {
  hideOnlineWarning();
});
