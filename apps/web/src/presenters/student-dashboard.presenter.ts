import { skipToken } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { trpc } from '@viastud/ui/lib/trpc'
import type { Grade, Subject } from '@viastud/utils'
import { grade } from '@viastud/utils'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

const dashboardPages = ['LESSONS', 'BOOK_COURSE'] as const
type DashboardPage = (typeof dashboardPages)[number]

interface ModuleRecommendation {
  type: 'module'
  moduleId: number
  moduleName: string
  chapterId: number
  chapterName: string
  reason: string
  confidence: number
}

interface TaskRecommendation {
  type: 'task'
  taskId?: number
  taskType: 'sheet' | 'quiz' | 'exercise'
  taskName: string
  moduleId: number
  moduleName: string
  chapterId: number
  chapterName: string
  reason: string
  level: string
  grade: Grade
  subject: string
  confidence: number
  estimatedTimeMinutes: number
}

interface NoRecommendation {
  type: 'no_recommendation'
}

type Recommendation = ModuleRecommendation | TaskRecommendation | NoRecommendation

interface RecentActivity {
  type: 'success' | 'fail'
  activity: string
  date: string
  time: string
  score: number | null
  moduleId: number
}

// Import UserDto from UI package
import type { UserDto } from '@viastud/ui/shared/edit-profile'

interface UserDetails {
  id: string
  isFinished: boolean
  grade: Grade | null
  interestedIn: Subject[]
}

type RouterOutputs = inferRouterOutputs<AppRouter>
type StudentReservations = RouterOutputs['reservations']['getStudentReservations']

type Module = RouterOutputs['module']['getAllWithSheets'][number]

interface TaskActivity {
  id: string
  createdAt: string
  subject: Subject
  status: 'succeeded' | 'failed'
  taskId: number
  moduleId: number
  score: number | null
  taskType: 'sheet' | 'quiz' | 'exercise'
  attemptNumber: number
  timeSpent: number
  moduleName: string
}

interface QuizGrade {
  id: number
  createdAt: string
  moduleName: string
  grade: number
  moduleId: number
}

interface StudentProfileData {
  child: {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    createdAt: string
    updatedAt: string
    role: string
    isActive: boolean
  }
  studentDetails: {
    grade: Grade | null
    interestedIn: Subject[]
    isFinished: boolean
  } | null
  moduleProgress: {
    moduleId: string
    moduleName: string
    chapterName: string
    doing: boolean
    done: boolean
  }[]
  taskActivity: TaskActivity[]
  quizGrades: QuizGrade[]
}

interface StudentStats {
  averageQuizGrade: number | null
  performancePercentile: number
  chapterProgress: number
  hasQuizDone: boolean
  reservedCoursesCount?: number
}

export interface StudentDashboardPresenter {
  // State
  currentPage: DashboardPage
  selectedGrade: Grade
  selectedSubjects: string[]
  searchValue: string
  selectedModuleId: string | null
  showDeletionModal: boolean
  reservationToDeleteId: number | null

  // Data
  student: UserDto | null | undefined
  userDetails: UserDetails | undefined
  nextRecommendation: Recommendation | undefined
  isLoading: boolean
  incomingStudentReservations: StudentReservations
  previousStudentReservations: StudentReservations
  modules: Module[]
  filteredModules: Module[]
  studentProfileData: StudentProfileData | undefined
  studentStats: StudentStats | undefined
  isLoadingStudentStats: boolean
  recentActivities: RecentActivity[]

  // Actions
  setCurrentPage: (page: DashboardPage) => void
  setSelectedGrade: (grade: Grade) => void
  setSelectedSubjects: (subjects: string[]) => void
  setSearchValue: (value: string) => void
  setSelectedModuleId: (moduleId: string | null) => void
  setShowDeletionModal: (show: boolean) => void
  setReservationToDeleteId: (id: number | null) => void

  // Business Logic
  handleCancelReservation: () => void
  handleConfirmCancelReservation: () => void
  getCurrentModuleId: () => number | null
  getGreetingMessage: () => string
  needsOnboarding: () => boolean
  navigate: ReturnType<typeof useNavigate>
}

