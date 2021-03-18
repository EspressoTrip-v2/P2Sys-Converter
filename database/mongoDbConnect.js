/* MODULES */
const mongoose = require('mongoose');

/* DATE VARIABLES */
const currentYear = new Date().getFullYear();
const yearLimit = currentYear - 3;

/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

const { logFileFunc } = require(`${dir}/logFile.js`);

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
exports.createPausedPriceList = async function (priceList, notifyMain) {
  try {
    let result = await pausedPricesModel.exists({ _id: priceList._id });
    if (result) {
      await pausedPricesModel.findOneAndReplace({ _id: priceList._id }, priceList).exec();
    } else {
      await pausedPricesModel.create(priceList);
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Create paused failed',
      body: `Failed to create ${priceList._id} paused price list, please check the log file.`,
    });
  }
};

// QUERY ALL CUSTOMER NUMBERS IN PAUSED PRICELISTS
exports.queryAllPaused = async function (notifyMain) {
  try {
    let result = await pausedPricesModel.find().distinct('_id').lean().exec();
    return result;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Query all paused failed',
      body: 'Problem querying paused items, please check the log file.',
    });
  }
};

// QUERY ALL CUSTOMER NUMBERS IN PAUSED PRICELISTS
exports.queryAllPausedQuantity = async function (notifyMain) {
  try {
    let result = await pausedPricesModel.find().distinct('_id').lean().exec();
    return result.length;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Query paused quantity failed',
      body: 'Problem querying paused quantities, please check the log file.',
    });
  }
};

// QUERY SINGLE PAUSED PRICE-LIST
exports.querySinglePaused = async function (customerNumber, notifyMain) {
  try {
    let result = await pausedPricesModel.findById(customerNumber).lean().exec();
    return result;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Query single paused item failed',
      body: `Problem querying ${customerNumber} paused item, please check the log file.`,
    });
  }
};

exports.removePausedItem = async function (customerNumber, notifyMain) {
  try {
    pausedPricesModel.findByIdAndDelete(customerNumber).exec();
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Removal of single paused item failed',
      body: `Problem removing ${customerNumber} paused item, please check the log file.`,
    });
  }
};

exports.removePausedItemSync = async function (customerNumber, notifyMain) {
  try {
    let result = await pausedPricesModel.findByIdAndDelete(customerNumber).lean().exec();
    if (result._id === customerNumber) {
      return true;
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Removal of single paused item failed',
      body: `Problem removing ${customerNumber} paused item, please check the log file.`,
    });
  }
};

// QUERY ALL CUSTOMER PRICE-LIST NUMBERS
exports.queryAllPriceListNumbers = async function (notifyMain) {
  try {
    let result = await customerPricesModel.find().distinct('_id').exec();
    return result;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Query all price list numbers failed',
      body: 'Problem querying all price list numbers, please check the log file.',
    });
  }
};

// QUERY A SINGLE PRICE-LIST
exports.querySinglePriceList = async function (customerNumber, notifyMain) {
  try {
    let priceList = await customerPricesModel.findById(customerNumber).lean().exec();
    return priceList;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Query single price failed',
      body: `Problem querying ${customerNumber} price list, please check the log file.`,
    });
  }
};

/* QUERY CUSTOMER PRICE-LIST EXISTS */
async function queryCustomerExists(customerNumber) {
  try {
    let result = await customerPricesModel.exists({ _id: customerNumber });
    return result;
  } catch (err) {
    logFileFunc(err);
  }
}

/* ADD PRICE LIST NUMBER */
async function addPriceListNumber(customerNumber, priceListNumber, notifyMain) {
  try {
    let existsFlag = await customerPricelistNumberModel.exists({ _id: customerNumber });
    if (!existsFlag) {
      await customerPricelistNumberModel.create({
        _id: customerNumber,
        number: priceListNumber,
      });
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Adding price list number failed',
      body: `Problem adding ${priceListNumber} for ${customerNumber}, please check the log file.`,
    });
  }
}

