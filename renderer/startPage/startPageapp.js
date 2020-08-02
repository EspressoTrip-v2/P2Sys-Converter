/* MODULES */
////////////
const { remote, ipcRenderer } = require('electron');
const {
  dataObjects,
  customerPrices,
  customerDatabase,
  customerNumberName,
} = require('../../data/objects');
const { tablePopulate } = require('./tablePopulate');

/* REMOTE WINDOWS */
///////////////////
let secWindow = remote.getCurrentWindow();
window.secWindow = secWindow;
// Global variables for usage on necessary code
let searchValue, target, jsonFile, tableEntryClass, priceEntryClass, htmlContent, remoteWindow;

///////////////////
/* DOM ELEMENTS */
/////////////////

/* HTML TABLE DOM*/
//////////////////
let closeBtn = document.getElementById('close-btn'),
  savebtn = document.getElementById('save-btn'),
  table = document.getElementById('table'),
  customerName = document.getElementById('customer-name'),
  customerPriceList = document.getElementById('pricelist'),
  ccaPrice = document.getElementById('cca-price'),
  infobtn = document.getElementById('info-btn'),
  customerContactMenu = document.getElementById('customer-contact-container'),
  sendEmailbtn = document.getElementById('email-now'),
  clientEmail = document.getElementById('client-email'),
  manCaaBtn = document.getElementById('cca-man'),
  autoCaaBtn = document.getElementById('cca-auto'),
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
  // customerNameEntry = document.getElementById('customer-name'),
  checkUpdateBtn = document.getElementById('check-update-btn'),
  checkCancelbtn = document.getElementById('check-cancel-btn'),
  disabledBtn = document.getElementById('disabled'),
  maxWindow = document.getElementsByClassName('max'),
  checkContinueBtn = document.getElementById('check-continue-btn'),
  customerNumberValue = document.getElementById('customer-number'),
  customerFindBtn = document.getElementById('assist-box'),
  hider = document.getElementById('hider'),
  pageBody = document.getElementById('page-body');

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

////////////////////////////////////
/* HTML TABLE FORM PAGE FUNCTION */
//////////////////////////////////

