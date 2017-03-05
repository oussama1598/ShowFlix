const low = require('lowdb');
const _ = require('underscore');

const dbHandler = function (_path, _defaults) {
    this.PATH = _path; //store the path of the json file
    this.defaults = _defaults;
};

dbHandler.prototype.init = function (db) {
    db.defaults(this.defaults).write(); // set the defaults
};

dbHandler.prototype.db = function () {
    const db = low(this.PATH);
    // compare the keys of the object if not match set the defaults
    if (!_.isEqual(Object.keys(db.value()), Object.keys(this.defaults))) {
        this.init(db);
    }
    return db; // return the db instance
};

module.exports = dbHandler;
