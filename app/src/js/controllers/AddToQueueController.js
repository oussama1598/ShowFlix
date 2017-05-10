export default class AddToQueueController {
  /* @ngInject; */
  constructor(ApiService, $mdDialog) {
    this.$ApiService = ApiService;
    this.$mdDialog = $mdDialog;
  }

  add() {
    if (
      isNaN(this.input.toepisode) &&
      this.input.toepisode !== 'f'
    ) {
      return window.Materialize.toast('Sorry the to episode should be a number or "f"', 4000, 'red');
    }

    if (
      this.input.toepisode !== 'f' &&
      parseInt(this.input.toepisode, 10) < parseInt(this.input.fromepisode, 10)
    ) {
      return window.Materialize.toast('The to episode should be greater or equals from episode', 4000, 'red');
    }

    this.addQueueProgress = true;

    return this.$ApiService.addtoQueue(
        this.input.name,
        this.input.season,
        this.input.fromepisode,
        this.input.toepisode)
      .then((res) => {
        if (res.status) {
          window.Materialize.toast('The result has been added to the queue', 4000, 'green');
        }

        this.addQueueProgress = false;
        this.$mdDialog.cancel();
      });
  }

  cancel() {
    this.$mdDialog.cancel();
  }
}
