const Q = require("q");
const downloader = require("../modules/downloader");
const utils = require("../utils/utils");
const colors = require("colors");
const path = require("path");
const DATAPATH = path.join(__dirname, "../data");
let infos = require("../data/infos.json");

const srcs = {
    sources: {},
    get: function(name) {
        const source = srcs.sources[name];
        if (source)
            return source;
        else
            throw (new Error("This source can't be found"));
    },
    add: function(arr) {
        if (arr.constructor === Array) {
            arr.forEach(val => {
                srcs.sources[val] = require(`./${val}`);
            });
        }
    },
    MoveToNext: function(name) {
        const _this = srcs;
        if (!global.NOMORE) {
            utils.BuildNextEpisode(infos, i => {
                infos = i;
                _this.getMediaUrlFor(name, 0);
            });
        }
    },
    getMediaUrlFor: function(name, prov, code, index) {
        const _this = srcs,
            defer = Q.defer(),
            src = _this.get(name);

        src.parseUrl(infos, code, DATAPATH).then(code => {

            if (!code) {
                console.log("Can't parse this url check again".red);
                return;
            }
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
        }).catch(next => {
            if (next) {
                console.log("Passing this episode".red);
                _this.MoveToNext(name)
            }
        })
    },
    initialize: function(name) {
        return srcs.get(name).init(infos, DATAPATH);
    },
    start: function(name) {
        global.NOMORE = false;
        srcs.initialize(name).then(() => {
            srcs.getMediaUrlFor(name, 0)
        });
    },
    stop: function(name) {
        global.NOMORE = true;
        if(global.Dl)
            global.Dl.pause();
    }
}

srcs.add(["4helal", "cera", "cimaclub", "mosalsl"]);

module.exports = {
    getMediaUrlFor: srcs.getMediaUrlFor,
    initialize: srcs.initialize
};
