/* MODULES */
////////////
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
  customerBackUp;

///////////////////
/* DOM ELEMENTS */
/////////////////

/* HTML TABLE DOM*/
//////////////////
let backBtn = document.getElementById('back-to-main-btn'),
  createBtn = document.getElementById('create-btn'),
  pauseBtn = document.getElementById('pause-btn'),
  customerName = document.getElementById('customer-name'),
  customerPriceList = document.getElementById('pricelist'),
  customerNumberValue = document.getElementById('customer-number'),
  ccaPrice = document.getElementById('cca-price'),
  infobtn = document.getElementById('info-btn'),
  customerContactMenu = document.getElementById('customer-contact-container'),
  sendEmailbtn = document.getElementById('email-now'),
  clientEmail = document.getElementById('client-email'),
  clientPhone = document.getElementById('client-phone'),
  manCaaBtn = document.getElementById('cca-man'),
  autoCaaBtn = document.getElementById('cca-auto'),
  lengthLockBtn = document.getElementById('lock'),
  lengthUnlockBtn = document.getElementById('unlock'),
  lockSvg = document.getElementById('lock-svg'),
  unlockSvg = document.getElementById('unlock-svg'),
  lengthColumn = document.getElementById('len'),
  soundClick = document.getElementById('click'),
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
  customerFindBtn = document.getElementById('assist-box'),
  hider = document.getElementById('hider'),
  checkResumeEditingBtn = document.getElementById('resume-editing-btn');

//////////////
/*FUNCTIONS*/
////////////

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
  let tableRows, columns, tableData, jsonObject;

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
      document.getElementById(`BR${i}`).innerText,
      document.getElementById(`DR${i}`).innerText,
      document.getElementById(`ER${i}`).value,
      parseInt(document.getElementById(`USER${i}`).value),
      parseInt(document.getElementById(`TSER${i}`).value),
    ];
  }

  jsonObject[customerNumberValue.value] = jsonObjectData;
  jsonObject[customerNumberValue.value]['COLUMNS'] = columns.map((el) => el.innerText);
  jsonObject[customerNumberValue.value]['CCA'] = parseInt(ccaPrice.value);
  jsonObject[customerNumberValue.value]['EMAIL'] = clientEmail.value;
  jsonObject[customerNumberValue.value]['TEL'] = clientPhone.value;
  jsonObject['PRICELIST'] = customerPriceList.value;
  jsonObject['HEADER'] = {
    customerName: customerName.innerText,
  };

  return jsonObject;
};

const resetForm = () => {
  html.style.cssText = 'transform:scale(0)';
  html.style.display == 'none';
  setTimeout(() => {
    /* RESTART SECWINDOW */
    ipcRenderer.send('restart-sec', 'startPage');
    secWindow.close();
  }, 300);
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

  //TODO: FINISH THE POPUP MENUS FOR THE BACKUP PRICES
  getBackupDateStrings(customernumber, cuMenu, ctMenu);
};

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
  soundClick.play();
  /* CHECK ALL VALUE ENTRIES AND WARN IF MISSING */
  let treatedMissingBool = [],
    untreatedMissingBool = [],
    untreatedColumnClass = Array.from(
      document.getElementsByClassName('price-entries-untreated')
    ),
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
      el.style.backgroundColor = '#ffe558';
      el.style.border = '1px solid #ffe558';
      el.style.color = 'black';
      el.placeholder = '';
    });
    untreatedMissingBool.forEach((el) => {
      el.style.backgroundColor = '#ffe558';
      el.style.border = '1px solid #ffe558';
      el.style.color = 'black';
      el.placeholder = '';
    });
    /* CREATE MESSAGE POPUP */
    remote.dialog.showMessageBox(secWindow, {
      type: 'warning',
      icon: `${dir}/renderer/icons/info.png`,
      buttons: ['OK'],
      message: 'MISSING VALUES:',
      detail: 'Please complete the highlighted areas.',
    });
  } else if (!customerName.innerText) {
    remote.dialog.showMessageBox(secWindow, {
      type: 'warning',
      icon: `${dir}/renderer/icons/info.png`,
      buttons: ['OK'],
      message: 'CUSTOMER NAME REQUIRED:',
      detail: 'The customer name is a required field.',
    });
  } else {
    /* CREATE THE CUSTOMER PRICELIST OBJECT TO SEND TO PYTHON */
    customerData = createObjectFromHtml();

    /* FADE THE BACKGROUND AND MESSAGE FOR PROGRESS BAR */
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(4px) grayscale(1)';
    ipcRenderer.send('progress', customerData);
  }
});

