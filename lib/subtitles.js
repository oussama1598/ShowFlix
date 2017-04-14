const Xray = require('x-ray');

const x = Xray({
    filters: {
        trim: value => value.trim()
    }
});
const URL = 'https://subscene.com/subtitles/release?q=';

const search = filename => new Promise((resolve, reject) => {
    x(`${URL}${filename}`, '.content table tr', [{
        name: '.a1 a span:nth-child(2) | trim',
        language: '.a1 a span:nth-child(1) | trim',
        link: '.a1 a@href'
    }])((err, data) => {
        if (err) reject(err);
        resolve(data);
    });
});

const getDownloadUrl = url => new Promise((resolve, reject) => {
    x(url, '.download', {
        url: 'a@href'
    })((err, data) => {
        if (err) reject(err);

        resolve(data.url);
    });
});

module.exports = {
    search,
    getDownloadUrl
};
