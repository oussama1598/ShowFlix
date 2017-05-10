export default class QueueController {
  /* @ngInject; */
  constructor(ApiService, SocketService, $rootScope) {
    this.$ApiService = ApiService;
    this.$socket = SocketService;
    this.loading = true;

    this.$ApiService.getQueue()
      .then(this.getQueue.bind(this));

    this.$socket.on('queueChanged', this.getQueue.bind(this));
    this.$socket.on('serverStat', this.stateEvent.bind(this));

    $rootScope.$on('$stateChangeStart', (event, toState) => {
      if (toState.name !== 'app.home') {
        this.$socket.off('queueChanged', this.getQueue.bind(this));
        this.$socket.off('serverStat', this.stateEvent.bind(this));
      }
    });
  }

  deleteFromQueue(ev, file, index) {
    this.queue.splice(index, 1);
    this.$ApiService.deleteQueue(file.name, file.season, file.episode)
      .then(() => {
        window.Materialize.toast('Item has been deleted successfly', 4000, 'green');
      })
      .catch(() => {});
  }

  startFrom(_index) {
    const done = this.queue.filter(item => item.done);
    const index = (_index - done.length);

    this.$ApiService.startFrom(index)
      .then(() => {
        this.$socket.emit('serverStat');
      });
  }

  getQueue(queue) {
    this.loading = false;
    this.queue = queue;
  }

  stateEvent(data) {
    if (this.queue[data.queueIndex]) this.queue[data.queueIndex].noOptions = data.running;
  }
}
