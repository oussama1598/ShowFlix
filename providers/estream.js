const utils = require("../utils/utils");
const _ = require("underscore");

function getUrl($) {
    let results = [],
        better = null;

    $("source").each(function() {
        let quality = $(this).attr("res");

        results.push({
            streamUrl: $(this).attr("src"),
            quality: quality ? quality.split("x")[1] : null
        });
    })

    _.each(results, item => {
        if (item.quality && (!better || (parseInt(better.quality) < parseInt(item.quality)))) better = item;
    })

    return better.streamUrl;
}

module.exports = function(url) {
    console.log("estream start parsing")
    return utils.getHtml(url).then($ => {
        console.log("estream HTML loaded!");
        return getUrl($);
    });
}
