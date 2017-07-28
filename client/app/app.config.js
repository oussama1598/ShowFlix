'use strict'

export function routeConfig ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
  'ngInject'

  $mdThemingProvider.theme('default')
    .primaryPalette('blue-grey', {
      'default': '900',
      'hue-1': '100',
      'hue-2': '600',
      'hue-3': 'A100'
    })
    .accentPalette('grey', {
      'default': '400'
    })

  $urlRouterProvider.otherwise('/')
  $locationProvider.html5Mode(true)
}
