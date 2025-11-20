import { z } from 'zod'

import { subject } from '#enums/subject'
import { editProfileSchema } from '#validators/common/edit-profile'

export const editProfessorSchema = editProfileSchema.extend({
  subject: z.enum(subject).optional(),
})

export type EditProfessorSchema = z.infer<typeof editProfessorSchema>
