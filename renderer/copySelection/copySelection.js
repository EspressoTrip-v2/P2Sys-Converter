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
let customerNameNumber, customerPrices, customerName, customerNumber;

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
  buttonSelectOption = document.getElementById('select-start'),
  buttonSelectCancel = document.getElementById('select-back'),
  existingCheckBox = document.getElementById('existing-customer-select'),
  existingCheckMark = document.getElementById('existing-customer-tick-img'),
  existingCheckMarkBox = document.getElementById('existing-customer-tick'),
  newCheckBox = document.getElementById('new-select'),
  newCheckMark = document.getElementById('new-tick-img'),
  newCheckMarkBox = document.getElementById('new-tick');
/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

function populateCustomerNames() {
  let customers = Object.keys(customerNameNumber),
    customerPricesKeys = Object.keys(customerPrices);

  (() => {
    customers.forEach((el) => {
      if (!customerPricesKeys.includes(customerNameNumber[el])) {
        let html = `<div title="${
          customerNameNumber[el.toLocaleUpperCase()]
        }" class="customer-name">${el.toUpperCase()}</div>`;
        customerListContainer.insertAdjacentHTML('beforeend', html);
      }
    });
  })();

  /* EXISTING CHECKBOX SELECT FUNCTION */
  function existingCheck(target, origin) {
    if (target && origin) {
      soundClick.play();
      existingCheckMarkBox.style.border = '2px solid var(--main)';
      existingCheckMark.style.animation = 'check 0.2s linear forwards';
    } else if (!target && origin) {
      soundClick.play();
      existingCheckMarkBox.style.border = '2px solid var(--sec-blue)';
      existingCheckMark.style.animation = 'none';
    } else if (!target && !origin && newCheckBox.checked) {
      existingCheckMarkBox.style.border = '2px solid var(--sec-blue)';
      existingCheckMark.style.animation = 'none';
      existingCheckBox.checked = false;
    } else if (!target && !origin && !newCheckBox.checked) {
      existingCheckMarkBox.style.border = '2px solid var(--main)';
      existingCheckMark.style.animation = 'check 0.2s linear forwards';
      existingCheckBox.checked = true;
    }
  }
  /* NEW CHECKBOX SELECT FUNCTION */
  function newCheck(target, origin) {
    if (target && origin) {
      soundClick.play();
      newCheckMarkBox.style.border = '2px solid var(--main)';
      newCheckMark.style.animation = 'check 0.2s linear forwards';
    } else if (!target && origin) {
      soundClick.play();
      newCheckMarkBox.style.border = '2px solid var(--sec-blue)';
      newCheckMark.style.animation = 'none';
    } else if (!target && !origin && newCheckBox.checked) {
      newCheckMarkBox.style.border = '2px solid var(--sec-blue)';
      newCheckMark.style.animation = 'none';
      newCheckBox.checked = false;
    } else if (!target && !origin && !newCheckBox.checked) {
      newCheckMarkBox.style.border = '2px solid var(--main)';
      newCheckMark.style.animation = 'check 0.2s linear forwards';
      newCheckBox.checked = true;
    }
  }

  ////////////////////////////////////////
  /* DOM ELEMENTS AFTER GENERATED HTML */
  //////////////////////////////////////

  let customerNameLists = Array.from(document.getElementsByClassName('customer-name')),
    searchDock = document.getElementById('customer-search');

  //////////////////////
  /* EVENT LISTENERS */
  ////////////////////

  customerNameLists.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      buttonDisabledSearch.style.display = 'none';
      buttonDisabledSearch.style.display = 'flex';
      /* ASSIGN NUMBERS AND NAME */
      customerNumber = customerNameNumber[e.target.innerText];
      customerName = e.target.innerText;

      // CLEAR ANY EXISTING HIGHLIGHTED NUMBER IN CASE OF RECLICK
      customerNameLists.forEach((el) => {
        el.setAttribute('class', 'customer-name');
      });

      // SET THE HIGHLIGHT ON CURRENT CLICKED ITEM
      el.setAttribute('class', 'customer-name-clicked');

      if (window.getComputedStyle(buttonDisabledSearch).display === 'flex') {
        buttonDisabledSearch.style.display = 'none';
        buttonSelectSearch.style.display = 'flex';
      }
    });
  });

  /* SELECT BUTTON SEARCH */
  buttonSelectSearch.addEventListener('click', (e) => {
    soundClick.play();
    setTimeout(() => {
      border.style.opacity = '0';
      /* SEND CUSTOMER NUMBER AND NAME TO SECWINDOW */
      setTimeout(() => {
        ipcRenderer.send('form-contents', { customerName, customerNumber });
        /* ADD FALSE MESSAGE SO IT DOES NOT START EVENT LISTENER FOR CUSTOMER NUMBER BOX */
        ipcRenderer.send('remove-fade', false);
        copySelectionWindow.close();
      }, 500);
    }, 300);
  });

  /* BACK BUTTON SEARCH */
  buttonBackSearch.addEventListener('click', (e) => {
    soundClick.play();
    setTimeout(() => {
      border.style.opacity = '0';
      setTimeout(() => {
        userAsk.style.transform = 'scale(1)';
      }, 600);
    }, 300);
  });

  /* CHECKBOXES */
  newCheckBox.addEventListener('change', (e) => {
    newCheck(e.target.checked, true);
    existingCheck(false, false);
  });

  existingCheckBox.addEventListener('change', (e) => {
    existingCheck(e.target.checked, true);
    newCheck(false, false);
  });

  /* SELECT BUTTON SELECTION BOX */
  buttonSelectOption.addEventListener('click', (e) => {
    soundClick.play();
    /* CHECK WHICH BOX IS SELECTED AND ACT APPROPRIATELY */
    if (newCheckBox.checked) {
      setTimeout(() => {
        userAsk.style.transform = 'scale(0)';
        setTimeout(() => {
          /* REMOVE SECWINDOW FADE AND CLOSE WINDOW AFTER SCALE */
          /* MESSAGE TRUE TO START CUSTOMER NUMBER AND CUSTOMER NAME EVENTLISTENERS */
          ipcRenderer.send('remove-fade', true);
          copySelectionWindow.close();
        }, 300);
      }, 300);
    } else if (existingCheckBox.checked) {
      setTimeout(() => {
        userAsk.style.transform = 'scale(0)';
        setTimeout(() => {
          border.style.opacity = '1';
          searchDock.focus();
        }, 400);
      }, 300);
    }
  });

  /* CANCEL BUTTON SELECTION BOX */
  buttonSelectCancel.addEventListener('click', () => {
    soundClick.play();
    setTimeout(() => {
      userAsk.style.transform = 'scale(0)';
      setTimeout(() => {
        ipcRenderer.send('reset-form', null);
      }, 400);
    }, 300);
  });

  //////////////////
  /* SEARCH CODE */
  ////////////////

  searchDock.addEventListener('keyup', (e) => {
    let pattern = /[\s\W]+/g,
      temp,
      text;
    searchDock.value = searchDock.value.toUpperCase();
    temp = searchDock.value.replace(pattern, '');
    customerNameLists.forEach((el) => {
      text = el.innerText.replace(pattern, '');
      let elMatch = text.includes(temp);
      if (elMatch) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
  });

  /* SET NEW CHECKBOX ON LOAD */
  newCheck(false, false);
  setTimeout(() => {
    /* SHOW WINDOW ON LOAD */
    userAsk.style.transform = 'scale(1)';
  }, 300);
}

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

/* GET CUSTOMER OBJECT */
ipcRenderer.on('copy-selection', (e, message) => {
  customerNameNumber = message.customerNameNumber;
  customerPrices = message.customerPrices;
  populateCustomerNames();
});
