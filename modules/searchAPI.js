const GoogleSearch = require('google-search');
const GOOGLE_API_KEY = "AIzaSyAKaazNPf7-FSKrVRH-sbmKEQTr7icbdRQ";

module.exports = (cx) => {
    return new GoogleSearch({
        key: GOOGLE_API_KEY,
        cx: cx
    });
};
