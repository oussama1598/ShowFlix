angular.module('showFlex').controller('queueCtrl', ["$scope", "socketEvt", "$rootScope", "$http",
    function($scope, socketEvt, $rootScope, $http) {

        $scope.queue = [];
        $scope.loading = true;

        $scope.openMenu = function($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        $scope.startFrom = function(index) {
            var done = $scope.queue.filter(function(item) {
                    return item.done;
                }),
                index = (index - done.length);
                
            $http({
                method: 'GET',
                url: "/start",
                params: { index: index }
            }).then(function(res) {
                if (res.data.error) {
                    Materialize.toast(res.data.error, 4000, "red");
                }
                socketEvt.emit("serverStat");
            })
        }

        $scope.changed = function(data) {
            $scope.queue = data;
        }

        $scope.deleteFromQueue = function(ev, file, index) {
            $scope.queue.splice(index, 1);
            $http.post("/queue", { name: file.name, season: file.season, episode: file.episode }).then(function(res) {
                if (res.data.status) {
                    Materialize.toast("Item has been deleted successfly", 4000, "green");
                }
            });
        }

        $scope.stateWatcher = function(data) {
            if ($scope.queue[data.queueIndex]) $scope.queue[data.queueIndex].noOptions = data.running;
        }

        $scope.init = function() {
            $http.get("/queue").then(function(res) {
                $scope.loading = false;
                $scope.queue = res.data;
            })
        }

        $scope.init();

        socketEvt.add("queueChanged", $scope.changed);
        socketEvt.add("serverStat", $scope.stateWatcher);

        $rootScope.$on('$stateChangeStart',
            function(event, toState, toParams, fromState, fromParams, options) {
                if (toState.name !== "app.queue") {
                    socketEvt.remove("queueChanged", $scope.changed);
                    socketEvt.remove("serverStat", $scope.stateWatcher);
                }
            })
    }
]);
