/* MODULES */
////////////

const { remote, ipcRenderer, shell } = require('electron');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

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
  databaseSetup,
} = require(`${dir}/data/objects.js`);
const { sendFailedMail } = require(`${dir}/renderer/email/failedMail.js`);

/* GLOBAL VARIABLES */
/////////////////////
let homeWindow = remote.getCurrentWindow(),
  stateInterval,
  restartInterval,
  sendStatus;

//////////////////
/* DOM ELEMENTS*/
////////////////

let startBtn = document.getElementById('start'),
  exitbtn = document.getElementById('exit-btn'),
  aboutbtn = document.getElementById('about-btn'),
  backbtn = document.getElementById('back-btn'),
  backBtnSettings = document.getElementById('back-btn-system'),
  emailSetupBtnSettings = document.getElementById('email-setup'),
  databaseSetupBtnSettings = document.getElementById('database-setup'),
  clearCachedEmailsBtnSettings = document.getElementById('clear-cached-emails'),
  clearPausedPricelistsBtnSettings = document.getElementById('clear-cached-pricelists'),
  forceDbUpdateBtnSettings = document.getElementById('db-update'),
  mailbtn = document.getElementById('mail-btn'),
  dbLight = document.getElementById('db'),
  databaseText = document.getElementById('dbtext'),
  systemSettingsBtn = document.getElementById('settings-button'),
  soundClick = document.getElementById('click');

