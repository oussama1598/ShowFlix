angular.module('showFlex').controller('queueCtrl', ["$scope", "socketEvt", "$rootScope", "$http", function($scope, socketEvt, $rootScope, $http) {
    $scope.queue = [];
    $scope.loading = true;

    $scope.changed = function(data) {
        $scope.loading = false;
        $scope.parseNewData(data);
    }

    $scope.parseNewData = function(data) {
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

    socketEvt.emit("watchQueue", true);
    socketEvt.add("queueChanged", $scope.changed);

    $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams, options) {
            if (toState.name !== "app.queue") {
                socketEvt.remove("queueChanged", $scope.changed);
            }
        })
}]);
