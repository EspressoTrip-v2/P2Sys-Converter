/* MODULES */
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);

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

/* UPDATE ONLINE DATABASES */
////////////////////////////
async function updateDatabase() {
  /* GET LATEST LOCAL LIBRARIES FOR UPDATE */
  ///////////////////////////////////////////

  /* CUSTOMER DATABASE IS CUSTOMER NUMBER - PRICELIST NUMBER */
  let customerPricelistNumber = JSON.parse(
    fs.readFileSync(`${dir}//templates/customerPricelistNumber.json`)
  );

  /* CUSTOMER NUMBER NAME IS CUSTOMER NUMBER - CUSTOMER NAME */
  let customerNumberName = JSON.parse(
    fs.readFileSync(`${dir}//templates/customerNumberName.json`)
  );

  /* ALL ON FILE LAYMAN PRICELISTS */
  let customerPrices = JSON.parse(fs.readFileSync(`${dir}//templates/customerPrices.json`));

  /* CUSTOMER PRICELIST BACKUP */
  let customerBackUp = JSON.parse(fs.readFileSync(`${dir}//templates/customerBackUp.json`));

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
