const utils = require('../utils/utils');
const _ = require('underscore');

function getUrl($) {
    const results = [];

    let better = null;

    $('source').each(function () {
        const quality = $(this).attr('res');

        results.push({
            streamUrl: $(this).attr('src'),
            quality: quality ? quality.split('x')[1] : null
        });
    });

    _.each(results, item => {
        if (
            item.quality &&
            (!better || (parseInt(better.quality, 10) < parseInt(item.quality, 10)))
        ) {
            better = item;
        }
    });

    return better.streamUrl;
}

module.exports = function (url) {
    _log(url);
    console.log('estream start parsing');
    return utils.getHtml(url).then($ => {
        console.log('estream HTML loaded!');
        return getUrl($);
    });
};