//////////////////////////
/* DATABASE CONNECTION */
////////////////////////
function mongooseConnect() {
  mongoose
    .connect(
      `mongodb+srv://${databaseSetup['username']}:${databaseSetup['password']}@cluster0.61lij.mongodb.net/${databaseSetup['database']}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    .catch((err) => {
      let fileDir = `${dir}/data/logfiles/database-logfile.txt`;
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

/* ONCE DB CONNECTION IS UP SEND PREVIOUSLY FAILED EMAILS AND UPDATE DATABASE */
db.once('connected', () => {
  /* SEND PREVIOUSLY FAILED MAIL MESSAGES */
  if (localStorage['failedEmail']) {
    sendFailedMail();
  }
  /* UPDATE DB */
  syncDb();
});

/* CONNECTION ERROR */
db.on('error', (err) => {
  new Notification('DATABASE ERROR', {
    icon: `${dir}/renderer/icons/trayTemplate.png`,
    body: `The following error occurred on your database:\n${err.message} `,
    requireInteraction: true,
  });
  logfileFunc(err);
  restartDB();
  clearInterval(sendStatus);
  sendDbStatus('getStatus');

  /* CLEAR THE STATE INTERVAL SET DB STATUS TO ERROR */
  clearInterval(stateInterval);
  dbLight.setAttribute('class', 'db-fail');
  databaseText.setAttribute('data-label', 'ERROR');
});

db.on('connected', (e) => {
  clearInterval(restartInterval);
});

////////////////
/* FUNCTIONS */
//////////////
/* MESSAGE FUNCTION FOR DATABASE CONNECTION INCONSISTENCIES */
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
      `mailto:juanbo.jb@gmail.com?subject=DATABASE ERROR: ${issue.join(' ')}`
    );
  }
}

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${dir}/data/logfiles/database-update-logfile.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Database ${message}\n`, (err) => console.log(err));
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Database ${message}\n`, (err) =>
      console.log(err)
    );
  }
}

/* UPDATE ONLINE DATABASES */
////////////////////////////
async function updateDatabase() {
  /* GET LATEST LOCAL LIBRARIES FOR UPDATE */
  ///////////////////////////////////////////

  /* CUSTOMER DATABASE IS CUSTOMER NUMBER - PRICELIST NUMBER */
  let customerPricelistNumber = JSON.parse(
    fs.readFileSync(`${dir}/data/templates/customerPricelistNumber.json`)
  );

  /* CUSTOMER NUMBER NAME IS CUSTOMER NUMBER - CUSTOMER NAME */
  let customerNumberName = JSON.parse(
    fs.readFileSync(`${dir}/data/templates/customerNumberName.json`)
  );

  /* ALL ON FILE LAYMAN PRICELISTS */
  let customerPrices = JSON.parse(
    fs.readFileSync(`${dir}/data/templates/customerPrices.json`)
  );

  /* CUSTOMER PRICELIST BACKUP */
  let customerBackUp = JSON.parse(
    fs.readFileSync(`${dir}/data/templates/customerBackUp.json`)
  );

  let mes = 'There are inconsistencies in:\n\n# {DATA} #\n\nPlease contact the developer.',
    title = 'DATABASE ERROR',
    type = 'warning',
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

/* DB CHECK INTERVAL */
//////////////////////
function startInterval() {
  stateInterval = setInterval(() => {
    if (db.readyState === 1) {
      dbLight.setAttribute('class', 'db-connected');
      databaseText.setAttribute('data-label', 'CONNECTED');
      // ipcRenderer.send('db-status', db.readyState);
    } else if (db.readyState === 0) {
      dbLight.setAttribute('class', 'db-fail');
      databaseText.setAttribute('data-label', 'ERROR');
      // ipcRenderer.send('db-status', db.readyState);
    }
  }, 1000);
}

/* SEND STATUS TO SECWINDOW */
function sendDbStatus(status) {
  if (status === 'getStatus') {
    sendStatus = setInterval(() => {
      ipcRenderer.send('db-status', db.readyState);
    }, 1000);
  } else if (status === 4) {
    sendStatus = setInterval(() => {
      ipcRenderer.send('db-status', 4);
    }, 1000);
  } else {
    sendStatus = setInterval(() => {
      ipcRenderer.send('db-status', status);
    }, 1000);
  }
}

/* DB RESTART FUNCTION FOR FAILURE */
function restartDB() {
  if (db.readyState === 0) {
    restartInterval = setInterval(() => {
      mongooseConnect();
    }, 300000);
  }
}

/* SYNC DATABASE FUNCTION */
///////////////////////////
async function syncDb() {
  clearInterval(stateInterval);
  if (db.readyState !== 0) {
    exitbtn.disabled = true;
    exitbtn.setAttribute('class', 'btn-disabled');

    /* SEND THE UPDATE CODE */
    clearInterval(sendStatus);
    sendDbStatus(4);
    /* CHANGE THE DB STATUS DOM */
    databaseText.setAttribute('data-label', 'UPDATING');
    dbLight.setAttribute('class', 'db-update');

    /* WAIT FOR LOCAL UPDATES TO COMPLETE */
    let updated = await updateDatabase();

    if (updated) {
      dbLight.setAttribute('class', 'db-connected');
      state = db.readyState;
      exitbtn.disabled = false;
      exitbtn.setAttribute('class', 'btn-exit');
      /* RESTART THE STATUS INTERVAL TIMER */
      startInterval();
      clearInterval(sendStatus);

      sendDbStatus('getStatus');
    }
  } else if (state === 0) {
    /* SET EXIT BUTTON ENABLED IF NOT CONNECTION AVAILABLE */
    exitbtn.disabled = false;
    exitbtn.setAttribute('class', 'btn-exit');
  }
}

//////////////////////
/* EVENT LISTENERS */
////////////////////

/* ONLINE STATUS MONITORING */
window.addEventListener('online', (e) => {
  startInterval();
});

window.addEventListener('offline', (e) => {
  new Notification('DATABASE CONNECTION ERROR', {
    icon: `${dir}/renderer/icons/trayTemplate.png`,
    body: 'Internet connection failure. Unable to connect to database.',
    requireInteraction: true,
  });
  /* CLEAR THE STATE INTERVAL */
  clearInterval(stateInterval);
  /* SET DB STATUS TO ERROR */
  dbLight.setAttribute('class', 'db-fail');
  databaseText.setAttribute('data-label', 'ERROR');
  /* SEND TO OTHER WINDOWS IF AVAILABLE */
  clearInterval(sendStatus);

  sendDbStatus('getStatus');
});

/* MAIN PAGE EVENTS */
/////////////////////

/* START BUTTON */
startBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('start', 'startPage');
  }, 200);
});

/* EXIT BUTTON */
exitbtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    homeWindow.close();
    homeWindow = null;
  }, 200);
});

/* ABOUT PAGE EVENTS */
//////////////////////

/* ABOUT BUTTON */
aboutbtn.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.about-screen').style.display = 'flex';
  setTimeout(() => {
    document.querySelector('.about-screen').style.visibility = 'visible';
    document.querySelector('.about-screen').style.opacity = 1;
  }, 200);
});
backbtn.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.about-screen').style.visibility = 'hidden';
  document.querySelector('.about-screen').style.opacity = 0;
});
mailbtn.addEventListener('click', (e) => {
  soundClick.play();

  shell.openExternal('mailto:juanbo.jb@gmail.com?subject=P2Sys() Inquiry/ Bug report');
});

/* SYSTEM BUTTONS */
backBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.system-settings').style.visibility = 'hidden';
  document.querySelector('.system-settings').style.opacity = 0;
});

/* EMAIL SETUP BUTTON */
emailSetupBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  shell.openPath(`${dir}/data/appdata/email.json`);
});

/* DATABASE SETUP BUTTON */
databaseSetupBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  shell.openPath(`${dir}/data/appdata/database.json`);
});

/* CLEAR LOCALSTORAGE FILES */
clearCachedEmailsBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  /* CHECK TO SEE I THERE ARE EMAILS TO REMOVE */
  if (localStorage.getItem('failedEmail')) {
    localStorage.removeItem('failedEmail');
    if (!localStorage.getItem('failedEmail')) {
      new Notification('Emails Cleared', {
        icon: `${dir}/renderer/icons/mailDeleteTemplate.png`,
        body: 'All unsent emails removed',
        requireInteraction: true,
      });
    }
  } else {
    new Notification('Emails Cleared', {
      icon: `${dir}/renderer/icons/info.png`,
      body: 'No emails to remove',
      requireInteraction: true,
    });
  }
});

/* CLEAR PAUSED PRICELISTS FILES */
clearPausedPricelistsBtnSettings.addEventListener('click', (e) => {
  soundClick.play();

  /* CHECK TO SEE I THERE ARE EMAILS TO REMOVE */
  let localStorageKeys = Object.keys(localStorage),
    keys = '';

  if (localStorageKeys.includes('failedEmail')) {
    localStorageKeys.splice(localStorageKeys.indexOf('failedEmail'), 1);
    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
      keys += `${key}, `;
    });

    new Notification('Price-lists removed', {
      icon: `${dir}/renderer/icons/info.png`,
      body: `Price-lists for:\n${keys}Have been removed.`,
      requireInteraction: true,
    });
  } else {
    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
      keys += `${key}, `;
    });

    let message =
      keys.length > 0 ? `Price-lists for:\n${keys}Have been removed.` : 'No price-lists found';

    localStorage.clear();
    new Notification('Price-lists removed', {
      icon: `${dir}/renderer/icons/info.png`,
      body: message,
      requireInteraction: true,
    });
  }
});

/* FORCE DB UPDATE */
forceDbUpdateBtnSettings.addEventListener('click', (e) => {
  soundClick.play();
  if (db.readyState === 1) {
    /* CREATE NOTIFICATION */
    new Notification('DATABASE SYNCING', {
      icon: `${dir}/renderer/icons/trayTemplate.png`,
      body: 'Syncing all local files',
    });

    syncDb();
  }
});

/* SYSTEM SETTINGS PAGE EVENTS */
/////////////////////////////////
systemSettingsBtn.addEventListener('click', (e) => {
  soundClick.play();

  document.querySelector('.about-screen').style.visibility = 'hidden';
  document.querySelector('.about-screen').style.opacity = 0;

  document.querySelector('.system-settings').style.display = 'flex';
  setTimeout(() => {
    document.querySelector('.system-settings').style.visibility = 'visible';
    document.querySelector('.system-settings').style.opacity = 1;

    if (db.readyState === 0) {
      forceDbUpdateBtnSettings.disabled = true;
      forceDbUpdateBtnSettings.setAttribute('class', 'system-btn-disabled');
    } else {
      forceDbUpdateBtnSettings.disabled = false;
      forceDbUpdateBtnSettings.setAttribute('class', 'system-btn');
    }
  }, 200);
});

/* IPC LISTENERS */
//////////////////

/* SYNC DB MESSAGE FROM PROGRESS BAR AFTER CONVERSION*/
ipcRenderer.on('sync-db', (e, message) => {
  console.log('message sync');
  syncDb();
});
