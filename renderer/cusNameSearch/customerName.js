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

customerNameLists.forEach((el) => {
  el.addEventListener('click', (e) => {
    let number = customerNameNumber[e.target.innerText],
      messageObject = {
        message: number,
        source: 'sec',
      };
    // send ipc
    ipcRenderer.send('window-message', messageObject);

    // Clear any existing highlighted number in case of reclick
    customerNameLists.forEach((el) => {
      el.setAttribute('class', 'customer-name');
      // el.style.backgroundColor = '#fff';
      // el.style.color = 'black';
      // el.style.border = '3px solid #fff ';
    });

    // set the highlight on current clicked item
    el.setAttribute('class', 'customer-name-clicked');

    // el.style.backgroundColor = '#8eafdafb';
    // el.style.color = 'white';
    // el.style.border = '3px solid #3e6ba6ff ';
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
