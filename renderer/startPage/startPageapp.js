/* MODULES */
////////////
const { remote, ipcRenderer } = require('electron');
const {
  dataObjects,
  customerPrices,
  customerPricelistNumber,
  customerNumberName,
  updateDataBase,
} = require('../../data/objects');
const { tablePopulate } = require('./tablePopulate');

/* REMOTE WINDOWS */
///////////////////
let secWindow = remote.getCurrentWindow();
window.secWindow = secWindow;
// GLOBAL VARIABLES FOR USAGE ON NECESSARY CODE
let searchValue, target, jsonFile, tableEntryClass, htmlContent;

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
  dbLight = document.getElementsByClassName('db-light'),
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
      document.getElementById(`USER${i}`).value,
      document.getElementById(`TSER${i}`).value,
    ];
  }

  jsonObject[customerNumberValue.value] = jsonObjectData;
  jsonObject[customerNumberValue.value]['PRICELIST'] = customerPriceList.value;
  jsonObject[customerNumberValue.value]['COLUMNS'] = columns.map((el) => el.innerText);
  jsonObject[customerNumberValue.value]['CCA'] = ccaPrice.value;
  jsonObject[customerNumberValue.value]['EMAIL'] = clientEmail.value;
  jsonObject[customerNumberValue.value]['TEL'] = clientPhone.value;
  return jsonObject;
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
    `<tbody id="table-body" >${innerTableColumns}${innerTable}</tbody>`
  );

  tableEntryClass = Array.from(document.getElementsByClassName('table-entries'));

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

/////////////////////////////////////////////////////
/* CCA BUTTON RESET ON BACK BUTTON PRESS FUNCTION */
///////////////////////////////////////////////////
const ccaBtnReset = () => {
  if (autoCaaBtn.classList.value === 'cca-auto-in') {
    autoCaaBtn.setAttribute('class', 'cca-auto-out');
    manCaaBtn.setAttribute('class', 'cca-man-in');
    autoCaaBtn.disabled = false;
    treatedColumns.style.backgroundColor = '#487613cc';
    console.log('Run');
  }
  console.log(autoCaaBtn.classList.value);
};

/////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX */
///////////////////////////////

/* POPULATE CUSTOMER NUMBER LIST IN SEARCH */
////////////////////////////////////////////
let customerNumber = Object.keys(customerPrices);
customerNumber.forEach((el) => {
  let html = `
  <dl class="cusnum" id="${el}">${el}</dl>
  `;
  customerNumberList.insertAdjacentHTML('beforeend', html);
});

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* HTML TABLE EVENTS */
//////////////////////

