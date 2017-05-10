export default class MainController {
  /* @ngInject; */
  constructor(ApiService, SocketService, $interval, $mdDialog) {
    this.$ApiService = ApiService;
    this.$socket = SocketService;
    this.$mdDialog = $mdDialog;
    this.serverOn = false;

    $('.button-collapse')
      .sideNav();


    $interval(() => this.$socket.emit('serverStat'), 2000);

    // listeners
    this.$socket.on('log', (data) => {
      window.Materialize.toast(data.str, 4000, data.color);
    });
    this.$socket.on('serverStat', (data) => {
      this.serverOn = data.running;
    });
  }

  toggleServer() {
    this.$ApiService.toggleServer(this.serverOn ? 'stop' : 'start')
      .then(() => this.$socket.emit('serverStat'));
  }

  showAddtoQueue(ev) {
    this.$mdDialog.show({
      controller: 'addtoQueueCtrl',
      controllerAs: 'addtoQueue',
      templateUrl: 'views/addtoQueue.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: false,
    });
  }
}
