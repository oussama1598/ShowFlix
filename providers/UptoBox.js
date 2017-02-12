const utils = require("../utils/utils");
const Q = require("q");
const request = require("request");
var $;

function loadHtml(url, done) {
    utils.getHtml(url).then(html => {
        console.log("Uptobox HTML loaded!");
        $ = html;
        done();
    })
}

function getUrl() {
    let results = [];

    $("source").each(function () {
        results.push("http:" + $(this).attr("src"));
    })

    return results[1];
}

module.exports = function(url) {
    const defer = Q.defer();
    console.log("Uptobox start parsing")

    loadHtml(url, () => {
        defer.resolve({url: getUrl(), code: url});
    });

    return defer.promise;
}
