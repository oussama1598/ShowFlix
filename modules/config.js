const path = require("path");

module.exports = (CNST) => {
    delete require.cache[require.resolve('../data/config')];
    const data = require('../data/config');

    if(CNST) return data[CNST] ? data[CNST] : null;
    if(!CNST) return data;
}
