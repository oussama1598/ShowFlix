angular.module('showFlex').controller('queueCtrl', ["$scope", "socketEvt", "$rootScope", function($scope, socketEvt, $rootScope) {
    $scope.queue = [];
    $scope.loading = true;

    $scope.changed = function(data) {
        $scope.loading = false;
        $scope.parseNewData(data);
    }

    $scope.parseNewData = function(data) {
        $scope.queue = data;
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
