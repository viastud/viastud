import { Exception } from '@adonisjs/core/exceptions'

export default class InvalidUserException extends Exception {
  static status = 400
  static code = 'E_INVALID_USER'
  static message = 'Invalid user ID'
}
