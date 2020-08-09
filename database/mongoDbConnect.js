const mongoose = require('mongoose');

/* CUSTOMER PRICELISTS ALREADY CREATED */
/* SCHEMA */
const customerPricesSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
/* MODEL */
const customerPrices = mongoose.model('Customer_Prices', customerPricesSchema);

/* CUSTOMER PRICELISTS ALREADY CREATED */
/* SCHEMA */
const customerDatabaseSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
/* MODEL */
const customerPricelistNumber = mongoose.model('Customer_Database', customerDatabaseSchema);

/* CUSTOMER PRICELISTS ALREADY CREATED */
/* SCHEMA */
const customerNameNumberSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
/* MODEL */
const customerNameNumber = mongoose.model('Customer_Name_Number', customerNameNumberSchema);

/* CUSTOMER PRICELISTS BACKUPS */
/* SCHEMA */
const customerBackUpSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerBackUp = mongoose.model('Customer_BackUp', customerBackUpSchema);

/* EXPORTS */
exports.customerPricesModel = customerPrices;
exports.customerPricelistNumberModel = customerPricelistNumber;
exports.customerNameNumberModel = customerNameNumber;
exports.customerBackUpModel = customerBackUp;
