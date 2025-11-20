import { Link, useBlocker } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { Progress } from '@viastud/ui/progress'
import { ConfirmLeaveModal } from '@viastud/ui/shared/confirm-leave-modal'
import { Myst } from '@viastud/ui/shared/myst'
import type { Grade, Subject } from '@viastud/utils'
import { CheckSquare, FileTextIcon, ListChecks, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { AnsweredQuestionType } from '@/components/quiz/quiz-results'
import { QuizResults } from '@/components/quiz/quiz-results'

export function QuizComponent({
  grade,
  subject,
  chapterId,
  sheetId,
  mode = 'module',
}: {
  grade: Grade
  subject: Subject
  chapterId: string
  sheetId?: string
  mode?: 'module' | 'chapter'
}) {
  const [error, setError] = useState<boolean>(false)
  const [numberOfCompletedQuestions, setNumberOfCompletedQuestions] = useState<number>(0)
  const [isQuizDataFetched, setIsQuizDataFetched] = useState<boolean>(false)
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestionType[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<AnsweredQuestionType>()
  const [score, setScore] = useState<number>(0)

  const moduleQuizQuery = trpc.question.getQuestionsForQuiz.useQuery(
    { sheetId: Number(sheetId) },
    { enabled: !isQuizDataFetched && mode === 'module' && Boolean(sheetId) }
  )
  const chapterQuizQuery = trpc.question.getQuestionsForChapterQuiz.useQuery(
    { chapterId: Number(chapterId) },
    { enabled: !isQuizDataFetched && mode === 'chapter' }
  )
  const isLoading = moduleQuizQuery.isLoading || chapterQuizQuery.isLoading
  const questionsData = moduleQuizQuery.data ?? chapterQuizQuery.data

  useEffect(() => {
    if (questionsData && questionsData.length > 0) {
      setIsQuizDataFetched(true)
      setCurrentQuestion({
        ...questionsData[0],
        answers: questionsData[0].answers.map((answer) => ({ ...answer, checked: false })),
      })
    }
  }, [questionsData])

  const questions = useMemo(() => questionsData ?? [], [questionsData])

  const { status, reset, proceed } = useBlocker({
    shouldBlockFn: () => numberOfCompletedQuestions !== questions.length,
    withResolver: true,
    disabled: numberOfCompletedQuestions === questions.length,
  })

  const utils = trpc.useUtils()
  const { mutateAsync: sendScore } = trpc.question.createQuizGrade.useMutation({
    onSuccess: async () => {
      // Invalidate stats and recommendations so the dashboard progress updates
      await utils.studentProgress.getStudentStats.invalidate()
      await utils.studentProgress.getNextRecommendation.invalidate()
      await utils.user.getStudentProfileData.invalidate()
    },
  })

  const handleValidateQuestion = async () => {
    if (
      !currentQuestion?.isMultipleChoice &&
      !currentQuestion?.answers.find((question) => question.checked)
    ) {
      setError(true)
    } else {
      setAnsweredQuestions([...answeredQuestions, currentQuestion])
      setNumberOfCompletedQuestions(numberOfCompletedQuestions + 1)
      const isRightAnswer = !currentQuestion.answers.find(
        (answer) => answer.checked !== answer.isRightAnswer
      )
      if (isRightAnswer) {
        setScore(score + 1)
      }
      if (numberOfCompletedQuestions + 1 !== questions.length) {
        setCurrentQuestion({
          ...questions[numberOfCompletedQuestions + 1],
          answers: questions[numberOfCompletedQuestions + 1].answers.map((answer) => ({
            ...answer,
            checked: false,
          })),
        })
      } else {
        setCurrentQuestion(undefined)
        if (mode === 'module' && sheetId) {
          await sendScore({ sheetId: Number(sheetId), grade: isRightAnswer ? score + 1 : score })
        }
      }
    }
  }

  if (isLoading) {
    return <div>loading</div>
  }

  return !currentQuestion ? (
    <QuizResults
      grade={grade}
      chapterId={chapterId}
      sheetId={mode === 'module' ? sheetId : undefined}
      subject={subject}
      answeredQuestions={answeredQuestions}
      score={score}
      numberOfCompletedQuestions={numberOfCompletedQuestions}
    />
  ) : (
    <div className="flex w-full flex-col gap-6 pt-4">
      {status === 'blocked' && (
        <ConfirmLeaveModal
          open={true}
          title="Souhaitez-vous vraiment quitter le quiz ? Si vous partez, vous perdrez votre progression."
          cancel={reset}
          confirm={proceed}
        />
      )}
      <div className="flex w-full items-center gap-4">
        {mode === 'module' && sheetId ? (
          <Link
            to="/ressources/$grade/$subject/$chapterId/$sheetId"
            params={{
              grade: grade.toLowerCase(),
              subject: subject.toLowerCase(),
              chapterId: chapterId.toString(),
              sheetId: sheetId.toString(),
            }}
          >
            <X />
          </Link>
        ) : null}
        <div className="flex w-full items-center gap-4 rounded-full border border-blue-100 bg-blue-50 px-4 py-2">
          <Progress
            progressBarClassName="bg-yellow-400 rounded-full"
            value={(100 * numberOfCompletedQuestions) / questions.length}
          />
          <span className="text-xs font-medium text-gray-700">
            {numberOfCompletedQuestions}/{questions.length}
          </span>
        </div>
        {mode === 'module' && sheetId ? (
          <Link
            target="_blank"
            to="/ressources/$grade/$subject/$chapterId/$sheetId"
            params={{
              grade: grade.toLowerCase(),
              subject: subject.toLowerCase(),
              chapterId: chapterId.toString(),
              sheetId: sheetId.toString(),
            }}
          >
            <Button variant="outline" className="gap-1">
              <FileTextIcon />
              <p>Revoir la fiche de cours</p>
            </Button>
          </Link>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-4 rounded-2xl bg-white p-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-blue-300 bg-yellow-200/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-900">
              {currentQuestion.isMultipleChoice ? (
                <ListChecks className="h-4 w-4" />
              ) : (
                <CheckSquare className="h-4 w-4" />
              )}
              {currentQuestion.isMultipleChoice ? 'Choix multiples' : 'Choix unique'}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-600">
            Question {numberOfCompletedQuestions + 1} / {questions.length}
          </span>
        </div>
        <Myst text={currentQuestion.title} images={currentQuestion.images} />
        {currentQuestion.isMultipleChoice ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">Choisissez toutes les bonnes réponses</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-4 gap-y-4 xl:gap-y-4 xl:pt-6">
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={`question_${numberOfCompletedQuestions}_answer_${index}`}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50',
                    { 'border-blue-300 bg-blue-50': currentQuestion.answers[index].checked }
                  )}
                  onClick={() => {
                    setCurrentQuestion({
                      ...currentQuestion,
                      answers: currentQuestion.answers.map((answer, i) =>
                        index === i ? { ...answer, checked: !answer.checked } : answer
                      ),
                    })
                  }}
                >
                  <Myst text={answer.content} images={currentQuestion.images} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">Choisissez la bonne réponse</p>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-4 gap-y-4 xl:gap-y-4 xl:pt-6">
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={`question_${numberOfCompletedQuestions}_answer_${index}`}
                  className={cn(
                    'flex cursor-pointer flex-col items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/30 p-4 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50',
                    { 'border-blue-300 bg-blue-50': currentQuestion.answers[index].checked }
                  )}
                  onClick={() => {
                    setError(false)
                    setCurrentQuestion({
                      ...currentQuestion,
                      answers: currentQuestion.answers.map((answer, i) =>
                        index === i ? { ...answer, checked: true } : { ...answer, checked: false }
                      ),
                    })
                  }}
                >
                  <Myst text={answer.content} images={currentQuestion.images} />
                </div>
              ))}
            </div>
            {error && <p className="text-xs text-red-500">Vous devez cocher une réponse</p>}
          </div>
        )}
      </div>
      <Button
        className="flex flex-row self-end"
        onClick={handleValidateQuestion}
        disabled={!currentQuestion?.answers.find((answer) => answer.checked)}
      >
        Valider
      </Button>
    </div>
  )
}
