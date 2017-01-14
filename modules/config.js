const path = require("path");

module.exports = () => {
    delete require.cache[require.resolve('../data/config')];
    return require('../data/config');
}
