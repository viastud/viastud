import { Exception } from '@adonisjs/core/exceptions'

export default class UnauthorizedAccessException extends Exception {
  static status = 401
  static code = 'E_UNAUTHORIZED_ACCESS'
  static message = 'You are not authorized to access this resource'
}
