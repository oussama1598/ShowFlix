const Q = require("q");
const utils = require("../utils/utils");
const _ = require("underscore");

module.exports = function(url) {
    console.log("googleDrive start parsing")

    url = `http://api.getlinkdrive.com/getlink?url=${url}`;

    return utils.getHtml(url, true).then(res => {
    	res = JSON.parse(res);

    	let lastRes = {res: 0, src: null};
    	_.each(res, val => {
    		const res = parseInt(val.res.replace("p", ""));

    		if(res > lastRes.res) lastRes = {res, src: val.src};
    	})

    	return lastRes.src;
    })
}
