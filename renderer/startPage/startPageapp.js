/* MODULES */
////////////
const { remote, ipcRenderer } = require('electron');
const { set } = require('mongoose');

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

/* LOCAL MODULES */
const { dataObjects } = require(`${dir}/objects.js`);
const { tablePopulate } = require(`${dir}/renderer/startPage/tablePopulate`);

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

/* ///////////////////////////////// VARIABLE LEGEND ////////////////////////////// */
/* searchValue: Value entered into the search box (customer number)                 */
/* target: clicked object in the customer list in search box                        */
/* jsonFile: Locally stored layman pricelist                                        */
/* htmlContent: Html that gets generated in the table form from the jsonFile        */
/* 
/* //////////////////////////////////////////////////////////////////////////////// */

// GLOBAL VARIABLES FOR USAGE ON NECESSARY CODE
let searchValue,
  target,
  jsonFile,
  htmlContent,
  customerNumber,
  customerData,
  pricelistNumber,
  customerPrices,
  customerPricelistNumber,
  customerNumberName,
  customerNameNumber,
  customerBackUp,
  cusNum,
  notObject,
  bundleSizeColumn,
  bundleSizeHeading,
  exmillPrice,
  exmillTransportCost,
  untreatedColumnClass,
  treatedColumnClass;

///////////////////
/* DOM ELEMENTS */
/////////////////

/* HTML TABLE DOM*/
//////////////////
let backBtn = document.getElementById('back-to-main-btn'),
  createBtn = document.getElementById('create-btn'),
  pauseBtn = document.getElementById('pause-btn'),
  customerName = document.getElementById('customer-name'),
  overflow = document.getElementById('overflow'),
  customerPriceList = document.getElementById('pricelist'),
  customerNumberValue = document.getElementById('customer-number'),
  customerNumberSubmit = document.getElementById('customer-number-submit'),
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
  exmillPop = document.getElementById('exmill-popup'),
  exmillYes = document.getElementById('exmill-yes'),
  exmillInfoPop = document.getElementById('exmill-info-popup'),
  exmillInfoYes = document.getElementById('exmill-info-yes'),
  transportFooterContainer = document.getElementById('transport-value'),
  transportFooterValue = document.getElementById('t-value'),
  /* TABLE COMPONENT DOMS */
  /////////////////////////
  table = document.getElementById('table'),
  /* MAIN PAGE ELEMENTS */
  ///////////////////////
  html = document.getElementsByTagName('html')[0],
  /* TABLE COLUMNS DOM*/
  /////////////////////
  treatedColumns = document.getElementById('treated'),
  /* PROGRESS FADE DOM */
  //////////////////////
  progressFade = document.getElementById('progress-fade');

/* CUSTOMER SEARCH DOM */
/////////////////////////
let checkCustomer = document.getElementById('check-customer'),
  customerSearch = document.getElementById('customer-search'),
  customerNumberList = document.getElementById('customer-list'),
  checkUpdateBtn = document.getElementById('check-update-btn'),
  checkCancelbtn = document.getElementById('check-cancel-btn'),
  disabledBtn = document.getElementById('disabled'),
  maxWindow = document.getElementsByClassName('max'),
  checkContinueBtn = document.getElementById('check-continue-btn'),
  customerFindBtn = document.getElementById('assist-btn'),
  hider = document.getElementById('hider'),
  checkResumeEditingBtn = document.getElementById('resume-editing-btn'),
  checkCopyBtn = document.getElementById('copy-btn'),
  copyCheckbox = document.getElementById('copy-select'),
  copyContainer = document.getElementById('copy-container'),
  tickBox = document.getElementById('tick'),
  tickCheckMark = document.getElementById('tick-img'),
  minimizeCheckBtn = document.getElementById('minimize-search'),
  /* CUSTOMER DISPLAY BOX IN TABLE */
  customerDisplayBoxContainer = document.getElementById('customer-displaybox-container'),
  customerDisplayBox = document.getElementById('customer-displaybox'),
  viewPauseBtn = document.getElementById('view-pause');

//////////////
/*FUNCTIONS*/
////////////

/* ADD PADDING TO SHORT CUSTOMER NUMBERS */
function paddingAddPricelistNum(value) {
  let newValue;
  if (value.length < 6) {
    newValue = value.padEnd(6, ' ');
    return newValue;
  } else if (value.length === 7) {
    newValue = value.slice(0, 6);
    return newValue;
  } else {
    return value;
  }
}

