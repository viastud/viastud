import { Exception } from '@adonisjs/core/exceptions'

export default class ExternalServiceException extends Exception {
  static status = 503
  static code = 'E_EXTERNAL_SERVICE'
  static message = 'External service unavailable'
}