/* PAUSE BUTTON TO SAVE TO LOCAL STORAGE */
pauseBtn.addEventListener('click', () => {
  soundClick.play();

  /* CREATE THE STORAGE OBJECT */
  let localStorageJson = createObjectFromHtml(),
    searchValue = customerSearch.value.toUpperCase();

  /* STRINGIFY FOR LOCALSTORAGE */
  localStorageJson = JSON.stringify(localStorageJson);
  /* SET ITEM */
  localStorage.setItem(searchValue, localStorageJson);
  setTimeout(() => {
    resetForm();
  }, 200);
});

/* SEND EMAIL BUTTON */
sendEmailbtn.addEventListener('click', (e) => {
  soundClick.play();

  if (clientEmail.value) {
    window.location = `mailto:${clientEmail.value}`;
  } else {
    remote.dialog
      .showMessageBox(secWindow, {
        type: 'warning',
        icon: `${dir}/renderer/icons/info.png`,
        buttons: ['OK'],
        message: 'NO EMAIL ADDRESS ON FILE:',
        detail: 'Please enter an email address.',
      })
      .then((response) => {
        infobtn.click();
      });
  }
});
/* INFO BUTTON */
infobtn.addEventListener('click', (e) => {
  soundClick.play();

  if (window.getComputedStyle(customerContactMenu).visibility === 'hidden') {
    customerContactMenu.style.visibility = 'visible';
    customerContactMenu.style.transform = 'scaleY(1)';
  } else {
    customerContactMenu.style.transform = 'scaleY(0)';
    setTimeout(() => {
      customerContactMenu.style.visibility = 'hidden';
    }, 250);
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

/* LENGTH UNLOCK BUTTON */
lengthUnlockBtn.addEventListener('click', (e) => {
  soundClick.play();
  if (lengthUnlockBtn.classList.value === 'unlock-out') {
    lengthUnlockBtn.setAttribute('class', 'unlock-in');
    unlockSvg.style.fill = '#fff';
    lengthColumn.style.backgroundColor = 'var(--opaque-man)';

    lengthLockBtn.setAttribute('class', 'lock-out');
    lockSvg.style.fill = 'var(--button-gold)';

    /* DISABLE CELLS */
    for (let i = 0; i < 30; i++) {
      document.getElementById(`ER${i}`).disabled = false;
    }
  }
});

/* AUTO CCA BUTTON */
autoCaaBtn.addEventListener('click', (e) => {
  soundClick.play();

  // Check to see if there is an entry in the cca price and the button is out
  if (autoCaaBtn.classList.value === 'cca-auto-out' && ccaPrice.value) {
    autoCaaBtn.setAttribute('class', 'cca-auto-in');
    autoCaaBtn.disabled = true;
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
  } else {
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
});

/* MANUAL CCA BUTTON */
manCaaBtn.addEventListener('click', (e) => {
  soundClick.play();

  if (manCaaBtn.classList.value === 'cca-man-out') {
    // Set man button in
    manCaaBtn.setAttribute('class', 'cca-man-in');
    manCaaBtn.disabled = true;
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
});

/////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX */
///////////////////////////////

/* CUSTOMER NUMBER SEARCH BOX EVENTS */
//////////////////////////////////////

/* POPULATE CUSTOMER NUMBER LIST IN SEARCH */
////////////////////////////////////////////

/* CLEAR CURRENT LIST OF CLICKS FUNCTION */
function clearList() {
  numbers.forEach((el) => {
    if (localStorage.getItem(el.innerText)) {
      el.setAttribute('class', 'cusnum-resume');
    } else {
      el.setAttribute('class', 'cusnum');
    }
  });
}

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
      customerSearch.dispatchEvent(new Event('keyup'));

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
      }
    });
  });
}

/* POPLATE THE CUSTOMERLIST AND ADD CORRECT CLASSES */