/* CHECK IF CUSTOMER EXISTS */
function checkExistingCustomer() {
  /* CUSTOMER NUMBER KEYUP EVENTS FOR COPIED PRICELIST */
  customerNumberValue.addEventListener('keyup', (e) => {
    if (customerNumberValue.value.length < 6) {
      customerNumberSubmit.click();
    }
    // USE REGEX TO REMOVE ANY UNWANTED CHAR
    let pattern = /\w+|\s+/g;
    if (customerNumberValue.value.length > 0) {
      let match = customerNumberValue.value.match(pattern).join('');
      pricelistNumber = match.toUpperCase().replace(' ', '');

      /* REGEX TO FIX SYNTAX OF CUSTOMER NUMBER TO PRICELISTNUMBER */
      pricelistNumber = paddingAddPricelistNum(pricelistNumber);

      /* ENTER THE PRICELIST NUMBER THAT HAS BEEN GENERATED */
      customerPriceList.value = pricelistNumber.toUpperCase();

      /* CHECK TO SEE IF CUSTOMER NUMBER ALREADY IN USE */
      if (Object.keys(customerPrices).includes(customerNumberValue.value.toUpperCase())) {
        let answer = remote.dialog.showMessageBoxSync(secWindow, {
          type: 'question',
          icon: `${dir}/renderer/icons/error.png`,
          buttons: ['TRY AGAIN', 'RETURN'],
          message: 'CUSTOMER NUMBER NOT AVAILABLE:',
          detail: `\nThis CUSTOMER NUMBER belongs to ${
            customerNumberName[customerNumberValue.value.toUpperCase()]
          }.\n\nWould you like to try a different CUSTOMER NUMBER or return to select the customer from the search window?`,
        });
        if (answer === 0) {
          customerNumberValue.value = null;
        } else {
          resetForm();
        }
      }
    }
    if (customerNumberValue.value.length === 0) {
      customerPriceList.value = null;
    }
  });

  /* DISPLAY BOX FOR CUSTOMER SEARCH */
  let customers = Object.keys(customerNameNumber),
    customerPricesKeys = Object.keys(customerPrices);

  /* GENERATE THE INTERNAL HTML */
  (() => {
    customers.forEach((el) => {
      let html = `<div title="${
        customerNameNumber[el.toLocaleUpperCase()]
      }" class="customer-name-list">${el.toUpperCase()}</div>`;
      customerDisplayBox.insertAdjacentHTML('beforeend', html);
    });
  })();

  let customerNameLists = Array.from(document.getElementsByClassName('customer-name-list'));

  /* EVENT LISTENER FOR CLICK */
  customerNameLists.forEach((el) => {
    el.addEventListener('click', (e) => {
      let number = customerNameNumber[e.target.innerText],
        name = e.target.innerText;
      soundClick.play();
      setTimeout(() => {
        customerName.innerText = name;
        customerName.contentEditable = false;
        customerDisplayBoxContainer.style.visibility = 'hidden';
        customerNumberValue.value = number;
        customerNumberValue.disabled = true;
        customerNumberValue.dispatchEvent(new Event('keyup'));
      }, 300);
    });
  });

  /* EVENTLISTENER FOR SUGGESTIONS */
  customerName.addEventListener('keyup', (e) => {
    let pattern = /[\s\W]+/g;
    let temp, text;
    let countA = 0;
    temp = customerName.innerText.replace(pattern, '');
    /* CHECK IF THE LENGTH OF ENTRY IS 3 OR GREATER TO SHOW BOX */
    if (temp.length >= 3 && temp.length <= 8) {
      customerDisplayBoxContainer.style.visibility = 'visible';
    } else {
      customerDisplayBoxContainer.style.visibility = 'hidden';
    }
    /* ASSIGN DISPLAY NONE OR BLOCK FOR ELEMENTS IF MATCHED */
    customerNameLists.forEach((el) => {
      if (customerPricesKeys.includes(el.title)) {
        el.style.display = 'none';
      } else {
        text = el.innerText.replace(pattern, '');
        /* REMOVE ELEMENTS THAT HAVE PRICELISTS */
        let elMatch = text.includes(temp);
        if (elMatch) {
          el.style.display = 'block';
          countA++;
        } else {
          el.style.display = 'none';
        }
      }
    });
    if (countA === 0) {
      /* IF ALL ELEMENTS ARE HIDDEN HIDE BOX */
      customerDisplayBoxContainer.style.visibility = 'hidden';
    }
  });
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
const createObjectFromHtml = () => {
  /* SET VARIABLES */
  let tableRows, columns, tableData, jsonObject, customerNum;
  customerNum = customerNumberValue.value.toUpperCase();
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

  jsonObject[customerNum] = jsonObjectData;
  jsonObject[customerNum]['COLUMNS'] = columns.map((el) => el.innerText);
  jsonObject[customerNum]['CCA'] = parseInt(ccaPrice.value);
  jsonObject[customerNum]['EMAIL'] = '';
  jsonObject[customerNum]['TEL'] = '';
  jsonObject['PRICELIST'] = customerPriceList.value;
  jsonObject['HEADER'] = {
    customerName: customerName.innerText,
  };

  return jsonObject;
};

const resetForm = () => {
  /* RESTART SECWINDOW */
  ipcRenderer.send('restart-sec', 'startPage');
  secWindow.close();
};

////////////////////////////////////
/* HTML TABLE FORM PAGE FUNCTION */
//////////////////////////////////

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
function getBackupDateStrings(customernumber, cumenu, ctmenu) {
  if (customerBackUp[customernumber]) {
    /* GET THE PRICELIST DATES FROM DATAFRAME */
    let datesArray = Array.from(Object.keys(customerBackUp[customernumber])),
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
          let val = customerBackUp[customernumber][el][i][3];
          // console.log(val);
          cudateList += ` ${el}: ${val}`;
        });
        cumenu[i].setAttribute('data-label', cudateList);
        cumenu[i].style.setProperty('--vis', 'visible');
      }
      /* TREATED COLUMNS POPUP */
      for (i = 0; i < ctmenu.length; i++) {
        ctdatelist = '';
        priceListDates.forEach((el) => {
          let val = customerBackUp[customernumber][el][i][4];
          // console.log(val);
          ctdatelist += ` ${el}: ${val}`;
        });
        ctmenu[i].setAttribute('data-label', ctdatelist);
        ctmenu[i].style.setProperty('--vis', 'visible');
      }
    }
  }
}

/* INNER TABLE HTM FUNCTION */
const htmlInnerFill = (customernumber, html) => {
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
  getBackupDateStrings(customernumber, cuMenu, ctMenu);
};

/* ACTIVATE EXMILL BUTTON FUNCTION */
function activateExmillBtn() {
  if (ccaPrice.value.length > 0) {
    /* ACTIVATE THE EXMILL BUTTON */
    if (Object.keys(customerPrices).includes('@EXMILL')) {
      exmillBtn.style.display = 'block';
      exmillBtnDisabled.style.display = 'none';
    } else {
      setTimeout(() => {
        soundPop.play();
        exmillPop.show();
      }, 2000);
    }
  }
}

