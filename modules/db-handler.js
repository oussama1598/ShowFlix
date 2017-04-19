const low = require('lowdb');
const _ = require('underscore');

class DbHandler {
  constructor(_path, _defaults) {
    this.path = _path;
    this.defaults = _defaults;
  }

  init(db) {
    db.defaults(this.defaults)
      .write();
  }

  db() {
    const db = low(this.path);
    if (!_.isEqual(Object.keys(db.value()), Object.keys(this.defaults))) {
      this.init(db);
    }
    return db;
  }
}

module.exports = DbHandler;
