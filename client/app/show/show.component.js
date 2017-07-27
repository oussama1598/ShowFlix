import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routes from './show.routes'

export class ShowController {
  $http
  $stateParams
  show
  byPassUrl = 'https://showsdb-api.herokuapp.com/api/bypass?url='
  loading = true

  /* @ngInject */
  constructor ($http, $stateParams) {
    this.$http = $http
    this.$stateParams = $stateParams
  }

  $onInit () {
    this.$http.get(`/api/shows/show/${this.$stateParams.imdb}`)
      .then(res => {
        this.show = res.data
        this.loading = false
      })
  }
}

export default angular.module('showFlixAppApp.show', [uiRouter])
  .config(routes)
  .component('show', {
    template: require('./show.html'),
    controller: ShowController
  }).name
