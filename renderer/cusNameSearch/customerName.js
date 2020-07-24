// Import modules
const { remote } = require('electron');
const { customerNameNumber } = require('../../data/objects.js');

// Get window
let childWindow = remote.getCurrentWindow();

////////////////
/* FUNCTIONS */
//////////////

function addLoader(parent) {
  let html = `
    <div id="loader">
    <img  src="../icons/loader.png"/>
    </div>
    `;
  parent.insertAdjacentHTML('beforeend', html);
}

function removeLoader(parent) {
  setTimeout(() => {
    parent.remove();
  }, 5000);
}

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container');

// Insert spinning logo
addLoader(customerListContainer);
/* POPULATE LIST OF CUSTOMERS */
let customers = Object.keys(customerNameNumber),
  loaderDiv = document.getElementById('loader');

for (let i = 0; i < customers.length; i++) {
  let html = `<div class="customer-name">${customers[i]}</div>`;
  customerListContainer.insertAdjacentHTML('beforeend', html);
  removeLoader(loaderDiv);
}
