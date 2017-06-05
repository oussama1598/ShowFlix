export default ($stateProvider, $urlRouterProvider, $locationProvider) => {
  'ngInject'
  $stateProvider
    .state('app', {
      url: '/app',
      templateUrl: 'dist/views/main.html',
      controller: 'mainCtrl',
      controllerAs: 'main',
      abstract: true
    })
    .state('app.home', {
      url: '/home',
      templateUrl: 'dist/views/home.html',
      controller: 'homeCtrl',
      controllerAs: 'home'
    })
    .state('app.show', {
      url: '/show/:imdbId',
      templateUrl: 'dist/views/show.html',
      controller: 'showCtrl',
      controllerAs: 'show'
    })
    .state('app.downloads', {
      url: '/downloads',
      templateUrl: 'dist/views/downloads.html',
      controller: 'downloadsCtrl',
      controllerAs: 'downloads'
    })
    .state('app.queue', {
      url: '/queue',
      templateUrl: 'dist/views/queue.html',
      controller: 'queueCtrl',
      controllerAs: 'queue'
    })

  $urlRouterProvider.otherwise('app/home')
  $locationProvider.html5Mode(true)
}
