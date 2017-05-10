export default class SubtitlesController {
  /* @ngInject; */
  constructor(ApiService, $mdDialog, file) {
    this.$ApiService = ApiService;
    this.$mdDialog = $mdDialog;
    this.file = file;
    this.loading = true;
    this.filename = '';

    this.$ApiService.getSubs(file.subs)
      .then(this.getSubs.bind(this));
  }

  getSubs(res) {
    this.loading = false;
    this.subtitles = res.subs;
    this.filename = res.filename;
  }

  downloadSub() {
    this.progress = true;
    this.$ApiService.downloadSub(this.file.subs, this.selected.link)
      .then(() => {
        this.progress = false;
        window.Materialize.toast('Subtitle has been addedd successfly.', 4000, 'green');
        this.cancel();
      })
      .catch(() => this.cancel());
  }

  search() {
    this.loading = true;
    this.$ApiService.getSubs(`${this.file.subs}?filename=${this.filename}`)
      .then(this.getSubs.bind(this));
  }

  cancel() {
    this.$mdDialog.cancel();
  }
}
