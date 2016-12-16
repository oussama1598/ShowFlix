const Q = require("q");
const downloader = require("../utils/downloader");
const utils = require("../utils/utils");
const colors = require("colors");
const path = require("path");
const DATAPATH = path.join(__dirname, "../data");
let infos = require("../data/infos.json");

const srcs = {
    sources: {},
    get: function(name) {
        return srcs.sources[name];
    },
    set: function(name) {
        srcs.sources[name] = require(`./${name}`);
    },
    MoveToNext: function(name) {
        const _this = srcs;
        utils.BuildNextEpisode(infos, i => {
            infos = i;
            _this.getMediaUrlFor(name, 0);
        });
    },
    getMediaUrlFor: function(name, prov, code, index) {
        const _this = srcs,
            defer = Q.defer(),
            src = _this.get(name);
            
        src.parseUrl(infos, code, DATAPATH).then(code => {
            src.decodeForProvider(code, prov).then(url => {
                console.log(`Url Found ${url}`.green)

                downloader.download(url, infos, index).then(() => {
                    console.log("Next Episode".green)
                    _this.MoveToNext(name, infos)

                }).catch(index => {

                    src.canNextProvider(prov).then(num => {
                        _this.getMediaUrlFor(name, num, code, index);
                    }).catch(() => {
                        _this.MoveToNext(name)
                    })

                })
            })
        })
    },
    initialize: function(name) {
        return srcs.get(name).init(infos, DATAPATH);
    }
}

srcs.set("4helal");
srcs.set("cera");
srcs.set("cimaclub");

module.exports = { 
    getMediaUrlFor: srcs.getMediaUrlFor, 
    initialize: srcs.initialize 
};
