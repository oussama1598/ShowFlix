const utils = require("../utils/utils");
const Q = require("q");
const request = require("request");
var $;

function loadHtml(url, done) {
    utils.getHtml(url).then(html => {
        console.log("KeeLoad HTML loaded!");
        $ = html;
        done();
    })
}

function getUrl() {
    let results = [];

    $("source").each(function () {
        results.push($(this).attr("src"));
    })

    return results[0];
}

module.exports = function(url) {
    const defer = Q.defer();
    console.log("KeeLoad start parsing")

    loadHtml(url, () => {
        defer.resolve(getUrl());
    });

    return defer.promise;
}
