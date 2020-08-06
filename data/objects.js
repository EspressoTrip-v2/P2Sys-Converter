const fs = require('fs');

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
        (err) => {
          console.log(err);
        }
      );
    } else {
      fs.appendFile(
        'logfile.txt',
        `${new Date()}: New customer->  ${newNumber}\n`,
        'utf8',
        (err) => {
          console.log(err);
        }
      );
    }
  } else {
    if (prices[newNumber]) {
      fs.writeFile(
        'logfile.txt',
        `${new Date()}: Updated customer->  ${newNumber}\n`,
        'utf8',
        (err) => {
          console.log(err);
        }
      );
    } else {
      fs.writeFile(
        'logfile.txt',
        `${new Date()}: New customer->  ${newNumber}\n`,
        'utf8',
        (err) => {
          if (err) throw err;
        }
      );
    }
  }
};

/* TEMPLATES FOR NEW CUSTOMER CREATION */
exports.dataObjects = JSON.parse(fs.readFileSync(`${__dirname}/templates/dataObjects.json`));

/* CUSTOMER DATABASE IS CUSTOMER NUMBER - PRICELIST NUMBER */

//TODO: NEED TO UPDATE ON SAVE
exports.customerDatabase = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerDatabase.json`)
);

/* CUSTOMER NUMBER NAME IS CUSTOMER NUMBER - CUSTOMER NAME */

//TODO: NEED TO UPDATE ON SAVE
let = customerNumberName = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerNameNumber.json`)
);

/* ALL ON FILE LAYMAN PRICELISTS */

//TODO: NEED TO UPDATE ON SAVE
exports.customerPrices = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerPrices.json`)
);

/* FUNCTIONS FOR EXPORT */

let customerNameNumber = {};
Object.entries(customerNumberName).forEach((el) => {
  customerNameNumber[el[1]] = el[0];
});

exports.customerNumberName = customerNumberName;
exports.customerNameNumber = customerNameNumber;
