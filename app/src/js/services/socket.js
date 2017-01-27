angular.module('showFlex').factory('serverSocket', ["socketFactory", function (socketFactory) {
	return socketFactory();
  }]);