import angular from 'angular'

export class NavbarComponent {
  $mdSidenav
  appName
  menu = [{
    title: 'Home',
    state: 'main'
  }, {
    title: 'Downloads',
    state: 'downloads'
  }, {
    title: 'Queue',
    state: 'queue'
  }]

  /* @ngInject */
  constructor ($mdSidenav, appConfig) {
    this.$mdSidenav = $mdSidenav

    this.appName = appConfig.appName
  }

  toggleNav () {
    this.$mdSidenav('left').toggle()
  }
}

export default angular.module('directives.navbar', [])
  .component('navbar', {
    template: require('./navbar.html'),
    controller: NavbarComponent
  })
  .name
