/* MODULES */
const nodemailer = require('nodemailer');
const { ipcRenderer, remote } = require('electron');

/* GET WORKING DIRECTORY */
let dir;

if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

const { logFileFunc } = require(`${dir}/logFile.js`);

/* GET WINDOW */
let emailWindow = remote.getCurrentWindow();

/* GET SCREEN SIZE */
let res = remote.screen.getPrimaryDisplay().size;
screenWidth = res.width;
screenHeight = res.height;

//////////////////
/* DOM ELEMENTS */
//////////////////

let newEmailInput = document.getElementById('email-entry'),
  emailMessageArea = document.getElementById('email-message'),
  sendBtn = document.getElementById('send'),
  cancelBtn = document.getElementById('close'),
  borderBox = document.getElementById('border'),
  sentNotification = document.getElementById('sent-audio'),
  errorNotification = document.getElementById('error-audio'),
  soundClick = document.getElementById('click'),
  sendingMail = document.getElementById('sending-container'),
  failedMail = document.getElementById('failed-container'),
  sentMail = document.getElementById('sent-container'),
  recipientContainer = document.getElementById('added-recipients'),
  subjectInput = document.getElementById('subject-input'),
  addEmailRecipientBtn = document.getElementById('add-recipient'),
  audioTag = Array.from(document.getElementsByTagName('audio'));

/* GLOBAL VARIABLES */
let customerNumber,
  filePaths,
  fileNameB,
  fileNameA,
  pausedFlag,
  newScheduleDate,
  text,
  recipientArr,
  headingText,
  multiZipPath,
  unHideHomeWindowFlag = null;

/* CREATE EMAIL TEXT FOR MESSAGE AND INITIAL ADDRESSES */
recipientArr = process.env.EMAIL_TO.split(',');

///////////////
/* FUNCTIONS */
///////////////

/* FUNCTION CHECK THE MUTE FLAG */
let storage = JSON.parse(localStorage.getItem('notifications'));
function checkMuteFlag() {
  if (!storage.muteflag) {
    /* SET FLAG TO FALSE AND TURN OFF ALL SOUND */
    storage.muteflag = false;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = true;
    });
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    storage.muteflag = true;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = false;
    });
  }
}

if (!storage.muteflag) {
  checkMuteFlag();
}

/* REMOVE RECIPIENT */
function removeMailRecipient(e) {
  let parent = e.target.parentNode;
  let recipientString = parent.id;
  parent.style.display = 'none';
  this.removeEventListener('click', removeMailRecipient);

  let idx = recipientArr.indexOf(recipientString);
  recipientArr.splice(idx, 1);
}

/* ADD LISTENERS TO RECIPIENTS */
function addListenersToRecipients() {
  let recipients = Array.from(recipientContainer.children);
  recipients.forEach((el) => {
    let button = `${el.id}-delete`;
    document.getElementById(button).addEventListener('click', removeMailRecipient);
  });
}

/* POPULATE RECIPIENT HTML */
function populateRecipientHtml() {
  recipientArr.forEach((el) => {
    let html = `<div class="recipient-list" id="${el}">${el}<button id="${el}-delete" class="delete-recipient">X</button></div>`;
    recipientContainer.insertAdjacentHTML('beforeend', html);
  });
  addListenersToRecipients();
}

/* FUNCTION TO GENERATE THE MESSAGE TEST FOR EMAIL MESSAGE*/
function getText(message) {
  populateRecipientHtml();

  if (message.multiZipPath === null) {
    /* SPLIT MESSAGE INTO USABLE PARTS */
    customerName = message.custDetail.customerName;
    customerNumber = message.customerNumber;
    filePaths = message.filePaths;
    pausedFlag = message.pauseFlag;
    newScheduleDate = message.newScheduleDate;
    multiZipPath = message.multiZipPath;

    /* GENERATE THE HEADING */
    if (newScheduleDate !== null) {
      headingText = `Price change notification for ${customerNumber.trim()}`;
    } else {
      headingText = `Emailing updates for ${customerNumber.trim()}`;
    }
    subjectInput.value = headingText;

    if (filePaths.length === 2) {
      if (filePaths[0].includes('S5')) {
        /* DISPLAY FILE NAMES */
        fileNameA = `S5_${customerNumber.trim()}.xlsx`;
        fileNameB = `${customerNumber.trim()}_system.xlsx`;
      } else {
        fileNameB = `S5_${customerNumber.trim()}.xlsx`;
        fileNameA = `${customerNumber.trim()}_system.xlsx`;
      }
    } else {
      fileNameA = `S5_sample_${customerNumber.trim()}.xlsx`;
    }

    /* CREATE THE TRANSPORT MESSAGE */
    /* TEXT OF MESSAGE */
    if (newScheduleDate === null) {
      text = `Please find the attached files for immediate update and distribution.\n\nCustomer Name:\n${customerName}\n\nCustomer Number:\n${customerNumber}\n\nKind Regards,\nA.C. Whitcher Management`;
    } else {
      text = `Dear: \n${customerName},\n\nThe attached file is a sample order form with price changes that will affect your account.\n\nThe changes will take effect on 1/${newScheduleDate}. Please do not place orders on this sample form, an official order form will be sent to you on or soon after 1/${newScheduleDate}.\n\nIf you have any queries please contact the sales department on +27 42 281 1713.\n\nKind Regards,\nA.C. Whitcher`;
    }

    /* INSERT THE MESSAGE IN THE TEXT AREA */
    emailMessageArea.value = text;

    return text;
  } else {
    multiZipPath = message.multiZipPath;
    unHideHomeWindowFlag = true;
    subjectInput.value = 'Compressed file for distribution';
    text = `The attached file is an automated schedule or bulk conversion, it could contain updates for multiple customers.\nPlease extract all files and folders and update and distribute immediately.\n\nKind Regards,\nA.C. Whitcher Management`;
    /* INSERT THE MESSAGE IN THE TEXT AREA */
    emailMessageArea.value = text;
    return text;
  }
}

