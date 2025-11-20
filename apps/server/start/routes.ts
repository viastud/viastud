const TrpcsController = () => import('#controllers/trpc_controller')
const CronController = () => import('#controllers/cron_controller')
const StripeController = () => import('#controllers/stripe_controller')
const VideoSdkController = () => import('#controllers/webhook_controller')
import router from '@adonisjs/core/services/router'

import { middleware } from '#start/kernel'

router.get('/', async () => {
  return 'ok'
})

router
  .group(() => {
    router.post('/api/cron-job', [CronController, 'index'])
    router.post('/api/stripe', [StripeController, 'index'])
    router.post('/api/webhook/recording-saved', [VideoSdkController, 'recordingSaved'])
  })
  .use(middleware.bodyParser())

router.any('/api/trpc/*', [TrpcsController, 'index'])
