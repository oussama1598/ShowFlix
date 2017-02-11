const utils = require("../utils/utils");

module.exports = function(url) {
    console.log("theVideo start parsing")
    return utils.getHtml(`http://video-downloader.herokuapp.com/download?url=${url}`, true).then(data => {
        return JSON.parse(data).streamUrl;
    })
}
