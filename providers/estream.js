const utils = require('../utils/utils');
const _ = require('underscore');

function getUrl($) {
    let results = [];

    $('source').each(function () {
        const quality = $(this).attr('res');

        results.push({
            streamUrl: $(this).attr('src'),
            quality: quality ? quality.split('x')[1] : null
        });
    });

    results = _.chain(results)
        .filter(item => item.quality)
        .sortBy(item => -parseInt(item.quality, 10))
        .value();

    return results[0].streamUrl;
}

module.exports = url => {
    global.log(url);
    console.log('estream start parsing');
    return utils.getHtml(url).then($ => {
        console.log('estream HTML loaded!');
        return getUrl($);
    });
};
