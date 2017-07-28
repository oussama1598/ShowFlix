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
  constructor ($rootScope, $stateParams, $http, $state) {
    this.$rootScope = $rootScope
    this.$stateParams = $stateParams
    this.$http = $http
    this.$state = $state
  }

  $onInit () {
    this.$rootScope.$broadcast('backBtn', {
      show: true,
      state: 'show/:imdb/:number',
      params: this.$stateParams
    })

    this.$http
      .get(`/api/show/${this.$stateParams.imdb}/${this.$stateParams.number}/${this.$stateParams.episode}`)
      .then(res => res.data)
      .then(data => {
        if (!data.status) {
          return this.$state.go('show/:imdb/:number', this.$stateParams)
        }

        this.episode = data
        this.loading = false
      })
  }
}

export default angular.module('showFlixAppApp.episode', [uiRouter])
  .config(routes)
  .component('episode', {
    template: require('./episode.html'),
    controller: EpisodeController
  })
  .name
