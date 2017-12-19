import angular from 'angular'
import uiRouter from 'angular-ui-router'
import filesize from 'filesize'
import routing from './queue.routes'

export class QueueController {
  /* @ngInject */
  constructor ($http) {
    this.$http = $http
    this.queue = []
  }

  $onInit () {
    this.getQueue()
  }

  getQueue () {
    this.queue = []
    this.loading = true
    this.$http.get(`/api/queue`)
      .then(res => {
        this.queue = res.data
        this.loading = false
      })
      .catch(err => console.log(err))
  }

  filesize (size) {
    return filesize(size)
  }
}

export default angular.module('showFlixAppApp.queue', [uiRouter])
  .config(routing)
  .component('queue', {
    template: require('./queue.html'),
    controller: QueueController
  })
  .name
