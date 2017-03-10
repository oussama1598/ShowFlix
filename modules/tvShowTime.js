const req = require('request');
const config = require('./config');
const async = require('async');
const utils = require('../utils/utils');

const TVST_CLIENT_ID = config('TVST_CLIENT_ID');
const TVST_CLIENT_SECRET = config('TVST_CLIENT_SECRET');
const TVST_ACCESS_TOKEN_URI = config('TVST_ACCESS_TOKEN_URI');
const TVST_LIBRARY_URI = config('TVST_LIBRARY_URI');

let RUN = false;
let TIMER = false;

function getAuth(code) {
    const form = {
        client_id: TVST_CLIENT_ID,
        client_secret: TVST_CLIENT_SECRET,
        code
    };
    const url = TVST_ACCESS_TOKEN_URI;

    return utils.getHtml(url, true, 'POST', form).then(body => body.access_token);
}

function getTowatch(_page, cb, add) {
    const ACCESS_TOKEN = config('ACCESS_TOKEN');
    const showsTo = global.infosdb.db().get('tvshowtimefeed').value();
    let page = _page;

    if (!showsTo || !ACCESS_TOKEN) return;

    req.get({
        url: TVST_LIBRARY_URI,
        qs: {
            access_token: ACCESS_TOKEN,
            limit: 40,
            page
        }
    }, (err, res, _body) => {
        const body = (err || res.statusCode !== 200) ? null : JSON.parse(_body);

        if (err || res.statusCode !== 200 || body.result === 'KO') return;

        if (res.headers['x-ratelimit-remaining'] > 0) {
            async.forEach(body.shows, (val, callback) => {
                if (val.last_aired) {
                    const {
                        number,
                        season_number
                    } = val.last_aired;

                    const show = showsTo.filter(item =>
                        val.name.toLowerCase().indexOf(item.name) > -1);

                    if (show.length > 0) {
                        const lastSeenNumber = val.last_seen ? val.last_seen.number : null;
                        const lastSeenSeason = val.last_seen ? val.last_seen.season_number : null;

                        const lastSeen = {
                            number: (show[0].lastEpisode) ? show[0].lastEpisode : lastSeenNumber,
                            season: (show[0].lastSeason) ? show[0].lastSeason : lastSeenSeason
                        };

                        if (
                            lastSeen.number &&
                            lastSeen.season &&
                            (lastSeen.number !== number || lastSeen.season !== season_number)
                        ) {
                            const from = lastSeen.season === season_number ?
                                (lastSeen.number + 1) :
                                number;

                            add({
                                keyword: show[0].name,
                                from,
                                season: season_number,
                                number
                            });
                        }
                    }
                }

                callback();
            }, () => {
                if (body.shows.length > 0) {
                    getTowatch(++page, cb, add);
                } else {
                    cb();
                }
            });
        } else {
            const delay = (
                (new Date(parseFloat(res.headers['x-ratelimit-reset']) * 1000).getTime() / 1000) -
                (new Date().getTime() / 1000)) + 10;
            setTimeout(() => {
                getTowatch(page, cb, add);
            }, delay * 1000);
        }
    });
}

function watch(add) {
    clearTimeout(TIMER);

    RUN = true;
    TIMER = setTimeout(() => {
        getTowatch(0, () => {
            if (RUN) watch(add);
        }, add);
    }, parseInt(config('FEED_FREQUENCY'), 10));
}

function stop() {
    clearTimeout(TIMER);
    RUN = false;
}

module.exports = {
    getAuth,
    watch,
    stop
};
