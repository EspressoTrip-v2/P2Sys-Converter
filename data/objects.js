const fs = require('fs');
const { dialog, shell } = require('electron');
const {
  customerPricesModel,
  customerPricelistNumberModel,
  customerNameNumberModel,
  customerBackUpModel,
} = require('../database/mongoDbConnect');

exports.writePricelistFile = (newNumber, jsonObj) => {
  let prices = JSON.parse(fs.readFileSync(`${__dirname}/templates/customerPrices.json`)),
    objString = JSON.stringify(jsonObj);
  /* CHECK TO SEE IT A LOG FILE HAS ALREADY BEEN CREATED AND APPEND OR WRITE NEW ONE */
  fs.writeFile(`${__dirname}/templates/customerPrices.json`, objString, 'utf8', (err) => {
    console.log(err);
  });

  /* LOGFILE UPDATING */
  if (fs.existsSync('logfile.txt')) {
    if (prices[newNumber]) {
      fs.appendFile(
        'logfile.txt',
        `${new Date()}: Updated customer->  ${newNumber}\n`,
        'utf8',
        (err) => console.log(err)
      );
    } else {
      fs.appendFile(
        'logfile.txt',
        `${new Date()}: New customer->  ${newNumber}\n`,
        'utf8',
        (err) => console.log(err)
      );
    }
  } else {
    if (prices[newNumber]) {
      fs.writeFile(
        'logfile.txt',
        `${new Date()}: Updated customer->  ${newNumber}\n`,
        'utf8',
        (err) => console.log(err)
      );
    } else {
      fs.writeFile(
        'logfile.txt',
        `${new Date()}: New customer->  ${newNumber}\n`,
        'utf8',
        (err) => console.log(err)
      );
    }
  }
};

/* CHECK DATA BASE CONSISTENCIES AND UPDATE */
const checkLength = async (localData, database, _id_name) => {
  /* GET DATA FROM DB */
  try {
    let data = await database.findOne({ _id: _id_name });
    /* CHECK LENGTH OF KEYS ABD UPDATE */
    if (Object.keys(data._doc).length != Object.keys(localData).length) {
      console.log('WILL UPDATE');
    } else {
      /* THROW ERROr AND ASK TO EMAIL DEVELOPER */
      let message = dialog.showMessageBoxSync({
        type: 'error',
        buttons: ['CANCEL', 'EMAIL DEVELOPER'],
        title: 'DATABASE ERROR',
        message:
          'There is an error with one of the databases.\n Please contact the developer for assistance.',
      });

      if (message === 1) {
        shell.openExternal('mailto:price.to.sys@gmail.com?subject=Database Error Report');
      }
    }
  } catch (err) {
    /* CATCH ERROR AND LOG TO LOGFILE.TXT */
    if (fs.existsSync('logfile.txt')) {
      fs.appendFile('logfile.txt', `${new Date()}: Database Error -> ${err}\n`, 'utf8');
    } else {
      fs.writeFile('logfile.txt', `${new Date()}: Database Error -> \n`, 'utf8', (err) =>
        console.log(err)
      );
    }
  }
};

/* ALL DATABASE UPDATE FUNCTION */
exports.updateDataBase = () => {
  /* GET ALL CURRENT LOCAL DATABASE FILES */
  let nameNumber = fs.readFileSync(`${__dirname}/templates/customerNameNumber.json`),
    prices = fs.readFileSync(`${__dirname}/templates/customerPrices.json`),
    cnPricelistNumber = fs.readFileSync(`${__dirname}/templates/customerPricelistNumber.json`),
    backUps = fs.readFileSync(`${__dirname}/templates/customerBackUp.json`);

  /* CHECK TO SEE IF THE LENGHTS ARE THE SAME */
  /* CUSTOMER  PRICELISTS */
  checkLength(prices, customerPricesModel, 'customerPrices');
  /* CUSTOMER NUMBER : PRICELIST NUMBER */
  checkLength(cnPricelistNumber, customerPricelistNumberModel, 'customerPricelistNumber');
  /* CUSTOMER NAME ON FILE: CUSTOMER NUMBER ON FILE */
  checkLength(nameNumber, customerNameNumberModel, 'customerNameNumber');
  /* CUSTOMER BACKUPS OF OLD PRICES */
  checkLength(backUps, customerBackUpModel, 'customerBackUp');
};

/* TEMPLATES FOR NEW CUSTOMER CREATION */
exports.dataObjects = JSON.parse(fs.readFileSync(`${__dirname}/templates/dataObjects.json`));

/* CUSTOMER DATABASE IS CUSTOMER NUMBER - PRICELIST NUMBER */

//TODO: NEED TO UPDATE ON SAVE
let customerPricelistNumber = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerPricelistNumber.json`)
);
delete customerPricelistNumber['_id'];

/* CUSTOMER NUMBER NAME IS CUSTOMER NUMBER - CUSTOMER NAME */

//TODO: NEED TO UPDATE ON SAVE
let = customerNumberName = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerNameNumber.json`)
);
delete customerNumberName['_id'];

/* ALL ON FILE LAYMAN PRICELISTS */

//TODO: NEED TO UPDATE ON SAVE
let customerPrices = JSON.parse(fs.readFileSync(`${__dirname}/templates/customerPrices.json`));
delete customerPrices['_id'];

delete customerPricelistNumber['_id'];

/* CUSTOMER PRICELIST BACKUP */

//TODO: NEED TO UPDATE ON SAVE
exports.customerBackUp = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerBackUp.json`)
);

/* FUNCTIONS FOR EXPORT */

let customerNameNumber = {};
Object.entries(customerNumberName).forEach((el) => {
  customerNameNumber[el[1]] = el[0];
});

exports.customerNumberName = customerNumberName;
exports.customerNameNumber = customerNameNumber;
exports.customerPricelistNumber = customerPricelistNumber;
exports.customerPrices = customerPrices;
