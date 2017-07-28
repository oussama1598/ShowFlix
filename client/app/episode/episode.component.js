import angular from 'angular'

export class EpisodeController {

}

export default angular.module('showFlixAppApp.episode', [])
  .component('episode', {
    template: require('./episode.html'),
    controller: EpisodeController
  })
  .name
