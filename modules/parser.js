const tvShowsApi = require("../lib/tvShowsApi");
const config = require("./config");
const parseTorrent = require("parse-torrent");
const _ = require("underscore");
const utils = require("../utils/utils");
const filenameParser = require("video-name-parser");
const request = require("request");
const fs = require("fs");
const os = require("os");
const path = require("path");
const filesHelper = require("../helpers/filesHelper");
const torrentEngine = require("./torrentEngine");

const BuildNextElement = (_index = -1) => {
  // the queue index default to -1
  const db = global.queuedb.get();
  const data = db.value();
  // if the index is the last one do not repeat those who are already tried
  const results = db
    .filter(
      item =>
        !item.done &&
        (parseInt(_index, 10) !== data.length - 1 ? true : !item.tried)
    )
    .value();
  const index = (parseInt(_index, 10) + 1).toString();

  // this returns to the first element in the queue
  if (parseInt(index, 10) > data.length - 1 && results.length > 0) {
    global.infosdb.db().set("queue", "0").write();
    return Promise.resolve();
  }

  global.infosdb.db().set("queue", index).write(); // update the queue index in infos db
  return Promise.resolve(); // resolve the promise
};

const MoveToNext = (magnetURI, notDone) => {
  // details are episode name, number season
  if (!global.RUNNING) return; // this will return without doing nothing if the parsing is Stopped

  global.queuedb.update(
    {
      magnet: magnetURI
    },
    {
      done: !notDone,
      tried: true
    }
  );

  BuildNextElement(global.infosdb.get("queue").value()).then(() => {
    parseQueue();
  }); // build the next element means add one to queue index
};

const startDownloading = ({ name, episode, season, magnet }) => {
  const infoHash = parseTorrent(magnet).infoHash;
  utils.createDownloadEntry(infoHash);

  new Promise((resolve, reject) => {
    global.webTorrent.add(
      magnet,
      {
        path: config("SAVETOFOLDER")
      },
      torrent => {
        filesHelper.createFile(name, season, episode, infoHash);
        global.downloadsdb.update(
          {
            infoHash
          },
          {
            episode,
            magnet,
            season,
            name
          }
        );

        console.log(`Started ${name} S${season}E${episode}`.green);

        torrent.on("done", () => {
          console.log(`Finished ${name} S${season}E${episode}`.green);
          resolve();
        });

        torrent.on("error", () => {
          reject();
        });
      }
    );
  })
    .then(() => {
      filesHelper.updateFile(infoHash, {
        done: true
      });
      console.log("Next in the Queue".green);
      setTimeout(() => MoveToNext(magnet), 1000);
    })
    .catch(error => {
      filesHelper.removeFile(infoHash);
      console.log(error.toString().red);
      console.log("Passing this episode".red);
      MoveToNext(magnet, true); // move to the next one
    });
};

const parseQueue = () => {
  const queueData = global.queuedb.get();
  const index = global.infosdb.get("queue").value(); // get the queue index
  const episodeEl = queueData.value()[index]; // get the queue index

  if (queueData.value().length === 0 || !episodeEl) {
    // check if theres more episodes
    console.log("All Done".green);
    global.RUNNING = false; // stop the parsing
    return; // exit this function with nothing
  }
  if (!episodeEl.done) {
    // if the episode is done or does not exist
    startDownloading(episodeEl);
  } else {
    MoveToNext(episodeEl.magnet); // if the episodeEl is already downloaded move to the next one
  }
};

const parseEpisodeMagnet = torrents =>
  _.chain(torrents)
    .filter(torrent => torrent.quality === config("PREFERED_QUALITY"))
    .sortBy(torrent => -torrent.seeds)[0];

const addEpisodeToQueue = (name, episode) => {
  const torrent = parseEpisodeMagnet(episode.torrents);

  const db = global.queuedb;
  const exists = db
    .find({
      infoHash: torrent.hash
    })
    .value();

  if (!exists) {
    db.add({
      infoHash: torrent.hash,
      name,
      season: parseInt(episode.season, 10),
      episode: parseInt(episode.season, 10),
      magnet: torrent.magnet,
      quality: torrent.quality,
      file: torrent.file,
      tried: false,
      done: false
    });
  }
};

const clearQueue = () =>
  Promise.resolve().then(() => {
    const data = global.queuedb.get(); // retreive queue data
    data.remove(item => item.done).write(); // remove finished items

    if (data.value().length === 0) {
      // check if the data is empty if so reject the promise
      return Promise.reject("Data is empty please try again.");
    }
    return true;
  });

module.exports.start = _index => {
  const index = _index;

  // if the parsing is already started then do nothing
  if (global.RUNNING) {
    return Promise().resolve();
  }

  global.RUNNING = true;
  return clearQueue()
    .then(() => BuildNextElement(index))
    .then(() => {
      global.log("Parsing Started".yellow); // log to the terminal that the parse is started
      parseQueue();
    })
    .catch(err => {
      console.log(err.red); // log the error to the client

      global.RUNNING = false;
      return Promise.reject(err); // return the error
    });
};

module.exports.stop = () => {
  global.RUNNING = false;
  global.log("Parsing Stopped".yellow);
  torrentEngine.destroy();
};

module.exports.addtoQueue = (name, season, from = 1, _to = "f") =>
  tvShowsApi.search(name, season).then(data => {
    const to = _to === "f"
      ? _.sortBy(data, item => -item.episode)[0].episode
      : _to;

    return _.chain(data)
      .filter(ep => ep.episode >= from && ep.episode <= to)
      .forEach(ep => addEpisodeToQueue(name, season, episode));
  });
