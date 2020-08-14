/* MODULES */
////////////
const { remote, ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
const dir = process.cwd();
/* CURRENT DIRECTORY */
const curDir = __dirname;

/* LOCAL MODULES */
const {
  dataObjects,
  customerPrices,
  customerPricelistNumber,
  customerNumberName,
  customerBackUp,
  writeLocalDatabase,
} = require(`${dir}/data/objects`);
const { tablePopulate } = require(`${curDir}/tablePopulate`);

/* CREATE DATE INSTANCE */
let mainDate = new Date();
let dateString = `${mainDate.getMonth() + 1}/${mainDate.getFullYear()}`;

/* REMOTE WINDOWS */
///////////////////
let secWindow = remote.getCurrentWindow();
window.secWindow = secWindow;

/* ///////////////////////////////// VARIABLE LEGEND ////////////////////////////// */
/* searchValue: Value entered into the search box (customer number)                 */
/* target: clicked object in the customer list in search box                        */
/* jsonFile: Locally stored layman pricelist                                        */
/* htmlContent: Html that gets generated in the table form from the jsonFile        */
/* 
/* //////////////////////////////////////////////////////////////////////////////// */

// GLOBAL VARIABLES FOR USAGE ON NECESSARY CODE
let searchValue, target, jsonFile, htmlContent, customerNumber, customerData;

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
  /* TABLE COMPONENT DOMS */
  /////////////////////////
  table = document.getElementById('table'),
  /* MAIN PAGE ELEMENTS */
  ///////////////////////
  html = document.getElementsByTagName('html')[0],
  /* TABLE COLUMNS DOM*/
  /////////////////////
  treatedColumns = document.getElementById('treated'),
  /* DB STATUS DOM*/
  //////////////////
  customerSearchDb = document.getElementById('db-customer-search'),
  customerSearchDbText = document.getElementById('db-customer-search-text'),
  tableDb = document.getElementById('db-table'),
  tableDbText = document.getElementById('db-table-text'),
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

/* FADE CUSTOMER DOCK ON WINDOWS */
const fadeInOut = (childWindow) => {
  let count = childWindow.getOpacity(),
    timer;
  if (childWindow.getOpacity() === 0) {
    if (count < 1) {
      timer = setInterval(() => {
        count += 0.1;
        childWindow.setOpacity(count);
        if (count >= 1) clearInterval(timer);
      }, 80);
    }
  } else if (childWindow.getOpacity() === 1) {
    if (count >= 1) {
      timer = setInterval(() => {
        count -= 0.1;
        childWindow.setOpacity(count);
        if (count <= 0) {
          clearInterval(timer);
          childWindow.close();
        }
      }, 50);
    }
  }
};

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
  /* GET THE TABLE BODY ELEMENT THAT WAS GENERATED WHEN FILLING HTML */
  let tableBody = document.getElementById('table-body');
  /* CHANGE WINDOW SIZE */
  secWindow.unmaximize();
  secWindow.setMinimumSize(400, 650);
  secWindow.setSize(400, 650);
  secWindow.center();

  /* HIDE THE WINDOW AND RESET ALL VALUES TO NULL */
  // BASICALLY REVERSE THE FILL HTML FUNCTION
  hider.style.display = 'none';
  customerNumberValue.value = null;
  customerName.innerText = null;
  customerName.contentEditable = true;
  ccaPrice.value = null;
  clientEmail.value = null;
  clientPhone.value = null;
  customerPriceList.value = null;
  customerPriceList.disabled = false;
  html.style.backgroundColor = 'transparent';
  tableBody.parentNode.removeChild(tableBody);

  /* RESET THE CCA BUTTONS BACK TO STANDARD */
  btnReset();

  /* SHOW THE SEARCH BOX AGAIN */
  checkCustomer.style.visibility = 'visible';
  checkCustomer.style.opacity = '1';
  /* CLEAR INPUT */
  customerSearch.value = null;

  /* GIVE ENOUGH DELAY TO REFOCUS THE SEARCH BOX AND ADD KEY UP TO RESET SEARCH VALUE */
  setTimeout(() => {
    customerSearch.focus();
    customerSearch.dispatchEvent(new Event('keyup'));
    checkUpdateBtn.style.display = 'none';
    checkContinueBtn.style.display = 'none';
    checkResumeEditingBtn.style.display = 'none';

    disabled.style.display = 'flex';
  }, 250);
};

////////////////////////////////////
/* HTML TABLE FORM PAGE FUNCTION */
//////////////////////////////////

/* INNER TABLE HTM FUNCTION */
const htmlInnerFill = (html) => {
  let innerTableColumns = html.htmlColumns,
    innerTable = html.htmlInner;

  table.insertAdjacentHTML(
    'beforeend',
    `<tbody id="table-body" ><tr id="row-columns">${innerTableColumns}</tr>${innerTable}</tbody>`
  );

  let tableEntryClass = Array.from(document.getElementsByClassName('table-entries'));

  tableEntryClass.forEach((el) => {
    el.addEventListener('focusout', () => {
      let submit = document.getElementById(`S${el.id}`);
      submit.click();
    });
    el.addEventListener('keyup', (e) => {
      el.value = el.value.toUpperCase();
    });
  });
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
  /* RESET THE TABLE FORM TO ZERO DATA */
  resetForm();
});

