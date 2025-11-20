import { Exception } from '@adonisjs/core/exceptions'

export default class DatabaseConnectionException extends Exception {
  static status = 500
  static code = 'E_DATABASE_CONNECTION'
  static message = 'Database connection error'
}
