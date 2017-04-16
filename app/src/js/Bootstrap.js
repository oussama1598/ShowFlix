export default ($rootScope) => {
  'ngInject';

  $rootScope.$on('$stateChangeStart', (event, toState) => {
    // if (toState.name !== 'app.downloads') socketEvt.emit('watchDownloads', false);
  });
};
