const path = require('path');
const low = require('lowdb');

const db = low(path.join(__dirname, '../data/config.json'));

module.exports = CNST => db.get(CNST).value();
