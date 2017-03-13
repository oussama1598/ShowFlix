const cloudscraper = require('cloudscraper');

cloudscraper.get(encodeURI('http://cimaclub.com/the-blacklist-redemption-الموسم-1-الحلقة-1-الاولى/?view=1'), (error, response, body) => {
  console.log(error);
  if (error) {
    console.log('Error occurred');
  } else {
    console.log(body, response);
  }
});
