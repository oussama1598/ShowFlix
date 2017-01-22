'use strict';

angular.module('showFlex').controller('downCtrl', ["$scope", "socketEvt", "$rootScope", function($scope, socketEvt, $rootScope) {
    $scope.files = [];
    $scope.loading = true;

    $scope.changed = function(data) {
        $scope.loading = false;
        $scope.parseNewData(data);
    }

    $scope.parseNewData = function(data) {
        $scope.files = data;
    }

    socketEvt.emit("watchDownloads", true);
    socketEvt.add("downloadsChanged", $scope.changed);

    $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams, options) {
            if (toState.name !== "app.downloads") {
                socketEvt.remove("downloadsChanged", $scope.changed);
            }
        })
}]);
