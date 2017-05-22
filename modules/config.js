const path = require('path')
const DbHandler = require('./db-handler')

const dbPath = path.join(__dirname, '../data/config.json')
const db = new DbHandler(dbPath, {})

module.exports = CNST => db.get(CNST).value()
module.exports.getAll = () => db.db().value()
