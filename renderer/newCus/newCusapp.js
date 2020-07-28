// Import Modules and Objects
const { remote, ipcRenderer } = require('electron');
const {
  dataObjects,
  customerPrices,
  customerDatabase,
  customerNumberName,
} = require('../../data/objects');
const { tablePopulate } = require('./tablePopulate');

// Get The current window
let secWindow = remote.getCurrentWindow();

// Global variables for usage on necessary code
let searchValue, target, jsonFile, tableEntryClass, priceEntryClass, htmlContent;

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
  ccaPrice = document.getElementById('cca-price');

/* CUSTOMER SEARCH DOM */
/////////////////////////
let checkCustomer = document.getElementById('check-customer'),
  customerSearch = document.getElementById('customer-search'),
  customerNumberList = document.getElementById('customer-list'),
  customerNameEntry = document.getElementById('customer-name'),
  // checkHiddenSubmit = document.getElementById('hidden-submit'),
  checkUpdateBtn = document.getElementById('check-update-btn'),
  checkCancelbtn = document.getElementById('check-cancel-btn'),
  disabledBtn = document.getElementById('disabled'),
  maxWindow = document.getElementsByClassName('max'),
  checkContinueBtn = document.getElementById('check-continue-btn'),
  customerNumberValue = document.getElementById('customer-number'),
  customerFindBtn = document.getElementById('assist-box'),
  hider = document.getElementById('hider');

//////////////
/*FUNCTIONS*/
////////////

/* Fade In/Out dock windows for win32 platfoms only */
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

//////////////////////
/* CUSTOMER NUMBER */
////////////////////

//* POPULATE CUSTOMER NUMBER LIST IN SEARCH */
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

////////////////////////
/* HTML TABLE EVENTS */
//////////////////////

closeBtn.addEventListener('click', () => {
  secWindow.setMinimumSize(400, 800);
  secWindow.unmaximize();
  secWindow.reload();
  secWindow.setSize(400, 800);
});

////////////////////////////////////
/* CUSTOMER NUMBER SEARCH EVENTS */
//////////////////////////////////

// Selection click event on customer list
let numbers = Array.from(document.getElementsByClassName('cusnum'));

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
      el.style.backgroundColor = '#fff';
      el.style.color = 'black';
      el.style.border = '3px solid #fff ';
    });
    // set the highlight on current clicked item
    el.style.backgroundColor = '#8eafdafb';
    el.style.color = 'white';
    el.style.border = '3px solid #3e6ba6ff ';
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

/* Search box button events */
/////////////////////////////
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
    customerName.contentEditable = true;
  }

  if (secWindow.getChildWindows().length > 0) {
    secWindow.getChildWindows()[0].close();
    setTimeout(() => {
      hider.style.display = 'flex';
      secWindow.maximize();
      secWindow.setMinimumSize(1000, 800);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1000, 800);
  }, 200);
});

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
      secWindow.setMinimumSize(1000, 800);
    }, 200);
  }
  setTimeout(() => {
    hider.style.display = 'flex';
    secWindow.maximize();
    secWindow.setMinimumSize(1000, 800);
  }, 200);
});

/* Global Enter keypress for search box */
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

checkCancelbtn.addEventListener('click', () => {
  secWindow.close();
  secWindow = null;
});

/* SEARCH ELIMINATION CODE */
customerSearch.addEventListener('keyup', (e) => {
  // Clean out any unwanted values
  let pattern = /\w+|\s+/g;
  let match = customerSearch.value.match(pattern).join('');
  customerSearch.value = match;

  // Code to set update btn
  if (target && customerSearch.value.length < 6) {
    // remove mouse click highlights
    numbers.forEach((el) => {
      el.style.backgroundColor = '#fff';
      el.style.color = 'black';
      el.style.border = '3px solid #fff ';
    });
    // set update button disabled
    checkUpdateBtn.style.display = 'none';
    disabledBtn.style.display = 'flex';
    target = null;
  }

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
}); //TODO: DOUBLE CHECK UNUSED CODE ///////////////////////

/////////////////////////
/* CUSTOMER FIND DOCK */ customerFindBtn.addEventListener('click', (e) => {
  // Get window posiiton to send to main process
  let dimensions = secWindow.getPosition(),
    message = {
      emit: 'newCus',
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
window.addEventListener('keydown', (e) => {
  if (e.keyCode === 37) {
    customerFindBtn.click();
  }
});

/////////////////////////////
/* WINDOW CONTROL ELEMENTS */
////////////////////////////
maxWindow[0].addEventListener('click', (e) => {
  if (secWindow.isMaximized()) {
    secWindow.unmaximize();
  } else {
    secWindow.maximize();
  }
});

//////////////////
/*IPC LISTENERS*/
////////////////
ipcRenderer.on('sec-main', (event, message) => {
  let child = secWindow.getChildWindows()[0];
  child.blur();
  secWindow.focus();
  customerSearch.focus();
  customerSearch.value = message;
  customerSearch.dispatchEvent(new Event('keyup'));

  if (document.getElementById(message)) {
    document.getElementById(message).click();
  }
});
