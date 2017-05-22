const config = require('../modules/config')

module.exports.getSettings = (req, res) => res.send(config.getAll())
