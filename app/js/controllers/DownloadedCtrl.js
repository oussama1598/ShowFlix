'use strict';

angular.module('showFlex').controller('DownloadedCtrl', ["$scope", "$http", "$interval", "socketEvt", "$mdDialog", "$rootScope",
    function($scope, $http, $interval, socketEvt, $mdDialog, $rootScope) {
        $scope.files = [];
        $scope.loading = true;
        $interval(function() { $scope.getFiles() }, 10000);

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
                $scope.getFiles();
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

        $scope.sendReq = function(url) {
            return $http({
                method: 'GET',
                url: url
            })
        }

        $scope.startServer = function() {
            if ($scope.serverOn) {
                $scope.sendReq("/stop").then(function(res) {
                    serverSocket.emit("serverStat");
                })
            } else {
                $scope.sendReq("/start").then(function(res) {
                    if (res.data.error) {
                        Materialize.toast(res.data.error, 4000, 'red')
                    }
                    serverSocket.emit("serverStat");
                })
            }
        }

        $scope.getFiles();
    }
]);
