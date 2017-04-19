const tvShowsApi = require('../lib/tvShowsApi');
const config = require('./config');
const parseTorrent = require('parse-torrent');
const _ = require('underscore');
const mediasHandler = require('./mediasHandler');
const utils = require('../utils/utils');

const BuildNextElement = (_index = -1) => { // the queue index default to -1
  const db = global.queuedb.db()
    .get('queue');
  const data = db.value();
  // if the index is the last one do not repeat those who are already tried
  const results = db.filter(item =>
      !item.done && (parseInt(_index, 10) !== (data.length - 1) ? true : !item.tried))
    .value();
  const index = (parseInt(_index, 10) + 1)
    .toString();

  // this returns to the first element in the queue
  if (parseInt(index, 10) > (data.length - 1) && results.length > 0) {
    global.infosdb.db()
      .set('queue', '0')
      .write();
    return Promise.resolve();
  }

  global.infosdb.db()
    .set('queue', index)
    .write(); // update the queue index in infos db
  return Promise.resolve(); // resolve the promise
};

const MoveToNext = (magnetURI, notDone) => { // details are episode name, number season
  if (!global.RUNNING) return; // this will return without doing nothing if the parsing is Stopped

  global.queuedb.db()
    .get('queue')
    .find({
      magnet: magnetURI,
    })
    .assign({
      done: !notDone,
      tried: true,
    })
    .write(); // update the queue element with done and tried

  BuildNextElement(global.infosdb.db()
      .get('queue')
      .value())
    .then(() => {
      parseQueue();
    }); // build the next element means add one to queue index
};

const startDownloading = ({
  name,
  episode,
  season,
  magnet,
}) => {
  const infoHash = parseTorrent(magnet)
    .infoHash;
  const dbRecord = utils.createDownloadEntry(infoHash);

  new Promise((resolve, reject) => {
      global.webTorrent.add(magnet, {
        path: config('SAVETOFOLDER'),
      }, (torrent) => {
        mediasHandler.createFile(name, season, episode, infoHash);
        dbRecord.assign({
            episode,
            magnet,
            season,
            name,
          })
          .write();
        console.log(`Started ${name} S${season}E${episode}`.green);

        torrent.on('done', () => {
          console.log(`Finished ${name} S${season}E${episode}`.green);
          resolve();
        });

        torrent.on('error', () => {
          reject();
        });
      });
    })
    .then(() => {
      mediasHandler.updateFile(infoHash, {
        done: true,
      });
      console.log('Next in the Queue'.green);
      setTimeout(() => MoveToNext(magnet), 1000);
    })
    .catch((error) => {
      mediasHandler.removeFile(infoHash);
      console.log(error.toString()
        .red);
      console.log('Passing this episode'.red);
      MoveToNext(magnet, true); // move to the next one
    });
};

const parseQueue = () => {
  const queueData = global.queuedb.db()
    .get('queue'); // get the db instance
  const index = global.infosdb.db()
    .get('queue')
    .value(); // get the queue index
  const episodeEl = queueData.value()[index]; // get the queue index

  if (queueData.value()
    .length === 0 || !episodeEl) { // check if theres more episodes
    console.log('All Done'.green);
    global.RUNNING = false; // stop the parsing
    return; // exit this function with nothing
  }
  if (!episodeEl.done) { // if the episode is done or does not exist
    startDownloading(episodeEl);
  } else {
    MoveToNext(episodeEl.magnet); // if the episodeEl is already downloaded move to the next one
  }
};

const parseEpisodeMagnet = (episode) => {
  const magnet = episode.torrents[config('PREFERED_QUALITY')];

  return magnet ? {
    magnet: magnet.url,
    quality: config('PREFERED_QUALITY'),
  } : null;
};

const addEpisodeToQueue = (name, season, episode, magnet) => {
  if (!magnet) return;

  const db = global.queuedb.db()
    .get('queue');
  const exists = db.find({
      name,
      season,
      episode,
    })
    .value();

  if (!exists) {
    db.push({
        name,
        season,
        episode,
        magnet: magnet.magnet,
        quality: magnet.quality,
        tried: false,
        done: false,
      })
      .write();
  }
};

const clearQueue = () => Promise.resolve()
  .then(() => {
    const data = global.queuedb.db()
      .get('queue'); // retreive queue data
    data.remove(item => item.done)
      .write(); // remove finished items

    if (data.value()
      .length === 0) {
      // check if the data is empty if so reject the promise
      return Promise.reject('Data is empty please try again.');
    }
    return true;
  });

module.exports.start = (_index) => {
  const index = _index;

  // if the parsing is already started then do nothing
  if (global.RUNNING) {
    return Promise()
      .resolve();
  }

  global.RUNNING = true;
  return clearQueue()
    .then(() => BuildNextElement(index))
    .then(() => {
      global.log('Parsing Started'.yellow); // log to the terminal that the parse is started
      parseQueue();
    })
    .catch((err) => {
      console.log(err.red); // log the error to the client

      global.RUNNING = false;
      return Promise.reject(err); // return the error
    });
};

module.exports.stop = () => {
  global.RUNNING = false;
  global.log('Parsing Stopped'.yellow);
  //  if (global.Dl) global.Dl.pause(); // pause the download
};

module.exports.addtoQueue = (name, season, from = 1, _to = 'f', episode) =>
  tvShowsApi.search(name, season, episode)
  .then((data) => {
    if (episode) {
      return parseEpisodeMagnet(episode) ||
        Promise.reject(new Error('could not found an episode with prefered quality'));
    }

    return data;
  })
  .then((data) => {
    if (episode) {
      addEpisodeToQueue(name, season, episode, data);
      return Promise.resolve();
    }

    const to = _to === 'f' ?
      _.sortBy(data, item => -item.episode)[0].episode :
      _to;

    return _.chain(data)
      .filter(ep => ep.episode >= from && ep.episode <= to)
      .forEach(ep => addEpisodeToQueue(name, season, ep.episode, parseEpisodeMagnet(ep)));
  });
