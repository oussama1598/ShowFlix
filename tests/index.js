// requeting file stream
// first check if the infoHash exists in the engine
// second check if the file is fully downloaded
// if the engine has the file request a stream instance if not stream normaly

const tvShowsApi = require('../modules/tvShowsApi');

tvShowsApi.search('lucfier', 1, 1)
    .then(result => {
        console.log(result);
    })
    .catch(err => {
        console.log(err.toString());
    });
