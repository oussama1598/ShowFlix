export default class SocketService {
  /* @ngInject; */
  constructor(socketFactory) {
    this.events = [];
    this.$socket = socketFactory();

    this.$socket.on('all', (data) => {
      this.evtsOccured(data.evt, data.data);
    });
  }

  evtsOccured(eventName, data) {
    const callbacks = this.events[eventName] ? this.events[eventName] : [];

    callbacks.forEach((callback) => {
      callback(data);
    });
  }

  on(to, fn) {
    if (this.events[to]) this.events[to].push(fn);

    this.events[to] = [fn];
  }

  off(event, fn) {
    if (!this.events[event]) return;
    this.events[event].splice(this.events[event].indexOf(fn), 1);
  }

  emit(event, data) {
    this.$socket.emit(event, data);
  }
}
