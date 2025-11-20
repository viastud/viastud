export const subject = ['MATHS'] as const

export type Subject = (typeof subject)[number]

export const SubjectEnum: Record<Subject, string> = {
  MATHS: 'Mathématiques',
}

export const SubjectEnumShort: Record<Subject, string> = {
  MATHS: 'Maths',
}

export const SubjectEmoji: Record<Subject, string> = {
  MATHS: '🧮',
}

export const SubjectIcons: Record<Subject, string> = {
  MATHS: '/icons/maths.svg',
}

export const subjectsOptions = subject.map((subj) => ({
  label: SubjectEnum[subj],
  value: subj,
}))
