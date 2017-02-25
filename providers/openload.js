const jjdecode = require("../utils/jjdecode");
const utils = require("../utils/utils");
const Q = require("q");

/* OpenloadDecoder - A script which will be executed by Duktape to extract Openload links
 *
 * JavaScript (for Duktape Java) port of openload urlresolver plugin by tknorris.
 *
 * Original plugin in Python :
 * https://github.com/tknorris/script.module.urlresolver/blob/master/lib/urlresolver/plugins/ol_gmu.py
 *
 * Copyright (C) 2016 NitroXenon
 *
 * This software is released under the GPLv3 License.
openload.io urlresolver plugin
Copyright (C) 2015 tknorris
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
const DOTALL = 32;
const CASE_INSENSITIVE = 2;

var OpenloadDecoder = {
    decode: function(html) {
        var results = [];
        try {
            var scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
            var scriptMatches = getMatches(html, scriptPattern, 1);
            for (var i = 0; i < scriptMatches.length; i++) {
                var script = scriptMatches[i];
                //var aaEncodedPattern = /(ﾟωﾟﾉ[\s\S]*?\('_'\);)/;
                var aaEncodedPattern = /(\uFF9F\u03C9\uFF9F\uFF89[\s\S]*?\('_'\);)/g;
                var aaEncodedArr = getMatches(script, aaEncodedPattern, 1);
                for (var j = 0; j < aaEncodedArr.length; j++) {
                    try {
                        var aaEncoded = aaEncodedArr[j];
                        var aaDecoded = aadecode(aaEncoded);

                        //Log.d("aaDecoded = " + aaDecoded);

                        var idPattern = /window\.r\s*=\s*['"]([^'^"]+?)['"]/gi;
                        var id = idPattern.exec(aaDecoded)[1];

                        var spanPattern = new RegExp('<span[^>]+?id="' + id + '[^"]*?"[^>]*?>([^<]+?)</span>', 'gi');
                        var spanMatches = getMatches(html, spanPattern, 1);

                        for (var spanIdx = 0; spanIdx < spanMatches.length; spanIdx++) {
                            try {
                                var encoded = spanMatches[spanIdx];
                                var decodedArr = [];

                                var subtrahend = parseInt(encoded.substr(0, 2));
                                var num = 2;

                                while (num < encoded.length) {
                                    var key = parseInt(encoded.substr(num + 3, 2));
                                    var val = String.fromCharCode(parseInt(encoded.substr(num, 3)) - subtrahend);
                                    decodedArr.push([key, val])
                                    num += 5;
                                }

                                var decodedUrl = '';

                                //Sort the array. Very important!
                                decodedArr.sort(function(a, b) {
                                    return parseInt(a[0]) - parseInt(b[0]);
                                });

                                for (var arrIdx = 0; arrIdx < decodedArr.length; arrIdx++) {
                                    var arr = decodedArr[arrIdx];
                                    var key = arr[0];
                                    var val = arr[1];
                                    //Log.d("appending. key = " + key + "; val = " + val);
                                    decodedUrl += val;
                                }

                                var streamUrl = "https://openload.co/stream/" + decodedUrl + "?mime=true";

                                results.push(streamUrl);
                            } catch (err) {}
                        }
                    } catch (err2) {}
                }
            }
        } catch (err3) {}

        return JSON.stringify(results);
    },
    isEnabled: function() {
        return true;
    }
};

function unpackHtml(html) {

    var replaceArr = ['j', '_', '__', '___'];

    var stringsPattern = '\\{\\s*var\\s+a\\s*=\\s*"([^"]+)';
    var strings = getJavaRegexMatches(html, stringsPattern, 1, CASE_INSENSITIVE);

    if (strings.length <= 0)
        return html;

    var shiftsPattern = "\\)\\);\\}\\((\\d+)\\)";
    var shifts = getJavaRegexMatches(html, shiftsPattern, 1, -1);
    var zippedArr = zip(strings, shifts);

    for (var i = 0, len = zippedArr.length; i < len; ++i) {
        var arr = zippedArr[i];
        var str = arr[0];
        var shift = arr[1];

        var res = caesarShift(str, parseInt(shift));
        res = JavaUrlDecoder.decode(res);

        for (j = 0, len2 = replaceArr.length; j < len2; ++j) {
            res = res.replace(j.toString(), replaceArr[j]);
        }

        html += ("<script>" + res + "</script>");
    }

    return html;
}

function caesarShift(s, shift) {
    if (!shift)
        shift = 13;
    else
        shift = parseInt(shift);

    var s2 = "";
    var z = "Z";
    var zCode = z.charCodeAt(0);
    var chars = getCharsFromString(s);

    for (var i = 0, len = chars.length; i < len; ++i) {
        var c = chars[i];
        var cCode = c.charCodeAt(0);
        if (isAlpha(c)) {
            var limit;
            if (cCode <= zCode)
                limit = 90;
            else
                limit = 122;
            //Log.d("limit = " + limit);

            var newCode = cCode + shift;
            if (newCode > limit) {
                newCode = newCode - 26;
            }
            s2 += String.fromCharCode(newCode);
        } else {
            s2 += c;
        }
    }
    return s2;
}

function getAllMagicNumbers(decodes) {
    return [3];
}

function getMatches(string, regex, index) {
    index || (index = 1); // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}

function isAlpha(s) {
    return /^[a-zA-Z()]+$/.test(s);
}

function zip(x, y) {
    return x.map(function(e, i) {
        return [e, y[i]];
    });
}

function getCharsFromString(s) {
    return s.split(/(?=(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/);
}

function sortObject(obj) {
    return Object.keys(obj).sort().reduce(function(result, key) {
        result[key] = obj[key];
        return result;
    }, {});
}

function getJavaRegexMatches(string, regex, index, mode) {}

var newUnescape = function(str) {
    if (str == null) return '';

    var re = new RegExp('(' + Object.keys(chars)
        .join('|') + ')', 'g');

    return String(str).replace(re, function(match) {
        return chars[match];
    });
};

var chars = {
    '&#39;': '\'',
    '&amp;': '&',
    '&gt;': '>',
    '&lt;': '<',
    '&quot;': '"'
};

function aadecode(text) {
    var evalPreamble = "(ﾟДﾟ) ['_'] ( (ﾟДﾟ) ['_'] (";
    var decodePreamble = "( (ﾟДﾟ) ['_'] (";
    var evalPostamble = ") (ﾟΘﾟ)) ('_');";
    var decodePostamble = ") ());";
    text = text.replace(/^\s*/, "").replace(/\s*$/, "");
    if (/^\s*$/.test(text)) return "";
    if (text.lastIndexOf(evalPreamble) < 0) throw new Error("Given code is not encoded as aaencode.");
    if (text.lastIndexOf(evalPostamble) != text.length - evalPostamble.length) throw new Error("Given code is not encoded as aaencode.");
    var decodingScript = text.replace(evalPreamble, decodePreamble).replace(evalPostamble, decodePostamble);
    return eval(decodingScript);
}

module.exports = function(url) {
    console.log("OpenLoad start parsing")

    // return utils.getHtml(url).then($ => {
    //     return JSON.parse(OpenloadDecoder.decode($.html()))[0];
    // });

    return utils.getHtml(`http://video-downloader.herokuapp.com/download?url=${url}`, true).then(data => {
        return data.streamUrl;
    });
}
