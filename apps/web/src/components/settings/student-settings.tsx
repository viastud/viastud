import { zodResolver } from '@hookform/resolvers/zod'
import type { ModuleForStudent } from '@viastud/server/routers/user_router'
import { Checkbox } from '@viastud/ui/checkbox'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { trpc } from '@viastud/ui/lib/trpc'
import { RadioGroup, RadioGroupItem } from '@viastud/ui/radio-group'
import type { UserDto } from '@viastud/ui/shared/edit-profile'
import { EditProfile } from '@viastud/ui/shared/edit-profile'
import type { EditProfileSchema, Grade, Subject } from '@viastud/utils'
import {
  editProfileSchema,
  grade,
  GradeEnum,
  subject,
  SubjectEmoji,
  SubjectEnum,
} from '@viastud/utils'
import type { Dispatch, SetStateAction } from 'react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { UserAuthStateAuthenticated } from '@/store/auth.store'

interface StudentSettingsProps {
  student: UserDto
  updateAuth?: (auth: UserAuthStateAuthenticated) => void
  editPassword?: boolean
  isDirty: boolean
  setIsDirty: Dispatch<SetStateAction<boolean>>
  onSuccess?: () => void
}

export function StudentSettings({
  student,
  updateAuth,
  editPassword,
  isDirty,
  setIsDirty,
  onSuccess,
}: StudentSettingsProps) {
  const [checkedGrade, setCheckedGrade] = useState<Grade | null>(null)
  const [interestedIn, setInterestedIn] = useState<Subject[]>([])
  const { toast } = useToast()
  const { data: studentData } = trpc.user.getStudentDetails.useQuery({
    id: student.id,
  })

  const [studentModules, setStudentModules] = useState<ModuleForStudent[]>([])

  useEffect(() => {
    if (studentData?.modules) {
      // Garder tous les modules pour préserver l'état, ne pas filtrer ici
      setStudentModules(studentData.modules)
    }
  }, [studentData])

  useEffect(() => {
    if (studentData) {
      setCheckedGrade(studentData.grade ?? null)
      setInterestedIn(studentData.interestedIn)
    }
  }, [studentData])

  const editProfileForm = useForm<EditProfileSchema>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      id: student?.id ?? '',
      lastName: student?.lastName ?? '',
      firstName: student?.firstName ?? '',
      email: student?.email ?? '',
      phoneNumber: student?.phoneNumber ?? '',
    },
  })

  const { mutateAsync: editProfileMutation } = trpc.user.edit.useMutation({
    onSuccess: (data) => {
      // Si updateAuth est fourni, on l'utilise (contexte étudiant)
      // Sinon, on ne fait rien (contexte parent - on ne veut pas changer l'auth du parent)
      if (updateAuth) {
        updateAuth({ user: data, role: 'STUDENT', isAuthenticated: true })
      }
      // Appeler le callback onSuccess si fourni
      if (onSuccess) {
        onSuccess()
      }
      toast({
        title: 'Profil modifié avec succès',
      })
      setIsDirty(false)
    },
    onError: () => {
      toast({
        title: 'Erreur lors de la modification du profil',
      })
    },
  })

  const changePasswordMutation = trpc.userAuth.changePassword.useMutation()

  // Helper pour filtrer les modules selon le grade et la matière
  const getFilteredModules = (subject: Subject) => {
    return studentModules.filter(
      (module) => module.subject === subject && module.grade === checkedGrade
    )
  }

  // Groupes de chapitres à partir des modules filtrés
  const getChapterGroups = (subject: Subject) => {
    const modules = getFilteredModules(subject)
    const chapterIdToGroup = new Map<
      number,
      { id: number; name: string; order: number; moduleIds: number[] }
    >()
    for (const module of modules) {
      const chapterId = module.chapter.id
      const chapterName = module.chapter.name
      const chapterOrder = (module.chapter as { order?: number }).order ?? 0
      if (!chapterIdToGroup.has(chapterId)) {
        chapterIdToGroup.set(chapterId, {
          id: chapterId,
          name: chapterName,
          order: chapterOrder,
          moduleIds: [],
        })
      }
      const chapterGroup = chapterIdToGroup.get(chapterId)
      if (chapterGroup) {
        chapterGroup.moduleIds.push(module.id)
      }
    }
    return Array.from(chapterIdToGroup.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.id - b.id
    })
  }

  const toggleChapterDone = (subjectParam: Subject, chapterId: number) => {
    setStudentModules((prev) => {
      const affected = prev.filter(
        (m) => m.grade === checkedGrade && m.subject === subjectParam && m.chapter.id === chapterId
      )
      const allDone = affected.length > 0 && affected.every((m) => m.doneModule)
      const next = prev.map((m) => {
        if (m.grade === checkedGrade && m.subject === subjectParam && m.chapter.id === chapterId) {
          return { ...m, doneModule: !allDone }
        }
        return m
      })
      return next
    })
    setIsDirty(true)
  }

  const toggleChapterDoing = (subjectParam: Subject, chapterId: number) => {
    setStudentModules((prev) => {
      const affected = prev.filter(
        (m) => m.grade === checkedGrade && m.subject === subjectParam && m.chapter.id === chapterId
      )
      const allDoing = affected.length > 0 && affected.every((m) => m.doingModule)
      const next = prev.map((m) => {
        if (m.grade === checkedGrade && m.subject === subjectParam && m.chapter.id === chapterId) {
          return { ...m, doingModule: !allDoing }
        }
        return m
      })
      return next
    })
    setIsDirty(true)
  }

  // Obsolete: la sélection se fait au niveau du chapitre désormais

  const onSubmit = async (data: EditProfileSchema) => {
    // On ne garde que les modules qui ont été cochés (doneModule ou doingModule à true)
    const modulesToSend = studentModules.filter((module) => module.doneModule || module.doingModule)
    await editProfileMutation({
      ...data,
      interestedIn,
      grade: checkedGrade,
      modules: modulesToSend,
    })
  }

  return (
    <div className="flex w-4/5 flex-col gap-4 pb-32 pt-4">
      <EditProfile
        editProfileForm={editProfileForm}
        editPassword={editPassword}
        onSubmit={onSubmit}
        updatePassword={changePasswordMutation}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        user={student}
        role="STUDENT"
        updateAuth={
          updateAuth
            ? (auth) => {
                updateAuth(auth as UserAuthStateAuthenticated)
              }
            : undefined
        }
      />
      <h1 className="text-2xl font-extrabold text-gray-950">Cours</h1>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex grow flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Classe</p>
          <RadioGroup className="flex gap-4" value={checkedGrade ?? undefined}>
            {grade.map((grade) => (
              <div className="flex items-center gap-2" key={grade}>
                <RadioGroupItem
                  value={grade}
                  onClick={() => {
                    setCheckedGrade(grade)
                    setIsDirty(true)
                  }}
                />
                <p className="text-sm font-medium text-gray-700">{GradeEnum[grade]}</p>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="flex grow flex-col items-start gap-2 self-stretch">
          <p className="text-sm font-medium text-gray-700">
            Quelle(s) matière(s) souhaitez-vous étudier ?
          </p>
          <div className="flex items-start gap-4 self-stretch">
            {subject.map((subject) => (
              <div className="flex items-center gap-2" key={subject}>
                <Checkbox
                  checked={interestedIn.includes(subject)}
                  onClick={() => {
                    setInterestedIn((prevState) =>
                      prevState.includes(subject)
                        ? prevState.filter((s) => s !== subject)
                        : [...prevState, subject]
                    )
                    setIsDirty(true)
                  }}
                />
                <p className="text-sm font-medium text-gray-700">{SubjectEnum[subject]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {subject.map(
        (subject) =>
          interestedIn.includes(subject) && (
            <div key={subject} className="flex w-full flex-col gap-4">
              <p className="text-lg font-bold text-gray-950">
                {SubjectEmoji[subject]} {SubjectEnum[subject]}
              </p>
              <div className="flex gap-4">
                <div className="flex flex-1 flex-col">
                  <div className="flex flex-col gap-4">
                    <p className="font-semibold text-gray-950">
                      Groupes de chapitres déjà traités en classe
                    </p>
                    <div className="flex flex-col gap-4 rounded-2xl">
                      {getChapterGroups(subject).map((chapter) => {
                        const isChecked = getFilteredModules(subject)
                          .filter((m) => m.chapter.id === chapter.id)
                          .every((m) => m.doneModule)
                        return (
                          <div
                            key={chapter.id}
                            className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
                            onClick={() => {
                              toggleChapterDone(subject, chapter.id)
                            }}
                          >
                            <Checkbox checked={isChecked} />
                            <p className="text-sm font-medium text-gray-700">{chapter.name}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 shrink-0 flex-col">
                  <div className="flex flex-col gap-4">
                    <p className="font-semibold text-gray-950">Chapitres étudiés actuellement</p>
                    <div className="flex flex-col gap-4 rounded-2xl">
                      {getChapterGroups(subject).map((chapter) => {
                        const isChecked = getFilteredModules(subject)
                          .filter((m) => m.chapter.id === chapter.id)
                          .every((m) => m.doingModule)
                        return (
                          <div
                            key={chapter.id}
                            className="flex cursor-pointer items-center justify-start gap-2 rounded-2xl bg-blue-50 p-4 transition-colors duration-300 hover:bg-blue-100"
                            onClick={() => {
                              toggleChapterDoing(subject, chapter.id)
                            }}
                          >
                            <Checkbox checked={isChecked} />
                            <p className="text-sm font-medium text-gray-700">{chapter.name}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
      )}
    </div>
  )
}
