const express = require('express');

// initialize routes
const apiRoutes = express.Router();

// controllers
const downloadsCtrl = require('../controllers/downloadsCtrl');
const searchCtrl = require('../controllers/searchCtrl');
const queueCtrl = require('../controllers/queueCtrl');
const mediasCtrl = require('../controllers/mediasCtrl');
const controlsCtrl = require('../controllers/controlsCtrl');

module.exports = app => {
    apiRoutes.get('/downloads', downloadsCtrl.getAll);
    apiRoutes.delete('/downloads', downloadsCtrl.deleteRecord);

    apiRoutes.get('/queue', queueCtrl.getRecords);
    apiRoutes.delete('/queue', queueCtrl.deleteRecord);
    apiRoutes.post('/queue', queueCtrl.addRecord);

    apiRoutes.get('/search', searchCtrl.search);

    apiRoutes.get('/files', mediasCtrl.getFiles);
    apiRoutes.get('/files/:filename', mediasCtrl.stream);
    apiRoutes.get('/files/:filename/thumb', mediasCtrl.thumb);
    apiRoutes.delete('/files/:filename', mediasCtrl.deleteFile);

    apiRoutes.get('/server', controlsCtrl.state);
    apiRoutes.get('/server/start', controlsCtrl.start);
    apiRoutes.get('/server/stop', controlsCtrl.stop);

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
    // app.get('/start', (req, res) => {

    // use apiRoutes in the /api route
    app.use('/api', apiRoutes);
};
