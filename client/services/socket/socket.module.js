import angular from 'angular'
import SocketService from './socket.service'

export default angular.module('services.socket', [])
  .factory('socket', SocketService)
  .name
