/* MODULES */
////////////

const { remote, ipcRenderer, shell } = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* LOCAL MODULES */
const {
  customerPricesModel,
  customerPricelistNumberModel,
  customerNumberNameModel,
  customerBackUpModel,
} = require(`${dir}/database/mongoDbConnect.js`);
const {
  customerBackUp,
  customerNumberName,
  customerPricelistNumber,
  customerPrices,
} = require(`${dir}/data/objects.js`);

/* GLOBAL VARIABLES */
/////////////////////
let homeWindow = remote.getCurrentWindow(),
  dbStateTimer,
  state = null;

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
  let fileDir = `${dir}/data/logfiles/online-db-logfile.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Database ${message}\n`, (err) => console.log(err));
  } else {
    fs.writeFile(fileDir, `${new Date()}: Database ${message}\n`, (err) => console.log(err));
  }
}

/* UPDATE ONLINE DATABASES */
////////////////////////////
async function updateDatabase() {
  /* ADD THE _id BACK INTO THE DATABASES */
  customerBackUp['_id'] = 'customerBackUp';
  customerNumberName['_id'] = 'customerNumberName';
  customerPricelistNumber['_id'] = 'customerPricelistNumber';
  customerPrices['_id'] = 'customerPrices';

  let mes = 'There are inconsistencies in:\n\n# {DATA} #\n\nPlease contact the developer.',
    title = 'DATABASE ERROR',
    type = 'error',
    but = ['OK', 'EMAIL DEV'];

  try {
    /* CUSTOMER PRICES DATABASE */
    let customerPricesDB = await customerPricesModel.findById('customerPrices');

    if (Object.keys(customerPrices).length >= Object.keys(customerPricesDB._doc).length) {
      await customerPricesModel.replaceOne(customerPrices, (err, res) => {
        if (err) logfileFunc(`customerPricesDB - ${err}`);
      });
    } else {
      /* CREATE ALERT IF DATABASES ARE NOT CONSISTENT */
      let alteredMes = mes.replace('{DATA}', 'CUSTOMER PRICELIST');
      messageAlert(type, title, alteredMes, but);
    }
  } catch (err) {
    /* CREATE ALERT IF CONNECTION ERROR */
    logfileFunc(`customerPricesDB - ${err}`);
    messageAlert(type, 'DB UNREACHABLE', 'CUSTOMERPRICES DATABASE', but);
  }

  try {
    /* CUSTOMER NUMBER: PRICELIST NUMBER DATABASE  */
    let customerPricelistNumberDB = await customerPricelistNumberModel.findById(
      'customerPricelistNumber'
    );

    if (
      Object.keys(customerPricelistNumber).length >=
      Object.keys(customerPricelistNumberDB._doc).length
    ) {
      await customerPricelistNumberModel.replaceOne(customerPricelistNumber, (err, res) => {
        if (err) logfileFunc(`customerPricelistNumberDB - ${err}`);
      });
    } else {
      /* CREATE ALERT IF DATABASES ARE NOT CONSISTENT */
      let alteredMes = mes.replace('{DATA}', 'CUSTOMER NUMBER: PRICELIST NUMBER');
      messageAlert(type, title, alteredMes, but);
    }
  } catch (err) {
    /* CREATE ALERT IF CONNECTION ERROR */
    logfileFunc(`customerPricelistNumberDB - ${err}`);
    messageAlert(type, 'DB UNREACHABLE', 'CUSTOMERPRICELISTNUMBER DATABASE', but);
  }

  try {
    /* CUSTOMER NUMBER: CUSTOMER NAME DATABASE */
    let customerNumberNameDB = await customerNumberNameModel.findById('customerNumberName');

    if (
      Object.keys(customerNumberName).length >= Object.keys(customerNumberNameDB._doc).length
    ) {
      await customerNumberNameModel.replaceOne(customerNumberName, (err, res) => {
        if (err) logfileFunc(`customerNumberNameDB - ${err}`);
      });
    } else {
      /* CREATE ALERT IF DATABASES ARE NOT CONSISTENT */
      let alteredMes = mes.replace('{DATA}', 'CUSTOMER NAME: CUSTOMER NUMBER');
      messageAlert(type, title, alteredMes, but);
    }
  } catch (err) {
    /* CREATE ALERT IF CONNECTION ERROR */
    logfileFunc(`customerNumberNameDB - ${err}`);
    messageAlert(type, 'DB UNREACHABLE', 'CUSTOMERNUMBERNAME DATABASE', but);
  }

  try {
    /* CUSTOMER BACKUP DATABASE */
    let customerBackUpDB = await customerBackUpModel.findById('customerBackUp');

    if (Object.keys(customerBackUp).length >= Object.keys(customerBackUpDB._doc).length) {
      await customerBackUpModel.replaceOne(customerBackUp, (err, res) => {
        if (err) logfileFunc(`customerBackUpDB - ${err}`);
      });
    } else {
      /* CREATE ALERT IF DATABASES ARE NOT CONSISTENT */
      let alteredMes = mes.replace('{DATA}', 'CUSTOMER BACKUP');
      messageAlert(type, title, alteredMes, but);
    }
  } catch (err) {
    /* CREATE ALERT IF CONNECTION ERROR */
    logfileFunc(`customerBackUpDB - ${err}`);
    messageAlert(type, 'DB UNREACHABLE', 'CUSTOMERBACKUP DATABASE', but);
  }

  return true;
}

/* SYNC DATABASE FUNCTION */
///////////////////////////
async function syncDb() {
  if (db.readyState !== 0) {
    exitbtn.disabled = true;
    exitbtn.setAttribute('class', 'btn-disabled');
    state = 4;
    databaseText.setAttribute('data-label', 'UPDATING');
    dbLight.setAttribute('class', 'db-update');
    let updated = await updateDatabase();
    if (updated) {
      dbLight.setAttribute('class', 'db-connected');
      state = db.readyState;
      exitbtn.disabled = false;
      exitbtn.setAttribute('class', 'btn-exit');
    }
  }
}

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
      let fileDir = `${dir}/data/logfiles/connection-logfile.txt`;
      /* CHECK IF IT EXISTS */
      fs.existsSync(fileDir)
        ? fs.appendFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          )
        : fs.writeFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
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
  } else if (state === 4) {
    ipcRenderer.send('db-status', state);
  }
}, 1000);

db.once('connected', () => {
  state = null;
  syncDb();
});

/* CONNECTION ERROR */
db.on('error', () => {
  state = 0;
  new Notification('DATABASE CONNECTION ERROR', {
    body: 'Unable to connect to the database...',
  });
  setTimeout(() => {
    mongooseConnect();
  }, 300000);
});

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
