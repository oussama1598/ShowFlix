'use strict'

export default function routes ($stateProvider) {
  'ngInject'

  $stateProvider.state('queue', {
    url: '/queue',
    template: '<queue flex layout="row"></queue>'
  })
}
