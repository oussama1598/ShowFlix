import ApiService from './ApiService';
import SocketService from './SocketService';
import ErrorHandler from './ErrorHandler';

export default angular.module('showFlix.services', [])
  .service('SocketService', SocketService)
  .service('ApiService', ApiService)
  .service('ErrorHandler', ErrorHandler);
