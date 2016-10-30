const utils = require("./utils")
const Q = require("q")
const cheerio = require("cheerio")
const jjdecode = require("./jjdecode")

var html;

function loadHtml(url, done) {
    utils.getHtml(url).then($ => {
        html = $.html();
        done();
    })
}

function getScript(Avariable, num) {
    return function(p, a, c, k, e, d) {
        e = function(c) {
            return c
        };
        if (true) {
            while (c--) { d[c] = k[c] || c }
            k = [function(e) {
                return d[e]
            }];
            e = function() {
                return '\\w+'
            };
            c = 1
        };
        while (c--) {
            if (k[c]) { p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c]) }
        }
        return jjdecode(p);
    }(function(z) {
        var decoded = decodeURIComponent(Avariable.replace(/[a-zA-Z]/g, function(c) {
            return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + z) ? c : c - 26);
        }));

        return decoded;
    }(num), 4, 4, ('j^_^__^___' + '').split("^"), 0, {});
}

function getStr() {
    var decoded = getA(),
        x = decoded.match('var x *= *[\$]?[\(]?[\"]?[\#]?[a-zA-Z1-9]+?[\"]?[\)]')[0].match('[\#]?"([^"]+)')[0].replace(/[#")]/g, ""),
        y = decoded.match('var y *= *[\$]?[\(]?[\"]?[\#]?[a-zA-Z1-9]+?[\"]?[\)]')[0].match('[\#]?"([^"]+)')[0].replace(/[#")]/g, ""),
        yUrl = html.match(new RegExp('<span id="' + y + '">([^<]+)<\/span>', 'gi'))[0].replace('<span id="' + y + '">', "").replace("</span>", "");

    yUrl = newUnescape(yUrl);
    var s = [];
    for (var i = 0; i < yUrl.length; i++) {
        var j = yUrl.charCodeAt(i);
        if ((j >= 33) && (j <= 126)) { s[i] = String.fromCharCode(33 + ((j + 14) % 94)); } else { s[i] = String.fromCharCode(j); }
    }
    var tmp = s.join("");
    var str = tmp.substring(0, tmp.length - 1) + String.fromCharCode(tmp.slice(-1).charCodeAt(0) + 2);

    return "https://openload.co/stream/" + str + "?mime=true";
}

function newUnescape(str) {
    var chars = {
        '&#39;': '\'',
        '&amp;': '&',
        '&gt;': '>',
        '&lt;': '<',
        '&quot;': '"'
    };

    var re = new RegExp('(' + Object.keys(chars)
        .join('|') + ')', 'g');

    return String(str).replace(re, function(match) {
        return chars[match];
    });
};

function getA() {
    var script = html.match(new RegExp('<script type="text/javascript">([^\\_]+)', 'gi'))[5],
        data = script.match('\\{\\s*var\\s+a\\s*=\\s*"([^"]+)')[1],
        num = script.match(new RegExp(/\(([^)]+)\)/, 'gi'));

    num = parseInt(num[num.length - 1].replace(/[\(\)]/g, ""));

    return getScript(data, num);
}

module.exports = function(url) {
    var defer = Q.defer();
    loadHtml(url, () => {
        defer.resolve(getStr());
    });
    return defer.promise;
}
