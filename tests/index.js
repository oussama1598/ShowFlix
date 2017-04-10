const api = require('../modules/tvShowsApi');


api.search('the catch', 2)
  .then(data => {
    console.log(data);
  })
  .catch(err => {
    console.log(err.toString());
  });
