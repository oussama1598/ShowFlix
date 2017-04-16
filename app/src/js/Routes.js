export default ($stateProvider, $urlRouterProvider) => {
  'ngInject';

  $stateProvider
    .state('app', {
      url: '/app',
      templateUrl: 'views/main.html',
      controller: 'mainCtrl',
      controllerAs: 'main',
      abstract: true,
    })
    .state('app.home', {
      url: '/home',
      templateUrl: 'views/home.html',
      controller: 'homeCtrl',
      controllerAs: 'home',
    })
    .state('app.downloads', {
      url: '/downloads',
      templateUrl: 'views/downloads.html',
      controller: 'downloadsCtrl',
      controllerAs: 'downloads',
    })
    .state('app.queue', {
      url: '/queue',
      templateUrl: 'views/queue.html',
      controller: 'queueCtrl',
      controllerAs: 'queue',
    });

  $urlRouterProvider.otherwise('app/home');
};
