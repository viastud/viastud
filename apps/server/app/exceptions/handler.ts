import { ExceptionHandler, type HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import Stripe from 'stripe'
import { ZodError } from 'zod'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected ignoreStatuses = [401, 400, 422, 403, 404]
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof ZodError) {
      ctx.response.status(422).send(error.errors)
      return
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    if (error instanceof ZodError) {
      return
    }
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      logger.error(error.message)
      return
    }
    return super.report(error, ctx)
  }
}
