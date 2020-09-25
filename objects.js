/* MODULES */
const fs = require('fs');

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

/* GET APPDATA DIR */
let appData;
if (process.platform === 'win32') {
  appData = `${process.env.APPDATA}/P2Sys-Converter`;
} else {
  appData = process.cwd();
}

/* TEMPLATES FOR NEW CUSTOMER CREATION */
exports.dataObjects = {
  'template-pricelist': {
    0: ['360 PIECES', '38 x 38', '0.9-2.7 AND 3.3 3.9'],
    1: ['360 PIECES', '38 x 38', '3.0-5.7 EXCL 3.3 3.9'],
    2: ['360 PIECES', '38 x 38', '6.0-6.6'],
    3: ['270 PIECES', '38 x 50', 'ODD LENGTHS 2.7-5.7'],
    4: ['270 PIECES', '38 x 50', 'EVEN LENGTHS 3.0-5.4'],
    5: ['270 PIECES', '38 x 50', '6.0-6.6'],
    6: ['192 PIECES', '38 x 76', '0.9-2.7 AND 3.3 3.9'],
    7: ['192 PIECES', '38 x 76', '3.0-5.7 EXCL 3.3 3.9'],
    8: ['192 PIECES', '38 x 76', '6.0-6.6'],
    9: ['128 PIECES', '38 x 114', '0.9-2.7'],
    10: ['128 PIECES', '38 x 114', '3.0-4.8'],
    11: ['128 PIECES', '38 x 114', '5.1-6.6'],
    12: ['96 PIECES', '38 x 152', '0.9-2.7'],
    13: ['96 PIECES', '38 x 152', '3.0-4.8'],
    14: ['96 PIECES', '38 x 152', '5.1-6.6'],
    15: ['64 PIECES', '38 x 228', '0.9-2.7'],
    16: ['64 PIECES', '38 x 228', '3.0-4.8'],
    17: ['64 PIECES', '38 x 228', '5.1-6.6'],
    18: ['144 PIECES', '50 x 76', '0.9-2.7 AND 3.3 3.9'],
    19: ['144 PIECES', '50 x 76', '3.0-4.8 EXCL 3.3 3.9'],
    20: ['144 PIECES', '50 x 76', '5.1-6.6'],
    21: ['72 PIECES', '50 x 152', '0.9-2.7 AND 3.3 3.9'],
    22: ['72 PIECES', '50 x 152', '3.0-4.8 EXCL 3.3 3.9'],
    23: ['72 PIECES', '50 x 152', '5.1-6.6'],
    24: ['48 PIECES', '50 x 228', '0.9-2.7'],
    25: ['48 PIECES', '50 x 228', '3.0-4.8'],
    26: ['48 PIECES', '50 x 228', '5.1-6.6'],
    27: ['32 PIECES', '76 x 228', '0.9-2.7'],
    28: ['32 PIECES', '76 x 228', '3.0-4.8'],
    29: ['32 PIECES', '76 x 228', '5.1-6.6'],
    COLUMNS: ['BUNDLE SIZE', 'DIMENSIONS', 'LENGTH', 'PRICE UNTREATED', 'PRICE TREATED'],
    CCA: '',
    EMAIL: '',
    TEL: '',
  },
  'regex-patterns': {
    sequence: {
      'odds-evens': ['3', '4'],
      'excl-and': [
        '0',
        '1',
        '2',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
      ],
    },
    'excl-and': '(\\d.\\d-\\d.\\d)(\\s(AND|EXCL)\\s(\\d.\\d(\\s\\d.\\d)?))?',
    'odds-evens': '((ODD|EVEN)\\s(LENGTHS)\\s)?(\\d.\\d-\\d.\\d)',
    standard: '(\\d.\\d)-(\\d.\\d)',
  },
};

/* CREATE DATA INSTANCE */
let mainDate = new Date();
let dateString = `${mainDate.getMonth() + 1}/${mainDate.getFullYear()}`;

/* ////////// */
/* FUNCTIONS */
/* //////// */

/* LOGFILE CREATION FUNCTION */
function logfileFunc(error) {
  const fileDir = `${appData}/error-log.txt`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}: Object.js error -> ${error}\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}:  Object.js error -> ${error}\n`, (err) =>
      console.log(err)
    );
  }
}

/* SORT DATES FUNCTION */
/////////////////////////
function sortDate(datesArr) {
  /* SET THE DATES */
  let arr = datesArr.map((el) => {
    return `1/${el}`;
  });
  arr.sort((dateA, dateB) => new Date(dateA) - new Date(dateB));
  return arr.map((el) => {
    return el.toString().slice(2);
  });
}

/* FUNCTION OVERWRITE THE LOCAL DATABASES WITH UPDATED INFORMATION */
exports.writeLocalDatabase = (filePath, writeFileObject) => {
  const backUpDir = `${filePath}/P2SYS-DATABASE`;
  if (!fs.existsSync(backUpDir)) {
    fs.mkdirSync(backUpDir);
  }
  let backUpObject;
  if (fs.existsSync(`${backUpDir}/databaseBackup.json`)) {
    backUpObject = JSON.parse(fs.readFileSync(`${backUpDir}/databaseBackup.json`, 'utf8'));
    let dateKeys = sortDate(Object.keys(backUpObject));
    if (!dateKeys.includes(dateString) && dateKeys.length < 6) {
      backUpObject[dateString] = writeFileObject;
      fs.writeFile(`${backUpDir}/databaseBackup.json`, JSON.stringify(backUpObject), (err) => {
        if (err) {
          logfileFunc(err);
        }
      });
    } else if (!dateKeys.includes(dateString) && dateKeys.length === 6) {
      delete backUpObject[dateKeys[0]];
      backUpObject[dateString] = writeFileObject;
      fs.writeFile(`${backUpDir}/databaseBackup.json`, JSON.stringify(backUpObject), (err) => {
        if (err) {
          logfileFunc(err);
        }
      });
    }
  } else {
    let newObject = JSON.stringify({ [dateString]: writeFileObject });
    fs.writeFile(`${backUpDir}/databaseBackup.json`, newObject, (err) => {
      if (err) {
        logfileFunc(err);
      }
    });
  }
};
