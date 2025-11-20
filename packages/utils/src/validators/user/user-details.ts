import { z } from 'zod'

import { grade } from '#enums/class'
import { subject } from '#enums/subject'

export const userDetailsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  grade: z.enum(grade).optional(),
  interestedIn: z.enum(subject).array(),
  doneModules: z.array(z.number()),
  doingModules: z.array(z.number()),
})
