const utils = require('../utils/utils');

function getUrl($) {
    const results = [];

    $('source').each(function () {
        results.push(`http:${this.attr('src')}`);
    });

    return results[1];
}

module.exports = function (url) {
    console.log('Uptobox start parsing');

    return utils.getHtml(url).then($ => {
        console.log('Uptobox HTML loaded!');
        return getUrl($);
    });
};