export function useStudentDashboardPresenter(): StudentDashboardPresenter {
  const { user: student } = useAuthStore()
  const navigate = useNavigate({ from: '/' })

  // State
  const [currentPage, setCurrentPage] = useState<DashboardPage>(dashboardPages[0])
  const [selectedGrade, setSelectedGrade] = useState<Grade>(grade[0])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [searchValue, setSearchValue] = useState('')
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [reservationToDeleteId, setReservationToDeleteId] = useState<number | null>(null)

  // TRPC Queries
  const { data: userDetails } = trpc.user.getUserDetails.useQuery(
    student ? { id: student.id } : skipToken
  )

  const { data: nextRecommendation, isLoading } =
    trpc.studentProgress.getNextRecommendation.useQuery(
      student ? { studentId: student.id } : skipToken
    )
  const { data: incomingStudentReservations, refetch: refetchIncomingStudentReservations } =
    trpc.reservations.getStudentReservations.useQuery({
      isAfterNow: true,
    })

  const { data: previousStudentReservations } = trpc.reservations.getStudentReservations.useQuery({
    isAfterNow: false,
  })

  const { data: modules } = trpc.module.getAllWithSheets.useQuery({
    grade: selectedGrade,
  })

  const { data: studentProfileData } = trpc.user.getStudentProfileData.useQuery(undefined, {
    enabled: !!student,
  })

  // Helper functions
  function getCurrentModuleId(): number | null {
    if (nextRecommendation?.type === 'module') {
      return nextRecommendation.moduleId
    }
    if (nextRecommendation?.type === 'task') {
      return nextRecommendation.moduleId
    }
    return null
  }

  const { data: studentStats, isLoading: isLoadingStudentStats } =
    trpc.studentProgress.getStudentStats.useQuery(
      getCurrentModuleId() && student ? { moduleId: Number(getCurrentModuleId()) } : skipToken
    )

  const cancelReservationMutation = trpc.reservations.cancelStudentReservation.useMutation()

  // Computed values
  const filteredModules =
    modules?.filter((module) => {
      return (
        module.name.toLowerCase().includes(searchValue.toLowerCase()) &&
        (selectedSubjects.length === 0 || selectedSubjects.includes(module.subject))
      )
    }) ?? []

  function getGreetingMessage(): string {
    if (student?.firstName) {
      return `Bonjour, ${student.firstName.charAt(0).toUpperCase()}${student.firstName.slice(1)} !`
    }
    return 'Bonjour !'
  }

  // Process recent activities
  const recentActivitiesFromTask = (studentProfileData?.taskActivity ?? []).map(
    (activity: TaskActivity): RecentActivity => {
      const dateObj = new Date(activity.createdAt)
      return {
        type: activity.status === 'succeeded' ? 'success' : 'fail',
        activity: `${activity.taskType === 'quiz' ? 'Quiz' : activity.taskType === 'exercise' ? 'Exercice' : 'Fiche'} : ${activity.moduleName}`,
        date: dateObj.toLocaleDateString('fr-FR'),
        time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        score: activity.score ?? null,
        moduleId: activity.moduleId,
      }
    }
  )

  const recentActivitiesFromQuizGrades = (studentProfileData?.quizGrades ?? []).map(
    (quiz: QuizGrade): RecentActivity => {
      const dateObj = new Date(quiz.createdAt)
      return {
        type: 'success',
        activity: `Quiz : ${quiz.moduleName ?? ''}`,
        date: dateObj.toLocaleDateString('fr-FR'),
        time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        score: quiz.grade,
        moduleId: quiz.moduleId,
      }
    }
  )

  const recentActivities = [...recentActivitiesFromTask, ...recentActivitiesFromQuizGrades].sort(
    (a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime()
  )

  // Event handlers
  const handleCancelReservation = () => {
    if (!reservationToDeleteId) return
    cancelReservationMutation.mutate(
      {
        reservationId: reservationToDeleteId,
      },
      {
        onSuccess: () => {
          void refetchIncomingStudentReservations()
        },
      }
    )
    setShowDeletionModal(false)
  }

  const handleConfirmCancelReservation = () => {
    setShowDeletionModal(false)
  }

  return {
    // State
    currentPage,
    selectedGrade,
    selectedSubjects,
    searchValue,
    selectedModuleId,
    showDeletionModal,
    reservationToDeleteId,

    // Data
    student,
    userDetails,
    nextRecommendation,
    isLoading,
    incomingStudentReservations: incomingStudentReservations ?? [],
    previousStudentReservations: previousStudentReservations ?? [],
    modules: modules ?? [],
    filteredModules,
    studentProfileData,
    studentStats,
    isLoadingStudentStats,
    recentActivities,

    // Actions
    setCurrentPage,
    setSelectedGrade,
    setSelectedSubjects,
    setSearchValue,
    setSelectedModuleId,
    setShowDeletionModal,
    setReservationToDeleteId,

    // Business Logic
    handleCancelReservation,
    handleConfirmCancelReservation,
    getCurrentModuleId,
    getGreetingMessage,
    needsOnboarding: () => !userDetails?.isFinished,
    navigate,
  }
}
