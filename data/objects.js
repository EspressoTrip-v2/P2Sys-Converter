const fs = require('fs');

exports.dataObjects = JSON.parse(fs.readFileSync(`${__dirname}/templates/dataObjects.json`));
exports.customerDatabase = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerDatabase.json`)
);
exports.customerNameNumber = JSON.parse(
  fs.readFileSync(`${__dirname}/templates/customerNameNumber.json`)
);
