'use strict';

angular.module('showFlex')
    .controller('MainCtrl', ['$scope', '$mdSidenav', 'socketEvt', '$interval' ,'$http', function($scope, $mdSidenav, socketEvt, $interval, $http) {
    	$scope.serverOn = false;

        $(".button-collapse").sideNav();
        socketEvt.add("log", function(data) {
            Materialize.toast(data.str, 4000, (data.color !== "white") ? data.color: "");
        })

        socketEvt.emit("serverStat");

        $interval(function() {
            socketEvt.emit("serverStat");
        }, 7000);

        socketEvt.add("serverStat", function(data) {
            $scope.serverOn = data.running;
        });

        $scope.sendReq = function(url) {
            return $http({
                method: 'GET',
                url: url
            })
        }

        $scope.startServer = function() {
            if ($scope.serverOn) {
                $scope.sendReq("/stop").then(function(res) {
                    socketEvt.emit("serverStat");
                })
            } else {
                $scope.sendReq("/start").then(function(res) {
                    //if (res.data.error) {
                        //Materialize.toast(res.data.error, 4000, 'red')
                   // }
                    socketEvt.emit("serverStat");
                })
            }
        }
    }]);
