export default class ErrorHandler {
  /* @ngInject; */
  constructor() {
    this.alert = window.Materialize.toast;
  }

  parse(msg) {
    if (typeof msg === 'string') {
      return this.alert(msg, 4000, 'red');
    }

    if (Array.isArray(msg)) {
      return this.alert(msg[0].msg, 4000, 'red');
    }

    return true;
  }
}
