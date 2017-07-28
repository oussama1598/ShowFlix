import moment from 'moment'

export function UtilService ($window) {
  'ngInject'

  const fixDate = date => moment(date).format('LL')

  return {
    fixDate
  }
}
