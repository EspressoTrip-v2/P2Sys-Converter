// Import modules
const { remote, ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* LOCAL MODULES */
const { customerNameNumber } = require(`${dir}/data/objects.js`);

//////////////
/* GLOBALS */
////////////
// let customerNameListHTML;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container'),
  soundClick = document.getElementById('click');
/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

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