function populateList() {
  customerNumberList.innerHTML = '';
  customerNumber = Object.keys(customerPrices);
  customerNumber.forEach((el) => {
    if (localStorage.getItem(el)) {
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
  addListListeners();
}

/* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
customerSearch.addEventListener('keyup', (e) => {
  // USE REGEX TO REMOVE ANY UNWANTED CHAR
  let pattern = /\w+|\s+/g;

  if (customerSearch.value) {
    let match = customerSearch.value.match(pattern).join('');
    pricelistNumber = match.toUpperCase().replace(' ', '');
    if (pricelistNumber.length < 6) {
      pricelistNumber = pricelistNumber.padEnd(6, ' ');
    } else if (pricelistNumber.length === 7) {
      pricelistNumber = pricelistNumber.slice(0, 6);
    }
  }

  // REHIDE THE UPDATE BUTTON AND RESUME IF SEARCH CHANGES
  if (target && customerSearch.value.length < 6) {
    // REMOVE ANY MOUSE CLICKED ITEMS
    clearList();
    // SHOW THE DISABLED BUTTON AND HIDE OTHERS
    checkUpdateBtn.style.display = 'none';
    checkResumeEditingBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';
    target = null;
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
          !customerNumber.includes(customerSearch.value)
        ) {
          if (localStorage.getItem(customerSearch.value.toUpperCase())) {
            // DISPLAY CONTINUE BUTTON
            checkContinueBtn.style.display = 'none';
            disabledBtn.style.display = 'none';
            checkUpdateBtn.style.display = 'none';
            checkResumeEditingBtn.style.display = 'flex';
            customerNumberList.style.backgroundImage = `url('${dir}/renderer/icons/inprogress.png')`;
          } else {
            // DISPLAY CONTINUE BUTTON
            jsonFile = dataObjects['template-pricelist'];
            checkContinueBtn.style.display = 'flex';
            disabledBtn.style.display = 'none';
            checkUpdateBtn.style.display = 'none';
            checkResumeEditingBtn.style.display = 'none';
          }
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
        } else if (!localStorage.getItem(customerSearch.value.toUpperCase())) {
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
      secWindow.setMinimumSize(1200, 700);
    }, 300);
    searchValue;
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1200, 700);
  }, 300);
});

/* UPDATE BUTTON */
checkUpdateBtn.addEventListener('click', (e) => {
  soundClick.play();

  /* SET SEARCH VALUE TO SEARCH CUSTOMER UPPERCASE */
  searchValue = customerSearch.value.toUpperCase();

  // POPULATE HTML TABLE
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(searchValue, htmlContent);

  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';

  // FILL TABLE INFO
  customerNumberValue.value = searchValue;
  customerName.innerText = customerNumberName[searchValue];
  customerName.contentEditable = false;
  ccaPrice.value = customerPrices[searchValue]['CCA'];
  clientEmail.value = customerPrices[searchValue]['EMAIL'];
  clientPhone.value = customerPrices[searchValue]['TEL'];

  if (customerPricelistNumber[searchValue]) {
    customerPriceList.value = customerPricelistNumber[searchValue];
    customerPriceList.disabled = true;
  } else {
    customerPriceList.value = pricelistNumber;
    customerPriceList.disabled = true;
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
      secWindow.setMinimumSize(1200, 700);
    }, 300);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1200, 700);
  }, 300);
});

/* RESUME BUTTON */
checkResumeEditingBtn.addEventListener('click', (e) => {
  soundClick.play();

  /* SET THE SEARCH VALUE TO CUSTOMER SEARCH VALUE UPPERCASE*/
  searchValue = customerSearch.value.toUpperCase();

  let localPricelist = JSON.parse(localStorage.getItem(searchValue));

  let localStorageObject = JSON.parse(localStorage.getItem(searchValue));
  // POPULATE HTML TABLE
  htmlContent = tablePopulate(localPricelist[searchValue]);
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
  clientEmail.value = localPricelist[searchValue]['EMAIL'];
  clientPhone.value = localPricelist[searchValue]['TEL'];
  ccaPrice.value = localPricelist[searchValue]['CCA'];

  // ADD BACKGROUND TO HTML ELEMENT
  setTimeout(() => {
    html.style.backgroundColor = '#fff';
  }, 300);

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1200, 700);
    }, 300);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1200, 700);
  }, 300);
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

/////////////////////////////
/* WINDOW CONTROL ELEMENTS */
////////////////////////////
maxWindow[0].addEventListener('click', (e) => {
  soundClick.play();

  if (secWindow.getSize()[0] === screenWidth) {
    secWindow.unmaximize();
    setTimeout(() => {
      secWindow.center();
    }, 50);
  } else {
    secWindow.maximize();
  }
});

