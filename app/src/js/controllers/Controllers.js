import HomeController from './HomeController';
import MainController from './MainController';
import DownloadsController from './DownloadsController';
import QueueController from './QueueController';

export default angular.module('showFlex.controllers', [])
  .controller('mainCtrl', MainController)
  .controller('homeCtrl', HomeController)
  .controller('downloadsCtrl', DownloadsController)
  .controller('queueCtrl', QueueController);