async function addCustomerName(customerName, customerNumber, notifyMain) {
  try {
    let existsFlag = await customerNumberNameModel.exists({ _id: customerNumber });
    if (!existsFlag) {
      await customerNumberNameModel.create({ _id: customerNumber, name: customerName });
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Adding customer name failed',
      body: `Problem adding a name to ${customerNumber}, please check the log file.`,
    });
  }
}

exports.addCustomerNameAndNumbers = async function (custDetail, notifyMain) {
  await addCustomerName(custDetail.customerName, custDetail.customerNumber, notifyMain);
  await addPriceListNumber(custDetail.customerNumber, custDetail.priceListNumber, notifyMain);
};

/* SAVE PRICE-LIST TO DATABASE */
exports.updatePriceListDataBase = async function (customerData, notifyMain) {
  let date = new Date();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  let dateString = `${month}/${year}`;
  let customerNumber = customerData.customerNumber;
  let priceList = customerData['price-list'];
  let custDetail = customerData.custDetail;

  try {
    /* Check if customer price-list exists */
    let existsFlagPriceList = await queryCustomerExists(customerNumber);
    /* Get the backup of the customer */
    let backupJson = await customerBackUpModel.findById(customerNumber).lean().exec();

    /* UPDATE NAME AND PRICE-LIST NUMBER DATABASE */
    if (custDetail !== null) {
      let priceListNumber = custDetail.priceListNumber;
      let customerName = custDetail.customerName;

      await addPriceListNumber(customerNumber, priceListNumber);
      await addCustomerName(customerName, customerNumber);
    }
    /* CREATE NEW BACKUP IF IT DOES NOT EXIST */
    if (backupJson !== null) {
      if (backupJson[dateString]) {
        await customerBackUpModel
          .findByIdAndUpdate(customerNumber, {
            [dateString]: priceList,
          })
          .exec();
      }
    } else {
      await customerBackUpModel.create({
        _id: customerNumber,
        [dateString]: priceList,
      });
    }

    /* CREATE NEW PRICE LIST IF IT DOES NOT EXISTS */
    if (existsFlagPriceList) {
      await customerPricesModel
        .findOneAndReplace(
          { _id: customerNumber },
          { _id: customerNumber, 'price-list': priceList }
        )
        .exec();
    } else {
      await customerPricesModel.create({ _id: customerNumber, 'price-list': priceList });
    }
    return true;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Updating price lists failed',
      body: `Problem updating price list for ${customerNumber}, please check the log file.`,
    });
  }
};

/* QUERY SINGLE PRICE-LIST NUMBER */
exports.querySinglePriceListNumber = async function (customerNumber, notifyMain) {
  try {
    let result = await customerPricelistNumberModel.findById(customerNumber).lean().exec();
    if (result !== null) {
      return result.number;
    } else {
      return null;
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying price list number failed',
      body: `Problem querying ${customerNumber} price list, please check the log file.`,
    });
  }
};

/* GET THE LATEST EXMILL PRICE-LIST */
exports.queryExmillPrice = async function (notifyMain) {
  try {
    let result = await customerPricesModel.findById('@EXMILL').lean().exec();
    return result['price-list'];
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'No Ex-Mill price list available',
      body: `There is no Ex-Mill in the database, please create one for full functionality.`,
    });
  }
};

exports.queryAllScheduleDates = async function (notifyMain) {
  try {
    let result = await schedulePricesModel.find().distinct('_id').lean().exec();
    return result;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying all schedules failed',
      body: `Problem querying all scheduled items, please check the log file.`,
    });
  }
};

exports.queryAllScheduleDatesQuantity = async function (notifyMain) {
  try {
    let result = await schedulePricesModel.find().distinct('_id').lean().exec();
    return result.length;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying all schedules dates failed',
      body: `Problem querying all scheduled dates, please check the log file.`,
    });
  }
};

exports.querySingleSchedule = async function (date, notifyMain) {
  try {
    let result = await schedulePricesModel.find({ _id: date }).lean().exec();
    let arr = Object.keys(result[0]);
    let idx = arr.indexOf('_id');
    arr.splice(idx, 1);
    return arr;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying single schedule date failed',
      body: `Problem querying schedule date: ${date}, please check the log file.`,
    });
  }
};

