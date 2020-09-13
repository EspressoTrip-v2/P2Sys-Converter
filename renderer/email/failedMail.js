/* MODULES */
const nodemailer = require('nodemailer');

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

///////////////////////////
/* FAILED EMAIL FUNCTION */
///////////////////////////

exports.sendFailedMail = async (soundElement) => {
  /* CREATE NODEMAILER TRANSPORTER */
  let mailTransportObject = {
    host: process.env.EMAIL_SMTP_HOST,
    auth: {
      user: process.env.EMAIL_AUTH_USER,
      pass: process.env.EMAIL_AUTH_PASSWORD,
    },
  };
  /* CREATE NODEMAILER TRANSPORTER */
  let mailTransport = nodemailer.createTransport(mailTransportObject);

  /* PARSE STRING TO OBJECT */
  let messages = JSON.parse(localStorage['failedEmail']);
  let failedMessages = [],
    reply;

  let successMes = [],
    number;

  /* LOOP THROUGH THE MESSAGES AND RESEND */

  for (let i = 0; i < messages.length; i++) {
    try {
      reply = await mailTransport.sendMail(messages[i]);
      successMes.push(messages[i]);
      number = messages[i].subject.split(' ');

      new Notification(`RETRY ${number[1]} SUCCESS`, {
        icon: `${dir}/renderer/icons/mailSendTemplate.png`,
        body: `Message sent successfully`,
        requireInteraction: true,
      });
      soundElement.play();
    } catch (err) {
      failedMessages.push(messages[i]);
      new Notification(`RETRY ${number[1]} FAILED`, {
        icon: `${dir}/renderer/icons/mailFailTemplate.png`,
        body: `The message failed again.\The address might be incorrect. Please clear any backlog messages in the settings panel`,
        requireInteraction: true,
      });
    }
  }
  if (failedMessages.length == 0) {
    localStorage.removeItem('failedEmail');
  } else {
    localStorage.setItem('failedEmail', JSON.stringify(failedMessages));
  }
};
