import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routes from './episode.routes'
import filesize from 'filesize'

export class EpisodeController {
  $rootScope
  $stateParams
  $state
  episode
  loading = true
  filesize = filesize
  sort = 'asc'

  /* @ngInject */
  constructor ($rootScope, $stateParams, $http, $state, $mdToast, $scope) {
    this.$rootScope = $rootScope
    this.$stateParams = $stateParams
    this.$http = $http
    this.$state = $state
    this.$mdToast = $mdToast
    this.$scope = $scope
  }

  $onInit () {
    this.$rootScope.$broadcast('backBtn', {
      show: true,
      state: 'show/:imdb/:number',
      params: this.$stateParams
    })

    this.$http
      .get(`/api/shows/${this.$stateParams.imdb}/${this.$stateParams.number}/${this.$stateParams.episode}`)
      .then(res => res.data)
      .then(data => {
        if (!data.status) {
          return this.$state.go('show/:imdb/:number', this.$stateParams)
        }

        this.episode = data
        this.loading = false
      })
  }

  onAddToQueue (torrent) {
    this.$http
      .post('/api/queue', {
        imdb: this.$stateParams.imdb,
        season: this.episode.season,
        episode: this.episode.episode,
        magnet: torrent.magnet,
        file: torrent.file,
        size: torrent.size
      })
      .then(() => this._showToast('Episode added to the queue'))
      .catch(err => {
        this._showToast('Error occured when adding this episode')
        console.log(err)
      })
  }

  _showToast (message) {
    this.$mdToast.show(
      this.$mdToast.simple()
        .textContent(message)
        .position('bottom right')
        .hideDelay(3000)
    )
  }
}

export default angular.module('showFlixAppApp.episode', [uiRouter])
  .config(routes)
  .component('episode', {
    template: require('./episode.html'),
    controller: EpisodeController
  })
  .name