var GoogleSearch = require('google-search');
const _ = require("underscore");
var googleSearch = new GoogleSearch({
  key: 'AIzaSyAKaazNPf7-FSKrVRH-sbmKEQTr7icbdRQ',
  cx: '018010331078829701272:y0xgo6cnjbw'
});

let q = "The BlackList".toLowerCase();

googleSearch.build({
  q: "the blacklist S02E01",
  num: 10, // Number of search results to return between 1 and 10, inclusive
}, function(error, response) {
	q = q.replace(/\s+/g, '-');
  _.each(response.items, val => {
  	if(val.link.indexOf(q) > -1){
  		if(val.link.indexOf("s02") > -1){
  			console.log(val.link)
  		}
  	}
  })
});