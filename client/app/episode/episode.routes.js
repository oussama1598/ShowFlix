export default function ($stateProvider) {
  'ngInject'

  $stateProvider.state('show/:imdb/:number/:episode', {
    url: '/show/:imdb/:number/:episode',
    template: '<episode layout="column" flex></episode>'
  })
}
