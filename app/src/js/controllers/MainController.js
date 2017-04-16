export default class MainController {
  /* @ngInject; */
  constructor(ApiService, SocketService, $interval) {
    this.$ApiService = ApiService;
    this.$socket = SocketService;
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
      .then((res) => {
        if (!res.data.status) return this.$ApiService.showError(res.data.error);
        return this.$socket.emit('serverStat');
      });
  }
}
