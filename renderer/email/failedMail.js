/* MODULES */
const nodemailer = require('nodemailer');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

/* LOCAL MODULES */
const { emailSetup } = require(`${dir}/objects.js`);

///////////////////////////
/* FAILED EMAIL FUNCTION */
///////////////////////////

exports.sendFailedMail = async () => {
  /* CREATE NODEMAILER TRANSPORTER */
  let mailTransport = nodemailer.createTransport(emailSetup['smtp']);

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
