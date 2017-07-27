import angular from 'angular'
import DirectiveController from './bgImage.directive'

export default angular.module('directives.bgImage', [])
  .directive('bgImage', DirectiveController)
  .name