/* FUNCTION TO FILL THE TABLE PAGE IF UPDATE OR COPY IS SELECTED */
function tablePageCreate(type) {
  /* SET SEARCH VALUE TO SEARCH CUSTOMER UPPERCASE */
  if (type) {
    searchValue = customerSearch.value.toUpperCase();
    if (customerPricelistNumber[searchValue]) {
      customerPriceList.value = customerPricelistNumber[searchValue];
      customerPriceList.disabled = true;
    } else {
      customerPriceList.value = pricelistNumber;
    }
    // FILL TABLE INFO
    customerNumberValue.value = searchValue;
    customerName.innerText = customerNumberName[searchValue];
    customerName.contentEditable = false;
  } else {
    customerNumberValue.disabled = false;
    customerName.innerText = null;
  }

  ccaPrice.value = customerPrices[searchValue]['CCA'];
  customerPriceList.disabled = true;

  // POPULATE HTML TABLE
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(searchValue, htmlContent);

  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';

  /* SET CUSTOMER NUMBER TO GLOBAL VARIABLE */
  cusNum = customerNumberValue.value.toUpperCase();

  // ADD BACKGROUND TO HTML ELEMENT
  setTimeout(() => {
    html.style.backgroundColor = '#f1f1f1';
  }, 300);
  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(950, 700);
    }, 300);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(950, 700);
  }, 300);

  /* CHECK TO ACTIVATE EXMILL BTN */
  activateExmillBtn();
}

///////////////////////////////////
/* HEADER BUTTON RESET FUNCTION */
/////////////////////////////////
const btnReset = () => {
  if (autoCaaBtn.classList.value === 'cca-auto-in') {
    autoCaaBtn.setAttribute('class', 'cca-auto-out');
    manCaaBtn.setAttribute('class', 'cca-man-in');
    autoCaaBtn.disabled = false;
    treatedColumns.style.backgroundColor = 'var(--opaque-man)';
  }
  if (lengthLockBtn.classList.value === 'lock-out') {
    lengthLockBtn.setAttribute('class', 'lock-in');
    lockSvg.style.fill = '#fff';
    lengthColumn.style.backgroundColor = 'var(--opaque-auto)';

    lengthUnlockBtn.setAttribute('class', 'unlock-out');
    unlockSvg.style.fill = 'var(--button-green)';
  }
};

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* HTML TABLE EVENTS */
//////////////////////

/* TO MAIN BUTTON */
backBtn.addEventListener('click', () => {
  soundClick.play();
  /* RESET THE TABLE FORM TO ZERO DATA */
  setTimeout(() => {
    resetForm();
  }, 200);
});

/* CREATE BUTTON */
createBtn.addEventListener('click', (e) => {
  /* MAKE SURE BUNDLE SIZES ARE NOT SHOWING EXMILL */
  repopulateBundleSize();

  soundClick.play();

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

  /* CHECK THE LENGTHS OF THOSE ARRAY AND HIGHLIGHT THE MISSING INPUTS */
  if (treatedMissingBool.length > 0 || untreatedMissingBool.length > 0) {
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
      icon: `${dir}/renderer/icons/error.png`,
      buttons: ['OK'],
      message: 'MISSING VALUES:',
      detail: 'Please complete the highlighted fields.',
    });
    /* CHECK IF ALL TOP REQUIRED FIELDS HAVE BEEN ENTERED */
  }
  if (
    customerName.innerText.length === 0 ||
    customerNumberValue.value.length < 6 ||
    ccaPrice.value.length === 0
  ) {
    /* HIGHLIGHT THE FIELDS THAT ARE MISSING */
    if (customerName.innerText.length === 0) {
      customerName.style.fontWeight = 'bolder';
      customerName.style.animation = 'cca-flash .5s linear 4';
      overflow.style.animation = 'cca-flash .5s linear 4';
      setTimeout(() => {
        customerName.style.fontWeight = 'normal';
        overflow.style.animation = 'none';
        customerName.style.animation = 'none';
      }, 2050);
    } else {
      customerName.style.backgroundColor = '#fff';
      customerName.style.border = '1px solid #fff';
      overflow.style.backgroundColor = '#fff';
      overflow.style.border = '1px solid #fff';
    }
    if (ccaPrice.value.length === 0) {
      ccaPrice.style.fontWeight = 'bolder';
      ccaPrice.style.animation = 'cca-flash .5s linear 4';
      setTimeout(() => {
        ccaPrice.style.fontWeight = 'normal';
        ccaPrice.style.animation = 'none';
      }, 2050);
    } else {
      ccaPrice.style.backgroundColor = '#fff';
      ccaPrice.style.border = '1px solid #fff';
    }
    if (customerNumberValue.value.length < 6) {
      customerNumberValue.style.fontWeight = 'bolder';
      customerNumberValue.style.animation = 'cca-flash .5s linear 4';
      setTimeout(() => {
        customerNumberValue.style.fontWeight = 'normal';
        customerNumberValue.style.animation = 'none';
      }, 2050);
    } else {
      customerNumberValue.style.backgroundColor = '#fff';
      customerNumberValue.style.border = '1px solid #fff';
    }
  } else {
    /* CREATE THE CUSTOMER PRICELIST OBJECT TO SEND TO PYTHON */
    customerData = createObjectFromHtml();
    if (!jsonFile) {
      jsonFile = customerData[Object.keys(customerData)[0]];
    }

    /* FADE THE BACKGROUND AND MESSAGE FOR PROGRESS BAR */
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(4px) grayscale(1)';
    ipcRenderer.send('progress', customerData);
  }

  secWindow.hide();
});

/* PAUSE BUTTON TO SAVE TO LOCAL STORAGE */
pauseBtn.addEventListener('click', () => {
  repopulateBundleSize();
  soundClick.play();
  if (customerName.innerText.length !== 0) {
    /* CREATE THE STORAGE OBJECT */
    let localStorageJson = createObjectFromHtml(),
      number = customerNumberValue.value.toUpperCase();

    /* STRINGIFY FOR LOCALSTORAGE */
    localStorageJson = JSON.stringify(localStorageJson);
    /* SET ITEM */
    localStorage.setItem(number, localStorageJson);
    setTimeout(() => {
      resetForm();
    }, 200);
  } else {
    remote.dialog.showMessageBoxSync(secWindow, {
      type: 'error',
      title: 'CUSTOMER NAME IS REQUIRED',
      message: 'Please enter a customer name before pausing',
      buttons: ['OK'],
      icon: `${dir}/renderer/icons/error.png`,
    });
    customerName.focus();
  }
});

