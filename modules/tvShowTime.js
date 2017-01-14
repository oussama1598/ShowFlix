const req = require("request");
const Q = require("q");
const fs = require("fs");
const utils = require("../utils/utils");
const config = require("./config")();
const async = require("async");

const TVST_CLIENT_ID = config['TVST_CLIENT_ID'];
const TVST_CLIENT_SECRET = config['TVST_CLIENT_SECRET'];
const TVST_ACCESS_TOKEN_URI = config['TVST_ACCESS_TOKEN_URI'];
const TVST_LIBRARY_URI = config['TVST_LIBRARY_URI'];

let RUN = false;
let TIMER = false;

function getAuth(code) {
    return Q.Promise((resolve, reject) => {
        const form = { client_id: TVST_CLIENT_ID, client_secret: TVST_CLIENT_SECRET, code };
        const url = TVST_ACCESS_TOKEN_URI;

        req.post({ url, form }, (err, res, body) => {
            body = (err || res.statusCode !== 200) ? null : JSON.parse(body);
            if (err || res.statusCode !== 200 || body.result === "KO") return reject(err || body.message);

            resolve(body.access_token);
        })
    })
}

function getTowatch(page, cb, add) {
    const ACCESS_TOKEN = require("./config")()['ACCESS_TOKEN'];

    let infos = utils.getInfosData(config['INFOS_PATH']),
        showsTo = infos['tvshowtimefeed'];

    if (!showsTo || !ACCESS_TOKEN) return;

    req.get({ url: TVST_LIBRARY_URI, qs: { access_token: ACCESS_TOKEN, limit: 40, page } }, (err, res, body) => {
        body = (err || res.statusCode !== 200) ? null : JSON.parse(body);

        if (err || res.statusCode !== 200 || body.result === "KO") return;

        if (res.headers['x-ratelimit-remaining'] > 0) {

            async.forEach(body.shows, (val, callback) => {
                if (val.last_aired) {
                    const { number, season_number } = val.last_aired,
                        show = showsTo.filter(item => val.name.toLowerCase().indexOf(item.name) > -1);

                    if (show.length > 0) {
                        const last_seen = {
                            number: (show[0].lasEpisode) ? show[0].lasEpisode : (val.last_seen) ? val.last_seen.number : null,
                            season: (show[0].lastSeason) ? show[0].lastSeason : (val.last_seen) ? val.last_seen.season_number : null
                        }

                        if (last_seen.number && last_seen.season && (last_seen.number !== number || last_seen.season !== season_number)) {
                            infos['tvshowtimefeed'][showsTo.indexOf(show[0])].lastSeason = season_number;
                            infos['tvshowtimefeed'][showsTo.indexOf(show[0])].lasEpisode = number;

                            utils.UpdateInfosData(infos, config['INFOS_PATH'], () => {
                                add({ name: show[0].name, from: (last_seen.number + 1), season: season_number });
                                callback();
                            });
                        } else {
                            callback()
                        }
                    } else {
                        callback()
                    }
                } else {
                    callback()
                }
            }, err => {
                if (body.shows.length > 0) {
                    getTowatch(++page, cb, add);
                } else {
                    cb()
                }
            })
        } else {
            const delay = ((new Date(parseFloat(res.headers['x-ratelimit-reset']) * 1000).getTime() / 1000) - (new Date().getTime() / 1000)) + 10;
            setTimeout(() => { getTowatch(page, cb, add) }, delay * 1000);
        }
    })
}

function start(add) {
    clearTimeout(TIMER);

    RUN = true;
    TIMER = setTimeout(() => {
        getTowatch(0, () => {
            if (RUN) start(add);
        }, add)
    }, require("./config")()['FEED_FREQUENCY']);
}

function stop() {
    clearTimeout(TIMER);
    RUN = false;
}

// TODO =>
// find a way of checking if file is done


module.exports = {
    getAuth,
    start,
    stop
}
