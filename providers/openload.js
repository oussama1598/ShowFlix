const utils = require('../utils/utils');
const urlParser = require('url');
const _ = require('underscore');

module.exports = function (url) {
    console.log('OpenLoad start parsing');

    return utils.getHtml('https://api.ipify.org/?format=json', true).then(ip =>
        utils.getHtml(`http://video-downloader.herokuapp.com/download?url=${url}`, true).then(data =>
            replaceIp(buildIp(ip.ip), data.streamUrl)
        )
    );
};

function replaceIp(ip, url) {
    const str2 = urlParser.parse(url).pathname.split('~')[2];
    return url.replace(str2, ip);
}

function buildIp(_ip) {
    let ip = _ip;
    let str = '';

    ip = ip.split('.');
    ip[2] = ip[3] = 0;

    _.each(ip, _num => {
        const num = parseInt(_num, 10);
        const dot = num !== ip.length - 1 ? '.' : '';
        str += `${ip[num]}${dot}`;
    });

    return str;
}
