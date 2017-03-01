const low = require("lowdb");
const config = require("./config");

const dbHandler = function(_path, _defaults) {
    //store the path of the json file
    this.PATH = _path;
    this.defaults = _defaults;
}

dbHandler.prototype.init = function(db, defaults) {
    db.defaults(defaults);
}

dbHandler.prototype.db = function() {
    // create new instance of the lowdb
    const db = low(this.PATH);

    // set the defaults if this json file doesnt exists or it is empty
    if(!db.value()) this.init(db, this.defaults);

    // return the db instance
    return db;
}

dbHandler.prototype.get = function(property) { // get a property from the db
    return this.db().get(property);
}

dbHandler.prototype.update = function(path, value) { // update property
    this.db().set(path, value).write();
}

dbHandler.prototype.find = function(path, data) { // find item within path
    return this.get(path).find(data);
}

dbHandler.prototype.assignTo = function(dbInstance, data) { // assing to an item
    dbInstance.assign(data).write();
}

dbHandler.prototype.exists = function itemExists(path, obj) {
    // weird way of getting if it exists but simply checks if is null or undefined and then it does the not like !undefined or !null
    return !(!this.findItem(path, obj));
}

module.exports = dbHandler;
