import angular from 'angular'

export class NavbarComponent {
  $mdSidenav
  appName
  menu = [{
    title: 'Home',
    state: 'main'
  }, {
    title: 'Files',
    state: 'files'
  }, {
    title: 'Queue',
    state: 'queue'
  }]
  $rootScope
  $state
  backBtn = {
    show: false
  }

  /* @ngInject */
  constructor ($mdSidenav, appConfig, $rootScope, $state) {
    this.$mdSidenav = $mdSidenav
    this.$rootScope = $rootScope
    this.$state = $state
    this.appName = appConfig.appName
  }

  $onInit () {
    this.$rootScope.$on('backBtn', (event, data) => {
      this.backBtn = data
    })
  }

  MenuBackAction () {
    if (this.backBtn.show) return this.$state.go(this.backBtn.state, this.backBtn.params || {})

    this.$mdSidenav('left').toggle()
  }
}

export default angular.module('directives.navbar', [])
  .component('navbar', {
    template: require('./navbar.html'),
    controller: NavbarComponent
  })
  .name
