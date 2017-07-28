export default function ($http) {
  'ngInject'

  const byPassUrl = 'https://showsdb-api.herokuapp.com/api/bypass?url='

  let showData = {
    imdb: null,
    data: null
  }

  const getData = imdb => {
    if (imdb === showData.imdb && showData.data) return Promise.resolve(showData.data)

    return $http.get(`/api/show/${imdb}`)
      .then(res => res.data)
      .then(data => {
        showData = {
          imdb,
          data
        }
        return data
      })
  }

  return {
    byPassUrl,
    getData
  }
}
