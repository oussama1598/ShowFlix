import angular from 'angular'
import ShowDataController from './showData.service'

export default angular.module('services.showData', [])
  .factory('showData', ShowDataController)
  .name
