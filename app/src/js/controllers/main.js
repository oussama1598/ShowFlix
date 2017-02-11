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
                if (!localStorage["queueCount"]) localStorage["queueCount"] = data.queueCount;
                if (parseInt(localStorage["queueCount"]) < data.queueCount) {
                    $scope.newItems = (data.queueCount - parseInt(localStorage["queueCount"]));
                } else {
                    $scope.newItems = false;
                }

                console.log(data);

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

                $scope.isUrl = function(s) {
                    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
                    return regexp.test(s);
                }

                $scope.sendReq = function(data) {
                    $scope.addQueueProgress = true;

                    $http.post("/addToqueue", data).then(function(res) {
                        $scope.addQueueProgress = false;
                        if (!res.data.status) {
                            Materialize.toast(res.data.error, 4000, 'red');
                            return;
                        }
                        $mdDialog.cancel();
                    });
                }

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

                    $scope.sendReq({
                        keyword: addtoQueue.name,
                        season: addtoQueue.season,
                        from: addtoQueue.fromepisode,
                        to: addtoQueue.toepisode
                    })
                }

                $scope.addUrl = function() {
                    var manual = $scope.manual;

                    if (isNaN(manual.toepisode) && manual.toepisode !== "f") {
                        Materialize.toast("Sorry the to episode should be a number or 'f'", 4000, 'red');
                        return;
                    }

                    if (manual.toepisode !== "f" && parseInt(manual.toepisode) < parseInt(manual.fromepisode)) {
                        Materialize.toast("The to episode should be greater or equals from episode", 4000, 'red');
                        return;
                    }

                    if (!$scope.isUrl(manual.url)) {
                        Materialize.toast("The entred url is not a valid one", 4000, 'red');
                        return;
                    }

                    $scope.sendReq({
                        keyword: manual.name,
                        url: manual.url,
                        season: manual.season,
                        from: manual.fromepisode,
                        to: manual.toepisode,
                    })
                }

            }
        }
    ]);
