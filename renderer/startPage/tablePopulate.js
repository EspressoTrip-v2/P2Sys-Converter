/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

/* MODULES */
////////////
const { dataObjects } = require(`${dir}/objects.js`);

/* FUNCTION TO POPULATE THE TABLE ROWS */
exports.tablePopulate = (jsonfile) => {
  // get indexes of the json file
  let idx = Object.keys(jsonfile).slice(0, -4);

  // table column names
  let htmlColumns = '';
  jsonfile['COLUMNS'].forEach((el) => {
    htmlColumns += `<th id="${el.toLowerCase().replace(' ', '-')}">${el}</th>`;
  });

  // Insert json template info into HTML table
  let htmlInner = '';
  idx.forEach((el) => {
    // Create regex pattern for correct row
    let row = jsonfile[el];
    let bundleSize = dataObjects['template-pricelist'][el][0];

    let pattern, title;
    if (dataObjects['regex-patterns']['sequence']['odds-evens'].includes(el)) {
      pattern = dataObjects['regex-patterns']['odds-evens'];
      title = '(ODD|EVEN) LENGTHS (#.#)-(#.#)\n(#.#)-(#.#)';
    } else if (dataObjects['regex-patterns']['sequence']['and'].includes(el)) {
      pattern = dataObjects['regex-patterns']['and'];
      title = '(#.#)-(#.#) (AND) (#.#) (#.#)\n(#.#)-(#.#) (AND) (#.#)\n(#.#)-(#.#)';
    } else if (dataObjects['regex-patterns']['sequence']['excl'].includes(el)) {
      pattern = dataObjects['regex-patterns']['excl'];
      title = '(#.#)-(#.#) (EXCL) (#.#) (#.#)\n(#.#)-(#.#) (EXCL) (#.#)\n(#.#)-(#.#)';
    } else {
      pattern = dataObjects['regex-patterns']['standard'];
      title = '(#.#)-(#.#)';
    }

    htmlInner += `
    
    <tr id="R${el}" ">
      <td>
      <input type="text" id="BR${el}" class="BR" value="${bundleSize}" style="border: none;" disabled/>
      </td>
      
      <td>
      <input type="text" id="DR${el}" class="DR" value="${row[1]}" style="border: none;" disabled/>
      </td>
      
     
      
      <td>
      <form action="javascript:null;"><input pattern=${pattern} id="ER${el}"  title="${title}" class="table-entries" type="text" value="${row[2]}" disabled/>
      <input type="submit" id="SER${el}" style="display:none;" />
      </form>
      </td>
      
          
      <td><div id="CU${el}" class="CU" data-label=""><input id="USER${el}" class="price-entries-untreated" type="number" value="${row[3]}" placeholder="- - - - - - - - -"/></div></td>
    
    
      <td><div id="CT${el}" class="CT" data-label=""><input id="TSER${el}" class="price-entries-treated" type="number" value="${row[4]}" placeholder="- - - - - - - - -"/></div></td>
    
    </tr>  
    `;
  });
  return { htmlColumns, htmlInner };
};
