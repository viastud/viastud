import { Link } from '@tanstack/react-router'
import type { QuestionMinimalDto } from '@viastud/server/routers/question_router'
import { Button } from '@viastud/ui/button'
import { Checkbox } from '@viastud/ui/checkbox'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { Myst } from '@viastud/ui/shared/myst'
import type { Grade, Subject } from '@viastud/utils'
import { Clock, FileTextIcon, RotateCw } from 'lucide-react'

const scoreDetails = {
  excellent: {
    title: 'Excellent !',
    icon: 'yellow-star',
    message:
      "Continuez sur cette lancée ! Pour vous surpasser encore davantage, nous vous encourageons à essayer d'autres exercices et quiz. Chaque défi est une opportunité d'apprendre et de s'améliorer.",
  },
  great: {
    title: 'Bravo !',
    icon: 'green-hexagon',
    message:
      "Très bien ! Vous êtes sur la bonne voie. Pour aller encore plus loin, n'hésitez pas à essayer d'autres exercices et quiz. Chaque défi supplémentaire vous aide à vous perfectionner.",
  },
  okay: {
    title: 'Vous êtes sur la bonne voie !',
    icon: 'orange-hexagon',
    message:
      "Bon début ! Continuez à travailler et vous verrez des améliorations. Essayez d'autres exercices et quiz pour vous entraîner davantage et progresser encore plus.",
  },
  bad: {
    title: 'Perséverez !',
    icon: 'red-hexagon',
    message:
      'Ne vous découragez pas ! Prenez le temps de revoir le cours et entraînez-vous sur les exercices corrigés pour mieux comprendre les concepts. Chaque effort vous rapproche de la réussite.',
  },
}

export interface StudentAnswer {
  id: number
  content: string
  isRightAnswer: boolean
  checked: boolean
}

export interface AnsweredQuestionType extends QuestionMinimalDto {
  answers: StudentAnswer[]
}

const determineScoreLabel = (normalizedScore: number) => {
  if (normalizedScore === 1) return 'excellent'
  if (1 > normalizedScore && normalizedScore >= 0.7) return 'great'
  if (0.7 > normalizedScore && normalizedScore >= 0.5) return 'okay'
  return 'bad'
}

interface QuizResultsProps {
  score: number
  numberOfCompletedQuestions: number
  grade: Grade
  subject: Subject
  chapterId?: string
  sheetId?: string
  answeredQuestions: AnsweredQuestionType[]
}

