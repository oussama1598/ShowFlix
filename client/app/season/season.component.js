import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routes from './season.routes'

export class SeasonController {
  $rootScope
  $stateParams
  $state
  $mdDialog
  showData
  byPassUrl
  loading = true
  show
  episodeId
  poster

  /* @ngInject */
  constructor ($rootScope, $stateParams, showData, $state, Util, $mdDialog) {
    this.$rootScope = $rootScope
    this.$stateParams = $stateParams
    this.showData = showData
    this.byPassUrl = showData.byPassUrl
    this.seasonNumber = $stateParams.number
    this.$state = $state
    this.$mdDialog = $mdDialog

    this.fixDate = Util.fixDate
  }

  $onInit () {
    this.$rootScope.$broadcast('backBtn', {
      show: true,
      state: 'show/:imdb',
      params: {
        imdb: this.$stateParams.imdb
      }
    })

    this.showData.getData(this.$stateParams.imdb)
      .then(data => {
        const season = data.seasons.filter(season =>
          season.season_number === parseFloat(this.seasonNumber))[0]

        if (!season) {
          return this.$state.go('show/:imdb', {
            imdb: this.$stateParams.imdb
          })
        }

        this.season = season
        this.selectedEpisode = season.episodes[0]
        this.poster = data.images.poster
        this.loading = false
      })
  }

  showEpisode (ev) {
    this.$mdDialog.show({
      template: '<episode layout="column" flex></episode>',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: true // Only for -xs, -sm breakpoints.
    })
  }
}

export default angular.module('showFlixAppApp.season', [uiRouter])
  .config(routes)
  .component('season', {
    template: require('./season.html'),
    controller: SeasonController
  }).name
