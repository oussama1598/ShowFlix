'use strict'

import angular from 'angular'
// import ngAnimate from 'angular-animate';
import ngCookies from 'angular-cookies'
import ngResource from 'angular-resource'
import ngSanitize from 'angular-sanitize'

import uiRouter from 'angular-ui-router'

import {
  routeConfig
} from './app.config'

import navbar from '../components/navbar/navbar.component'
import footer from '../components/footer/footer.component'
import main from './main/main.component'
import constants from './app.constants'
import util from '../components/util/util.module'

import './app.scss'

angular.module('showFlixAppApp', [
  ngCookies,
  ngResource,
  ngSanitize,
  uiRouter,
  navbar,
  footer,
  main,
  constants,
  util
])
  .config(routeConfig)

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['showFlixAppApp'], {
      strictDi: true
    })
  })
