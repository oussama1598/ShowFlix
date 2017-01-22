const utils = require("../utils/utils");


const CX = "018010331078829701272:y0xgo6cnjbw";
const season = `02`

let q = "the flash 2014";

utils.searchAPI(CX).build({ q: `${q} S${season}`, num: 10 }, (err, res) => {
        if (err) {
            reject("Something went wrong!");
            return;
        }

        q = q.replace(/\s+/g, '-');

        for (item in res.items) {
             const val = res.items[item];

             console.log(val);

             /*if (val.link.indexOf(q) > -1) {
                 if (val.link.indexOf(`s${season}`) > -1) {
                     resolve(val.link);
                     return;
                 }
             }*/
         }

    })
    //init();

// TODO =>
// find a way of checking if file is done
// add alert to home page to tell if the server is off and no more working
