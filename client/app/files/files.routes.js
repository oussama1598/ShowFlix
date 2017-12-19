'use strict'

export default function routes ($stateProvider) {
  'ngInject'

  $stateProvider.state('files', {
    url: '/files',
    template: '<files flex layout="row"></files>'
  })
}
