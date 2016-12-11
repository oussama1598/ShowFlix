const Q = require("q");
const downloader = require("../utils/downloader");
const utils = require("../utils/utils");
const colors = require("colors");

const srcs = {
    sources: {},
    get: function(name) {
        return srcs.sources[name];
    },
    set: function(name) {
        srcs.sources[name] = require(`./${name}`);
    },
    MoveToNext: function(name, infos) {
    	const _this = srcs;
        utils.BuildNextEpisode(infos, infos => {
            _this.getMediaUrlFor(name, infos, 0);
        });
    },
    getMediaUrlFor: function(name, infos, prov, code, index) {
        const _this = srcs,
            defer = Q.defer(),
            src = _this.get(name);

        src.parseUrl(infos, code).then(code => {
            src.decodeForProvider(code, prov).then(url => {
            	console.log(`Url Found ${url}`.green)

                downloader.download(url, infos, index).then(() => {
                    console.log("Next Episode".green)
                   _this.MoveToNext(name, infos)

                }).catch(index => {

                    src.canNextProvider(prov).then(num => {
                        _this.getMediaUrlFor(name, infos, num, code, index);
                    }).catch(() => {
                        _this.MoveToNext(name, infos)
                    })

                })
            })
        })
    }
}

srcs.set("4helal");
srcs.set("cera");

module.exports = srcs.getMediaUrlFor;
