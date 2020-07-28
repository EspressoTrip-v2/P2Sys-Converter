const fs = require('fs');

/* TEMPLATES FOR NEW CUSTOMER CREATION */
exports.dataObjects = JSON.parse(fs.readFileSync(`${__dirname}/templates/dataObjects.json`));

/* CUSTOMER DATABASE IS CUSTOMER NUMBER - PRICELIST NUMBER */

//TODO: NEED TO UPDATE ON SAVE
exports.customerDatabase = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerDatabase.json`)
);

/* CUSTOMER NUMBER NAME IS CUSTOMER NUMBER - CUSTOMER NAME */

//TODO: NEED TO UPDATE ON SAVE
exports.customerNumberName = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerNameNumber.json`)
);

/* ALL ON FILE LAYMAN PRICELISTS */

//TODO: NEED TO UPDATE ON SAVE
exports.customerPrices = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerPrices.json`)
);
