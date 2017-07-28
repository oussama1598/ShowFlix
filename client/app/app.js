import angular from 'angular'
import ngAnimate from 'angular-animate'
import ngCookies from 'angular-cookies'
import ngResource from 'angular-resource'
import ngSanitize from 'angular-sanitize'
import ngMaterial from 'angular-material'
import uiRouter from 'angular-ui-router'

import {
  routeConfig
} from './app.config'

import constants from './app.constants'
import util from '../components/util/util.module'

// Loading Services
import socket from '../services/socket/socket.module'
import showData from '../services/showData/showData.module'

// Loading Components
import navbar from '../components/navbar/navbar.component'
import main from './main/main.component'
import show from './show/show.component'
import season from './season/season.component'
import episode from './episode/episode.component'

// Loading directives
import bgImage from '../directives/bgImage/bgImage.module'

import './app.scss'

angular.module('showFlixAppApp', [
  ngCookies,
  ngResource,
  ngSanitize,
  ngMaterial,
  ngAnimate,
  uiRouter,
  constants,
  util,
  socket,
  showData,
  navbar,
  main,
  show,
  season,
  episode,
  bgImage
])
  .config(routeConfig)

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['showFlixAppApp'], {
      strictDi: true
    })
  })
