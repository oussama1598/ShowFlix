'use strict';

angular
    .module('showFlex', [
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ui.router',
        'ngMaterial',
        'ngMdIcons',
        'btford.socket-io'
    ])
    .config(["$stateProvider", "$urlRouterProvider", "$mdThemingProvider", function($stateProvider, $urlRouterProvider, $mdThemingProvider) {
        $stateProvider
            .state('app', {
                url: '/app',
                templateUrl: 'views/main.html',
                controller: 'MainCtrl',
                abstract: true
            })
            .state('app.home', {
                url: "/home",
                views: {
                    "mainView": {
                        templateUrl: "views/home.html",
                        controller: "homeCtrl"
                    }
                }
            })
            .state('app.downloads', {
                url: "/downloads",
                views: {
                    "mainView": {
                        templateUrl: "views/downloads.html",
                        controller: "downCtrl"
                    }
                }
            })
            .state('app.settings', {
                url: "/settings",
                views: {
                    "mainView": {
                        templateUrl: "views/settings.html",
                        controller: "settingsCtrl"
                    }
                }
            })
            .state('app.queue', {
                url: "/queue",
                views: {
                    "mainView": {
                        templateUrl: "views/queue.html",
                        controller: "queueCtrl"
                    }
                }
            });
        $urlRouterProvider.otherwise("/app/home");
        $mdThemingProvider.theme('default')
    .primaryPalette('pink')
    }]).run(["$rootScope", "socketEvt", function($rootScope, socketEvt) {
        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams, options) {
                if (toState.name !== "app.downloads") {
                    socketEvt.emit("watchDownloads", false);
                }
            })
    }]).filter('iif', function() {
        return function(input, trueValue, falseValue) {
            return input ? trueValue : falseValue;
        };
    });
