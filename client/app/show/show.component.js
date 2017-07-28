import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routes from './show.routes'

export class ShowController {
  $http
  $stateParams
  $rootScope
  $state
  show
  byPassUrl = 'https://showsdb-api.herokuapp.com/api/bypass?url='
  loading = true
  showData

  /* @ngInject */
  constructor ($http, $stateParams, $rootScope, showData, $state) {
    this.$http = $http
    this.$stateParams = $stateParams
    this.$rootScope = $rootScope
    this.$state = $state
    this.showData = showData
    this.byPassUrl = showData.byPassUrl
  }

  $onInit () {
    this.showData.getData(this.$stateParams.imdb)
      .then(data => {
        this.show = data
        this.loading = false
      })

    this.$rootScope.$broadcast('backBtn', {
      show: true,
      state: 'main'
    })
  }

  goToSeason (seasonNumber) {
    this.$state.go('show/:imdb/:number', {
      imdb: this.$stateParams.imdb,
      number: seasonNumber
    })
  }
}

export default angular.module('showFlixAppApp.show', [uiRouter])
  .config(routes)
  .component('show', {
    template: require('./show.html'),
    controller: ShowController
  }).name
