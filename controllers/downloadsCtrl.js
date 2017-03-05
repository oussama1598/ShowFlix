const low = require("lowdb");
const config = require("../modules/config");

function getData() {
    // get new instance of lowdb in order to refresh the data
    const db = low(config("DOWNLOADS_QUEUE_PATH"));
    // check if the json exists first
    if (!db.get("downloads").value()) db.defaults({
        downloads: []
    }).write();

    // return the instance of the lowdb
    return db;
}

function findItem(obj) {
    // find an item inside the json data with an object match
    return getData().get("downloads").find(obj).value();
}

function getAll() {
    // return all the items in the json data
    return getData().get("downloads").value();
}

function addItem(obj) {
    // add item
    getData().get("downloads").push(obj).write();
}

function removeItem(obj) {
    // remove item
    getData().get("downloads").remove(obj).write();
}

function updateItem(obj, changes) {
    getData().get("downloads").find(obj).assign(changes).write();
}

function itemExists(obj){
  // weird way of getting if it exists but simply checks if is null or undefined and then it does the not like !undefined or !null
  return !(!findItem(obj));
}

module.exports = {
    getAll,
    findItem,
    addItem,
    removeItem,
    itemExists,
    updateItem
}
