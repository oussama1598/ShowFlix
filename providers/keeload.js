const utils = require('../utils/utils');

function getUrl($) {
    const results = [];

    $('source').each(function () {
        results.push($(this).attr('src'));
    });

    return results[0];
}

module.exports = function (url) {
    return utils.getHtml(url).then($ => getUrl($));
};
