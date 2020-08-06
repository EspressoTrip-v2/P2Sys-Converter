const mongoose = require('mongoose');

/* CREATE SCHEMA AND MODEL FOR DATABASE */
const pricelist = new mongoose.Schema({}, { strict: false });
const PriceList = mongoose.model('PriceList', pricelist);

/* EXPORT REQUIRED ITEMS */
exports.PriceList = PriceList;