/* CREATE BUTTON */
createBtn.addEventListener('click', (e) => {
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
      type: 'error',
      icon: `${dir}/renderer/icons/trayTemplate.png`,
      buttons: ['OK'],
      message: 'MISSING VALUES:',
      detail: 'Please complete the highlighted areas.',
    });
  } else if (!customerName.innerText) {
    remote.dialog.showMessageBox(secWindow, {
      type: 'error',
      icon: `${dir}/renderer/icons/trayTemplate.png`,
      buttons: ['OK'],
      message: 'CUSTOMER NAME REQUIRED:',
      detail: 'The customer name is a required field.',
    });
  } else {
    /* CREATE THE CUSTOMER PRICELIST OBJECT TO SEND TO PYTHON */
    customerData = createObjectFromHtml();

    /* CREATE MESSAGE TO SEND TO IPC LISTENER */
    message = {
      emit: 'progress',
      html: `${dir}/renderer/progress/progress.html`,
      jsonObject: customerData,
      destination: 'child',
      relayChannel: 'convert-python',
    };

    /* FADE THE BACKGROUND AND MESSAGE FOR PROGRESS BAR */
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(1px) grayscale(1)';
    ipcRenderer.send('progress', message);
  }
});

/* PAUSE BUTTON TO SAVE TO LOCAL STORAGE */
pauseBtn.addEventListener('click', () => {
  /* CREATE THE STORAGE OBJECT */
  let localStorageJson = createObjectFromHtml();

  /* STRINGIFY FOR LOCALSTORAGE */
  localStorageJson = JSON.stringify(localStorageJson);
  /* SET ITEM */
  localStorage.setItem(searchValue, localStorageJson);
  backBtn.click();
});

/* SEND EMAIL BUTTON */
sendEmailbtn.addEventListener('click', (e) => {
  if (clientEmail.value) {
    window.location = `mailto:${clientEmail.value}`;
  } else {
    remote.dialog
      .showMessageBox(secWindow, {
        type: 'warning',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
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
    if (localStorage[el.innerText]) {
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
      if (localStorage[searchValue]) {
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
    if (localStorage[el]) {
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
populateList();

/* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
customerSearch.addEventListener('keyup', (e) => {
  // USE REGEX TO REMOVE ANY UNWANTED CHAR
  let pattern = /\w+|\s+/g;
  if (customerSearch.value) {
    let match = customerSearch.value.match(pattern).join('');
    customerSearch.value = match;
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
          customerSearch.value.length === 6 &&
          !customerNumber.includes(customerSearch.value) &&
          !Object.keys(localStorage).includes(customerSearch.value)
        ) {
          // DISPLAY CONTINUE BUTTON
          jsonFile = dataObjects['template-pricelist'];
          checkContinueBtn.style.display = 'flex';
          disabledBtn.style.display = 'none';
          checkUpdateBtn.style.display = 'none';
          checkResumeEditingBtn.style.display = 'none';
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
        } else if (
          customerSearch.value.length === 6 &&
          Object.keys(localStorage).includes(customerSearch.value)
        ) {
          // SHOW RESUME BUTTON
          checkContinueBtn.style.display = 'none';
          disabledBtn.style.display = 'none';
          checkUpdateBtn.style.display = 'none';
          checkResumeEditingBtn.style.display = 'flex';
        }

        // DISPLAY TICK IF THE SEARCH  VALUE IS CORRECT PATTERN AND LENGTH 6
        customerNumberList.style.backgroundImage = "url('../icons/tick.png')";
        searchValue = customerSearch.value.toUpperCase();
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
  // POPULATE HTML TABLE
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(htmlContent);
  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';
  customerNumberValue.value = searchValue;
  customerPriceList.value = searchValue;
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
  }, 200);

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1200, 700);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1200, 700);
  }, 200);
});

/* UPDATE BUTTON */
checkUpdateBtn.addEventListener('click', (e) => {
  // POPULATE HTML TABLE
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(htmlContent);

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
    customerPriceList.value = searchValue;
    customerPriceList.disabled = true;
  }
  // ADD BACKGROUND TO HTML ELEMENT
  setTimeout(() => {
    html.style.backgroundColor = '#fff';
  }, 200);

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1200, 700);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1200, 700);
  }, 200);
});

/* RESUME BUTTON */
checkResumeEditingBtn.addEventListener('click', (e) => {
  let localPricelist = JSON.parse(localStorage[searchValue]),
    localStorageObject = JSON.parse(localStorage[searchValue]);
  // POPULATE HTML TABLE
  htmlContent = tablePopulate(localPricelist[searchValue]);
  htmlInnerFill(htmlContent);

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
  }, 200);

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1200, 700);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1200, 700);
  }, 200);
});

