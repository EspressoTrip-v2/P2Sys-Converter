/* MODULES */
const nodemailer = require('nodemailer');
const { shell, ipcRenderer, remote } = require('electron');
const fs = require('fs');
/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* LOCAL MODULES */
const { emailSetup } = require(`${dir}/data/objects.js`);

/* GET WINDOW */
let emailWindow = remote.getCurrentWindow();

//////////////////
/* DOM ELEMENTS */
//////////////////

let emailRecipients = document.getElementById('email-entry'),
  emailMessageArea = document.getElementById('email-message'),
  excel = document.getElementsByClassName('excel')[0],
  sendBtn = document.getElementById('send'),
  borderBox = document.getElementById('border'),
  letterContainer = document.getElementById('sent-letter-container'),
  letterCheckbox = document.getElementById('check-container'),
  sentNotification = document.getElementById('sent-audio'),
  sentLetter = document.getElementById('sent-letter');

/* CREATE EMAIL TEXT FOR MESSAGE AND INITIAL ADDRESSES */
emailRecipients.value = emailSetup['email']['to'];

/* GLOBAL VARIABLES */
let customerNumber, filePaths, fileNameB, fileNameA, html, dialogReply, failedMessageobj;

///////////////
/* FUNCTIONS */
///////////////

/* LOCAL STORAGE APPEND FUNCTION INCASE FAILED EMAIL ALREADY EXISTS */
function localStorageAppend(obj) {
  let localFile;
  if (localStorage.getItem('failedEmail')) {
    localFile = JSON.parse(localStorage.getItem('failedEmail'));
    localFile.push(obj);
    localStorage.setItem('failedEmail', JSON.stringify(localFile));
  } else {
    localFile = [];
    localFile.push(obj);
    localStorage.setItem('failedEmail', JSON.stringify(localFile));
  }
}

/* FUNCTION TO GENERATE THE MESSAGE TEST FOR EMAIL MESSAGE*/
function getText(message) {
  /* SPLIT MESSAGE INTO USABLE PARTS */
  customerName = message.name;
  customerNumber = message.number;
  filePaths = message.filePaths;

  if (filePaths[0].includes('S5')) {
    /* DISPLAY FILE NAMES */
    fileNameA = `S5_${customerNumber}.xlsx`;
    fileNameB = `${customerNumber}_system.xlsx`;
  } else {
    fileNameB = `S5_${customerNumber}.xlsx`;
    fileNameA = `${customerNumber}_system.xlsx`;
  }

  /* CREATE THE TRANSPORT MESSAGE */
  /* TEXT OF MESSAGE */
  let textInitial = emailSetup['email']['text'].replace('{NAME}', customerName),
    text = textInitial.replace('{NUMBER}', customerNumber);
  /* INSERT THE MESSAGE IN THE TEXT AREA */
  emailMessageArea.value = text;

  return text;
}

/* FUNCTION TO CREATE MESSAGE OBJECT TO SEND AS EMAIL */
function getMessage(text) {
  let transportMessage = {
    to: emailRecipients.value,
    subject: `Emailing ${customerNumber}`,
    replyTo: emailSetup['email']['replyTo'],
    text,
    attachments: [{ path: filePaths[0] }, { path: filePaths[1] }],
  };

  return transportMessage;
}

//////////////////////////////
/* EMAIL TRANSPORT FUNCTION */
//////////////////////////////

/* CREATE NODEMAILER TRANSPORTER */
let mailTransport = nodemailer.createTransport(emailSetup['smtp']);

function verifyConnect(message) {
  console.log(message);
  /* SHOW NOTIFICATION IF ERROR CONNECTING */
  mailTransport.verify((err, success) => {
    if (err) {
      /* LOG THE ERROR */
      logfileFunc(err);
      new Notification('MAIL SERVER ERROR', {
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        body: 'There was a mail server error.\nPlease contact your administrator.',
      });

      /* SEND MESSAGE TO CLOSE THE ACTIVE LOADER */
      ipcRenderer.send('close-loader', null);

      /* GET THE REPLY FOR DIALOG */
      dialogReply = remote.dialog.showMessageBoxSync(emailWindow, {
        type: 'warning',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        title: 'EMAIL SERVER ERROR',
        buttons: ['CONTINUE', 'CLOSE'],
        message: 'THE EMAIL SERVER COULD NOT BE REACHED:',
        detail:
          'Choose CONTINUE to try send anyway.\nElse CLOSE to return to the customer search box.\n\nWe will resend the email on the next restart',
      });
      if (dialogReply === 0) {
        /* GET THE MESSAGE OBJECT TO SAVE FOR RETRY ON RELOAD */
        populateExcelHtml(message);
      } else {
        /* SEND FAILED OBJECT TO LOCALSTORAGE FUNCTION */
        failedMessageobj = getMessage(getText(message));
        localStorageAppend(failedMessageobj);
        ipcRenderer.send('email-close', null);
        emailWindow.close();
      }
    } else {
      populateExcelHtml(message);
    }
  });
}

