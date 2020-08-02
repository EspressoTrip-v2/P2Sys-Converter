// Import modules
const { remote, ipcRenderer } = require('electron');
const { customerNameNumber } = require('../../data/objects.js');

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
    let number = customerNameNumber[e.target.innerText],
      message = {
        channel: 'dock-sec',
        message: number,
        destination: 'sec',
      };
    // send ipc
    ipcRenderer.send('window-message', message);

    // Clear any existing highlighted number in case of reclick
    customerNameLists.forEach((el) => {
      el.setAttribute('class', 'customer-name');
    });

    // set the highlight on current clicked item
    el.setAttribute('class', 'customer-name-clicked');

    customerSearch.value = el.textContent;
    customerSearch.dispatchEvent(new Event('keyup'));
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
