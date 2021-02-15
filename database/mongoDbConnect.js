/* MODULES */
const mongoose = require('mongoose');

/* SCHEDULE PRICELIST SCHEMA */
/* SCHEMA */
const schedulePricesSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const schedulePricesModel = mongoose.model('Schedule_Prices', schedulePricesSchema);
exports.schedulePricesModel = schedulePricesModel;

/* CUSTOMER PRICELISTS ALREADY CREATED */
/* SCHEMA */
const customerPricesSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerPricesModel = mongoose.model('Customer_Prices', customerPricesSchema);
exports.customerPricesModel = customerPricesModel;

/* CUSTOMER NUMBER: PRICELIST NUMBER */
/* SCHEMA */
const customerPricelistNumberSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerPricelistNumberModel = mongoose.model(
  'Customer_Pricelist_Number',
  customerPricelistNumberSchema
);
exports.customerPricelistNumberModel = customerPricelistNumberModel;

/* CUSTOMER NAME: CUSTOMER NUMBER */
/* SCHEMA */
const customerNumberNameSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerNumberNameModel = mongoose.model(
  'Customer_Number_Name',
  customerNumberNameSchema
);
exports.customerNumberNameModel = customerNumberNameModel;

/* CUSTOMER PRICELISTS BACKUPS */
/* SCHEMA */
const customerBackUpSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerBackUpModel = mongoose.model('Customer_BackUp', customerBackUpSchema);
exports.customerBackUpModel = customerBackUpModel;
