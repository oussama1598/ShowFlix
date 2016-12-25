const utils = require("../utils/utils");
const Q = require("q");
const sources = require("../sources/sources");

const provs = {
    providers: {},
    add: function(name, provider) {
        this.providers[name] = provider;
    },
    get: function(name) {
        return this.providers[name];
    }
};

provs.add("openload", require("./openload"));

provs.add("keeload", require("./keeload"));

provs.add("Uptobox", require("./Uptobox"));

provs.add("top4top", require("./top4top"));

provs.add("googleDrive", require("./googleDrive"));


module.exports = provs;
