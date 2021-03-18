const fs = require('fs');

let appData = `${process.env.APPDATA}\\P2Sys-Manager`;

/* LOGFILE CREATION FUNCTION */
exports.logFileFunc = function (error) {
  const fileDir = `${appData}/error-log.txt`;
  /* CHECK IF IT EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFileSync(fileDir, `${new Date()}:  Error -> [${error}]\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Error -> [${error}]\n`, (err) =>
      console.log(err)
    );
  }
};
