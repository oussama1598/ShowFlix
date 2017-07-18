import angular from 'angular'
import uiRouter from 'angular-ui-router'
import routing from './main.routes'

export class MainController {
  $http;

  awesomeThings = [];

  /* @ngInject */
  constructor ($http) {
    this.$http = $http
  }

  $onInit () {
    this.$http.get('/api/things')
      .then(response => {
        this.awesomeThings = response.data
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
