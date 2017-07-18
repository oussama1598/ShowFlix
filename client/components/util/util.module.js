'use strict'

import angular from 'angular'
import {
  UtilService
} from './util.service'

export default angular.module('showFlixAppApp.util', [])
  .factory('Util', UtilService)
  .name
