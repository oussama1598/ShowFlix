const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");

module.exports = extend(true, {
    name: "cimaclub",
    providerCodes: [{ code: 1, name: "openload" }],
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://cimaclub.com/wp-content/themes/Cimaclub/servers/server.php?q=${Ecode}&i=${code}`;

        return utils.getHtml(serverUrl).then($ => {
            return provider($("iframe").attr("src"));
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {
            name: infos.name,
            season: infos.season
        };

        $(".episode a").each(function(e) {
            $(this).find("span").remove();

            const Enumber = $(this).text().trim(),
                url = decodeURI($(this).attr("href")) + "?view=1";

            Urls[Enumber] = url;
        });

        return Urls;

    },
    Parse: function($) {
        return urlParser.parse($("link[rel='shortlink']").attr("href"), true).query.p;
    }
}, sourceBase);
