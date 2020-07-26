// Import modules
const { remote, ipcRenderer } = require('electron');
const { customerNameNumber } = require('../../data/objects.js');

// Get window
// let childWindow = remote.getChildWindows();
let childWindow = remote.getCurrentWindow();

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

ipcRenderer.on('child-main', (event, message) => {
  console.log(message);
});

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
// addLoader(customerListContainer);

let customers = Object.keys(customerNameNumber);

(async () => {
  customers.forEach((el) => {
    let html = `<div class="customer-name">${el.toUpperCase()}</div>`;
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

customerNameLists.forEach((el) => {
  el.addEventListener('click', (e) => {
    let number = customerNameNumber[e.target.innerText],
      messageObject = {
        message: number,
        source: 'sec',
      };

    ipcRenderer.send('window-message', messageObject);
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
