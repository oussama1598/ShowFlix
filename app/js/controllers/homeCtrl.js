'use strict';

angular.module('showFlex').controller('homeCtrl', ["$scope", "$http", "$interval", "$timeout", function($scope, $http, $interval, $timeout) {
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


    $scope.getFiles();
}]);