/* LENGTH LOCK BUTTON */
lengthLockBtn.addEventListener('click', (e) => {
  soundClick.play();

  if (lengthLockBtn.classList.value === 'lock-out') {
    lengthLockBtn.setAttribute('class', 'lock-in');
    lockSvg.style.fill = '#fff';
    lengthColumn.style.backgroundColor = 'var(--opaque-auto)';

    lengthUnlockBtn.setAttribute('class', 'unlock-out');
    unlockSvg.style.fill = 'var(--button-green)';

    /* ENABLE CELLS */
    for (let i = 0; i < 30; i++) {
      document.getElementById(`ER${i}`).disabled = true;
    }
  }
});

let lockbuttonPop = document.getElementById('lockbutton-popup'),
  lockbuttonPopYes = document.getElementById('lockbutton-yes'),
  lockbuttonPopNo = document.getElementById('lockbutton-no');
/* LOCKBUTTON NOTIFICATION FUNCTION */
function notificationBubbleLockbutton() {
  notObject = JSON.parse(localStorage.getItem('notifications'));
  if (notObject.lockbutton) {
    soundPop.play();
    lockbuttonPop.show();
    lockbuttonPopYes.addEventListener('click', (e) => {
      soundPop.play();
      lockbuttonPop.close();
      unlockLength();
    });
    lockbuttonPopNo.addEventListener('click', (e) => {
      soundPop.play();
      lockbuttonPop.close();
    });
  } else if (!notObject.lockbutton) {
    unlockLength();
  }
}

function unlockLength() {
  soundClick.play();
  if (lengthUnlockBtn.classList.value === 'unlock-out') {
    lengthUnlockBtn.setAttribute('class', 'unlock-in');
    unlockSvg.style.fill = '#fff';
    lengthColumn.style.backgroundColor = 'var(--opaque-man)';

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
  notificationBubbleLockbutton();
});

let CCAPop = document.getElementById('CCA-popup'),
  CCAPopYes = document.getElementById('CCA-yes'),
  CCAPopNo = document.getElementById('CCA-no');
/* CCA NOTIFICATION */
function notificationBubbleAutocca() {
  notObject = JSON.parse(localStorage.getItem('notifications'));
  if (notObject.autocca) {
    soundPop.play();
    CCAPop.show();
    CCAPopYes.addEventListener('click', (e) => {
      soundPop.play();
      CCAPop.close();
      CCAAutoSwitch();
    });
    CCAPopNo.addEventListener('click', (e) => {
      soundPop.play();
      CCAPop.close();
    });
  } else if (!notObject.autocca) {
    CCAAutoSwitch();
  }
}

/* FUNCTION TO SWITCH CCA */
function CCAAutoSwitch() {
  soundClick.play();
  // Check to see if there is an entry in the cca price and the button is out
  if (autoCaaBtn.classList.value === 'cca-auto-out' && ccaPrice.value) {
    autoCaaBtn.setAttribute('class', 'cca-auto-in');
    autoCaaBtn.disabled = true;
    ccaPrice.disabled = true;
    treatedColumns.style.backgroundColor = 'var(--opaque-auto)';

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
  notificationBubbleAutocca();
});

function CCAManualSwitch() {
  soundClick.play();

  if (manCaaBtn.classList.value === 'cca-man-out') {
    // Set man button in
    manCaaBtn.setAttribute('class', 'cca-man-in');
    manCaaBtn.disabled = true;
    ccaPrice.disabled = false;
    treatedColumns.style.backgroundColor = 'var(--opaque-man)';

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
  transportFooterContainer.close();
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
    element.value = jsonFile[i][0];
  }
}

/* FUNCTION TO CREATE THE PERCENTAGE STRING FOR EXMILL */
function createExmillPercent(pricelistvalue, exmillvalue) {
  let string, newInt;
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
    exmillValue =
      exmillPrice[parseInt(this.id.replace('USER', ''))][4] - parseInt(exmillTransportCost);
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
  bundleSizeHeading.style.backgroundColor = 'dodgerblue';
  bundleSizeColumn.setAttribute('class', 'exm');

  let brInput, ctInputValue, element, exmillValue;
  for (let i = 0; i < 30; i++) {
    /* CREATE BUNDLE SIZE ENTRY ID */
    /* PRICELIST TREATED VALUE */
    ctInputValue =
      parseInt(document.getElementById(`TSER${i}`).value) - parseInt(exmillTransportCost);
    /* EXMILL TREATED VALUE */
    exmillValue = parseInt(exmillPrice[i][4]) - parseInt(exmillTransportCost);

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

    if (
      window.getComputedStyle(transportFooterContainer).transform ===
      'matrix(1, 0, 0, 1, 0, 0)'
    ) {
      transportFooterContainer.close();
      setTimeout(() => {
        transportFooterValue.innerText = '';
      }, 300);
    } else {
      transportFooterValue.innerText = '';
    }

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

/* YES BUTTON FOR EXMILL POPUP */
exmillYes.addEventListener('click', (e) => {
  soundPop.play();
  exmillPop.close();
});

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
  transportFooterValue.innerText = exmillTransportCost;
  setTimeout(() => {
    compareExmill();
    setTimeout(() => {
      exmillContainer.style.transform = 'scaleX(0)';
      exmillTransportValue.value = '';
      exmillApplyBtn.setAttribute('class', 'exmill-btn-disabled');
      exmillTransportValue.value = '';
      exmillApplyBtn.setAttribute('class', 'exmill-btn-disabled');
      setTimeout(() => {
        transportFooterContainer.show();
      }, 500);
    }, 200);
  }, 200);
});

/* exmillApplyBtn
exmillTransportValue */
/////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX */
///////////////////////////////

/* CUSTOMER NUMBER SEARCH BOX EVENTS */
//////////////////////////////////////

/* POPULATE CUSTOMER NUMBER LIST IN SEARCH */
////////////////////////////////////////////

