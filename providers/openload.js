const utils = require("../utils/utils");
const urlParser = require("url");

module.exports = function(url) {
    console.log("OpenLoad start parsing")

    return utils.getHtml('https://api.ipify.org/?format=json', true).then(ip => {
        _log(buildIp(ip.ip))
        return utils.getHtml(`http://video-downloader.herokuapp.com/download?url=${url}`, true).then(data => {
            return replaceIp(buildIp(ip.ip), data.streamUrl);
        });
    });
}

function replaceIp(ip, url) {
    var str2 = urlParser.parse(url).pathname.split("~")[2];
    return url.replace(str2, ip);
}

function buildIp(ip) {
    let str = "";
    ip = ip.split(".");
    ip[2] = ip[3] = 0;

    for (let num in ip) {
        num = parseInt(num);
        const dot = num !== ip.length - 1 ? "." : "";
        str += `${ip[num]}${dot}`;
    }
    return str;
}