/* CHANGE OPACITY AFTER LOAD */
secWindow.webContents.on('did-finish-load', () => {
  setTimeout(() => {
    checkCustomer.style.opacity = '1';
  }, 300);
});

//////////////////
/*IPC LISTENERS*/
////////////////

/* RECEIVE THE DATABASE OBJECTS THAT WERE DOWNLOADED */
ipcRenderer.once('database-object', (e, message) => {
  customerPrices = message.customerPrices;
  customerPricelistNumber = message.customerPricelistNumber;
  customerNumberName = message.customerNumberName;
  customerBackUp = message.customerBackUp;

  populateList();
});

/* COMMUNICATION FOR CUSTOMER DOCK */
ipcRenderer.on('dock-sec', (event, message) => {
  let child = secWindow.getChildWindows()[0];
  customerSearch.value = message;

  /* GET THE PRICELIST FROMT HE DATABASE */
  jsonFile = customerPrices[message];

  child.blur();
  secWindow.focus();
  customerSearch.focus();
  if (Object.keys(customerPrices).includes(message)) {
    /* SEND THE NUMBER TO THE SUCTOMER SEARCH MAKE THE ITEM CLICKED AND SHOW UPDATE BUTTON */
    let item = document.getElementById(message);
    item.setAttribute('class', 'cusnum-clicked');
    checkUpdateBtn.style.display = 'flex';
    disabledBtn.style.display = 'none';
    checkContinueBtn.style.display = 'none';
    customerSearch.dispatchEvent(new Event('keyup'));
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

  /* CREATE THE DATE OBJECT TO INSERT IN CUSTOMER BACKUPS */
  let dateJsonFile = {};
  dateJsonFile = {};
  if (jsonFile[0].length > 3) {
    if (customerBackUp[customerNumberValue.value]) {
      dateJsonFile = jsonFile;
      customerBackUp[customerNumberValue.value][dateString] = dateJsonFile;
    } else {
      dateJsonFile[dateString] = jsonFile;
      customerBackUp[customerNumberValue.value] = dateJsonFile;
    }
  } else {
    dateJsonFile[dateString] = customerData[customerNumberValue.value];
    customerBackUp[customerNumberValue.value] = dateJsonFile;
  }

  /* UPDATE ALL THE DATA OBJECTS AND SEND TO GET WRITTEN LOCALLY  */
  customerPricelistNumber[customerNumberValue.value] = customerPriceList.value;
  customerNumberName[customerNumberValue.value] = customerName.innerText;
  customerPrices[customerNumberValue.value] = customerData[customerNumberValue.value];

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

  /* UPDATE ONLINE DB */
  ipcRenderer.send('update-database', databaseObj);

  /* SEND MESSAGE WITH FILE PATHS TO MAIN TO OPEN EMAIL CHILDWINDOW */
  /* ADD CUSTOMER NUMBER FOE EASIER FILENAME DESCRIPTION */
  let newMessage = {
    name: customerName.innerText,
    number: pricelistNumber,
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
ipcRenderer.on('error', (e, message) => {
  resetForm();
});

/* CONNECTION MONITORING */
window.addEventListener('offline', (e) => {
  new Notification('P2SYS DATABASE CONNECTION ERROR', {
    icon: `${dir}/renderer/icons/error.png`,
    body: 'Unable to connect to the database.',
    requireInteraction: true,
  });
  createBtn.setAttribute('class', 'create-btn-disabled');
});

setTimeout(() => {
  if (!window.navigator.onLine) {
    new Notification('P2SYS DATABASE CONNECTION ERROR', {
      icon: `${dir}/renderer/icons/error.png`,
      body: 'Unable to connect to the database.',
      requireInteraction: true,
    });
    createBtn.setAttribute('class', 'create-btn-disabled');
  }
}, 2000);

/* MESSAGE FROM DB ON LOSS OF CONNECTION */
ipcRenderer.on('reconnected', (e, message) => {
  createBtn.setAttribute('class', 'create-btn');
});

/* RETURN MESSAGE AFTER DATABASE UPDATE TO CREATE EMAIL BOX*/
ipcRenderer.on('database-updated', (e, message) => {
  // REMOVE ITEM FROM LOCAL STORAGE
  localStorage.removeItem(searchValue);
});
