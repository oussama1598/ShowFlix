const GoogleSearch = require('google-search');
const config = require('./config');

module.exports = (cx) =>
    new GoogleSearch({
        key: config('GOOGLE_API_KEY'),
        cx: cx
    });
