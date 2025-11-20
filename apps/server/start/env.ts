/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  APP_ENV: Env.schema.enum(['development', 'production', 'staging'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  POSTGRES_USER: Env.schema.string(),
  POSTGRES_PASSWORD: Env.schema.string.optional(),
  POSTGRES_DB: Env.schema.string(),
  NO_POSTGRES_SSL: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for Video SDK
  |----------------------------------------------------------
  */
  VIDEOSDK_API_KEY: Env.schema.string(),
  VIDEOSDK_SECRET_KEY: Env.schema.string(),
  VIDEOSDK_API_ENDPOINT: Env.schema.string(),
  VIDEOSDK_BUCKET: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for AWS SDK
  |----------------------------------------------------------
  */
  PROFILE_NAME: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for Brevo mail services
  |----------------------------------------------------------
  */
  PROFESSOR_BASE_URL: Env.schema.string(),
  USER_BASE_URL: Env.schema.string(),
  CONTACT_EMAIL_ADDRESS: Env.schema.string(),
  BREVO_API_KEY: Env.schema.string(),
  BREVO_FROM_EMAIL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring @rlanz/sentry package
  |----------------------------------------------------------
  */
  SENTRY_DSN: Env.schema.string(),
  SENTRY_RELEASE: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for Stripe API
  |----------------------------------------------------------
  */
  STRIPE_PRIVATE_API_KEY: Env.schema.string(),
  STRIPE_SIGNING_SECRET: Env.schema.string(),
  STRIPE_WEEKLY: Env.schema.string(),
  STRIPE_REFERRAL_COUPON_ID: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for Twilio SMS
  |----------------------------------------------------------
  */
  TWILIO_ACCOUNT_SID: Env.schema.string.optional(),
  TWILIO_AUTH_TOKEN: Env.schema.string.optional(),
  TWILIO_PHONE_NUMBER: Env.schema.string.optional(),
  TWILIO_MESSAGING_SERVICE_SID: Env.schema.string.optional(),
  SEND_REAL_SMS: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for cron jobs
  |----------------------------------------------------------
  */

  CRON_TOKEN: Env.schema.string(),
})