/* FUNCTION TO CREATE MESSAGE OBJECT TO SEND AS EMAIL */
function getMessage() {
  if (recipientArr.length < 1) {
    /* CREATE MESSAGE POPUP */
    remote.dialog.showMessageBoxSync(emailWindow, {
      type: 'warning',
      icon: `${dir}/renderer/icons/converter-logo.png`,
      buttons: ['OK'],
      message: 'Missing email',
      detail: 'Please add an email address.',
    });
  } else {
    let attachments;
    if (multiZipPath === null) {
      if (newScheduleDate !== null) {
        attachments = [{ filename: fileNameA, path: filePaths[0] }];
      } else {
        attachments = [
          { filename: fileNameA, path: filePaths[0] },
          { filename: fileNameB, path: filePaths[1] },
        ];
      }
    } else if (multiZipPath !== null) {
      let arr = multiZipPath.split('\\');
      let fileName = arr[arr.length - 1];
      attachments = [{ filename: fileName, path: multiZipPath }];
    }

    let transportMessage = {
      from: process.env.EMAIL_FROM,
      to: recipientArr,
      subject: subjectInput.value,
      text: emailMessageArea.value,
      attachments,
    };

    return transportMessage;
  }
  return null;
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
      logFileFunc(err.stack);
      new Notification('P2Sys mail server error', {
        icon: `${dir}/renderer/icons/converter-logo.png`,
        body: 'There was a mail server error.\nPlease contact your administrator.',
      });
    } else {
      populateEmail(message);
    }
  });
}

/* EMAIL SENT FUNCTION */
function sendEmail() {
  ipcRenderer.send('hide-updater', null);
  borderBox.style.visibility = 'hidden';
  /* SHOW HOMEWINDOW IF CONVERTING SCHEDULE ITEMS */
  if (unHideHomeWindowFlag != null) {
    ipcRenderer.send('show-home', null);
  } else {
    ipcRenderer.send('email-close', null);
  }
  setTimeout(() => {
    emailWindow.setBounds({
      width: Math.floor(screenWidth * 0.03),
      height: Math.floor(screenWidth * 0.03),
      x: screenWidth - 60,
      y: screenHeight - 100,
    });
    setTimeout(() => {
      sendingMail.style.transform = 'scale(1)';
    }, 500);
  }, 500);
}

/* EXCEL BOX AND MAIL SEND FUNCTION */
function populateEmail(message) {
  /* GET THE MESSAGE TEXT */
  text = getText(message);

  /* EVENT LISTENERS */

  /////////////////////

  /* NEW EMAIL EVENT */
  function addNewEmailEvent(address) {
    let buttonId = `${address}-delete`;
    document.getElementById(buttonId).addEventListener('click', removeMailRecipient);
  }

  /* ADD EMAIL RECIPIENT BUTTON */
  addEmailRecipientBtn.addEventListener('click', (e) => {
    soundClick.play();
    emailAddress = newEmailInput.value;

    if (
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(emailAddress)
    ) {
      let html = `<div class="recipient-list" id="${emailAddress}">${emailAddress}<button id="${emailAddress}-delete" class="delete-recipient">X</button></div>`;
      recipientContainer.insertAdjacentHTML('beforeend', html);

      /* ADD TO RECIPIENT ARR */
      recipientArr.push(emailAddress);
      addNewEmailEvent(emailAddress);

      newEmailInput.value = '';
    }
  });

  borderBox.style.visibility = 'visible';

  /* SEND BUTTON */
  sendBtn.addEventListener('click', (e) => {
    let message = getMessage();
    if (message !== null) {
      soundClick.play();
      setTimeout(() => {
        sendEmail();
        mailTransport.sendMail(message, (err, info) => {
          /* HIDE SENDING ICON */
          sendingMail.style.display = 'none';
          if (err) {
            /* HIDE SENDING ICON */

            sendingMail.style.display = 'none';

            /* LOG ERROR */
            logFileFunc(err.stack);

            /* CREATE NOTIFICATION */
            new Notification('P2Sys mail send error', {
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
              ipcRenderer.send('show-updater', null);
              emailWindow.close();
            }, 1500);
          } else {
            /* SHOW SENT ICON */
            sentNotification.play();
            sentMail.style.animation = 'pop 0.3s 0.3s linear 1 forwards';
            sentMail.style.opacity = '0';

            setTimeout(() => {
              ipcRenderer.send('close-email-window', null);
            }, 1500);
          }
        });
      }, 300);
    }
  });
}

/* CANCEL MAIL SEND */
cancelBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('email-close', null);
    ipcRenderer.send('close-email-window', null);
  }, 300);
});
/* ///////////// */
/* IPC LISTENERS */
/* ///////////// */

ipcRenderer.on('email-popup', (e, message) => {
  verifyConnect(message);
});
