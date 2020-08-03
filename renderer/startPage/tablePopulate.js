/* MODULES */
////////////
const { dataObjects } = require('../../data/objects');

/* FUNCTION TO POPULATE THE TABLE ROWS */
exports.tablePopulate = (jsonfile) => {
  // get indexes of the json file
  let idx = Object.keys(jsonfile).slice(0, -5);

  // table column names
  let htmlColumns = '';
  jsonfile['columns'].forEach((el) => {
    htmlColumns += `<th id="${el.toLowerCase().replace(' ', '-')}">${el}</th>`;
  });

  // Insert json template info into HTML table
  let htmlInner = '';
  idx.forEach((el) => {
    // Create regex pattern for correct row
    let row = jsonfile[el];
    let pattern, title;
    if (dataObjects['regex-patterns']['sequence']['odds-evens'].includes(el)) {
      pattern = dataObjects['regex-patterns']['odds-evens'];
      title = '(ODD|EVEN) LENGTHS (#.#)-(#.#)\n(#.#)-(#.#)';
    } else if (dataObjects['regex-patterns']['sequence']['excl-and'].includes(el)) {
      pattern = dataObjects['regex-patterns']['excl-and'];
      title = '(#.#)-(#.#) (EXCL|AND) (#.#) (#.#)\n(#.#)-(#.#) (EXCL|AND) (#.#)\n(#.#)-(#.#)';
    } else {
      pattern = dataObjects['regex-patterns']['standard'];
      title = '(#.#)-(#.#)';
    }

    // Length and price entries
    htmlInner += `
    
    <tr id="R${el}" ">
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      
      <td>
      <form action="javascript:null;"><input pattern=${pattern} id="ER${el}"  title="${title}" class="table-entries" type="text" value="${
      row[2]
    }"/>
      <input type="submit" id="SER${el}" style="display:none;" />
      </form>
      </td>
      
      
      <td><input id="USER${el}" class="price-entries-untreated" type="number" value="${
      row[3] ? row[3] : ''
    }" placeholder="- - - - - - - - -"/></td>
      <td><input id="TSER${el}" class="price-entries-treated" type="number" value="${
      row[4] ? row[4] : ''
    }" placeholder="- - - - - - - - -"/></td>
    
    </tr>  
    `;
  });
  return { htmlColumns, htmlInner };
};