const debug = require('debug')('ShowFlix:TvShowTime');
const async = require('async');
const utils = require('../utils/utils');
const EventEmitter = require('events');
const URL = require('url')
  .URL;

const LIBRARY_URL = 'https://api.tvshowtime.com/v1/library';

const removeParenthesis = str => (str.indexOf('(') > -1 ? str.substr(0, str.indexOf('('))
  .trim() : str);

class TvShowTime extends EventEmitter {
  constructor() {
    super();

    this.RUN = false;
    this.DELAY = 10000;
    this.TIMER = null;
    this.accessToken = null;
    this.favList = null;
    this.endPointUrl = null;
    this.page = 0;
  }

  setParams(_delay = 10000, _accessToken, _favList) {
    this.DELAY = _delay;
    this.accessToken = _accessToken;
    this.favList = _favList;

    return this;
  }

  watch() {
    if (!this.accessToken ||
      !this.favList
    ) {
      throw new Error('You should set params first');
    }

    debug('Started watching');

    this.RUN = true;
    this.createTimer();

    return this;
  }

  stop() {
    this.RUN = stop;
    clearTimeout(this.TIMER);

    debug('Stopped watching');
  }

  createTimer(_delay) {
    if (!this.RUN) return;
    if (this.TIMER) clearTimeout(this.TIMER);

    this.TIMER = setTimeout(this.fetch.bind(this), _delay || this.DELAY);
  }

  fetch() {
    if (!this.RUN) return false;

    this.TIMER = null;
    const libarayUrl = new URL(LIBRARY_URL);
    libarayUrl.searchParams.append('access_token', this.accessToken);
    libarayUrl.searchParams.append('page', this.page);
    libarayUrl.searchParams.append('limit', 30);

    debug(`Checking user's library page: ${this.page}`);

    return utils.getHtml(libarayUrl.href, true, 'GET', {}, {}, 20000, true)
      .then((res) => {
        if (res.headers.get('x-ratelimit-remaining') === '0') {
          const toResetIn = new Date(res.headers.get('x-ratelimit-reset') * 1000)
            .getTime() / 1000;
          const now = new Date()
            .getTime() / 1000;
          const delay = (toResetIn - now) + 10;

          this.createTimer(delay * 1000);
          return Promise.reject(new Error(`Rate limit exceeded Waiting for ${delay.toFixed(0)}s`));
        }

        return res.json();
      })
      .then((body) => {
        if (body.result === 'KO') return Promise.reject(new Error(body.message));
        async.forEach(body.shows, (val, callback) => {
          if (!val.last_aired) return callback();

          const {
            number,
            season_number: seasonNumber,
          } = val.last_aired;
          const show = this.favList()
            .find(item =>
              item.name.toLowerCase() === removeParenthesis(val.name.toLowerCase()));

          if (!show || !val.last_seen) return callback();

          const lastSeenNumber = val.last_seen.number;
          const lastSeenSeason = val.last_seen.season_number;

          const lastSeen = {
            number: show.lastEpisode ? show.lastEpisode : lastSeenNumber,
            season: show.lastSeason ? show.lastSeason : lastSeenSeason,
          };


          if (
            lastSeen.number !== number ||
            lastSeen.season !== seasonNumber
          ) {
            const from = lastSeen.season === seasonNumber ?
              (lastSeen.number + 1) :
              number;

            this.emit('found', {
              keyword: show.name,
              from,
              season: seasonNumber,
              number,
            });

            debug(`Found: ${show.name}`);
          }

          return callback();
        }, () => {
          if (body.shows.length > 0) {
            this.page += 1;
            return this.createTimer(1);
          }

          this.page = 0;
          return this.createTimer();
        });

        return true;
      })
      .catch((err) => {
        debug(err.toString()
          .red);

        if (!this.TIMER) this.createTimer();
      });
  }

  set delay(value) {
    if (isNaN(value)) return;

    this.DELAY = parseInt(value, 10);
    this.createTimer();
  }
}

module.exports = new TvShowTime();

// module.exports.getAuth = (code) => {
//   const form = {
//     client_id: config('TVST_CLIENT_ID'),
//     client_secret: config('TVST_CLIENT_SECRET'),
//     code,
//   };
//   const url = config('TVST_ACCESS_TOKEN_URI');
//
//   return utils.getHtml(url, true, 'POST', form)
//     .then(body => body.access_token);
// };
