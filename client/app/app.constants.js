import angular from 'angular'

export default angular.module('showFlixAppApp.constants', [])
  .constant('appConfig', require('../../server/config/config'))
  .name