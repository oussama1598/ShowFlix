const jjdecode = require("../utils/jjdecode");
const utils = require("../utils/utils");
const Q = require("q");

const DOTALL = 32;
const CASE_INSENSITIVE = 2;

var OpenloadDecoder = {
    decode: function(html) {

        console.log("openLoad HTML loaded!")

        var results = [];

        /*try {
            html = unpackHtml(html);
        } catch (err) {
            Log.d(err.toString());
        }*/

        //Try to get link using eval() first
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


                        var idPattern = /window.r\s*=\s*'([\s\S]*?)'/gi;
                        var id = idPattern.exec(aaDecoded)[1];

                        var spanPattern = new RegExp('<span\\s+id="' + id + "x" + '"[^>]*>([^<]+?)</span>', 'gi');
                        var span = spanPattern.exec(html)[1];

                        var firstTwoChars = parseInt(span.substr(0, 2));
                        var urlcode = '';
                        var num = 2;
                        while (num < span.length) {
                            urlcode += String.fromCharCode(parseInt(span.substr(num, 3)) - firstTwoChars * parseInt(span.substr(num + 3, 2)));
                            num += 5;
                        }

                        var streamUrl = "https://openload.co/stream/" + urlcode + "?mime=true";
                        results.push(streamUrl);
                    } catch (err) {
                    }
                }
            }
        } catch (err) {
            
        }

        //Try to get link by decrypting the link
        try {
            var hiddenId = '';
            var decodes = [];
            var magicNumbers = getAllMagicNumbers();

            var hiddenUrlPattern = /<span[^>]*>([^<]+)<\/span>\s*<span[^>]*>[^<]+<\/span>\s*<span[^>]+id="streamurl"/gi;
            var hiddenUrl = hiddenUrlPattern.exec(html)[1];
            if (hiddenUrl == undefined)
                return;

            hiddenUrl = newUnescape(hiddenUrl);

            var hiddenUrlChars = getCharsFromString(hiddenUrl);
            var magic = 0;
            if (hiddenUrlChars.length > 1) {
                magic = hiddenUrlChars[hiddenUrlChars.length - 1].charCodeAt(0);
            }

            for (var x = 0; x < magicNumbers.length; x++) {
                var s = [];
                var magicNumber = magicNumbers[x];

                for (var i = 0; i < hiddenUrlChars.length; i++) {
                    var c = hiddenUrlChars[i];
                    var j = c.charCodeAt(0);
                    //Log.d("c = " + c + "; j = " + j);

                    if (j == magic)
                        j -= 1;
                    else if (j == magic - 1)
                        j += 1;

                    if (j >= 33 & j <= 126)
                        j = 33 + ((j + 14) % 94);

                    if (i == (hiddenUrl.length - 1))
                        j += parseInt(magicNumber);

                    s.push(String.fromCharCode(j));
                }
                var res = s.join('');

                results.push("https://openload.co/stream/" + res + "?mime=true");
            }
        } catch (err) {
        }

        return JSON.stringify(results);
    },
    isEnabled: function() {
        return true;
    }
};

function unpackHtml(html) {
    console.log("unpacking html");

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
            //console.log("limit = " + limit);

            var newCode = cCode + shift;
            if (newCode > limit) {
                newCode = newCode - 26;
            }
            s2 += String.fromCharCode(newCode);
        } else {
            s2 += c;
        }
    }

    console.log("s2 = " + s2);

    return s2;
}

function getAllMagicNumbers(decodes) {
    /*
    var magicNumbers = [];
    if (decodes.length > 0) {
        var charDecodePattern = /charCodeAt\(\d+\)\s*\+\s*(\d+)\)/g;
        for (var i = 0; i < decodes.length; i++) {
            var decodedStr = decodes[i];
            var charDecodeArr = charDecodePattern.exec(decodedStr);
            if (charDecodeArr == null || charDecodeArr.length <= 0 || charDecodeArr[1] == undefined)
                continue;
            magicNumbers.push(charDecodeArr[1]);
            break;
        }
    }

    if (magicNumbers.length <= 0) {
        magicNumbers = [0, 1, 2, 3, 4];
    }
    return magicNumbers;
    */

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

function getJavaRegexMatches(string, regex, index, mode) {
    if (mode && mode > -1) {}
    //return JSON.parse(JavaRegex.findAllWithMode(string, regex, index, mode));
    //return JSON.parse(JavaRegex.findAll(string, regex, index));
}

/*!
 * unescape <https://github.com/jonschlinkert/unescape>
 * Edited by NitroXenon to make it compatible with OpenloadDecoder 
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 *
 * Licensed under the MIT License
 */

/**
 * Convert HTML entities to HTML characters.
 *
 * @param  {String} `str` String with HTML entities to un-escape.
 * @return {String}
 */

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
    const defer = Q.defer();
    console.log("OpenLoad start parsing")

    utils.getHtml(url).then($ => {
        defer.resolve(JSON.parse(OpenloadDecoder.decode($.html()))[0]);
    });

    return defer.promise;
}

