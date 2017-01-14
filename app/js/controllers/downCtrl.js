'use strict';

angular.module('showFlex').controller('downCtrl', ["$scope", "serverSocket", function($scope, serverSocket) {
    $scope.files = [];
    $scope.loading = true;


    serverSocket.on("downloadsChanged", function(data) {
        $scope.loading = false;
        $scope.parseNewData(data);
    })

    $scope.parseNewData = function(data) {
        if (_.isArray(data)) {
            $scope.files = data;
            return;
        }

        _.each($scope.files, (val, key) => {
            if (val.filename === data.filename) {
                $scope.files[key] = data;
            }
        })
    }
}]);
