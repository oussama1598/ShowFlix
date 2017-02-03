'use strict';

angular.module('showFlex')
    .controller('MainCtrl', ['$scope', '$mdSidenav', 'socketEvt', '$interval', '$http', '$mdDialog',
        function($scope, $mdSidenav, socketEvt, $interval, $http, $mdDialog) {
            $scope.serverOn = false;
            $scope.addQueueProgress = false;

            $(".button-collapse").sideNav();
            socketEvt.add("log", function(data) {
                Materialize.toast(data.str, 4000, (data.color !== "white") ? data.color : "");
            })

            socketEvt.emit("serverStat");

            $interval(function() {
                socketEvt.emit("serverStat");
            }, 7000);

            socketEvt.add("serverStat", function(data) {
                if(!localStorage["queueCount"]) localStorage["queueCount"] = data.queueCount;
                if(parseInt(localStorage["queueCount"]) < data.queueCount){
                    $scope.newItems = (data.queueCount - parseInt(localStorage["queueCount"]));
                }else{
                    $scope.newItems = false;
                }

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
                        socketEvt.emit("serverStat");
                    })
                }
            }

            $scope.showAddtoQueue = function(ev) {
                $mdDialog.show({
                        controller: ["$scope", "$mdDialog", DialogController],
                        templateUrl: 'views/addtoQueue.html',
                        parent: angular.element(document.body),
                        targetEvent: ev,
                        clickOutsideToClose: false
                    })
            }

            function DialogController($scope, $mdDialog) {
                $scope.cancel = function() {
                    $mdDialog.cancel();
                };

                $scope.add = function() {
                    var addtoQueue = $scope.addtoQueue;

                    if (isNaN(addtoQueue.toepisode) && addtoQueue.toepisode !== "f") {
                        Materialize.toast("Sorry the to episode should be a number or 'f'", 4000, 'red');
                        return;
                    }

                    if (addtoQueue.toepisode !== "f" && parseInt(addtoQueue.toepisode) < parseInt(addtoQueue.fromepisode)) {
                        Materialize.toast("The to episode should be greater or equals from episode", 4000, 'red');
                        return;
                    }

                    $scope.addQueueProgress = true;
                    
                    $http.post("/addToqueue", { 
                        keyword: addtoQueue.name, 
                        season: addtoQueue.season, 
                        from: addtoQueue.fromepisode, 
                        to: addtoQueue.toepisode 
                    }).then(function (res) {
                        $scope.addQueueProgress = false;
                        if(!res.data.status){
                            Materialize.toast(res.data.error, 4000, 'red');
                            return;
                        }
                        $mdDialog.cancel();
                    });
                }

            }
        }
    ]);