/* CLEAR CURRENT LIST OF CLICKS FUNCTION */
/* SET A FLAG FOR THE PUSE VIEW BUTTON */

function clearList() {
  numbers.forEach((el) => {
    if (localStorage.getItem(el.innerText)) {
      el.setAttribute('class', 'cusnum-resume');
    } else {
      el.setAttribute('class', 'cusnum');
    }
  });
}

/* SHOW ONLY PAUSED ITEMS FUNCTION */
function showPausedItems() {
  let listedItems = Array.from(customerNumberList.children);
  listedItems.forEach((el) => {
    if (el.classList.value === 'cusnum-resume') {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
}
// failedEmail

/* ADD EVENT LISTENERS TO LIST FUNCTION */

let numbers;
function addListListeners() {
  /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
  numbers = Array.from(customerNumberList.children);
  // CLICK EVENT ON CUSTOMER LIST ITEM
  numbers.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      // RESET ALL THE BUTTONS TO DEFAULT
      checkUpdateBtn.style.display = 'none';
      checkContinueBtn.style.display = 'none';
      checkResumeEditingBtn.style.display = 'none';
      disabledBtn.style.display = 'flex';

      // SET THE ELEMENT CLICKED TO A GLOBAL VARIABLE
      target = e.target;
      searchValue = target.id;
      // CLEAR ANY EXISTING CLICKED ELEMENTS THAT WERE PREVIOUSLY CLICKED
      clearList();
      // SET THE CLICKED CLASS ON THE SELECTED ELEMENT
      el.setAttribute('class', 'cusnum-clicked');
      customerSearch.value = el.textContent;

      // FIRST CHECK TO SEE IF THERE IS A LOCALLY STORED VERSION
      // PRICELIST OF THE SELECTED CUSTOMER AND SHOW THE RESUME BUTTON
      if (localStorage.getItem(searchValue)) {
        jsonFile = customerPrices[customerSearch.value];
        checkUpdateBtn.style.display = 'none';
        checkContinueBtn.style.display = 'none';
        checkResumeEditingBtn.style.display = 'flex';
        disabledBtn.style.display = 'none';
      } else {
        // IF NO LOCAL STORED VERSION SHOW THE UPDATE BUTTON
        jsonFile = customerPrices[customerSearch.value];
        checkUpdateBtn.style.display = 'flex';
        checkContinueBtn.style.display = 'none';
        checkResumeEditingBtn.style.display = 'none';
        disabledBtn.style.display = 'none';
        copyContainer.style.opacity = '1';
      }
      customerSearch.dispatchEvent(new Event('keyup'));
    });
  });
}

/* POPLATE THE CUSTOMERLIST AND ADD CORRECT CLASSES */
function populateList() {
  customerNumberList.innerHTML = '';
  customerNumber = Object.keys(customerPrices);

  let localStorageKeys = Object.keys(localStorage);

  customerNumber.forEach((el) => {
    if (localStorage.getItem(el)) {
      localStorageKeys.splice(localStorageKeys.indexOf(el), 1);

      let html = `
      <dl class="cusnum-resume" id="${el}">${el}</dl>
      `;
      customerNumberList.insertAdjacentHTML('beforeend', html);
    } else {
      let html = `
      <dl class="cusnum" id="${el}">${el}</dl>
      `;
      customerNumberList.insertAdjacentHTML('beforeend', html);
    }
  });
  if (localStorageKeys.length > 0) {
    localStorageKeys.forEach((el) => {
      if (el !== 'notifications' && el !== 'failedEmail') {
        let html = `
        <dl class="cusnum-resume" id="${el}">${el}</dl>
        `;
        customerNumberList.insertAdjacentHTML('beforeend', html);
      }
    });
  }
  addListListeners();
}

/* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
customerSearch.addEventListener('keyup', (e) => {
  // USE REGEX TO REMOVE ANY UNWANTED CHAR
  let pattern = /\w+|\s+/g,
    matchStop = /[.]/g;
  customerSearch.value = customerSearch.value.replace(matchStop, '');

  if (customerSearch.value) {
    let match = customerSearch.value.match(pattern).join('');
    pricelistNumber = match.toUpperCase().replace(' ', '');

    /* REGEX TO FIX SYNTAX OF CUSTOMER NUMBER TO PRICELISTNUMBER */
    pricelistNumber = paddingAddPricelistNum(pricelistNumber);
  }

  // REHIDE THE UPDATE BUTTON AND RESUME IF SEARCH CHANGES
  if (target && customerSearch.value.length < 6) {
    // REMOVE ANY MOUSE CLICKED ITEMS
    clearList();
    // SHOW THE DISABLED BUTTON AND HIDE OTHERS
    checkUpdateBtn.style.display = 'none';
    checkCopyBtn.style.display = 'none';
    checkResumeEditingBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';
    target = null;

    /* UNCHECK COPY */
    copyCheckbox.checked = false;
    tickBox.style.border = '2px solid var(--sec-blue)';
    tickCheckMark.style.animation = 'none';
    copyContainer.style.opacity = '0';
  } else if (
    customerSearch.value.length < 6 &&
    !Object.keys(localStorage).includes(customerSearch.value)
  ) {
    checkContinueBtn.style.display = 'none';
    checkUpdateBtn.style.display = 'none';
    checkResumeEditingBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';
  }
  // SORTING CODE
  numbers.forEach((el) => {
    // CHECK TO SEE IF THE ELEMENT CONTAINS THE SEARCH VALUE
    let hasMatch = el.innerText.includes(customerSearch.value.toUpperCase());
    el.style.display = hasMatch ? 'block' : 'none';
    // COUNT THE DISPLAY NONE ATTRIBUTES AND DISPLAY THE APPROPRIATE BUTTON
    let count = 0;

    numbers.forEach((el) => {
      if (window.getComputedStyle(el).display === 'none') {
        count += 1;
      }
      if (count === numbers.length) {
        if (
          // MAKE SURE CONTINUE BUTT0N IS INACTIVE / SEARCH VALUE LENGTH IS 6
          // AND THE SEARCH VALUE ISNT IN THE CURRENT CUSTOMER PRICELISTS
          window.getComputedStyle(checkContinueBtn).display === 'none' &&
          customerSearch.value.length >= 6 &&
          !customerNumber.includes(customerSearch.value.toUpperCase())
        ) {
          // DISPLAY CONTINUE BUTTON
          jsonFile = dataObjects['template-pricelist'];
          checkContinueBtn.style.display = 'flex';
          disabledBtn.style.display = 'none';
          checkUpdateBtn.style.display = 'none';
          checkResumeEditingBtn.style.display = 'none';
          copyContainer.style.opacity = '0';
          checkCopyBtn.style.display = 'none';
        } else if (
          // DISABLE THE CONTINUE BUTTON IF THE SEARCH VALUE IS LESS 6
          window.getComputedStyle(checkContinueBtn).display === 'flex' &&
          customerSearch.value.length < 6
        ) {
          // SHOW DISABLED BUTTON
          checkContinueBtn.style.display = 'none';
          disabledBtn.style.display = 'flex';
          checkUpdateBtn.style.display = 'none';
          checkResumeEditingBtn.style.display = 'none';
          copyContainer.style.opacity = '0';
          checkCopyBtn.style.display = 'none';
        } else if (
          !localStorage.getItem(customerSearch.value.toUpperCase()) &&
          !customerNumber.includes(customerSearch.value.toUpperCase())
        ) {
          // DISPLAY TICK IF THE SEARCH  VALUE IS CORRECT PATTERN AND LENGTH 6
          customerNumberList.style.backgroundImage = `url('${dir}/renderer/icons/tick.png')`;
          searchValue = customerSearch.value.toUpperCase();
        }
      } else {
        // REMOVE IMAGE IF UNACCEPTABLE
        customerNumberList.style.backgroundImage = 'none';
      }
    });
  });
});

