'use strict';

angular.module('showFlex')
    .controller('MainCtrl', ['$scope', '$mdSidenav', 'socketEvt', '$interval', function($scope, $mdSidenav, socketEvt, $interval) {
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
    }]);
