/* TEMPLATES FOR NEW CUSTOMER CREATION */
exports.dataObjects = {
  'template-pricelist': {
    0: ['420 PIECES', '38 x 38', '0.9-2.7 AND 3.3 3.9'],
    1: ['420 PIECES', '38 x 38', '3.0-5.7 EXCL 3.3 3.9'],
    2: ['420 PIECES', '38 x 38', '6.0-6.6'],
    3: ['315 PIECES', '38 x 50', 'ODD LENGTHS 2.7-5.7'],
    4: ['315 PIECES', '38 x 50', 'EVEN LENGTHS 3.0-5.4'],
    5: ['315 PIECES', '38 x 50', '6.0-6.6'],
    6: ['210 PIECES', '38 x 76', '0.9-2.7 AND 3.3 3.9'],
    7: ['210 PIECES', '38 x 76', '3.0-5.7 EXCL 3.3 3.9'],
    8: ['210 PIECES', '38 x 76', '6.0-6.6'],
    9: ['140 PIECES', '38 x 114', '0.9-2.7'],
    10: ['140 PIECES', '38 x 114', '3.0-4.8'],
    11: ['140 PIECES', '38 x 114', '5.1-6.6'],
    12: ['98 PIECES', '38 x 152', '0.9-2.7'],
    13: ['98 PIECES', '38 x 152', '3.0-4.8'],
    14: ['98 PIECES', '38 x 152', '5.1-6.6'],
    15: ['70 PIECES', '38 x 228', '0.9-2.7'],
    16: ['70 PIECES', '38 x 228', '3.0-4.8'],
    17: ['70 PIECES', '38 x 228', '5.1-6.6'],
    18: ['168 PIECES', '50 x 76', '0.9-2.7 AND 3.3 3.9'],
    19: ['168 PIECES', '50 x 76', '3.0-4.8 EXCL 3.3 3.9'],
    20: ['168 PIECES', '50 x 76', '5.1-6.6'],
    21: ['77 PIECES', '50 x 152', '0.9-2.7 AND 3.3 3.9'],
    22: ['77 PIECES', '50 x 152', '3.0-4.8 EXCL 3.3 3.9'],
    23: ['77 PIECES', '50 x 152', '5.1-6.6'],
    24: ['55 PIECES', '50 x 228', '0.9-2.7'],
    25: ['55 PIECES', '50 x 228', '3.0-4.8'],
    26: ['55 PIECES', '50 x 228', '5.1-6.6'],
    27: ['35 PIECES', '76 x 228', '0.9-2.7'],
    28: ['35 PIECES', '76 x 228', '3.0-4.8'],
    29: ['35 PIECES', '76 x 228', '5.1-6.6'],
    COLUMNS: ['BUNDLE SIZE', 'DIMENSIONS', 'LENGTH', 'PRICE UNTREATED', 'PRICE TREATED'],
    CCA: '',
    EMAIL: '',
    TEL: '',
  },
  'regex-patterns': {
    sequence: {
      'odds-evens': ['3', '4'],
      and: ['0', '6', '9', '12', '15', '18', '21', '22', '24', '27'],
      excl: ['1', '7', '10', '13', '16', '19', '22', '22', '25', '28'],
    },
    and: '(\\d.\\d-\\d.\\d)(\\s(AND)\\s(\\d.\\d(\\s\\d.\\d)?))?',
    excl: '(\\d.\\d-\\d.\\d)(\\s(EXCL)\\s(\\d.\\d(\\s\\d.\\d)?))?',
    'odds-evens': '((ODD|EVEN)\\s(LENGTHS)\\s)?(\\d.\\d-\\d.\\d)',
    standard: '(\\d.\\d)-(\\d.\\d)',
  },
};
