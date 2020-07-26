// Import Modules and Objects
const { remote, ipcRenderer } = require('electron');
const { dataObjects, customerDatabase, customerNameNumber } = require('../../data/objects.js');

// Get The current window
let secWindow = remote.getCurrentWindow(),
  screenSize = remote.screen.getPrimaryDisplay().size;

// Global variables for usage on necessary code
let searchValue, target;

//////////////
/*FUNCTIONS*/
////////////

/* Fade In/Out dock windows for win32 platfoms only */
const fadeInOut = (childWindow) => {
  let count = childWindow.getOpacity(),
    timer;
  console.log(childWindow.getOpacity());
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

///////////////////
/* DOM ELEMENTS */
/////////////////

/* HTML table form */
let closebtn = document.getElementById('close-btn'),
  table = document.getElementById('inner-table'),
  tableColumns = document.getElementById('columns'),
  /* Customer search view */
  /////////////////////////
  checkCustomer = document.getElementById('check-customer'),
  customerSearch = document.getElementById('customer-search'),
  customerNumberList = document.getElementById('customer-list'),
  checkHiddenSubmit = document.getElementById('hidden-submit'),
  checkUpdateBtn = document.getElementById('check-update-btn'),
  checkCancelbtn = document.getElementById('check-cancel-btn'),
  disabledBtn = document.getElementById('disabled'),
  maxWindow = document.getElementsByClassName('max'),
  checkContinueBtn = document.getElementById('check-continue-btn'),
  customerNumberValue = document.getElementById('customer-number'),
  /* Customer find dock */
  ///////////////////////
  customerFindBtn = document.getElementById('assist-box');

////////////////////////////////
/* CUSTOMER NUMBER SELECTION */
///////////////////////////////

// Populate list with current customer numbers
let customerNumber = Object.keys(customerDatabase);
customerNumber.forEach((el) => {
  let html = `
  <dl class="cusnum" id="${el}">${el}</dl>
  `;
  customerNumberList.insertAdjacentHTML('beforeend', html);
});

///////////////////////////////////
/* HTML TABLE FORM CONSTRUCTORS */
/////////////////////////////////

// Create column headers from json template

let idx = Object.keys(dataObjects['template-pricelist']).slice(0, -2);
let htmlColumns = '';
dataObjects['template-pricelist']['columns'].forEach((el) => {
  htmlColumns += `<th id="${el}">${el}</th>`;
});
tableColumns.innerHTML = htmlColumns;

// Insert json template info into HTML table
let htmlInner = '';
idx.forEach((el) => {
  // Create regex pattern for correct row
  let row = dataObjects['template-pricelist'][el];
  let pattern, title;
  if (dataObjects['regex-patterns']['sequence']['odds-evens'].includes(el)) {
    pattern = dataObjects['regex-patterns']['odds-evens'];
    title = '(ODD|EVEN) LENGTHS (#.#)-(#.#)\n(#.#)-(#.#)';
  } else if (dataObjects['regex-patterns']['sequence']['excl-and'].includes(el)) {
    pattern = dataObjects['regex-patterns']['excl-and'];
    title = '(#.#)-(#.#) (EXCL|AND) (#.#) (#.#)\n(#.#)-(#.#) (EXCL|AND) (#.#)\n(#.#)-(#.#)';
  } else {
    pattern = dataObjects['regex-patterns']['standard'];
    title = '(#.#)-(#.#)';
  }
  htmlInner += `
    
    <tr id="R${el}" ">
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      
      <td>
      <form action="javascript:null;"><input pattern=${pattern} id="ER${el}"  title="${title}" class="table-entries" type="text" value="${row[2]}"/>
      <input type="submit" id="SER${el}" style="display:none;" />
      </form>
      </td>
      
      
      <td><input id="USER${el}" class="price-entries" type="number" placeholder="- - - - - - - - -"/></td>
      <td><input id="TSER${el}" class="price-entries" type="number" placeholder="- - - - - - - - -"/></td>
    
    </tr>  
    `;
});
table.innerHTML = htmlInner;

////////////////////////////////////////
/* DOM ELEMENTS AFTER GENERATED HTML */
//////////////////////////////////////

let numbers = Array.from(document.getElementsByClassName('cusnum')),
  tableEntryClass = Array.from(document.getElementsByClassName('table-entries')),
  priceEntryClass = Array.from(document.getElementsByClassName('price-entries'));

//////////////////////
/* EVENT LISTENERS */
////////////////////

////////////////////////////////
/* CUSTOMER NUMBER SELECTION */
//////////////////////////////

// Selection click event on customer list
numbers.forEach((el) => {
  el.addEventListener('click', (e) => {
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

    // Set/Activate updare button and remove disabled btn
    checkUpdateBtn.style.display = 'flex';
    checkContinueBtn.style.display = 'none';
    disabledBtn.style.display = 'none';
    searchValue = customerSearch.value.toUpperCase(); //TODO: Eventlistener for update btn
  });
});

/* Search box button events */
/////////////////////////////
checkContinueBtn.addEventListener('click', (e) => {
  checkCustomer.style.visibility = 'hidden';
  checkCustomer.style.opacity = '0';
  customerNumberValue.value = searchValue;

  // setTimeout(() => {}, 200); //TODO: fix this maximise window
});

closebtn.addEventListener('click', () => {
  secWindow.close();
  secWindow = null;
});
checkCancelbtn.addEventListener('click', () => {
  secWindow.close();
  secWindow = null;
});

//////////////////
/* SEARCH CODE */
////////////////
customerSearch.addEventListener('keyup', (e) => {
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

  /* Hide items not in search */
  /////////////////////////////
  numbers.forEach((el) => {
    // Check to see if element contains search item
    let hasMatch = el.innerText.includes(customerSearch.value.toUpperCase());
    el.style.display = hasMatch ? 'block' : 'none';

    // Count how many display non values in array
    let count = 0;

    numbers.forEach((el) => {
      if (window.getComputedStyle(el).display === 'none') {
        count += 1;
      }
      if (count === numbers.length) {
        if (
          // make sure continue btn is inactive and length of search is 6
          window.getComputedStyle(checkContinueBtn).display === 'none' &&
          customerSearch.value.length === 6
        ) {
          // Display the continue btn
          checkContinueBtn.style.display = 'flex';
          disabledBtn.style.display = 'none';
        } else if (
          // Or if the continue button is active and search length is less than 6
          window.getComputedStyle(checkContinueBtn).display === 'flex' &&
          customerSearch.value.length < 6
        ) {
          // Disable continue btn
          checkContinueBtn.style.display = 'none';
          disabledBtn.style.display = 'flex';
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

///////////////////////////
/* HTML TABLE FORM PAGE */
/////////////////////////

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

/////////////////////////
/* CUSTOMER FIND DOCK */
///////////////////////

customerFindBtn.addEventListener('click', (e) => {
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
      setTimeout(() => {
        ipcRenderer.send('set', 'set');
      });
    }
  }
});

/* WINDOW CONTROL ELEMENTS */
// Maximise window controls
maxWindow[0].addEventListener('click', (e) => {
  console.log(secWindow.getParentWindow());
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
});
