/* MODULES */
////////////

const { remote, ipcRenderer, shell } = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');
const {
  customerPricesModel,
  customerPricelistNumberModel,
  customerNameNumberModel,
  customerBackUpModel,
} = require('../../database/mongoDbConnect.js');
const {
  customerBackUp,
  customerNumberName,
  customerPricelistNumber,
  customerPrices,
} = require('../../data/objects.js');

/* GLOBAL VARIABLES */
/////////////////////
let homeWindow = remote.getCurrentWindow(),
  dbStateTimer,
  state = null;

////////////////
/* FUNCTIONS */
//////////////

function messageAlert(type, title, detail, buttons) {
  let selection = remote.dialog.showMessageBoxSync(homeWindow, {
    type,
    buttons,
    title,
    message: 'There was an database error:',
    detail,
  });
  if (selection === 1) {
    let issue = detail.match(/([A-Z]+)/g).map((el) => {
      if (el.length > 3) return el;
    });
    shell.openExternal(
      `mailto:price.to.sys@gmail.com?subject=DATABASE ERROR: ${issue.join(' ')}`
    );
  }
}

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  if (fs.existsSync('./data/logfiles/online-db-logfile.txt')) {
    fs.appendFile(
      './data/logfiles/online-db-logfile.txt',
      `${new Date()}: Database ${message}\n`,
      (err) => console.log(err)
    );
  } else {
    fs.writeFile(
      './data/logfiles/online-db-logfile.txt',
      `${new Date()}: Database ${message}\n`,
      (err) => console.log(err)
    );
  }
}

/* UPDATE ONLINE DATABASES */
////////////////////////////
async function updateDatabase() {
  let mes = 'There are inconsistencies in:\n\n# {DATA} #\n\nPlease contact the developer.',
    title = 'DATABASE ERROR',
    type = 'error',
    but = ['OK', 'EMAIL DEV'];

  /* CUSTOMER PRICES DATABASE */
  let customerPricesDB = await customerPricesModel.findById('customerPrices');
  delete customerPricesDB._doc['_id'];
  if (Object.keys(customerPrices).length >= Object.keys(customerPricesDB._doc).length) {
    customerPricesDB.replaceOne({ _id: 'customerPrices' }, customerPrices, (err, res) => {
      if (err) logfileFunc(`customerPricesDB - ${err}`);
    });
  } else {
    let alteredMes = mes.replace('{DATA}', 'CUSTOMER PRICELIST');
    messageAlert(type, title, alteredMes, but);
  }

  /* CUSTOMER NUMBER: PRICELIST NUMBER DATABASE  */
  let customerPricelistNumberDB = await customerPricelistNumberModel.findById(
    'customerPricelistNumber'
  );
  delete customerPricelistNumberDB._doc['_id'];
  if (
    Object.keys(customerPricelistNumber).length >=
    Object.keys(customerPricelistNumberDB._doc).length
  ) {
    customerPricelistNumberDB.replaceOne(
      { _id: 'customerPricelistNumber' },
      customerPricelistNumber,
      (err, res) => {
        if (err) logfileFunc(`customerPricelistNumberDB - ${err}`);
      }
    );
  } else {
    let alteredMes = mes.replace('{DATA}', 'CUSTOMER NUMBER: PRICELIST NUMBER');
    messageAlert(type, title, alteredMes, but);
  }

  /* CUSTOMER NAME: CUSTOMER NUMBER DATABASE */
  let customerNameNumberDB = await customerNameNumberModel.findById('customerNameNumber');
  delete customerNameNumberDB._doc['_id'];

  if (
    Object.keys(customerNumberName).length >= Object.keys(customerNameNumberDB._doc).length
  ) {
    customerNameNumberDB.replaceOne(
      { _id: 'customerNameNumber' },
      customerNumberName,
      (err, res) => {
        if (err) logfileFunc(`customerNameNumberDB - ${err}`);
      }
    );
  } else {
    let alteredMes = mes.replace('{DATA}', 'CUSTOMER NAME: CUSTOMER NUMBER');
    messageAlert(type, title, alteredMes, but);
  }

  /* CUSTOMER BACKUP DATABASE */
  let customerBackUpDB = await customerBackUpModel.findById('customerBackUp');
  delete customerBackUpDB._doc['_id'];
  if (Object.keys(customerBackUp).length >= Object.keys(customerBackUpDB._doc).length) {
    customerBackUpDB.replaceOne({ _id: 'customerBackUp' }, customerBackUp, (err, res) => {
      if (err) logfileFunc(`customerBackUpDB - ${err}`);
    });
  } else {
    let alteredMes = mes.replace('{DATA}', 'CUSTOMER BACKUP');
    messageAlert(type, title, alteredMes, but);
  }

  return true;
}

