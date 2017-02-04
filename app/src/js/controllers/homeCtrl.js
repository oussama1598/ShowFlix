'use strict';

angular.module('showFlex').controller('homeCtrl', ["$scope", "$http", "socketEvt", "$mdDialog", "$rootScope",
    function($scope, $http, socketEvt, $mdDialog, $rootScope) {
        $scope.files = [];
        $scope.loading = true;

        $scope.getFiles = function() {
            $http({
                method: 'GET',
                url: '/medias?id=' + Math.random(),
                headers: {
                    'Cache-Control': 'no-cache'
                }
            }).then(function(res) {
                $scope.loading = false;
                $scope.files = res.data;
            });
        }


        $scope.removeFileByStreamUrl = function(url) {
            _.each($scope.files, function(file, key) {
                if (file) {
                    if (file.streamUrl === url) {
                        $scope.files.splice(key, 1);
                    }
                }
            });
        }

        $scope.delete = function(url, $event) {
            $scope.removeFileByStreamUrl(url);

            $http.delete(url).then(function(res) {
                $scope.removeFileByStreamUrl(url)
            })
        }

        $scope.confirmDelete = function(url, ev) {

            var confirm = $mdDialog.confirm()
                .title('Confirm')
                .textContent('Are you sure you wanna delete this episode?')
                .ariaLabel('delete')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(function() {
                $scope.delete(url, ev);
            });
        };

        $scope.mediasChanged = function(data) {
            $scope.files = data;
        }

        $scope.getFiles();

        socketEvt.add("mediasChanged", $scope.mediasChanged);

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams, options) {
                if (toState.name !== "app.home") {
                    socketEvt.remove("mediasChanged", $scope.mediasChanged);
                }
            })
    }
]);
