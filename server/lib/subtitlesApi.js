import Xray from 'x-ray'

const x = Xray({
  filters: {
    trim: value => value.trim()
  }
})
const URL = 'https://subscene.com/subtitles/release?q='

export function search (filename) {
  return new Promise((resolve, reject) => {
    x(`${URL}${filename}`, '.content table tr', [
      {
        name: '.a1 a span:nth-child(2) | trim',
        language: '.a1 a span:nth-child(1) | trim',
        link: '.a1 a@href'
      }
    ])((err, data) => {
      if (err) reject(err)
      resolve(data)
    })
  })
}

export function getDownloadUrl (url) {
  return new Promise((resolve, reject) => {
    x(url, '.download', {
      url: 'a@href'
    })((err, data) => {
      if (err) reject(err)

      resolve(data.url)
    })
  })
}
