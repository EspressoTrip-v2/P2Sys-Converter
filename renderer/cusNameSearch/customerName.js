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

//////////////
/* GLOBALS */
////////////
let customerNameListHTML;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container');

/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

// Insert spinning logo
addLoader(customerListContainer);

let customers = Object.keys(customerNameNumber),
  loaderDiv = document.getElementById('loader');

let counter = 0;
for (let i = 0; i < customers.length; i++) {
  if (customerNameListHTML) {
    customerNameListHTML += `<div class="customer-name">${customers[i].toUpperCase()}</div>`;
    counter++;
  } else {
    customerNameListHTML = `<div class="customer-name">${customers[i].toUpperCase()}</div>`;
    counter++;
  }
}
if (counter === customers.length) {
  removeLoader(loaderDiv);
  customerListContainer.insertAdjacentHTML('beforeend', customerNameListHTML);
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
    console.log(e.target);
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
