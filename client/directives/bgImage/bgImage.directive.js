export default function () {
  return (scope, element, attrs) => {
    scope.$watch(attrs.bgImage, value => {
      if (value.constructor === Array) value = value.join('')

      element.css({
        'background-image': 'url(' + value + ')',
        'background-size': 'cover'
      })
    })
  }
}
