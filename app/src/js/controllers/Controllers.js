import HomeController from './HomeController';
import MainController from './MainController';
import DownloadsController from './DownloadsController';
import QueueController from './QueueController';
import AddToQueueController from './AddToQueueController';
import SubtitlesController from './SubtitlesController';

export default angular.module('showFlix.controllers', [])
  .controller('mainCtrl', MainController)
  .controller('homeCtrl', HomeController)
  .controller('downloadsCtrl', DownloadsController)
  .controller('queueCtrl', QueueController)
  .controller('addtoQueueCtrl', AddToQueueController)
  .controller('subtitlesCtrl', SubtitlesController);
