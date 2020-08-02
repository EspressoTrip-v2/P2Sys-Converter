const { dataObjects, customerDatabase, customerPrices } = require('../../data/objects');

exports.tablePopulate = (jsonfile) => {
  // let idx = Object.keys(dataObjects['template-pricelist']).slice(0, -2);
  let idx = Object.keys(jsonfile).slice(0, -5);

  let htmlColumns = '';
  jsonfile['columns'].forEach((el) => {
    htmlColumns += `<th id="${el.toLowerCase().replace(' ', '-')}">${el}</th>`;
  });
  // tableColumns.innerHTML = htmlColumns;

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

// Create column headers from json template

// let idx = Object.keys(dataObjects['template-pricelist']).slice(0, -2);
// let htmlColumns = '';
// dataObjects['template-pricelist']['columns'].forEach((el) => {
//   htmlColumns += `<th id="${el}">${el}</th>`;
// });
// tableColumns.innerHTML = htmlColumns;

// Insert json template info into HTML table
// let htmlInner = '';
// idx.forEach((el) => {
//   // Create regex pattern for correct row
//   let row = dataObjects['template-pricelist'][el];
//   let pattern, title;
//   if (dataObjects['regex-patterns']['sequence']['odds-evens'].includes(el)) {
//     pattern = dataObjects['regex-patterns']['odds-evens'];
//     title = '(ODD|EVEN) LENGTHS (#.#)-(#.#)\n(#.#)-(#.#)';
//   } else if (dataObjects['regex-patterns']['sequence']['excl-and'].includes(el)) {
//     pattern = dataObjects['regex-patterns']['excl-and'];
//     title = '(#.#)-(#.#) (EXCL|AND) (#.#) (#.#)\n(#.#)-(#.#) (EXCL|AND) (#.#)\n(#.#)-(#.#)';
//   } else {
//     pattern = dataObjects['regex-patterns']['standard'];
//     title = '(#.#)-(#.#)';
//   }
//   htmlInner += `

//     <tr id="R${el}" ">
//       <td>${row[0]}</td>
//       <td>${row[1]}</td>

//       <td>
//       <form action="javascript:null;"><input pattern=${pattern} id="ER${el}"  title="${title}" class="table-entries" type="text" value="${row[2]}"/>
//       <input type="submit" id="SER${el}" style="display:none;" />
//       </form>
//       </td>

//       <td><input id="USER${el}" class="price-entries" type="number" placeholder="- - - - - - - - -"/></td>
//       <td><input id="TSER${el}" class="price-entries" type="number" placeholder="- - - - - - - - -"/></td>

//     </tr>
//     `;
// });
// table.innerHTML = htmlInner;
