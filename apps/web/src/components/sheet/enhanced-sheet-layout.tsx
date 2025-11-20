import { Button } from '@viastud/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { Progress } from '@viastud/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Play,
  Target,
  Trophy,
} from 'lucide-react'

interface LessonContext {
  currentLesson: {
    id: number
    name: string
    chapterName: string
    position: { current: number; total: number }
  }
  progression: {
    sheetRead: boolean
    quizCompleted: boolean
    exerciseCompleted: boolean
    scores: { quiz?: number; exercise?: number }
  }
  nextActions: {
    type: 'quiz' | 'exercise' | 'next_lesson' | 'review'
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
    url: string
  }[]
  navigation: {
    previous?: { id: number; name: string }
    next?: { id: number; name: string }
  }
}

// Mock data - sera remplacé par vraies données
const mockContext: LessonContext = {
  currentLesson: {
    id: 2,
    name: 'Équations et inéquations',
    chapterName: 'Fonctions et équations',
    position: { current: 2, total: 3 },
  },
  progression: {
    sheetRead: true, // L'utilisateur est en train de lire
    quizCompleted: false,
    exerciseCompleted: false,
    scores: {},
  },
  nextActions: [
    {
      type: 'quiz',
      title: 'Tester vos connaissances',
      description: 'Quiz de 10 questions sur les équations',
      priority: 'high',
      url: '/quiz/2',
    },
    {
      type: 'exercise',
      title: 'Pratiquer avec des exercices',
      description: "Exercices d'application corrigés",
      priority: 'medium',
      url: '/exercise/2',
    },
  ],
  navigation: {
    previous: { id: 1, name: 'Fonctions du second degré' },
    next: { id: 3, name: "Systèmes d'équations" },
  },
}

export function EnhancedSheetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full gap-6">
      {/* 📄 CONTENU PRINCIPAL (Existant) */}
      <div className="flex-1">{children}</div>

      {/* 🎯 SIDEBAR CONTEXTE ET ACTIONS */}
      <div className="w-80 space-y-4">
        <ProgressionContextCard context={mockContext} />
        <NextActionsCard actions={mockContext.nextActions} />
        <LessonNavigationCard navigation={mockContext.navigation} />
      </div>
    </div>
  )
}

function ProgressionContextCard({ context }: { context: LessonContext }) {
  const completedSteps = [
    context.progression.sheetRead,
    context.progression.quizCompleted,
    context.progression.exerciseCompleted,
  ].filter(Boolean).length

  const progressPercentage = (completedSteps / 3) * 100

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-blue-600" />
          Votre progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contexte leçon */}
        <div>
          <div className="text-sm text-gray-600">
            Leçon {context.currentLesson.position.current}/{context.currentLesson.position.total}
          </div>
          <div className="font-semibold text-gray-900">{context.currentLesson.name}</div>
          <div className="text-sm text-blue-600">{context.currentLesson.chapterName}</div>
        </div>

        {/* Progression globale */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression de la leçon</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Étapes détaillées */}
        <div className="space-y-2">
          <ProgressStep
            icon={<BookOpen className="h-4 w-4" />}
            label="Fiche de cours lue"
            completed={context.progression.sheetRead}
            current={true}
          />
          <ProgressStep
            icon={<Target className="h-4 w-4" />}
            label="Quiz réalisé"
            completed={context.progression.quizCompleted}
            score={context.progression.scores.quiz}
          />
          <ProgressStep
            icon={<FileText className="h-4 w-4" />}
            label="Exercice terminé"
            completed={context.progression.exerciseCompleted}
            score={context.progression.scores.exercise}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ProgressStep({
  icon,
  label,
  completed,
  current = false,
  score,
}: {
  icon: React.ReactNode
  label: string
  completed: boolean
  current?: boolean
  score?: number
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-2 ${
        current ? 'border border-blue-300 bg-blue-100' : ''
      }`}
    >
      <div className={completed ? 'text-green-600' : 'text-gray-400'}>
        {completed ? <CheckCircle className="h-4 w-4" /> : icon}
      </div>
      <div className="flex-1">
        <div
          className={`text-sm ${completed ? 'text-green-900' : current ? 'font-medium text-blue-900' : 'text-gray-600'}`}
        >
          {label}
        </div>
        {score && <div className="text-xs font-medium text-green-700">{score}%</div>}
      </div>
      {current && <Clock className="h-4 w-4 text-blue-600" />}
    </div>
  )
}

function NextActionsCard({ actions }: { actions: LessonContext['nextActions'] }) {
  if (actions.length === 0) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-green-600" />
          <div className="font-semibold text-green-900">Leçon terminée !</div>
          <div className="text-sm text-green-700">Passez à la suite</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">🎯 Prochaines étapes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <ActionCard key={index} action={action} />
        ))}
      </CardContent>
    </Card>
  )
}

function ActionCard({ action }: { action: LessonContext['nextActions'][0] }) {
  const getIcon = () => {
    switch (action.type) {
      case 'quiz':
        return <Target className="h-4 w-4" />
      case 'exercise':
        return <FileText className="h-4 w-4" />
      case 'next_lesson':
        return <ArrowRight className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const getPriorityColor = () => {
    switch (action.priority) {
      case 'high':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      case 'medium':
        return 'border-green-200 bg-green-50 hover:bg-green-100'
      default:
        return 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    }
  }

  return (
    <div className={`cursor-pointer rounded-lg border p-3 transition-colors ${getPriorityColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{action.title}</div>
          <div className="text-xs text-gray-600">{action.description}</div>
        </div>
        <Button size="sm" className="text-xs">
          <Play className="mr-1 h-3 w-3" />
          Go
        </Button>
      </div>
    </div>
  )
}

function LessonNavigationCard({ navigation }: { navigation: LessonContext['navigation'] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">📚 Navigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {navigation.previous && (
          <Button variant="outline" className="h-auto w-full justify-start p-3 text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium">Précédent</div>
              <div className="text-xs text-gray-600">{navigation.previous.name}</div>
            </div>
          </Button>
        )}

        {navigation.next && (
          <Button variant="outline" className="h-auto w-full justify-start p-3 text-sm">
            <div className="flex-1 text-left">
              <div className="font-medium">Suivant</div>
              <div className="text-xs text-gray-600">{navigation.next.name}</div>
            </div>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
