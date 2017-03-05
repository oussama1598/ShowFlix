const utils = require('../utils/utils');
const _ = require('underscore');

module.exports = function (_url) {
    let url = _url;

    console.log('googleDrive start parsing');
    _log(url);

    url = `http://api.getlinkdrive.com/getlink?url=${url}`;

    return utils.getHtml(url, true).then(res => {
        let lastRes = {
            res: 0,
            src: null
        };
        _.each(res, val => {
            const resolution = parseInt(val.res.replace('p', ''), 10);

            if (resolution > lastRes.res) {
                lastRes = {
                    resolution,
                    src: val.src
                };
            }
        });

        return lastRes.src;
    });
};