const htmlInnerFill = (html) => {
  let innerTableColumns = html.htmlColumns,
    innerTable = html.htmlInner;

  table.insertAdjacentHTML('beforeend', innerTableColumns + innerTable);

  tableEntryClass = Array.from(document.getElementsByClassName('table-entries'));
  priceEntryClass = Array.from(document.getElementsByClassName('price-entries'));
  // Set a hidden submit for non entry prices in treated untreated columns
  priceEntryClass.forEach((el) => {
    el.addEventListener('focusout', () => {
      if (el.value === '') {
        el.value = 0;
      }
    });
  });

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

/* BACK TO MAIN BUTTON */
closeBtn.addEventListener('click', () => {
  pageBody.style.display = 'none';
  secWindow.unmaximize();
  secWindow.reload();
  secWindow.setMinimumSize(400, 800);
  secWindow.setSize(400, 800);
  secWindow.center();
});

/* TODO: CHECK ENTRIES BEFORE SAVING */
/* SAVE BUTTON */

savebtn.addEventListener('click', (e) => {
  let treatedMissingBool = [],
    untreatedMissingBool = [],
    untreatedColumnClass = Array.from(
      document.getElementsByClassName('price-entries-untreated')
    ),
    treatedColumnClass = Array.from(document.getElementsByClassName('price-entries-treated'));

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

  if (treatedMissingBool.length > 0 || untreatedMissingBool.length > 0) {
    treatedMissingBool.forEach((el) => {
      el.style.backgroundColor = 'red';
      el.style.color = '#fff';
      el.placeholder = '';
    });
    untreatedMissingBool.forEach((el) => {
      el.style.backgroundColor = 'red';
      el.style.color = '#fff';
      el.placeholder = '';
    });
    remote.dialog.showErrorBox(
      'MISSING VALUES',
      'Please enter values in the highlighted fields'
    );
  } else {
    let message = {
      emit: 'progress',
      html: './renderer/progress/progress.html',
    };
    progressFade.style.visibility = 'visible';
    progressFade.style.backdropFilter = 'blur(1px) grayscale(1)';
    ipcRenderer.send('progress', message);
  }
});

/* SEND EMAIL BUTTON */
sendEmailbtn.addEventListener('click', (e) => {
  if (clientEmail.value) {
    window.location = `mailto:${clientEmail.value}`;
  } else {
    let message =
      'There is no client email to use.\nPlease enter one by clicking on the INFO button';
    remote.dialog.showMessageBox(secWindow, {
      title: 'EMAIL ERROR',
      type: 'warning',
      buttons: ['OK'],
      message: message,
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
/* MANUAL CCA BUTTON */
manCaaBtn.addEventListener('click', (e) => {
  if (manCaaBtn.classList.value === 'cca-man-out') {
    manCaaBtn.setAttribute('class', 'cca-man-in');
    manCaaBtn.disabled = true;
    treatedColumns.style.backgroundColor = '#487613cc';

    for (let i = 0; i < 30; i++) {
      document.getElementById(`TSER${i}`).disabled = false;
    }

    autoCaaBtn.setAttribute('class', 'cca-auto-out');
    autoCaaBtn.disabled = false;
  }
});
/* AUTO CCA BUTTON */
autoCaaBtn.addEventListener('click', (e) => {
  if (autoCaaBtn.classList.value === 'cca-auto-out') {
    autoCaaBtn.setAttribute('class', 'cca-auto-in');
    autoCaaBtn.disabled = true;
    treatedColumns.style.backgroundColor = '#d97a3acc';

    for (let i = 0; i < 30; i++) {
      document.getElementById(`TSER${i}`).disabled = true;
    }

    manCaaBtn.setAttribute('class', 'cca-man-out');
    manCaaBtn.disabled = false;
  }
});

////////////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX EVENTS */
//////////////////////////////////////

/* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
let numbers = Array.from(document.getElementsByClassName('cusnum'));
// click event on list
numbers.forEach((el) => {
  el.addEventListener('click', (e) => {
    // reset all buttons to default

    checkUpdateBtn.style.display = 'none';
    checkContinueBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';

    // Retrieve the element clicked and set to global for other elements
    target = e.target;
    // Clear any existing highlighted number in case of reclick
    numbers.forEach((el) => {
      el.setAttribute('class', 'cusnum');
    });
    // set clicked
    el.setAttribute('class', 'cusnum-clicked');
    customerSearch.value = el.textContent;
    customerSearch.dispatchEvent(new Event('keyup'));

    // Set/Activate update button and remove disabled btn
    jsonFile = customerPrices[customerSearch.value];
    checkUpdateBtn.style.display = 'flex';
    checkContinueBtn.style.display = 'none';
    disabledBtn.style.display = 'none';
    searchValue = customerSearch.value.toUpperCase();
  });
});

/* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
customerSearch.addEventListener('keyup', (e) => {
  // Clean out any unwanted values
  let pattern = /\w+|\s+/g;
  if (customerSearch.value) {
    let match = customerSearch.value.match(pattern).join('');
    customerSearch.value = match;
  }

  // Code to unhide/hide update btn
  if (target && customerSearch.value.length < 6) {
    // remove mouse click highlights
    numbers.forEach((el) => {
      el.setAttribute('class', 'cusnum');
    });
    // set update button disabled
    checkUpdateBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';
    target = null;
  }
  // sort code
  numbers.forEach((el) => {
    // Check to see if element contains search item
    let hasMatch = el.innerText.includes(customerSearch.value.toUpperCase());
    el.style.display = hasMatch ? 'block' : 'none';

    // Count how many display non values in array and display appropriate buttons
    let count = 0;

    numbers.forEach((el) => {
      if (window.getComputedStyle(el).display === 'none') {
        count += 1;
      }
      if (count === numbers.length) {
        if (
          // make sure continue btn is inactive and length of search is 6
          window.getComputedStyle(checkContinueBtn).display === 'none' &&
          customerSearch.value.length === 6 &&
          !customerNumber.includes(customerSearch.value)
        ) {
          // Display the continue btn
          jsonFile = dataObjects['template-pricelist'];
          checkContinueBtn.style.display = 'flex';
          disabledBtn.style.display = 'none';
          checkUpdateBtn.style.display = 'none';
        } else if (
          // Or if the continue button is active and search length is less than 6
          window.getComputedStyle(checkContinueBtn).display === 'flex' &&
          customerSearch.value.length < 6
        ) {
          // Disable continue btn
          checkContinueBtn.style.display = 'none';
          disabledBtn.style.display = 'flex';
          checkUpdateBtn.style.display = 'none';
        }

        // set search box background on accepted new number
        customerNumberList.style.backgroundImage = "url('../icons/tick.png')";
        searchValue = customerSearch.value.toUpperCase();
      } else {
        // Remove image if not accepted
        customerNumberList.style.backgroundImage = 'none';
      }
    });
  });
});

/* SEARCH BOX BUTTON EVENTS */
/////////////////////////////

/* CONTINUE BUTTON */
checkContinueBtn.addEventListener('click', (e) => {
  // populate html table
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(htmlContent);

  // hide search box
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';
  customerNumberValue.value = searchValue;
  customerPriceList.value = searchValue;
  customerPriceList.disabled = true;

  if (customerNumberName[searchValue]) {
    customerName.innerText = customerNumberName[searchValue];
    customerName.contentEditable = false;
  }

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1280, 600);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1280, 600);
  }, 200);
});

/* UPDATE BUTTON */
checkUpdateBtn.addEventListener('click', (e) => {
  // populate html table
  htmlContent = tablePopulate(jsonFile);
  htmlInnerFill(htmlContent);
  // hide search box
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';
  // Fill table info
  customerNumberValue.value = searchValue;
  customerName.innerText = customerNumberName[searchValue];
  customerName.contentEditable = false;
  ccaPrice.value = customerPrices[searchValue]['CCA'];
  ccaPrice.disabled = true;

  if (customerDatabase[searchValue]) {
    customerPriceList.value = customerDatabase[searchValue];
    customerPriceList.disabled = true;
  } else {
    customerPriceList.value = searchValue;
    customerPriceList.disabled = true;
  }

  if (customerDatabase[searchValue]) {
    customerPriceList.value = customerDatabase[searchValue];
    customerPriceList.disabled = true;
  }

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1280, 600);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1280, 600);
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
    closeBtn.click();
  }
);
