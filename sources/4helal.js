const utils = require("../utils/utils");
const providers = require("../providers/providers");
const Q = require("q");
const urlParser = require('url');
const colors = require('colors');


module.exports = {
	providerCodes: [{code: 1, name: "top4top"}, {code: 1, name: "top4top"}],
	canNextProvider: function (prov){
        const defer = Q.defer();
        ++prov;
        if(prov < this.providerCodes.length){
            console.log("Trying Next provider".red);
            defer.resolve(prov);
        }else{
            console.log("Passing this episode".red);
            defer.reject()
        }

        return defer.promise;
	},
    decodeForProvider: function(Ecode, prov) {
        const provDetails = this.providerCodes[prov],
        	provider = providers.get(provDetails.name),
            code = provDetails.code,
            serverUrl = `http://www.4helal.tv/ajax.php?id=${Ecode}&ajax=true&server=${code}`;

        return utils.getHtml(serverUrl, true).then(response => {
            return provider(urlParser.parse(response, true).query.url);
        })
    },
    parseUrl: function(infos, code) {
        const defer = Q.defer(),
            url = `http://www.4helal.tv/v/Series=The-Blacklist-S${infos.season}Ep${infos.episode}`;

        if(!code){
            console.log(`Parsing Episode ${infos.episode} Season ${infos.season} From 4helal`.green)
            
            utils.getHtml(url).then($ => {
                defer.resolve(urlParser.parse($("meta[itemprop='embedURL']").attr("content"), true).query.f);
            })
        }else{
            defer.resolve(code);
        }

        return defer.promise;
    }
}