/* SYNC DATABASE FUNCTION */
///////////////////////////
const syncDb = async () => {
  databaseText.setAttribute('data-label', 'UPDATING');
  dbLight.setAttribute('class', 'db-update');
  let updated = await updateDatabase();
  if (updated) {
    dbLight.setAttribute('class', 'db-connected');
    state = db.readyState;
  }
};

//////////////////////////
/* DATABASE CONNECTION */
////////////////////////
function mongooseConnect() {
  mongoose
    .connect(
      'mongodb+srv://pricetosys:Juan@198103@cluster0.61lij.mongodb.net/acwhitcher?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    .catch((err) => {
      fs.existsSync('connection-logfile.txt')
        ? fs.appendFile(
            'connection-logfile.txt',
            `${new Date()} -> Connection failure: ${err}\n`,
            'utf8',
            () => console.log('Logfile write error')
          )
        : fs.writeFile(
            'connection-logfile.txt',
            `${new Date()} -> Connection failure: ${err}\n`,
            'utf8',
            () => console.log('Logfile write error')
          );
    });
}

/* CREATE CONNECTION */
mongooseConnect();

////////////////////
/* DB  LISTENERS */
//////////////////
const db = mongoose.connection;

/* DB CHECK INTERVAL */
//////////////////////
setInterval(() => {
  if (state === 1) {
    dbLight.setAttribute('class', 'db-connected');
    databaseText.setAttribute('data-label', 'CONNECTED');
    ipcRenderer.send('db-status', state);
  } else if (state === 0) {
    dbLight.setAttribute('class', 'db-fail');
    databaseText.setAttribute('data-label', 'ERROR');
    ipcRenderer.send('db-status', state);
  }
}, 1000);

db.once('connected', () => {
  state = null;
  syncDb();
});

/* CONNECTION ERROR */
db.on('error', () => {
  let notification = new Notification({
    title: 'AC WHITCHER DB ALERT',
    body: 'CONNECTION ERROR',
  });
  notification.show();
  /* RESTART DB ON INITIAL START CONNECTION */
  setTimeout(() => {
    mongooseConnect();
  }, 300000);
});

//////////////////
/* DOM ELEMENTS*/
////////////////

/* MAIN WINDOW */
////////////////
let startBtn = document.getElementById('start'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('about-btn'),
  backbtn = document.getElementById('back-btn'),
  mailbtn = document.getElementById('mail-btn'),
  dbLight = document.getElementById('db'),
  databaseText = document.getElementById('dbtext');

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* MAIN PAGE EVENTS */
/////////////////////

/* START BUTTON */
startBtn.addEventListener('click', (e) => {
  ipcRenderer.send('start', 'startPage');
});

/* EXIT BUTTON */
exitbtn.addEventListener('click', (e) => {
  clearInterval(dbStateTimer);
  homeWindow.close();
  homeWindow = null;
});

/* ABOUT PAGE EVENTS */
//////////////////////

/* ABOUT BUTTON */
aboutbtn.addEventListener('click', (e) => {
  document.querySelector('.about-screen').style.display = 'flex';
  document.querySelector('.about-screen').style.visibility = 'visible';
  document.querySelector('.about-screen').style.opacity = 1;
});
backbtn.addEventListener('click', (e) => {
  document.querySelector('.about-screen').style.visibility = 'hidden';
  document.querySelector('.about-screen').style.opacity = 0;
});
mailbtn.addEventListener('click', (e) => {
  shell.openExternal('mailto:price.to.sys@gmail.com?subject=P2Sys() Inquiry/ Bug report');
});

/* IPC LISTENERS */
//////////////////

/* SYNC DB*/
ipcRenderer.on('sync-db', (e, message) => {
  syncDb();
});