/* SEARCH BOX BUTTON EVENTS */
/////////////////////////////

/* CONTINUE BUTTON */
checkContinueBtn.addEventListener('click', (e) => {
  soundClick.play();

  /* SET SEARCH VALUE TO SEARCH CUSTOMER UPPERCASE */
  searchValue = customerSearch.value.toUpperCase();

  // POPULATE HTML TABLE
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(searchValue, htmlContent);
  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';
  customerNumberValue.value = searchValue;
  customerPriceList.value = pricelistNumber;
  customerPriceList.disabled = true;

  if (customerNumberName[searchValue]) {
    customerName.innerText = customerNumberName[searchValue];
    customerName.contentEditable = false;
  } else {
    customerName.innerText = null;
  }
  // ADD BACKGROUND TO HTML ELEMENT
  setTimeout(() => {
    html.style.backgroundColor = '#fff';
  }, 300);

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(950, 700);
    }, 300);
    searchValue;
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(950, 700);
  }, 300);

  /* ACTIVATE EXMILL BUTTON */
  activateExmillBtn();

  /* SHOW INFO POPUP FOR EXMILL */
  setTimeout(() => {
    soundPop.play();
    exmillInfoPop.show();
    exmillInfoYes.addEventListener('click', (e) => {
      soundPop.play();
      exmillInfoPop.close();
    });
  }, 2000);
});

/* UPDATE BUTTON */
checkUpdateBtn.addEventListener('click', (e) => {
  soundClick.play();
  tablePageCreate(true);
});

/* RESUME BUTTON */
checkResumeEditingBtn.addEventListener('click', (e) => {
  soundClick.play();

  /* SET THE SEARCH VALUE TO CUSTOMER SEARCH VALUE UPPERCASE*/
  searchValue = customerSearch.value.toUpperCase();

  // let localStorageObject = JSON.parse(localStorage.getItem(searchValue));
  /* GET OBJECT FROM LOCAL STORAGE */
  let localStorageObject = JSON.parse(localStorage.getItem(searchValue));
  /* SET JSONfILE */
  jsonFile = localStorageObject[searchValue];
  console.log(jsonFile);
  // POPULATE HTML TABLE
  htmlContent = tablePopulate(localStorageObject[searchValue]);
  htmlInnerFill(searchValue, htmlContent);

  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';
  // FILL TABLE INFO
  customerNumberValue.value = searchValue;
  customerName.innerText = customerNumberName[searchValue]
    ? customerNumberName[searchValue]
    : localStorageObject['HEADER']['customerName'];
  customerName.contentEditable = false;
  /* LOOK TO SEE IF PRICELIST ONFILE */
  customerPriceList.value = customerPricelistNumber[searchValue]
    ? customerPricelistNumber[searchValue]
    : searchValue;
  customerPriceList.disabled = true;
  ccaPrice.value = localStorageObject[searchValue]['CCA'];

  // ADD BACKGROUND TO HTML ELEMENT
  setTimeout(() => {
    html.style.backgroundColor = '#fff';
  }, 300);

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(950, 700);
    }, 300);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(950, 700);
  }, 300);

  /* ACTIVATE EXMILL BUTTON */
  activateExmillBtn();
});

