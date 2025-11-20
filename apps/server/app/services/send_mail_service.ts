import { type MailTemplate, MailTemplateEnum } from '@viastud/utils'
import axios from 'axios'

import env from '#start/env'

export async function sendMail({
  mailTemplate,
  emails,
  subject,
  attachment,
  replyTo,
  params,
}: {
  mailTemplate: MailTemplate
  emails: string[]
  subject?: string
  attachment?: { content: string; name: string }[]
  replyTo?: { email: string; name: string }
  params?: Record<string, string>
}) {
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      templateId: MailTemplateEnum[mailTemplate],
      to: emails.map((email) => ({ email })),
      subject,
      replyTo,
      attachment,
      params,
    },
    {
      headers: {
        'api-key': env.get('BREVO_API_KEY'),
      },
    }
  )
}

// Raw email sender removed in favor of template-based sendMail
