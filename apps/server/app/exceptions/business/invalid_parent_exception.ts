import { Exception } from '@adonisjs/core/exceptions'

export default class InvalidParentException extends Exception {
  static status = 400
  static code = 'E_INVALID_PARENT'
  static message = 'Invalid parent ID'
}