/* CANCEL BUTTON */
checkCancelbtn.addEventListener('click', () => {
  secWindow.close();
  secWindow = null;
});

/* CUSTOMER FIND DOCK BUTTON */

customerFindBtn.addEventListener('click', (e) => {
  // Get window posiiton to send to main process
  let dimensions = secWindow.getPosition(),
    message = {
      emit: 'startPage',
      dimensions,
      type: 'toolbar',
    };

  if (secWindow.getChildWindows().length > 0) {
    if (process.platform === 'win32') {
      fadeInOut(secWindow.getChildWindows()[0]);
      customerSearch.focus();
    } else {
      secWindow.getChildWindows()[0].close();
      customerSearch.focus();
    }
  } else {
    if (process.platform === 'win32') {
      ipcRenderer.send('position', message);
      fadeInOut(secWindow.getChildWindows()[0]);
    } else {
      ipcRenderer.send('position', message);
    }
  }
});

/////////////////////////////
/* WINDOW CONTROL ELEMENTS */
////////////////////////////
maxWindow[0].addEventListener('click', (e) => {
  if (secWindow.isMaximized()) {
    secWindow.unmaximize();
    setTimeout(() => {
      secWindow.center();
    }, 50);
  } else {
    secWindow.maximize();
  }
});

//////////////////
/*IPC LISTENERS*/
////////////////

/* COMMUNICATION FOR CUSTOMER DOCK */
ipcRenderer.on('dock-sec', (event, message) => {
  let child = secWindow.getChildWindows()[0];
  child.blur();
  secWindow.focus();
  customerSearch.focus();
  customerSearch.value = message;
  setTimeout(() => {
    customerSearch.dispatchEvent(new Event('keyup'));
  }, 200);

  if (document.getElementById(message)) {
    document.getElementById(message).click();
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
  /* CREATE THE DATE OBJECT TO INSERT IN CUSTOMER BACKUPS */
  let dateJsonFile = {};
  dateJsonFile[dateString] =
    jsonFile[0].length > 3 ? jsonFile : customerData[customerNumberValue.value];

  /* UPDATE ALL THE DATA OBJECTS AND SEND TO GET WRITTEN LOCALLY  */
  customerBackUp[customerNumberValue.value] = dateJsonFile;
  customerPricelistNumber[customerNumberValue.value] = customerPriceList.value;
  customerNumberName[customerNumberValue.value] = customerName.innerText;
  customerPrices[customerNumberValue.value] = customerData[customerNumberValue.value];

  /* ADD BACK THE _id FOR ONLINE UPDATE */
  customerBackUp['_id'] = 'customerBackUp';
  customerPricelistNumber['_id'] = 'customerPricelistNumber';
  customerNumberName['_id'] = 'customerNumberName';
  customerPrices['_id'] = 'customerPrices';

  /* CREATE THE WRITE FILE OBJECT */
  let writeFileObject = {
    customerBackUp,
    customerPrices,
    customerNumberName,
    customerPricelistNumber,
  };

  /* SEND TO THE WRITE OBJECT FUNCTION */
  writeLocalDatabase(writeFileObject);
  /* REPOPULATE CUSTOMER LIST */
  populateList();
  // HIDE THE PROGRESS BAR
  progressFade.style.visibility = 'hidden';
  progressFade.style.backdropFilter = 'none';
  // REMOVE ITEM FROM LOCAL STORAGE
  localStorage.removeItem(searchValue);
  // CLICK BACK BUTTON
  backBtn.click();
});

ipcRenderer.on('db-status', (e, message) => {
  /* DISABLE THE CREATE BUTTON */
  if (message === 4) {
    createBtn.disabled = true;
    createBtn.setAttribute('class', 'create-btn-disabled');
  } else {
    createBtn.disabled = false;
    createBtn.setAttribute('class', 'create-btn');
  }

  /* CONTROL DB STATUS LIGHT */
  if (message === 1) {
    /* CUSTOMER SEARCH DB STATUS */
    customerSearchDb.setAttribute('class', 'db-connected');
    customerSearchDbText.setAttribute('data-label', 'CONNECTED');

    /* TABLE DB STATUS */
    tableDb.setAttribute('class', 'db-connected');
    tableDbText.setAttribute('data-label', 'CONNECTED');
  } else if (message === 0) {
    /* CUSTOMER SEARCH DB STATUS */
    customerSearchDb.setAttribute('class', 'db-fail');
    customerSearchDbText.setAttribute('data-label', 'ERROR');

    /* TABLE DB STATUS */
    tableDb.setAttribute('class', 'db-fail');
    tableDbText.setAttribute('data-label', 'ERROR');
  } else if (message === 4) {
    /* CUSTOMER SEARCH DB STATUS */
    customerSearchDb.setAttribute('class', 'db-update');
    customerSearchDbText.setAttribute('data-label', 'UPDATING');

    /* TABLE DB STATUS */
    tableDb.setAttribute('class', 'db-update');
    tableDbText.setAttribute('data-label', 'UPDATING');
  }
});
