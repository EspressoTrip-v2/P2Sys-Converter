// Import modules
const { remote, ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

/* GLOBAL VARIABLES */
/////////////////////
let customerNameNumber;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container'),
  soundClick = document.getElementById('click'),
  border = document.getElementById('border');

/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

function populateCustomerNames() {
  let customers = Object.keys(customerNameNumber);

  (() => {
    customers.forEach((el) => {
      let html = `<div title="${
        customerNameNumber[el.toLocaleUpperCase()]
      }" class="customer-name">${el.toUpperCase()}</div>`;
      customerListContainer.insertAdjacentHTML('beforeend', html);
    });
  })();

  ////////////////////////////////////////
  /* DOM ELEMENTS AFTER GENERATED HTML */
  //////////////////////////////////////

  let customerNameLists = Array.from(document.getElementsByClassName('customer-name')),
    searchDock = document.getElementById('customer-search');

  //////////////////////
  /* EVENT LISTENERS */
  ////////////////////

  /* SEND CUSTOMER NUMBER TO SECWINDOW */
  customerNameLists.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      let number = customerNameNumber[e.target.innerText];
      // send ipc
      ipcRenderer.send('dock-sec', number);

      // Clear any existing highlighted number in case of reclick
      customerNameLists.forEach((el) => {
        el.setAttribute('class', 'customer-name');
      });

      // set the highlight on current clicked item
      el.setAttribute('class', 'customer-name-clicked');
    });
  });

  //////////////////
  /* SEARCH CODE */
  ////////////////

  searchDock.addEventListener('keyup', (e) => {
    searchDock.value = searchDock.value.toUpperCase();
    customerNameLists.forEach((el) => {
      let elMatch = el.innerText.includes(searchDock.value);
      el.style.display = elMatch ? 'block' : 'none';
    });
  });

  /* SHOW WINDOW ON LOAD */
  border.style.opacity = '1';
}

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

/* MESSAGE TO RETRACT WINDOW BEFORE CLOSE */
ipcRenderer.on('close-window-dock', (e, message) => {
  border.style.opacity = '0';
});

/* GET CUSTOMER OBJECT */
ipcRenderer.on('customer-name-number', (e, message) => {
  customerNameNumber = message;
  populateCustomerNames();
});
