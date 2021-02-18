/* MODULES */
const mongoose = require('mongoose');
const fs = require('fs');

/* GET APPDATA DIR */
let appData;
if (process.platform === 'win32') {
  appData = `${process.env.APPDATA}/P2Sys-Converter`;
} else {
  appData = process.cwd();
}

/* DATE VARIABLES */
const currentYear = new Date().getFullYear();
const yearLimit = currentYear - 3;

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${appData}/error-log.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}: Database ${message}\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Database ${message}\n`, (err) =>
      console.log(err)
    );
  }
}

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

/* QUERY FUNCTIONS EXPORT */
// QUERY PRICE-LIST
exports.queryPriceList = async function (customerNumber) {
  try {
    let priceList = await (await customerPricesModel.findById(customerNumber)).execPopulate();
    return priceList;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY ALL BACKUPS
async function queryAllBackUps() {
  try {
    let backUps = await customerBackUpModel.find().distinct('_id').exec();
    let pos = backUps.findIndex((el) => el === 'check');
    backUps.splice(pos, 1);
    removeBackups(backUps);
  } catch (err) {
    logfileFunc(err.stack);
  }
}

exports.queryBackUpDate = async function () {
  try {
    let date = await customerBackUpModel.findById('check').exec();
    let value = parseInt(date.toJSON().value);
    if (value < new Date().getFullYear()) {
      queryAllBackUps();
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY ALL SCHEDULE PRICES
exports.queryAllSchedules = async function () {
  try {
    let schedules = await schedulePricesModel.find().distinct('_id').exec();
    console.log(schedules);
  } catch (err) {
    logfileFunc(err.stack);
  }
};

/* REMOVE BACKUP FUNCTION */
async function removePriceLists(query) {
  /* Convert to json */
  let queryJson = query.toJSON();
  let dateKeys = Object.keys(queryJson);

  /* Remove the _id */
  let pos = dateKeys.findIndex((el) => el == '_id');
  dateKeys.splice(pos, 1);

  /* Convert & sort the dates */
  dateKeys.sort((dateA, dateB) => new Date(dateA) - new Date(dateB));

  /* Start building new object */
  let id = queryJson._id;
  let newObj = {
    _id: id,
  };

  let prevDate = 0;
  dateKeys.forEach((date, ind, arr) => {
    let dateString = `${1}/${date}`;
    let convertedDateYear = new Date(dateString).getFullYear();

    if (convertedDateYear > yearLimit) {
      if (prevDate === 0) {
        prevDate = new Date(dateString);
      }
      if (arr.length < 2) {
        newObj[date] = queryJson[date];
      } else {
        if (convertedDateYear === currentYear) {
          newObj[date] = queryJson[date];
        }
        if (convertedDateYear > prevDate.getFullYear()) {
          let string = `${prevDate.getDate()}/${prevDate.getFullYear()}`;

          newObj[string] = queryJson[string];
          prevDate = new Date(dateString);

          if (arr[ind + 1] === 'undefined') {
            newObj[date] = queryJson[date];
          }
        } else if (convertedDateYear === prevDate.getFullYear()) {
          prevDate = new Date(dateString);
        }
      }
    }
  });

  try {
    let result = await customerBackUpModel.findOneAndReplace({ _id: id }, newObj).exec();
  } catch (err) {
    logfileFunc(err.stack);
  }
}

/* REMOVE THE UNNECESSARY BACKUPS */
async function removeBackups(customerNumbers) {
  customerNumbers.forEach(async (number) => {
    try {
      let backup = await customerBackUpModel.findById(number).exec();
      removePriceLists(backup);
    } catch (err) {
      logfileFunc(err.stack);
    }
  });
}
