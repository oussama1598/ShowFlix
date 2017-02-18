const utils = require("../utils/utils");

function getUrl($) {
    let results = [];

    $("source").each(function() {
        results.push($(this).attr("src"));
    })

    return results[0];
}

module.exports = function(url) {
    return utils.getHtml(url).then($ => {
        return getUrl($);
    })
}