/* LOGFILE CREATION FUNCTION */
function logfileFunc(error) {
  const fileDir = `${dir}/data/logfiles/mail-error-logfile.txt'`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Email Error -> ${error}\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Email Error -> ${error}\n`, (err) =>
      console.log(err)
    );
  }
}

/* EMAIL SENT FUNCTION */
function sendEmail() {
  borderBox.style.transform = 'scale(0)';
  letterContainer.style.cssText = 'transform: scaleY(1);';
}

/* EXCEL BOX AND MAIL SEND FUNCTION */
function populateExcelHtml(message) {
  /* GET THE MESSAGE TEXT */
  let text = getText(message);

  html = `

<a href="#" title="Double click to open" class="link" id="file-a">
<svg class="excel-image" viewBox="0 0 30 30">
  <style>
    .a {
      fill: #08743b;
    }
  </style>
  <path
    d="M28.7 7.5l-5.5-6.3 -1.1-1.3H9.3c-1.7 0-3.1 1.4-3.1 3.1V7h1.9L8.1 3.8c0-1 0.8-1.8 1.8-1.8l11 0v5.2c0 1.9 1.6 3.5 3.5 3.5h3.8l-0.2 15.1c0 1-0.8 1.8-1.8 1.8l-16.6 0c-0.9 0-1.6-0.9-1.6-1.9v-1.3H6.1v1.9c0 1.9 1.3 3.5 2.9 3.5l17.8 0c1.7 0 3.1-1.4 3.1-3.1V9L28.7 7.5"
    fill="#434440"
  />
  <path d="M20.2 25.4H0V6.1h20.2V25.4M1.9 23.4h16.3V8H1.9" class="a" />
  <polyline
    points="15.7 20.8 12.3 20.8 10 17.5 7.6 20.8 4.1 20.8 8.4 15.5 5 10.8 8.4 10.8 10 13.4 11.7 10.8 15.2 10.8 11.6 15.5 15.7 20.8 "
    class="a"
  />
</svg>
<span id="file-a-label">${fileNameA}</span>
</a>
<a href="#" title="Double click to open" class="link" id="file-b">
<svg class="excel-image" viewBox="0 0 30 30">
  <style>
    .a {
      fill: #08743b;
    }
  </style>
  <path
    d="M28.7 7.5l-5.5-6.3 -1.1-1.3H9.3c-1.7 0-3.1 1.4-3.1 3.1V7h1.9L8.1 3.8c0-1 0.8-1.8 1.8-1.8l11 0v5.2c0 1.9 1.6 3.5 3.5 3.5h3.8l-0.2 15.1c0 1-0.8 1.8-1.8 1.8l-16.6 0c-0.9 0-1.6-0.9-1.6-1.9v-1.3H6.1v1.9c0 1.9 1.3 3.5 2.9 3.5l17.8 0c1.7 0 3.1-1.4 3.1-3.1V9L28.7 7.5"
    fill="#434440"
  />
  <path d="M20.2 25.4H0V6.1h20.2V25.4M1.9 23.4h16.3V8H1.9" class="a" />
  <polyline
    points="15.7 20.8 12.3 20.8 10 17.5 7.6 20.8 4.1 20.8 8.4 15.5 5 10.8 8.4 10.8 10 13.4 11.7 10.8 15.2 10.8 11.6 15.5 15.7 20.8 "
    class="a"
  />
</svg>
<span id="file-b-label">${fileNameB}</span>
</a>
`;

  /* GENERATED DOM ELEMENTS */
  ////////////////////////////
  let excelLinks = document.getElementsByClassName('link');
  excel.insertAdjacentHTML('beforeend', html);

  /* EVENT LISTENERS */

  /////////////////////

  /* SEND BUTTON */
  sendBtn.addEventListener('click', (e) => {
    let message = getMessage(text);

    /* HIDE EMAIL BOX SHOW LETTER */
    sendEmail();
    mailTransport.sendMail(message, (err, info) => {
      if (err) {
        logfileFunc(err);

        localStorageAppend(message);

        /* CREATE NOTIFICATION */
        new Notification('MAIL SEND ERROR', {
          icon: `${dir}/renderer/icons/mailFailTemplate.png`,
          body: 'There was a problem sending the message',
        });

        /* CHANGE THE LETTER TO RED AND CHANGE MESSAGE TO FAIL */
        letterContainer.setAttribute('data-label', '');
        letterContainer.setAttribute('data-fail', 'SENDING FAILED');
        sentLetter.style.fill = '#cf2115';
        setTimeout(() => {
          letterContainer.style.cssText = 'transform:scaleY(0);opacity:0;';
          ipcRenderer.send('email-close', null);
          emailWindow.close();
        }, 1800);
      } else {
        /* IF SUCCESSFUL SHOW TICK AND TRANSITION  */
        letterCheckbox.style.cssText =
          'visibility: visible;transform: rotate(360deg) scale(1);';
        letterContainer.setAttribute('data-label', '');
        sentNotification.play();
        setTimeout(() => {
          letterContainer.style.cssText = 'transform:scaleY(0);opacity:0;';
          letterCheckbox.style.cssText = 'transform:scaleY(0);opacity:0;';
          setTimeout(() => {
            ipcRenderer.send('email-close', null);
            emailWindow.close();
          }, 1800);
        }, 1000);
      }
    });
  });

  /* FILE LINKS */
  /* FILE A */
  excelLinks[0].addEventListener('dblclick', (e) => {
    shell.openPath(filePaths[0]);
  });
  /* FILE B */
  excelLinks[1].addEventListener('dblclick', (e) => {
    shell.openPath(filePaths[1]);
  });

  borderBox.style.cssText = 'transform: scale(1);opacity:1;';
}

/* ///////////// */
/* IPC LISTENERS */
/* ///////////// */

ipcRenderer.on('email-popup', (e, message) => {
  verifyConnect(message);
});
