import ApiService from './ApiService';
import SocketService from './SocketService';

export default angular.module('showFlex.services', [])
  .service('SocketService', SocketService)
  .service('ApiService', ApiService);
