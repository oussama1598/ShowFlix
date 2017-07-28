export default function ($stateProvider) {
  'ngInject'
  $stateProvider.state('show/:imdb/:number', {
    url: '/show/:imdb/:number',
    template: '<season layout="column" flex></season>'
  })
}
