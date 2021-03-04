/* MODULES */
const mongoose = require('mongoose');
const fs = require('fs');

const notifier = require('node-notifier');
const { exec } = require('child_process');

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

/* GET WORKING DIRECTORY */
let dir;
function envFileChange() {
  let fileName = `${process.cwd()}/resources/app.asar`;
  /* LOCAL MODULES */
  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = fileName.replace(pattern, '/');
  } else dir = fileName;
}
if (!process.env.NODE_ENV) {
  envFileChange();
} else {
  dir = process.cwd();

  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = dir.replace(pattern, '/');
  }
}

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${appData}/error-log.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}: ${message}\n`, (err) => console.log(err));
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: ${message}\n`, (err) => console.log(err));
  }
}

/* PAUSED PRICELIST SCHEMA */
/* SCHEMA */
const pausedPricesSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const pausedPricesModel = mongoose.model('Paused_Prices', pausedPricesSchema);
exports.pausedPricesModel = pausedPricesModel;

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
////////////////////////////

// CREATE A PAUSED PRICE-LIST
exports.createPausedPriceList = async function (priceList) {
  try {
    let result = await pausedPricesModel.exists({ _id: priceList._id });
    if (result) {
      await pausedPricesModel.findOneAndReplace({ _id: priceList._id }, priceList).exec();
    } else {
      await pausedPricesModel.create(priceList);
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY ALL CUSTOMER NUMBERS IN PAUSED PRICELISTS
exports.queryAllPaused = async function () {
  try {
    let result = pausedPricesModel.find().distinct('_id').lean().exec();
    return result;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY SINGLE PAUSED PRICE-LIST
exports.querySinglePaused = async function (customerNumber) {
  try {
    let result = pausedPricesModel.findById(customerNumber).lean().exec();
    return result;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.removePausedItem = async function (customerNumber) {
  try {
    pausedPricesModel.findByIdAndDelete(customerNumber).exec();
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.removePausedItemSync = async function (customerNumber) {
  try {
    let result = await pausedPricesModel.findByIdAndDelete(customerNumber).lean().exec();
    if (result._id === customerNumber) {
      return true;
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY ALL CUSTOMER PRICE-LIST NUMBERS
exports.queryAllPriceListNumbers = async function () {
  let result = await customerPricesModel.find().distinct('_id').exec();
  return result;
};

// QUERY A SINGLE PRICE-LIST
exports.querySinglePriceList = async function (customerNumber) {
  try {
    let priceList = await customerPricesModel.findById(customerNumber).lean().exec();
    return priceList;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

/* QUERY CUSTOMER PRICE-LIST EXISTS */
async function queryCustomerExists(customerNumber) {
  try {
    let result = await customerPricesModel.exists({ _id: customerNumber });
    return result;
  } catch (err) {
    logfileFunc(err.stack);
  }
}

/* SAVE PRICE-LIST TO DATABASE */
exports.updatePriceListDataBase = async function (priceList) {
  let date = new Date();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let dateString = `${month}/${year}`;
  let customerNumber = priceList._id;
  try {
    /* Check if customer price-list exists */
    let existsFlagPriceList = await queryCustomerExists(customerNumber);
    /* Get the backup of the customer */
    let backupJson = await customerBackUpModel.findById(customerNumber).lean().exec();

    if (backupJson[dateString]) {
      customerBackUpModel
        .findByIdAndUpdate(customerNumber, {
          [dateString]: priceList['price-list'],
        })
        .exec();
    } else {
      customerBackUpModel
        .updateOne({ _id: customerNumber }, { [dateString]: priceList['price-list'] })
        .exec();
    }
    if (existsFlagPriceList) {
      customerPricesModel.findOneAndReplace({ _id: customerNumber }, priceList).exec();
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

/* QUERY SINGLE PRICE-LIST NUMBER */
exports.querySinglePriceListNumber = async function (customerNumber) {
  try {
    let result = await customerPricelistNumberModel.findById(customerNumber).lean().exec();
    if (result != null) {
      return result.number;
    } else {
      return null;
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

/* GET THE LATEST EXMILL PRICE-LIST */
exports.queryExmillPrice = async function () {
  try {
    let result = await customerPricesModel.findById('@EXMILL').lean().exec();
    return result['price-list'];
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.queryAllScheduleDates = async function () {
  try {
    let result = await schedulePricesModel.find().distinct('_id').lean().exec();
    return result;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.querySingleSchedule = async function (date) {
  try {
    let result = await schedulePricesModel.find({ _id: date }).lean().exec();
    let arr = Object.keys(result[0]);
    let idx = arr.indexOf('_id');
    arr.splice(idx, 1);
    return arr;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.createScheduleItem = async function (message, date) {
  let result;
  try {
    let existsFlag = await schedulePricesModel.exists({ _id: date });
    if (existsFlag) {
      result = await schedulePricesModel.updateOne({ _id: date }, message).exec();
      if (result.n > 0) {
        return true;
      }
    } else {
      message['_id'] = date;
      result = await schedulePricesModel.create(message);
      if (result != null) {
        return true;
      }
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.removeScheduleItems = async function (message) {
  try {
    let result = await schedulePricesModel.findById(message.dateValue).lean().exec();
    let keys = Object.keys(result).length;
    if (keys <= 2) {
      await schedulePricesModel.findByIdAndDelete(message.dateValue);
      return true;
    } else {
      delete result[message.customerNumber];
      let update = await schedulePricesModel
        .findOneAndReplace({ _id: message.dateValue }, result)
        .lean()
        .exec();
      if (update._id == message.dateValue) {
        return true;
      }
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

exports.editSingleScheduledPriceList = async function (dateNumberObj) {
  try {
    let scheduleObj = await schedulePricesModel
      .findById(dateNumberObj.dateValue)
      .lean()
      .exec();
    let priceList = scheduleObj[dateNumberObj.customerNumber];
    return priceList;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY ALL CUSTOMER NUMBERS ON FILE
exports.queryAllCustomerNumbers = async function () {
  try {
    let result = await customerNumberNameModel.find().distinct('_id').lean().exec();
    return result;
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// GET CUSTOMER NAME
exports.queryCustomerName = async function (customerNumber, allNames) {
  let result;
  if (allNames) {
    try {
      result = await customerNumberNameModel.find().lean().exec();
      return result;
    } catch (err) {
      logfileFunc(err.stack);
    }
  } else {
    try {
      result = await customerNumberNameModel.findById(customerNumber).lean().exec();
      return result;
    } catch (err) {
      logfileFunc(err.stack);
    }
  }
};

// QUERY SINGLE CUSTOMER BACKUP
exports.querySingleCustomerBackup = async function (customerNumber) {
  try {
    let result = await customerBackUpModel.findById(customerNumber).lean().exec();
    if (result != null) {
      delete result['_id'];
      return result;
    } else {
      return [];
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY THE LAST CLEANED DATE ON BACKUP DATABASE
exports.queryBackUpDate = async function () {
  try {
    let date = await customerBackUpModel.findById('check').lean().exec();
    let value = parseInt(date.value);
    if (value < new Date().getFullYear()) {
      notifier.notify({
        title: 'CLEANING BACKUP DATABASE',
        message: 'Redundant backups are being removed please do not close the application.',
        icon: `${dir}/renderer/icons/info.png`,
      });
      updateBackups();
    }
  } catch (err) {
    logfileFunc(err.stack);
  }
};

// QUERY THE LAST CLEANED DATE ON BACKUP DATABASE
async function updateBackups() {
  try {
    let backUpCustomerNumbers = await customerBackUpModel.find().distinct('_id').lean().exec();
    removeBackups(backUpCustomerNumbers);
  } catch (err) {
    logfileFunc(err.stack);
  }
}

/* REMOVE BACKUP FUNCTION */
async function removePriceLists(query) {
  /* Convert to json */
  let queryJson = query.toJSON();
  let dateKeys = Object.keys(queryJson);

  /* Remove the _id from the array */
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
    customerBackUpModel.findOneAndReplace({ _id: id }, newObj).exec();
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

    try {
      /* SET CHECK DATE TO CURRENT */
      customerBackUpModel
        .findOneAndReplace(
          { _id: 'check' },
          {
            _id: 'check',
            value: currentYear,
          }
        )
        .exec();
    } catch (err) {
      logfileFunc(err.stack);
    }
  });
}
