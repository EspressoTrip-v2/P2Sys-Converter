/* MODULES */
const nodemailer = require('nodemailer');
const { screen, ipcRenderer, remote } = require('electron');
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir;
function envFileChange() {
  let fileName = `${process.cwd()}/resources/app.asar`;
  /* LOCAL MODULES */
  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = fileName.replace(pattern, '/');
  } else dir = fileName;
}
if (!process.env.NODE_ENV) {
  envFileChange();
} else {
  dir = process.cwd();

  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = dir.replace(pattern, '/');
  }
}

/* GET APPDATA DIR */
let appData;
if (process.platform === 'win32') {
  appData = `${process.env.APPDATA}/P2Sys-Converter`;
} else {
  appData = process.cwd();
}

/* GET WINDOW */
let emailWindow = remote.getCurrentWindow();

/* GET SCREEN SIZE */
let res = remote.screen.getPrimaryDisplay().size;
screenWidth = res.width;
screenHeight = res.height;

//////////////////
/* DOM ELEMENTS */
//////////////////

let emailRecipients = document.getElementById('email-entry'),
  emailMessageArea = document.getElementById('email-message'),
  sendBtn = document.getElementById('send'),
  borderBox = document.getElementById('border'),
  sentNotification = document.getElementById('sent-audio'),
  errorNotification = document.getElementById('error-audio'),
  soundClick = document.getElementById('click'),
  sendingMail = document.getElementById('sending-container'),
  failedMail = document.getElementById('failed-container'),
  sentMail = document.getElementById('sent-container');

/* CREATE EMAIL TEXT FOR MESSAGE AND INITIAL ADDRESSES */
emailRecipients.value = process.env.EMAIL_TO;

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
    fileNameA = `S5_${customerNumber.trim()}.xlsx`;
    fileNameB = `${customerNumber.trim()}_system.xlsx`;
  } else {
    fileNameB = `S5_${customerNumber.trim()}.xlsx`;
    fileNameA = `${customerNumber.trim()}_system.xlsx`;
  }

  /* CREATE THE TRANSPORT MESSAGE */
  /* TEXT OF MESSAGE */
  let textInitial = process.env.EMAIL_TEXT.replace('{NAME}', customerName),
    text = textInitial.replace('{NUMBER}', customerNumber.trim());
  /* INSERT THE MESSAGE IN THE TEXT AREA */
  emailMessageArea.value = text;

  return text;
}

/* FUNCTION TO CREATE MESSAGE OBJECT TO SEND AS EMAIL */
function getMessage(text) {
  let transportMessage = {
    from: process.env.EMAIL_FROM,
    to: emailRecipients.value,
    subject: `Emailing ${customerNumber.trim()}`,
    text: emailMessageArea.value,
    attachments: [
      { filename: fileNameA, path: filePaths[0] },
      { filename: fileNameB, path: filePaths[1] },
    ],
  };

  return transportMessage;
}

//////////////////////////////
/* EMAIL TRANSPORT FUNCTION */
//////////////////////////////

/* CREATE NODEMAILER TRANSPORTER */
let mailTransportObject = {
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE,
  auth: {
    user: process.env.EMAIL_AUTH_USER,
    pass: process.env.EMAIL_AUTH_PASSWORD,
  },
};
let mailTransport = nodemailer.createTransport(mailTransportObject);

function verifyConnect(message) {
  /* SHOW NOTIFICATION IF ERROR CONNECTING */
  mailTransport.verify((err, success) => {
    if (err) {
      /* LOG THE ERROR */
      logfileFunc(err);
      new Notification('P2SYS MAIL SERVER ERROR', {
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        body: 'There was a mail server error.\nPlease contact your administrator.',
      });

      /* SEND MESSAGE TO CLOSE THE ACTIVE LOADER */
      ipcRenderer.send('close-loader', null);

      /* GET THE REPLY FOR DIALOG */
      dialogReply = remote.dialog.showMessageBoxSync(emailWindow, {
        type: 'question',
        icon: `${dir}/renderer/icons/error.png`,
        title: 'P2SYS EMAIL ERROR',
        buttons: ['CONTINUE', 'CLOSE'],
        message: 'THE EMAIL SERVER COULD NOT BE REACHED:',
        detail:
          'Choose CONTINUE to try send anyway.\nElse CLOSE to return to the customer search box.\n\nWe will resend the email on the next restart',
      });
      if (dialogReply === 0) {
        /* GET THE MESSAGE OBJECT TO SAVE FOR RETRY ON RELOAD */
        populateEmail(message);
      } else {
        /* SEND FAILED OBJECT TO LOCALSTORAGE FUNCTION */
        failedMessageobj = getMessage(getText(message));
        localStorageAppend(failedMessageobj);
        ipcRenderer.send('email-close', null);
        emailWindow.close();
      }
    } else {
      populateEmail(message);
    }
  });
}

/* LOGFILE CREATION FUNCTION */
function logfileFunc(error) {
  const fileDir = `${appData}/error-log.txt`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}: Email Error -> ${error}\n`, (err) =>
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
  borderBox.style.opacity = '0';
  setTimeout(() => {
    ipcRenderer.send('email-close', null);
    emailWindow.setBounds({
      width: 120,
      height: 105,
      x: screenWidth - 125,
      y: screenHeight - 150,
    });
    setTimeout(() => {
      sendingMail.style.transform = 'scale(1)';
    }, 500);
  }, 500);
}

/* EXCEL BOX AND MAIL SEND FUNCTION */
function populateEmail(message) {
  /* GET THE MESSAGE TEXT */
  let text = getText(message);

  /* EVENT LISTENERS */

  /////////////////////

  /* SEND BUTTON */
  sendBtn.addEventListener('click', (e) => {
    soundClick.play();
    let message = getMessage(text);
    setTimeout(() => {
      sendEmail();
      mailTransport.sendMail(message, (err, info) => {
        /* HIDE SENDING ICON */
        sendingMail.style.display = 'none';
        if (err) {
          /* HIDE SENDING ICON */

          sendingMail.style.display = 'none';

          /* LOG ERROR */
          logfileFunc(err);

          /* SEND TO LOCAL STORAGE */
          localStorageAppend(message);

          /* CREATE NOTIFICATION */
          new Notification('P2SYS MAIL SEND ERROR', {
            icon: `${dir}/renderer/icons/mailFailTemplate.png`,
            body: 'There was a problem sending the message',
          });

          setTimeout(() => {
            /* SHOW FAILED ICON */
            errorNotification.play();
            failedMail.style.animation = 'shake 0.2s 0.3s linear infinite alternate';
            failedMail.style.opacity = '0';
          }, 500);

          setTimeout(() => {
            emailWindow.close();
          }, 15000);
        } else {
          /* SHOW SENT ICON */
          sentNotification.play();
          sentMail.style.animation = 'pop 0.3s 0.3s linear 1 forwards';
          sentMail.style.opacity = '0';
          setTimeout(() => {
            emailWindow.close();
          }, 7000);
        }
      });
    }, 200);
  });

  borderBox.style.opacity = '1';
  ipcRenderer.send('loader-close', null);
}

/* ///////////// */
/* IPC LISTENERS */
/* ///////////// */

ipcRenderer.on('email-popup', (e, message) => {
  verifyConnect(message);
});
