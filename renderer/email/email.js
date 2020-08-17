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

/* CREATE NODEMAILER TRANSPORTER */
let mailTransport = nodemailer.createTransport(emailSetup['smtp']);

/* SHOW NOTIFICATION IF ERROR CONNECTING */
mailTransport.verify((err, success) => {
  if (err) {
    new Notification('MAIL SERVER ERROR', {
      body: 'There was a mail server error.\nPlease contact your administrator.',
    });
  }
});

///////////////////
/* DOM ELEMENTS */
/////////////////

let emailRecipients = document.getElementById('email-entry'),
  emailMessageArea = document.getElementById('email-message'),
  excel = document.getElementsByClassName('excel')[0],
  sendBtn = document.getElementById('send'),
  borderBox = document.getElementById('border'),
  letterContainer = document.getElementById('sent-letter-container'),
  letterCheckbox = document.getElementById('check-container');

/* CREATE EMAIL TEXT FOR MESSAGE AND INITIAL ADDRESSES */
emailRecipients.value = emailSetup['email']['to'];

///////////////
/* FUNCTIONS */
///////////////

/* LOGFILE CREATION FUNCTION */
function logfileFunc(error) {
  const fileDir = `${dir}/data/logfiles/mail-error-logfile.txt'`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Email Error -> ${error}\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFile(fileDir, `${new Date()}: Email Error -> ${error}\n`, (err) =>
      console.log(err)
    );
  }
}

/* EMAIL SENT FUNCTION */
function sendEmail() {
  borderBox.style.transform = 'scale(0)';
  letterContainer.style.cssText = 'visibility: visible;transform: scaleY(1);';
}

/* EXCEL BOX AND MAIL SEND FUNCTION */
function populateExcelHtml(message) {
  /* GLOBAL VARIABLES */
  let customerNumber, transportMessage, filePaths, fileNameB, fileNameA, html;

  /* SPLIT MESSAGE INTO USABLE PARTS */
  customerName = message.name;
  customerNumber = message.number;
  filePaths = message.filePaths;

  /* DISPLAY FILE NAMES */
  fileNameA = `S5_${customerNumber}.xlsx`;
  fileNameB = `${customerNumber}_system.xlsx`;

  /* CREATE THE TRANSPORT MESSAGE */
  /* TEXT OF MESSAGE */
  let textInitial = emailSetup['email']['text'].replace('{NAME}', customerName),
    text = textInitial.replace('{NUMBER}', customerNumber);
  /* INSERT THE MESSAGE IN THE TEXT AREA */
  emailMessageArea.value = text;

  transportMessage = {
    to: emailRecipients.value,
    subject: `Emailing ${customerNumber}`,
    replyTo: emailSetup['email']['replyTo'],
    text,
    attachments: [{ path: filePaths[0] }, { path: filePaths[1] }],
  };

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
    /* HIDE EMAIL BOX SHOW LETTER */
    sendEmail();
    mailTransport.sendMail(transportMessage, (err, info) => {
      if (err) {
        new Notification('MAIL SEND ERROR', {
          body: 'There was a problem sending messages',
        });
        logfileFunc(err);
      } else {
        letterCheckbox.style.cssText =
          'visibility: visible;transform: rotate(360deg) scale(1);';
        letterContainer.setAttribute('data-label', '');
        setTimeout(() => {
          letterContainer.style.transform = 'scaleY(0)';
          letterCheckbox.style.transform = 'scaleY(0)';
          setTimeout(() => {
            ipcRenderer.send('email-close', null);
            emailWindow.close();
          }, 1500);
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
  populateExcelHtml(message);
});
