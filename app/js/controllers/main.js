'use strict';

angular.module('showFlex')
    .controller('MainCtrl', function($scope, $mdSidenav) {
        $(".button-collapse").sideNav();
    });
