/* MODULES */
const fs = require('fs');

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
let = customerBackUp = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerBackUp.json`)
);
delete customerBackUp['_id'];

/* ////////// */
/* FUNCTIONS */
/* //////// */

/* LOGFILE CREATION FUNCTION */
function logfileFunc(customerNumber) {
  if (fs.existsSync('./data/logfiles/local-db-logfile.txt')) {
    if (customerPrices[customerNumber]) {
      fs.appendFile(
        './data/logfiles/local-db-logfile.txt',
        `${new Date()}: Updated customer ->  ${customerNumber}\n`,
        (err) => console.log(err)
      );
    } else {
      fs.appendFile(
        './data/logfiles/local-db-logfile.txt',
        `${new Date()}: New customer ->  ${customerNumber}\n`,
        (err) => console.log(err)
      );
    }
  } else {
    if (customerPrices[customerNumber]) {
      fs.writeFile(
        './data/logfiles/local-db-logfile.txt',
        `${new Date()}: Updated customer ->  ${customerNumber}\n`,
        (err) => console.log(err)
      );
    } else {
      fs.writeFile(
        './data/logfiles/local-db-logfile.txt',
        `${new Date()}: New customer ->  ${customerNumber}\n`,
        (err) => console.log(err)
      );
    }
  }
}

exports.writeLocalDatabase = (object) => {
  //TODO: FINISH
};

let customerNameNumber = {};
Object.entries(customerNumberName).forEach((el) => {
  customerNameNumber[el[1]] = el[0];
});

exports.customerNumberName = customerNumberName;
exports.customerNameNumber = customerNameNumber;
exports.customerPricelistNumber = customerPricelistNumber;
exports.customerPrices = customerPrices;
exports.customerBackUp = customerBackUp;
