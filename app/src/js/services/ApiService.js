export default class ApiService {
  /* @ngInject; */
  constructor($http, ErrorHandler) {
    this.$http = $http;
    this.$ErrorHandler = ErrorHandler;
  }

  wrapforError(promise) {
    return promise
      .then(res => res.data)
      .then(res => (
        Object.prototype.hasOwnProperty.call(res, 'status') &&
        !res.status ? Promise.reject(res.error) : res))
      .catch((err) => {
        this.$ErrorHandler.parse(err);
        return Promise.reject(err);
      });
  }

  toggleServer(command) {
    return this.wrapforError(this.$http
      .get(`api/server/${command}`));
  }

  getFiles() {
    return this.wrapforError(this.$http
      .get('api/files'));
  }

  deleteFile(url) {
    return this.wrapforError(this.$http.delete(`api${url}`));
  }

  getDownloads() {
    return this.wrapforError(this.$http.get('api/downloads'));
  }

  getQueue() {
    return this.wrapforError(this.$http.get('api/queue'));
  }

  deleteQueue(name, season, episode) {
    return this.wrapforError(
      this.$http({
        url: 'api/queue',
        method: 'DELETE',
        data: {
          name,
          season,
          episode,
        },
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
      }));
  }

  startFrom(index) {
    return this.wrapforError(this.$http({
      method: 'GET',
      url: 'api/server/start',
      params: {
        index,
      },
    }));
  }

  addtoQueue(keyword, season, from, to) {
    return this.wrapforError(this.$http.post('/api/queue', {
      keyword,
      season,
      from,
      to,
    }));
  }

  getSubs(subsUrl) {
    return this.wrapforError(this.$http.get(`api${subsUrl}`));
  }

  downloadSub(subsUrl, link) {
    return this.wrapforError(this.$http.post(`api${subsUrl}`, {
      link,
    }));
  }
}
