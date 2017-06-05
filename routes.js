const express = require('express')

// initialize routes
const apiRoutes = express.Router()

// controllers
const downloadsCtrl = require('./controllers/downloadsCtrl')
const searchCtrl = require('./controllers/searchCtrl')
const queueCtrl = require('./controllers/queueCtrl')
const mediasCtrl = require('./controllers/mediasCtrl')
const controlsCtrl = require('./controllers/controlsCtrl')
const subtitlesCtrl = require('./controllers/subtitlesCtrl')
const settingsCtrl = require('./controllers/settingsCtrl')
const showCtrl = require('./controllers/showCtrl')

// custom middelwares
const medias = require('./middlewares/medias')

module.exports = () => {
  apiRoutes
    .route('/downloads')
    .get(downloadsCtrl.getAll)
    .delete(downloadsCtrl.deleteRecord)

  apiRoutes
    .route('/queue')
    .get(queueCtrl.getRecords)
    .delete(queueCtrl.deleteRecord)
    .post(queueCtrl.addRecord)

  apiRoutes.get('/search', searchCtrl.search)
  apiRoutes.get('/files', mediasCtrl.getFiles)

  apiRoutes
    .route('/files/:infoHash')
    .get(medias.check(), mediasCtrl.stream)
    .delete(medias.check(), mediasCtrl.deleteFile)

  apiRoutes.get('/files/:infoHash/thumb', medias.check(), mediasCtrl.thumb)

  apiRoutes
    .route('/files/:infoHash/subs')
    .get(medias.check(), subtitlesCtrl.getSubs)
    .post(medias.check(), subtitlesCtrl.downloadSub)

  apiRoutes.get('/server', controlsCtrl.state)
  apiRoutes.get('/server/start', controlsCtrl.start)
  apiRoutes.get('/server/stop', controlsCtrl.stop)

  apiRoutes.get('/settings', settingsCtrl.getSettings)

  apiRoutes.get('/show/:imdb', showCtrl.getShow)

  // app.get('/tvshowfeed', (req, res) => {
  //     if (!req.query.code) {
  //         return res.send({
  //             status: 'error',
  //             error: 'code is required'
  //         });
  //     }
  //
  //     tvshowTime.getAuth(req.query.code).then(() => { //accessToken => {
  //         // let conf = config('ACCESS_TOKEN');
  //         // conf['ACCESS_TOKEN'] = accessToken;
  //         // utils.updateConfig(conf, () => {
  //         //     res.redirect('/')
  //         // }); // to be updated
  //     }).catch(error => {
  //         res.send({
  //             status: 'error',
  //             error
  //         });
  //     });
  // });
  //
  return apiRoutes
}