export const QuizResults = ({
  score,
  numberOfCompletedQuestions,
  grade,
  subject,
  chapterId,
  sheetId,
  answeredQuestions,
}: QuizResultsProps) => {
  const { data: relatedQuizzes } = trpc.sheet.getRelatedSheetIdsAndNamesForQuiz.useQuery(
    { sheetId: Number(sheetId) },
    { enabled: Boolean(sheetId) }
  )

  return (
    <div className="flex w-full flex-col gap-8 py-4">
      <div className="flex w-full flex-col gap-4">
        <div className="relative flex w-full flex-col gap-4 overflow-hidden rounded-2xl border border-blue-200 bg-blue-50 p-8">
          <div className="absolute -left-60 -top-48 h-96 w-96 rotate-[55deg] bg-blue-600 opacity-70 mix-blend-overlay" />
          <div className="absolute -bottom-48 -right-60 h-96 w-96 rotate-[55deg] bg-blue-600 opacity-70 mix-blend-overlay" />
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-3xl font-bold text-gray-950">
              {scoreDetails[determineScoreLabel(score / numberOfCompletedQuestions)].title}
            </h1>
            <h1 className="text-2xl font-light text-gray-950">Vous avez obtenu un score de</h1>
            <div className="relative cursor-default">
              <img
                src={`/icons/${
                  scoreDetails[determineScoreLabel(score / numberOfCompletedQuestions)].icon
                }.svg`}
              />
              <div
                className={cn('absolute right-6 top-6 flex items-end gap-0.5', {
                  'left-5 top-8': score / numberOfCompletedQuestions === 1,
                })}
              >
                <h1 className="text-3xl font-extrabold text-gray-950">{score}</h1>
                <h1 className="pb-1 text-xs font-extrabold text-gray-950">
                  /{numberOfCompletedQuestions}
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-6">
          <p className="flex w-2/3 text-center text-gray-700">
            {scoreDetails[determineScoreLabel(score / numberOfCompletedQuestions)].message}
          </p>
          <div className="flex gap-4">
            {sheetId ? (
              <Link
                to="/ressources/$grade/$subject/$chapterId/$sheetId"
                params={{
                  grade: grade.toLowerCase(),
                  subject: subject.toLowerCase(),
                  chapterId: (chapterId ?? '').toString(),
                  sheetId: sheetId.toString(),
                }}
              >
                <Button variant="outline" className="gap-1">
                  <FileTextIcon />
                  <p>Revoir la fiche de cours</p>
                </Button>
              </Link>
            ) : null}
            <Button
              variant="secondary"
              className="w-auto gap-2 bg-yellow-300 font-semibold text-gray-950 hover:bg-yellow-400"
              onClick={() => {
                window.location.reload()
              }}
            >
              <RotateCw />
              <p>Nouveau quiz</p>
            </Button>
            {sheetId ? (
              <Link to="/course/$course" params={{ course: sheetId.toString() }}>
                <Button>Réserver un cours</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-8">
        <h1 className="text-2xl font-extrabold text-gray-950">Correction</h1>
        {answeredQuestions.map((question) => (
          <div key={`question_detail_${question.id}`} className="flex gap-4">
            <div className="flex w-2/3 flex-col gap-4 rounded-2xl border border-blue-200 bg-white p-6">
              <Myst text={question.title} images={question.images} />
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-700">Réponses</p>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-x-4 gap-y-4 pb-6 xl:gap-y-4 xl:pt-8">
                  {question.answers.map((answer) => (
                    <div
                      key={`question_detail_${numberOfCompletedQuestions}_answer_${answer.id}`}
                      className={cn('flex flex-col items-center gap-4 rounded-xl border p-4', {
                        'border-lime-300 bg-gradient-to-b from-lime-200 to-lime-300':
                          answer.isRightAnswer,
                        'border-red-300 bg-gradient-to-b from-red-200 to-red-300':
                          !answer.isRightAnswer && answer.checked,
                      })}
                    >
                      <Myst text={answer.content} images={question.images} />
                      <Checkbox className="cursor-default" checked={answer.checked} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex w-1/3 flex-col">
              <div className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-white p-6">
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-semibold">Bonnes réponses</p>
                  <div className="flex gap-2">
                    {question.answers.map(
                      (answer) =>
                        answer.isRightAnswer && (
                          <div
                            key={`question_detail_${numberOfCompletedQuestions}_answer_${answer.id}_sidebox`}
                            className="flex items-center rounded-lg border border-lime-300 bg-gradient-to-b from-lime-200 to-lime-300 p-4"
                          >
                            <Myst text={answer.content} images={question.images} />
                          </div>
                        )
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-semibold">Réponse détaillée</p>
                  <Myst text={question.detailedAnswer} images={question.images} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {sheetId ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-extrabold text-gray-950">Continuer à s’entrainer</h1>
          <div className="flex gap-4">
            {relatedQuizzes?.map((quiz) => (
              <div
                key={`related_quiz_${quiz.id}`}
                className="flex flex-1 flex-col gap-4 rounded-2xl bg-white p-4"
              >
                <div className="flex grow flex-col justify-between gap-2">
                  <p className="text-lg font-semibold text-gray-950">Quiz - {quiz.name}</p>
                  <p className="text-gray-700">Testez vos connaissances afin de vous améliorer</p>
                  <div className="flex gap-2">
                    <div className="flex gap-1">
                      <img className="h-4 w-4" src="/icons/bar-chart.svg" />
                      <p className="text-xs font-medium text-gray-500">Classe</p>
                    </div>
                    <div className="flex gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-xs font-medium text-gray-500">1 heure</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/ressources/$grade/$subject/$chapterId/$sheetId/quiz"
                  params={{
                    grade: grade.toLowerCase(),
                    subject: subject.toLowerCase(),
                    chapterId: (chapterId ?? '').toString(),
                    sheetId: quiz.id.toString(),
                  }}
                >
                  <Button
                    variant="secondary"
                    className="w-full gap-2 bg-yellow-300 font-semibold text-gray-950 hover:bg-yellow-400"
                  >
                    Démarrer
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
