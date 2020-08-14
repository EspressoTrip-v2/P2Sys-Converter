/* MODULES */
const fs = require('fs');
const { ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
const dir = process.cwd();
/* GET CURRENT DIRECTORY */
const curDir = __dirname;

/* TEMPLATES FOR NEW CUSTOMER CREATION */
exports.dataObjects = JSON.parse(fs.readFileSync(`${curDir}/templates/dataObjects.json`));

/* CUSTOMER DATABASE IS CUSTOMER NUMBER - PRICELIST NUMBER */

//TODO: NEED TO UPDATE ON SAVE
let customerPricelistNumber = JSON.parse(
  fs.readFileSync(`${curDir}/templates/customerPricelistNumber.json`)
);
delete customerPricelistNumber['_id'];

/* CUSTOMER NUMBER NAME IS CUSTOMER NUMBER - CUSTOMER NAME */

//TODO: NEED TO UPDATE ON SAVE
let = customerNumberName = JSON.parse(
  fs.readFileSync(`${curDir}/templates/customerNumberName.json`)
);
delete customerNumberName['_id'];

/* ALL ON FILE LAYMAN PRICELISTS */

//TODO: NEED TO UPDATE ON SAVE
let customerPrices = JSON.parse(fs.readFileSync(`${curDir}/templates/customerPrices.json`));
delete customerPrices['_id'];

delete customerPricelistNumber['_id'];

/* CUSTOMER PRICELIST BACKUP */

//TODO: NEED TO UPDATE ON SAVE
let = customerBackUp = JSON.parse(fs.readFileSync(`${curDir}/templates/customerBackUp.json`));
delete customerBackUp['_id'];

/* ////////// */
/* FUNCTIONS */
/* //////// */

/* LOGFILE CREATION FUNCTION */
function logfileFunc(database) {
  const fileDir = `${dir}/data/logfiles/local-db-logfile.txt'`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(
      fileDir,
      `${new Date()}: Writefile Error ->  In local Database ${database}\n`,
      (err) => console.log(err)
    );
  } else {
    fs.writeFile(fileDir, `${new Date()}: Updated customer ->  ${database}\n`, (err) =>
      console.log(err)
    );
  }
}

/* FUNCTION OVERWRITE THE LOCAL DATABASES WITH UPDATED INFOMATION */
exports.writeLocalDatabase = (writeFileObject) => {
  const fileDir = `${curDir}/templates`;

  fs.writeFileSync(
    `${fileDir}/customerPrices.json`,
    JSON.stringify(writeFileObject.customerPrices),
    'utf-8',
    (err) => {
      console.log(err);
    }
  );
  fs.writeFileSync(
    `${fileDir}/customerPricelistNumber.json`,
    JSON.stringify(writeFileObject.customerPricelistNumber),
    'utf-8',
    (err) => {
      console.log(err);
    }
  );
  fs.writeFileSync(
    `${fileDir}/customerBackUp.json`,
    JSON.stringify(writeFileObject.customerBackUp),
    'utf-8',
    (err) => {
      console.log(err);
    }
  );
  fs.writeFileSync(
    `${fileDir}/customerNumberName.json`,
    JSON.stringify(writeFileObject.customerNumberName),
    'utf-8',
    (err) => {
      console.log(err);
    }
  );
  ipcRenderer.send('db-sync', 'sent message');
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
