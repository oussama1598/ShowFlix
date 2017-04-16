import Routes from './Routes';
import Bootstrap from './Bootstrap';

import Controlers from './controllers/Controllers';
import Services from './services/Services';

angular.module('showFlex', ['ui.router', 'btford.socket-io', 'ngMaterial', Controlers.name, Services.name])
  .config(Routes)
  .run(Bootstrap);
