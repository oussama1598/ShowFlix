export default function ($stateProvider) {
  'ngInject'
  $stateProvider.state('show/:imdb', {
    url: '/show/:imdb',
    template: '<show flex layout="column"></show>'
  })
}
