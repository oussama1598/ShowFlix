const TVDB = require('node-tvdb')
const tvdb = new TVDB('C4E207D934C6B805')

tvdb
  .sendRequest('series/295685/episodes/query', {
    query: {
      airedSeason: 1,
      airedEpisode: 1
    }
  })
  .then(response => {
    console.log(response)
  })
