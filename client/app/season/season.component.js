import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routes from './season.routes'

export class SeasonController {
  $rootScope
  $stateParams
  $state
  showData
  byPassUrl
  loading = true
  show
  episodeId
  poster

  /* @ngInject */
  constructor ($rootScope, $stateParams, showData, $state, Util) {
    this.$rootScope = $rootScope
    this.$stateParams = $stateParams
    this.showData = showData
    this.byPassUrl = showData.byPassUrl
    this.seasonNumber = $stateParams.number
    this.$state = $state

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

  showEpisode (episode) {
    this.$state.go('show/:imdb/:number/:episode', Object.assign(this.$stateParams, {
      episode: this.selectedEpisode.episode
    }))
  }
}

export default angular.module('showFlixAppApp.season', [uiRouter])
  .config(routes)
  .component('season', {
    template: require('./season.html'),
    controller: SeasonController
  }).name
