const req = require('request');
const config = require('../modules/config');
const async = require('async');
const utils = require('../utils/utils');

let RUN = false;
let TIMER = false;

const removeParenthesis = (str) => {
  return str.indexOf('(') > -1 ? str.substr(0, str.indexOf('('))
    .trim() : str;
};

const getTowatch = (_page, cb, add) => {
  const ACCESS_TOKEN = config('ACCESS_TOKEN');
  const showsTo = global.infosdb.db()
    .get('tvshowtimefeed')
    .value();
  let page = _page;

  if (!showsTo || !ACCESS_TOKEN) return;

  req.get({
    url: config('TVST_LIBRARY_URI'),
    qs: {
      access_token: ACCESS_TOKEN,
      limit: 40,
      page,
    },
  }, (err, res, _body) => {
    const body = (err || res.statusCode !== 200) ? null : JSON.parse(_body);

    if (!body || body.result === 'KO') return;

    if (res.headers['x-ratelimit-remaining'] > 0) {
      async.forEach(body.shows, (val, callback) => {
        if (val.last_aired) {
          const {
            number,
            season_number,
          } = val.last_aired;
          const show = showsTo.find(item =>
            item.name.toLowerCase() === removeParenthesis(val.name.toLowerCase()));

          if (show) {
            const lastSeenNumber = val.last_seen ? val.last_seen.number : null;
            const lastSeenSeason = val.last_seen ? val.last_seen.season_number : null;
            const lastSeen = {
              number: show.lastEpisode ? show.lastEpisode : lastSeenNumber,
              season: show.lastSeason ? show.lastSeason : lastSeenSeason,
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
                keyword: show.name,
                from,
                season: season_number,
                number,
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
        (new Date(parseFloat(res.headers['x-ratelimit-reset']) * 1000)
          .getTime() / 1000) -
        (new Date()
          .getTime() / 1000)) + 10;
      setTimeout(() => {
        getTowatch(page, cb, add);
      }, delay * 1000);
    }
  });
};

const watch = (add) => {
  clearTimeout(TIMER);

  RUN = true;
  TIMER = setTimeout(() => {
    getTowatch(0, () => {
      if (RUN) watch(add);
    }, add);
  }, parseInt(config('FEED_FREQUENCY'), 10));
};

const stop = () => {
  clearTimeout(TIMER);
  RUN = false;
};

const getAuth = (code) => {
  const form = {
    client_id: config('TVST_CLIENT_ID'),
    client_secret: config('TVST_CLIENT_SECRET'),
    code,
  };
  const url = config('TVST_ACCESS_TOKEN_URI');

  return utils.getHtml(url, true, 'POST', form)
    .then(body => body.access_token);
};

module.exports = {
  watch,
  stop,
  getAuth,
};
