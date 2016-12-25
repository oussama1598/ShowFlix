const utils = require("../utils/utils");
const providers = require("../providers/providers");
const sourceBase = require("./sourceBase");
const urlParser = require('url');
const extend = require("extend");

module.exports = extend(true, {
    name: "4helal",
    providerCodes: [{ code: 1, name: "top4top" }],
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
            provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://www.4helal.tv/ajax.php?id=${Ecode}&ajax=true&server=${code}`;

        return utils.getHtml(serverUrl, true).then(response => {
            return provider(urlParser.parse(response, true).query.url);
        })
    },
    BuildUrlsSource: function($, infos) {
        let Urls = {
            name: infos.name,
            season: infos.season
        };

        $(".episodes-table tbody tr").each(function(e) {
            const Enumber = $(this).find("td").eq(0).text(),
                url = $(this).find("td a").attr("href");

            Urls[Enumber] = url;
        });

        return Urls;

    },
    Parse: function($) {
        utils.getHtml(url).then($ => {
            const url = urlParser.parse($("meta[itemprop='embedURL']").attr("content"), true).query.f;

            return url;
        })
    }
}, sourceBase);
