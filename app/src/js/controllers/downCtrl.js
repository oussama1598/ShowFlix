'use strict';

angular.module('showFlex').controller('downCtrl', ['$scope', 'socketEvt', '$rootScope', '$http',
    function($scope, socketEvt, $rootScope, $http) {
        $scope.files = [];
        $scope.loading = true;

        $scope.changed = function(data) {
            $scope.files = data;
        }

        $scope.delete = function (file) {
          $http.delete('api/downloads', {
            code: file.code,
            providerCode: file.providerCode
          });
        }

        $scope.init = function() {
            $http.get('api/downloads').then(function(res) {
                $scope.loading = false;
                $scope.files = res.data;
            })
        }

        $scope.init();

        socketEvt.add('downloadsChanged', $scope.changed);

        $rootScope.$on('$stateChangeStart',
            function(event, toState) {
                if (toState.name !== 'app.downloads') {
                    socketEvt.remove('downloadsChanged', $scope.changed);
                }
            });
    }
]);
