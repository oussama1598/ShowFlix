const tvShowsApi = require('../lib/tvShowsApi')
const config = require('./config')
const _ = require('underscore')
const utils = require('../utils/utils')
const filesHelper = require('../helpers/filesHelper')
const torrentEngine = require('./torrentEngine')

torrentEngine
  .on('start', infoHash => {
    const data = global.downloadsdb.find({ infoHash }).value()
    console.log(`Started ${data.name} S${data.season}E${data.episode}`.green)

    filesHelper.createFile(data.name, data.season, data.episode, infoHash)
  })
  .on('done', infoHash => {
    filesHelper.updateFile(infoHash, {
      done: true
    })
    console.log('Next in the Queue'.green)

    if (!global.RUNNING) return
    setTimeout(() => MoveToNext(infoHash), 1000)
  })
  .on('error', infoHash => {
    filesHelper.removeFile(infoHash)
    console.log('Passing this episode'.red)

    if (!global.RUNNING) return
    MoveToNext(infoHash, true) // move to the next one
  })

const BuildNextElement = (_index = -1) => {
  // the queue index defaults to -1
  const db = global.queuedb.get()
  const data = db.value()
  // if the index is the last one do not repeat those who are already tried
  const results = db
    .filter(
      item =>
        !item.done &&
        (parseInt(_index, 10) !== data.length - 1 ? true : !item.tried)
    )
    .value()
  const index = (parseInt(_index, 10) + 1).toString()

  // this returns to the first element in the queue
  if (parseInt(index, 10) > data.length - 1 && results.length > 0) {
    global.infosdb.db().set('queue', '0').write()
    return Promise.resolve()
  }

  global.infosdb.db().set('queue', index).write() // update the queue index in infos db
  return Promise.resolve() // resolve the promise
}

const MoveToNext = (infoHash, notDone) => {
  // details are episode name, number season
  if (!global.RUNNING) return

  global.queuedb.update(
    {
      infoHash
    },
    {
      done: !notDone,
      tried: true
    }
  )

  BuildNextElement(global.infosdb.get('queue').value()).then(() => {
    parseQueue()
  }) // build the next element means add one to queue index
}

const startDownloading = episodeData => {
  utils.createDownloadEntry(episodeData)
  torrentEngine.add(episodeData.magnet, config('SAVETOFOLDER'))
}

const parseQueue = () => {
  const queueData = global.queuedb.get()
  const index = global.infosdb.get('queue').value() // get the queue index
  const episodeEl = queueData.value()[index] // get the queue index

  if (queueData.value().length === 0 || !episodeEl) {
    console.log('All Done'.green)
    global.RUNNING = false // stop the parsing
    return
  }
  if (!episodeEl.done) {
    // if the episode is done or does not exist
    startDownloading(episodeEl)
  } else {
    MoveToNext(episodeEl.infoHash) // if the episodeEl is already downloaded move to the next one
  }
}

const parseEpisodeMagnet = torrents =>
  _.chain(torrents)
    .filter(torrent => torrent.quality === config('PREFERED_QUALITY'))
    .sortBy(torrent => -torrent.seeds)
    .value()[0]

const addEpisodeToQueue = (name, episode) => {
  const torrent = parseEpisodeMagnet(episode.torrents)

  const db = global.queuedb
  const exists = db
    .find({
      infoHash: torrent.hash
    })
    .value()

  if (!exists) {
    db.add({
      infoHash: torrent.hash,
      name,
      season: parseInt(episode.season, 10),
      episode: parseInt(episode.episode, 10),
      magnet: torrent.magnet,
      quality: torrent.quality,
      file: torrent.file,
      tried: false,
      done: false
    })
  }
}

const clearQueue = () =>
  Promise.resolve().then(() => {
    const data = global.queuedb.get() // retreive queue data
    data.remove(item => item.done).write() // remove finished items

    if (data.value().length === 0) {
      // check if the data is empty if so reject the promise
      return Promise.reject('Data is empty please try again.')
    }
    return true
  })

module.exports.start = index => {
  // if the parsing is already started then do nothing
  if (global.RUNNING) {
    return Promise().resolve()
  }

  global.RUNNING = true
  return clearQueue()
    .then(() => BuildNextElement(index))
    .then(() => {
      global.log('Parsing Started'.yellow) // log to the terminal that the parse is started
      parseQueue()
    })
    .catch(err => {
      console.log(err.red) // log the error to the client

      global.RUNNING = false
      return Promise.reject(err) // return the error
    })
}

module.exports.stop = () => {
  if (!global.RUNNING) return

  global.RUNNING = false
  global.log('Parsing Stopped'.yellow)
  torrentEngine.destroy()
}

module.exports.addtoQueue = (name, season, from = 1, _to = 'f') =>
  tvShowsApi.search(name, season).then(data => {
    const to = _to === 'f'
      ? _.sortBy(data, item => -item.episode)[0].episode
      : _to

    return _.chain(data)
      .filter(
        ep => parseInt(ep.episode, 10) >= from && parseInt(ep.episode, 10) <= to
      )
      .forEach(episode => addEpisodeToQueue(name, episode))
  })
