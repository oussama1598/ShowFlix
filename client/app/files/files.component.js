import angular from 'angular'
import uiRouter from 'angular-ui-router'
import filesize from 'filesize'
import humanizeDuration from 'humanize-duration'
import routing from './files.routes'

export class FilesController {
  /* @ngInject */
  constructor ($http) {
    this.$http = $http
    this.files = {}
  }

  $onInit () {
    this.getShows()
  }

  getShows () {
    this.files = new Map()
    this.loading = true
    this.$http.get(`/api/files`)
      .then(res => {
        res.data.forEach(file => {
          let episodes = this.files[file.imdb]

          if (!episodes) episodes = []

          episodes.push(file)
          this.files[file.imdb] = episodes
        })

        this.
        this.loading = false
      })
      .catch(err => console.log(err))
  }

  filesize (size) {
    return filesize(size)
  }

  humanizeDuration (seconds) {
    return humanizeDuration(seconds, { round: true })
  }
}

export default angular.module('showFlixAppApp.files', [uiRouter])
  .config(routing)
  .component('files', {
    template: require('./files.html'),
    controller: FilesController
  })
  .name
