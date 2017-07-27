import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routing from './main.routes'

export class MainController {
  $http
  $state
  shows
  sorts = [
    {
      name: 'Popularity',
      key: 'seeds'
    }, {
      name: 'Date added',
      key: 'dateadded'
    },
    {
      name: 'Year',
      key: 'year'
    },
    {
      name: 'Title',
      key: 'title'
    }
  ]
  genres = [
    'popular',
    'action',
    'adventure',
    'animation',
    'biography',
    'comedy',
    'crime',
    'documentary',
    'drama',
    'family',
    'fantasy',
    'film-noir',
    'history',
    'horror',
    'music',
    'musical',
    'mystery',
    'romance',
    'sci-fi',
    'short',
    'sport',
    'thriller',
    'war',
    'western'
  ]
  page = 1
  sort = 'seeds'
  genre = 'popular'
  loading = true

  /* @ngInject */
  constructor ($http, $state) {
    this.$http = $http
    this.$state = $state
  }

  $onInit () {
    this.getShows()
  }

  getShows () {
    this.loading = true
    this.$http.get(`/api/shows/${this.page}?sort=${this.sort}&genre=${this.genre}`)
      .then(res => {
        if (!res.data.status) return

        this.shows = res.data.shows
        this.loading = false
      })
  }

  optionsChanged () {
    this.shows = []
    this.getShows()
  }

  goTo (imdb) {
    this.$state.go('show/:imdb', {
      imdb
    })
  }
}

export default angular.module('showFlixAppApp.main', [uiRouter])
  .config(routing)
  .component('main', {
    template: require('./main.html'),
    controller: MainController
  })
  .name
