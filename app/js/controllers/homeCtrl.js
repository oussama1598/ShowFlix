'use strict';

angular.module('showFlex').controller('homeCtrl', ["$scope", "$http", "$interval", "$timeout", function($scope, $http, $interval, $timeout) {
    $scope.files = [];
    $scope.loading = true;

    $interval(function() { $scope.getFiles() }, 10000);

    $scope.getFiles = function() {
        $http({
            method: 'GET',
            url: '/medias'
        }).then(function(res) {
            $scope.loading = false;
            $scope.files = res.data;
        });
    }


    $scope.removeFileByStreamUrl = function (url){
        _.each($scope.files, function (file, key){
            console.log(file.streamUrl === url, key)
            if(file.streamUrl === url){
                $scope.files.splice(0, 0);

                console.log($scope.files)
            }
        });
    }

    $scope.delete = function(url, $event) {
        $scope.removeFileByStreamUrl(url);

        $http({
            method: 'POST',
            url: url + "/delete"
        }).then(function(res) {
            $scope.removeFileByStreamUrl(url)
        })
    }


    $scope.getFiles();
}]);
