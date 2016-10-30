'use strict'

const merge = require('lodash').merge
const inquirer = require('inquirer')
const utils = require('./utils')
const parser = require("./parser")
const parse = require('url-parse')
const Downloader = require("filedownloader")
const _progress = require('cli-progress')


utils.getHtml("http://www.darshow.com/20000-watch-full-serie-agents-of-s.h.i.e.l.d.-online.html").then($ => {
    let saisons = [];
    $(".seasonlinkclassa").each((i, e) => {
        saisons.push({ href: $(e).attr("href"), s: i + 1 });
    });

    utils.ask.list('What saison would you like to watch ?', saisons.map(s => ({
            name: "Saison " + s.s,
            value: s.href
        })))
        .then(answer => {
            getEpisodes(answer);
        })
})

function getEpisodes(url) {
    utils.getHtml(url).then($ => {
        let episodes = [],
            count = $(".shortmail").length;
        $(".shortmail").each((i, e) => {
            episodes.push({ href: $(e).find(".pipay1").eq(0).find("a").attr("href"), e: count - i });
        });

        utils.ask.list('What Episode would you like to watch ?', episodes.map(e => ({
                name: "Episode " + e.e,
                value: e.href
            })))
            .then(answer => {
                getEpisode(answer);
            })
    })
}

function getEpisode(url) {
    utils.getHtml(url).then($ => {
        $(".small.orange.awesome").each((i, e) => {
            if ($(e).text().indexOf("Openload") > -1) {
                parseData($(e).attr("href"));
                return;
            }
        });
    })
}

function parseData(url) {
    url = "https://openload.co/embed/" + parse(url, true).pathname.split("/")[2];
    console.log(url);
    parser(url).then(stream => {
        console.log(stream);
       /* var Dl = new Downloader({
            url: stream,
            saveto: "/home/oussama/Desktop/ShowFlix1/Downloads",
            resume: true
        }).on("start", function() {
            console.log("Download Started");
        }).on("error", function(err) {
            console.log(err)
        }).on("progress", function(data) {
            console.log("Downloaded "+ data.progress +"% At " + (data.speed/1024) + "KB/s")
        }).on("end", function() {
            console.log("Download Finished");
        });*/
    });
}