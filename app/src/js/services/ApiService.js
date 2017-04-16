export default class ApiService {
  /* @ngInject; */
  constructor($http) {
    this.$http = $http;
  }

  toggleServer(command) {
    return this.$http
      .get(`api/server/${command}`)
      .catch((err) => {
        this.showError(err);
      });
  }

  getFiles() {
    return this.$http
      .get('api/files')
      .then(res => res.data)
      .catch((err) => {
        this.showError(err);
      });
  }

  deleteFile(url) {
    return this.$http.delete(`api${url}`)
      .then((res) => {
        if (!res.status) {
          return Promise.reject(res.error);
        }
        return true;
      })
      .catch((err) => {
        this.showError(err);
      });
  }

  getDownloads() {
    return this.$http.get('api/downloads')
      .then(res => res.data)
      .catch((err) => {
        this.showError(err);
      });
  }

  getQueue() {
    return this.$http.get('api/queue')
      .then(res => res.data)
      .catch((err) => {
        this.showError(err);
      });
  }

  deleteQueue(name, season, episode) {
    return this.$http.delete('api/queue', {
        name,
        season,
        episode,
      })
      .then((res) => {
        if (!res.status) {
          return Promise.reject(res.error);
        }
        return true;
      })
      .catch((err) => {
        this.showError(err);
      });
  }

  startFrom(index) {
    return this.$http({
      method: 'GET',
      url: 'api/server/start',
      params: {
        index,
      },
    })
      .then((res) => {
        if (!res.status) {
          return Promise.reject(res.error);
        }
        return true;
      })
      .catch((err) => {
        this.showError(err);
      });
  }

  static showError(msg) {
    window.Materialize.toast(msg, 4000, 'red');
  }
}