/* CANCEL BUTTON */
checkCancelbtn.addEventListener('click', () => {
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

/* CUSTOMER FIND DOCK BUTTON */

customerFindBtn.addEventListener('click', (e) => {
  soundClick.play();

  // Get window posiiton to send to main process
  let dimensions = secWindow.getPosition(),
    message = {
      emit: 'startPage',
      dimensions,
      type: 'toolbar',
    };

  if (secWindow.getChildWindows().length > 0) {
    ipcRenderer.send('close-window-dock', null);
    setTimeout(() => {
      secWindow.getChildWindows()[0].close();
      customerSearch.focus();
    }, 500);
  } else {
    ipcRenderer.send('position', message);
  }
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

/* COPY NOTIFICATION */
let copyPop = document.getElementById('copy-popup'),
  copyPopYes = document.getElementById('copy-yes');
function notificationBubbleCopy() {
  /* READ IN THE LOCAL STORAGE OBJECT AND CHECK FLAG */
  let notObject = JSON.parse(localStorage.getItem('notifications'));
  if (notObject.copy) {
    soundPop.play();
    copyPop.show();
    copyPopYes.addEventListener('click', (e) => {
      soundPop.play();
      copyPop.close();
    });
  }
}

/* COPY CHECKBOX EVENTS */
copyCheckbox.addEventListener('change', (e) => {
  if (checkUpdateBtn.style.display === 'flex') {
    soundClick.play();
    if (e.target.checked) {
      notificationBubbleCopy();
      tickBox.style.border = '2px solid var(--main)';
      tickCheckMark.style.animation = 'check 0.2s linear forwards';
      setTimeout(() => {
        checkUpdateBtn.style.display = 'none';
        checkCopyBtn.style.display = 'flex';
      }, 200);
    }
  } else if (checkCopyBtn.style.display === 'flex') {
    soundClick.play();
    tickBox.style.border = '2px solid var(--sec-blue)';
    tickCheckMark.style.animation = 'none';
    setTimeout(() => {
      checkUpdateBtn.style.display = 'flex';
      checkCopyBtn.style.display = 'none';
    }, 200);
  }
});

/* COPY BUTTON EVENTS */
checkCopyBtn.addEventListener('click', (e) => {
  soundClick.play();
  tablePageCreate(false);
  progressFade.style.visibility = 'visible';
  progressFade.style.backdropFilter = 'blur(3px)';
  ipcRenderer.send('open-copySelection', 'open');
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

/* PAUSE BUTTON FLAG FUNCTION */
function checkLocalStorage() {
  let localStorageKeys = Object.keys(localStorage),
    storageArr = [];
  localStorageKeys.forEach((el) => {
    if (el !== 'notifications' && el !== 'failedEmail') {
      storageArr.push(el);
    }
  });

  if (storageArr.length > 0) {
    return true;
  } else {
    return false;
  }
}

/* CHANGE OPACITY AFTER LOAD */
secWindow.webContents.on('did-finish-load', () => {
  setTimeout(() => {
    checkCustomer.style.opacity = '1';
    if (checkLocalStorage()) {
      setTimeout(() => {
        viewPauseBtn.style.animation = 'pop 0.3s linear forwards 1';
        soundPop.play();
        viewPauseBtn.addEventListener('click', (e) => {
          clearList();
          soundClick.play();
          setTimeout(() => {
            showPausedItems();
          }, 300);
        });
      }, 1000);
    }
  }, 300);
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

let roundAllPop = document.getElementById('roundall-popup'),
  roundAllPopYes = document.getElementById('roundall-yes');

/* CALCULATE NOTIFICATION */
function notificationBubbleRoundall() {
  notObject = JSON.parse(localStorage.getItem('notifications'));
  if (notObject.roundall) {
    soundPop.play();
    roundAllPop.show();
    roundAllPopYes.addEventListener('click', (e) => {
      soundPop.play();
      roundAllPop.close();
    });
  }
}

/* ROUNDALL CHECKBOX EVENTS */
roundAllCheckbox.addEventListener('change', (e) => {
  soundClick.play();
  if (e.target.checked) {
    notificationBubbleRoundall();
    roundAllBox.style.border = '2px solid var(--main)';
    roundAllCheckMark.style.animation = 'check 0.2s linear forwards';
  } else {
    soundClick.play();
    roundAllBox.style.border = '2px solid var(--sec-blue)';
    roundAllCheckMark.style.animation = 'none';
  }
});

/* CALCULATE NOTIFICATION */
let calculateButtonPop = document.getElementById('calculatebutton-popup'),
  calculateButtonPopYes = document.getElementById('calculatebutton-yes'),
  calculateButtonPopNo = document.getElementById('calculatebutton-no');
function notificationBubbleCalculate() {
  notObject = JSON.parse(localStorage.getItem('notifications'));
  if (notObject.calculate) {
    soundPop.play();
    calculateButtonPop.show();
    calculateButtonPopYes.addEventListener('click', (e) => {
      soundPop.play();
      calculateButtonPop.close();
      calculateButtonPress();
    });
    calculateButtonPopNo.addEventListener('click', (e) => {
      soundPop.play();
      calculateButtonPop.close();
    });
  } else if (!notObject.calculate) {
    calculateButtonPress();
  }
}

function calculateButtonPress() {
  /* PRESS CCA BUTTON FUNCTION */
  CCAAutoSwitch();
  /* SHOW PERCENTAGE CALCULATOR*/
  setTimeout(() => {
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(3px)';
    if (secWindow.getSize()[0] >= 1280) {
      percentageContainer.style.transform = 'scale(1)';
    } else {
      percentageContainer.style.transform = 'scale(0.8)';
    }
  }, 300);
}

/* CALCULATE BUTTON */
calculateBtn.addEventListener('click', (e) => {
  notificationBubbleCalculate();
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
  roundAllBox.style.border = '2px solid var(--sec-blue)';
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

/* REMOVE FADE */
ipcRenderer.on('remove-fade', (e, message) => {
  if (message) {
    progressFade.style.visibility = 'hidden';
    progressFade.style.backdropFilter = 'none';
    /* ACTIVATE EVENTLISTENER FOR CUSTOMER NUMBER ENTRY */
    checkExistingCustomer();
    customerName.focus();
  } else {
    progressFade.style.visibility = 'hidden';
    progressFade.style.backdropFilter = 'none';
  }
});

/* RECEIVE THE DATABASE OBJECTS THAT WERE DOWNLOADED */
ipcRenderer.once('database-object', (e, message) => {
  customerPrices = message.customerPrices;
  customerPricelistNumber = message.customerPricelistNumber;
  customerNumberName = message.customerNumberName;
  customerNameNumber = message.customerNameNumber;
  customerBackUp = message.customerBackUp;
  exmillPrice = customerPrices['@EXMILL'];
  populateList();
});

/* COMMUNICATION FOR CUSTOMER DOCK */
ipcRenderer.on('dock-sec', (event, message) => {
  let child = secWindow.getChildWindows()[0];

  /* RESET CHECKBOX */
  copyCheckbox.checked = false;
  tickBox.style.border = '2px solid var(--sec-blue)';
  tickCheckMark.style.animation = 'none';

  /* FILL SEARCH BOX WITH CUSTOMER NUMBER */
  customerSearch.value = message;
  /* SET CUSTOMER NUMBER GLOBAL VARIABLE */
  searchValue = message;

  /* GET THE PRICELIST FROM HE DATABASE */
  jsonFile = customerPrices[message];

  child.blur();
  secWindow.focus();
  customerSearch.focus();
  if (Object.keys(customerPrices).includes(message)) {
    /* SEND THE NUMBER TO THE CUSTOMER SEARCH MAKE THE ITEM CLICKED AND SHOW UPDATE BUTTON */
    let item = document.getElementById(message);
    item.setAttribute('class', 'cusnum-clicked');
    checkUpdateBtn.style.display = 'flex';
    disabledBtn.style.display = 'none';
    checkContinueBtn.style.display = 'none';
    copyContainer.style.opacity = '1';
    /* KEYUP EVENT TO FORCE SORT ALGORITHM  */
    customerSearch.dispatchEvent(new Event('keyup'));
    /* DISPLAY THE ITEM AS CLICKED */
    item.style.display = 'block';
  } else {
    customerSearch.dispatchEvent(new Event('keyup'));
    customerSearch.dispatchEvent(new Event('keyup'));
  }
});

/* //// LOCAL oBJECTS //// */
/* customerPrices:         */
/* customerPricelistNumber */
/* customerNumberName      */
/* customerBackUp          */
/* /////////////////////// */

/* COMMUNICATION FOR PROGRESS WINDOW END */
ipcRenderer.on('progress-end', (event, message) => {
  /* SET SEARCH VALUE TO SEARCH CUSTOMER UPPERCASE */
  searchValue = customerSearch.value.toUpperCase();
  cusNum = customerNumberValue.value.toUpperCase();

  /* CREATE THE DATE OBJECT TO INSERT IN CUSTOMER BACKUPS */
  let dateJsonFile = {};
  if (jsonFile[0].length > 3) {
    if (customerBackUp[cusNum]) {
      dateJsonFile = jsonFile;
      customerBackUp[cusNum][dateString] = dateJsonFile;
    } else {
      dateJsonFile[dateString] = jsonFile;
      customerBackUp[cusNum] = dateJsonFile;
    }
  } else {
    dateJsonFile[dateString] = customerData[cusNum];
    customerBackUp[cusNum] = dateJsonFile;
  }

  /* UPDATE ALL THE DATA OBJECTS AND SEND TO GET WRITTEN LOCALLY  */
  customerPricelistNumber[cusNum] = customerPriceList.value;
  customerNumberName[cusNum] = customerName.innerText;
  customerPrices[cusNum] = customerData[cusNum];

  /* ADD BACK THE _id FOR ONLINE UPDATE */
  customerBackUp['_id'] = 'customerBackUp';
  customerPricelistNumber['_id'] = 'customerPricelistNumber';
  customerNumberName['_id'] = 'customerNumberName';
  customerPrices['_id'] = 'customerPrices';

  /* CREATE THE WRITE FILE OBJECT */
  let databaseObj = {
    customerBackUp,
    customerPrices,
    customerNumberName,
    customerPricelistNumber,
  };

  /* UPDATE DB */
  ipcRenderer.send('update-database', databaseObj);

  /* REMOVE ITEM FROM LOCALSTORAGE */
  localStorage.removeItem(cusNum);

  /* SEND MESSAGE WITH FILE PATHS TO MAIN TO OPEN EMAIL CHILDWINDOW */
  /* ADD CUSTOMER NUMBER FOE EASIER FILENAME DESCRIPTION */
  let newMessage = {
    name: customerName.innerText,
    number: cusNum,
    filePaths: message,
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

/* CONNECTION MONITORING */
window.addEventListener('offline', (e) => {
  new Notification('P2SYS OFFLINE', {
    icon: `${dir}/renderer/icons/error.png`,
    body: 'There is no available internet connection.',
    requireInteraction: true,
  });
  createBtn.setAttribute('class', 'create-btn-disabled');
  createBtn.disabled = true;
});

/* CHECK IF THERE IS AN INTERNET CONNECTION  */
setTimeout(() => {
  if (!window.navigator.onLine) {
    createBtn.setAttribute('class', 'create-btn-disabled');
    createBtn.disabled = true;
  }
}, 2000);

/* MESSAGE FROM DB ON LOSS OF CONNECTION */
ipcRenderer.on('reconnected', (e, message) => {
  createBtn.setAttribute('class', 'create-btn');
  createBtn.disabled = false;
});

/* ENTER NAME AND NUMBER FROM CUSTOMER DATABASE DURING COPY  */
ipcRenderer.on('form-contents', (e, message) => {
  cusNum;
  customerName.innerText = message.customerName;
  customerName.contentEditable = false;
  /* SAFETY TO MAKE SURE THERE ARE NO VALUES LESS THAN 6 DUE TO DATABASE ISSUES */
  if (message.customerNumber.length < 6) {
    cusNum = message.customerNumber.padEnd(6, ' ');
    customerNumberValue.value = cusNum;
    customerNumberValue.disabled = true;
    customerNumberName[customerName] = cusNum;
    customerPriceList.value = customerPricelistNumber[message.customerNumber];
    pricelistNumber = cusNum;
  } else {
    /* STANDARD ROUTE TO FILL ENTRIES */
    customerNumberValue.value = message.customerNumber;
    customerNumberValue.dispatchEvent(new Event('keyup'));
    customerNumberValue.disabled = true;
    customerPriceList.value = customerPricelistNumber[message.customerNumber];
    pricelistNumber = customerPricelistNumber[message.customerNumber];
  }
});
