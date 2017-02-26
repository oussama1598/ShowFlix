const Ev = require("events");
const util = require('util');
const utils = require("../utils/utils");
const config = require("./config");
const _ = require("underscore");

function Watcher(delay, fn) {
    this.last = [];
    setInterval(() => {
        // this function will be called to retreive the data
        const arr = fn();

        // get the diffrence between two arrays
        const deff = utils.arrayDeffrence(arr, this.last);

        if (deff.length > 0 || arr.length === 0 && this.last.length > 0) {
            this.last = _.map(arr, _.clone);
            this.emit("changed", arr);
        }
    }, delay);
}

util.inherits(Watcher, Ev);

module.exports = Watcher;