exports.createScheduleItem = async function (message, date, notifyMain) {
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
      if (result !== null) {
        return true;
      }
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Creating schedule date failed',
      body: `Problem creating schedule date: ${date}, please check the log file.`,
    });
  }
};

exports.removeScheduleItems = async function (message, notifyMain) {
  let keys;
  try {
    let result = await schedulePricesModel.findById(message.dateValue).lean().exec();

    if (result !== null) {
      keys = Object.keys(result).length;
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
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Removing schedule date failed',
      body: `Problem removing schedule date: ${date}, please check the log file.`,
    });
  }
};

exports.editSingleScheduledPriceList = async function (dateNumberObj, notifyMain) {
  try {
    let scheduleObj = await schedulePricesModel
      .findById(dateNumberObj.dateValue)
      .lean()
      .exec();
    let priceList = scheduleObj[dateNumberObj.customerNumber];
    return priceList;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Editing schedule date failed',
      body: `Problem editing schedule date: ${date}, please check the log file.`,
    });
  }
};

// QUERY ALL CUSTOMER NUMBERS ON FILE
exports.queryAllCustomerNumbers = async function (notifyMain) {
  try {
    let result = await customerNumberNameModel.find().distinct('_id').lean().exec();
    return result;
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying all customer numbers failed',
      body: `Problem querying all customer numbers, please check the log file.`,
    });
  }
};

// GET CUSTOMER NAME
exports.queryCustomerName = async function (customerNumber, allNames, notifyMain) {
  let result;
  if (allNames) {
    try {
      result = await customerNumberNameModel.find().lean().exec();
      return result;
    } catch (err) {
      logFileFunc(err);
      notifyMain({
        title: 'Querying all customer names failed',
        body: `Problem querying all customer names, please check the log file.`,
      });
    }
  } else {
    try {
      result = await customerNumberNameModel.findById(customerNumber).lean().exec();
      return result;
    } catch (err) {
      logFileFunc(err);
      notifyMain({
        title: 'Querying a customer name failed',
        body: `Problem querying name for ${customerNumber}, please check the log file.`,
      });
    }
  }
};

// QUERY SINGLE CUSTOMER BACKUP
exports.querySingleCustomerBackup = async function (customerNumber, notifyMain) {
  try {
    let result = await customerBackUpModel.findById(customerNumber).lean().exec();
    if (result != null && Object.keys(result).length >= 2) {
      delete result['_id'];
      return result;
    } else if (result === null) {
      return result;
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying a single backup failed',
      body: `Problem querying backup for ${customerNumber}, please check the log file.`,
    });
  }
};

// QUERY THE LAST CLEANED DATE ON BACKUP DATABASE
exports.queryBackUpDate = async function (notifyMain) {
  try {
    let date = await customerBackUpModel.findById('check').lean().exec();
    let value = parseInt(date.value);
    if (value < new Date().getFullYear()) {
      updateBackups();
      return true;
    } else {
      return false;
    }
  } catch (err) {
    logFileFunc(err);
    notifyMain({
      title: 'Querying all backup dates failed',
      body: `Problem querying all backup dates, please check the log file.`,
    });
  }
};

// QUERY THE LAST CLEANED DATE ON BACKUP DATABASE
async function updateBackups() {
  try {
    let backUpCustomerNumbers = await customerBackUpModel.find().distinct('_id').lean().exec();
    removeBackups(backUpCustomerNumbers);
  } catch (err) {
    logFileFunc(err);
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
    logFileFunc(err);
  }
}

/* REMOVE THE UNNECESSARY BACKUPS */
async function removeBackups(customerNumbers) {
  customerNumbers.forEach(async (number) => {
    try {
      let backup = await customerBackUpModel.findById(number).exec();
      removePriceLists(backup);
    } catch (err) {
      logFileFunc(err);
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
      logFileFunc(err);
    }
  });
}
