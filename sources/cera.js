const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");

module.exports = extend(true, {
    name: "cera",
    providerCodes: [{ code: 3, name: "openload" }, { code: 2, name: "keeload" }, { code: 4, name: "Uptobox" }, {code: 1, name: "googleDrive"}],
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cera.online/wp-content/themes/Theme/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {
            name: infos.name,
            season: infos.season
        };

        $(".episodesList a").each(function(e) {
            const Enumber = $(this).attr("class").replace("serie", ""),
                url = $(this).attr("href");

            Urls[Enumber] = url;
        });
        return Urls;

    },
    Parse: function(SourceUrl) {
        
        return utils.getHtml(SourceUrl).then($ => {
            let url = $("link[rel='shortlink']").attr("href");
            if (url)
                url = url ? urlParser.parse(url, true).query.p : false;
            else
                url = $("div[id^='post-ratings-']").attr("id").replace("post-ratings-", "");

            return url;
        });
    }
}, sourceBase);
