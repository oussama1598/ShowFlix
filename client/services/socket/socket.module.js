import angular from 'angular'
import SocketService from './socket.service'

export default angular.module('showFlixAppApp.socket', [])
  .factory('socket', SocketService)
  .name