/* TO MAIN BUTTON */
backBtn.addEventListener('click', () => {
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
  tableBody.innerHTML = null;

  /* RESET THE CCA BUTTONS BACK TO STANDARD */
  ccaBtnReset();

  /* SHOW THE SEARCH BOX AGAIN */
  checkCustomer.style.visibility = 'visible';
  checkCustomer.style.opacity = '1';
  /* CLEAR INPUT */
  customerSearch.value = null;

  /* GIVE ENOUGH DELAY TO REFOCUS THE SEARCH BOX AND ADD KEY UP TO RESET SEARCH VALUE */
  setTimeout(() => {
    customerSearch.focus();
    customerSearch.dispatchEvent(new Event('keyup'));
  }, 500);
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
      type: 'warning',
      icon: './renderer/icons/trayTemplate.png',
      buttons: ['OK'],
      message: 'MISSING VALUES:',
      detail: 'Please complete the highlighted areas.',
    });
  } else {
    /* CREATE THE CUSTOMER PRICELIST OBJECT */
    let customerData = createObjectFromHtml();
    updateDataBase();

    /* CREATE MESSAGE TO SEND TO IPC LISTENER */
    message = {
      emit: 'progress',
      html: './renderer/progress/progress.html',
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
  let localStorageJson = createObjectFromHtml();
  delete localStorageJson[searchValue]['PRICELIST'];
  localStorageJson = JSON.stringify(localStorageJson);
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
        icon: './renderer/icons/trayTemplate.png',
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

/* AUTO CCA BUTTON */
autoCaaBtn.addEventListener('click', (e) => {
  // Check to see if there is an entry in the cca price and the button is out
  if (autoCaaBtn.classList.value === 'cca-auto-out' && ccaPrice.value) {
    autoCaaBtn.setAttribute('class', 'cca-auto-in');
    autoCaaBtn.disabled = true;
    treatedColumns.style.backgroundColor = '#d97a3acc';

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
    treatedColumns.style.backgroundColor = '#487613cc';

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

////////////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX EVENTS */
//////////////////////////////////////

/* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
let numbers = Array.from(document.getElementsByClassName('cusnum'));
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
    numbers.forEach((el) => {
      el.setAttribute('class', 'cusnum');
    });
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
    numbers.forEach((el) => {
      el.setAttribute('class', 'cusnum');
    });
    // SHOW THE DISABLED BUTTON AND HIDE OTHERS
    checkUpdateBtn.style.display = 'none';
    checkResumeEditingBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';
    target = null;
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
          !customerNumber.includes(customerSearch.value)
        ) {
          // DISPLAY CONTINUE BUTTON
          jsonFile = dataObjects['template-pricelist'];
          checkContinueBtn.style.display = 'flex';
          disabledBtn.style.display = 'none';
          checkUpdateBtn.style.display = 'none';
        } else if (
          // DISBLE THE CONTINUE BUTTON IF THE SEARCH VALUE IS LESS 6
          window.getComputedStyle(checkContinueBtn).display === 'flex' &&
          customerSearch.value.length < 6
        ) {
          // SHOW DISABLED BUTTON
          checkContinueBtn.style.display = 'none';
          disabledBtn.style.display = 'flex';
          checkUpdateBtn.style.display = 'none';
        }

        // DISPLAY TICK IF TEH SEARCH  VALUE IS CORRECT PATTERN AND LENGTH 6
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
  let localPricelist = JSON.parse(localStorage[searchValue]);
  // POPULATE HTML TABLE
  htmlContent = tablePopulate(localPricelist[searchValue]);
  htmlInnerFill(htmlContent);

  // HIDE SEARCH BOX
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';

  // FILL TABLE INFO
  customerNumberValue.value = searchValue;
  customerName.innerText = customerNumberName[searchValue];
  customerName.contentEditable = false;
  ccaPrice.value = localPricelist['CCA'];
  customerPriceList.value = customerPricelistNumber[searchValue];
  customerPriceList.disabled = true;
  clientEmail.value = localPricelist[searchValue]['EMAIL'];
  clientPhone.value = localPricelist[searchValue]['TEL'];

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

/* GLOBAL KEY REGISTRATION */
////////////////////////////
window.addEventListener('keydown', (event) => {
  if (
    customerSearch.value.length === 6 &&
    event.keyCode === 13 &&
    checkContinueBtn.style.display === 'flex'
  ) {
    checkContinueBtn.click();
  } else if (
    customerSearch.value.length === 6 &&
    event.keyCode === 13 &&
    checkUpdateBtn.style.display === 'flex'
  ) {
    checkUpdateBtn.click();
  }
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
  customerSearch.dispatchEvent(new Event('keyup'));

  if (document.getElementById(message)) {
    document.getElementById(message).click();
  }
}); /* TODO: COMPLETE BACK SEQUENCE AFTER PYTHON PROCESSED */

/* COMMUNICATION FOR PROGRESS WINDOW END */ ipcRenderer.on(
  'progress-end',
  (event, message) => {
    progressFade.style.visibility = 'hidden';
    progressFade.style.backdropFilter = 'none';
    backBtn.click();
  }
);

ipcRenderer.on('db-status', (e, message) => {
  if (message === 1) {
    /* CUSTOMER SEARCH DB STATUS */
    dbLight[0].classList[1]
      ? dbLight[0].classList.replace('db-fail', 'db-connected')
      : dbLight[0].classList.add('db-connected');

    /* TABLE DB STATUS */
    dbLight[1].classList[1]
      ? dbLight[1].classList.replace('db-fail', 'db-connected')
      : dbLight[1].classList.add('db-connected');
  } else if (message === 0) {
    /* CUSTOMER SEARCH DB STATUS */

    dbLight[0].classList[1]
      ? dbLight[0].classList.replace('db-connected', 'db-fail')
      : dbLight[0].classList.add('db-fail');

    /* TABLE DB STATUS */
    dbLight[1].classList[1]
      ? dbLight[1].classList.replace('db-connected', 'db-fail')
      : dbLight[1].classList.add('db-fail');
  }
});
