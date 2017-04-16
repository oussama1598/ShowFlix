export default class DownloadsController {
  /* @ngInject; */
  constructor(ApiService, SocketService, $rootScope) {
    this.$ApiService = ApiService;
    this.$socket = SocketService;
    this.loading = true;

    this.$ApiService.getDownloads()
      .then(this.setDownloads.bind(this));
    this.$socket.on('downloadsChanged', this.setDownloads.bind(this));

    $rootScope.$on('$stateChangeStart', (event, toState) => {
      if (toState.name !== 'app.downloads') {
        this.$socket.off('downloadsChanged', this.setDownloads.bind(this));
      }
    });
  }

  setDownloads(downloads) {
    this.loading = false;
    downloads.forEach((_file) => {
      const file = _file;
      file.progress.progress = file.progress.progress.toFixed(2);
      file.progress.written = window.filesize(file.progress.written);
      file.progress.size = window.filesize(file.progress.size);
      file.progress.speed = window.filesize(file.progress.speed);
      file.progress.timeRemaining = window.humanizeDuration(file.progress.timeRemaining, {
        delimiter: ' and ',
        largest: 2,
        round: true,
      });
    });
    this.files = downloads;
  }
}
