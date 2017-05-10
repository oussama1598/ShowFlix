export default class HomeContoller {
  /* @ngInject; */
  constructor(ApiService, SocketService, $rootScope, $mdDialog) {
    this.$ApiService = ApiService;
    this.$socket = SocketService;
    this.$mdDialog = $mdDialog;
    this.loading = true;

    this.$ApiService.getFiles()
      .then(this.getFiles.bind(this));

    this.$socket.on('mediasChanged', this.getFiles.bind(this));

    $rootScope.$on('$stateChangeStart', (event, toState) => {
      if (toState.name !== 'app.home') this.$socket.off('mediasChanged', this.getFiles.bind(this));
    });
  }

  getFiles(files) {
    this.loading = false;
    this.Files = files;
  }

  confirmDelete(file, ev) {
    const confirm = this.$mdDialog.confirm()
      .title('Confirm')
      .textContent('Are you sure you wanna delete this episode?')
      .ariaLabel('delete')
      .targetEvent(ev)
      .ok('Yes')
      .cancel('No');

    this.$mdDialog.show(confirm)
      .then(() => {
        this.Files.splice(this.Files.indexOf(file), 1);
        this.$ApiService.deleteFile(file.streamUrl);
      })
      .catch(() => {});
  }

  openSubtitlesDialog(file, ev) {
    this.$mdDialog.show({
      controller: 'subtitlesCtrl',
      controllerAs: 'subs',
      templateUrl: 'views/subtitlesDialog.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: false,
      locals: {
        file,
      },
    });
  }
}
