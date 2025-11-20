import { defineConfig } from '@adonisjs/lucid'

import { AWS_PUBLIC_PEM } from '#config/aws_public_pem'
import env from '#start/env'

const SSL_CONFIG = {
  ca: AWS_PUBLIC_PEM,
}

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('POSTGRES_USER'),
        password: env.get('POSTGRES_PASSWORD'),
        database: env.get('POSTGRES_DB'),
        ssl: env.get('NO_POSTGRES_SSL') ? false : SSL_CONFIG,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
        disableRollbacksInProduction: true,
      },
    },
  },
})

export default dbConfig
