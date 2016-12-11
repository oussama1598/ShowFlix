const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');


module.exports = {
	providerCodes: [{code: 3, name: "openload"}, {code: 2, name: "keeload"}, {code: 4, name: "Uptobox"}],
	canNextProvider: function (){

	},
    decodeForProvider: function(Ecode) {
        const provDetails = this.providerCodes[0],
        	provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cera.online/wp-content/themes/Theme/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        })
    },
    parseUrl: function(infos) {
        const defer = Q.defer(),
            regExp = /^0[0-9].*$/,
            s = regExp.test(infos.season) ? ('' + infos.season)[1] : infos.season,
            e = regExp.test(infos.episode) ? ('' + infos.episode)[1] : infos.episode,
            url = `http://cera.online/mosalsal-the-blacklist-episode-${e}-season-${s}-s${infos.season}e${infos.episode}-watch-cima4u-download-translated-egfire-tv-series.html`;
        //url = `http://cera.online/the-blacklist-s${infos.season}e${infos.episode}.html`

        utils.getHtml(url).then($ => {
            defer.resolve(urlParser.parse($("link[rel='shortlink']").attr("href"), true).query.p);
        })
        return defer.promise;
    }
}
