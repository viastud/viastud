import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '@viastud/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@viastud/ui/breadcrumb'
import { Button } from '@viastud/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { Progress } from '@viastud/ui/progress'
import { Textarea } from '@viastud/ui/textarea'
import { useMemo, useState } from 'react'

import StudentHeader from '@/components/student-header'

interface Step {
  id: string
  prompt: string
  type: 'single_choice' | 'multiple_choice' | 'short_text'
  options?: string[]
}

export const Route = createFileRoute('/interactive-exercise')({
  component: InteractiveExercisePage,
})

function InteractiveExercisePage() {
  const { data, isLoading } = trpc.interactiveExercise.getMockExercise.useQuery()
  const [stepIndex, setStepIndex] = useState(0)
  const checkAnswerMutation = trpc.interactiveExercise.checkAnswer.useMutation()

  const current = useMemo(
    () => (data ? (data.steps[stepIndex] as Step) : undefined),
    [data, stepIndex]
  )
  const [shortText, setShortText] = useState('')
  const [result, setResult] = useState<{ correct: boolean; feedback?: string } | null>(null)

  if (isLoading || !data || !current) {
    return (
      <>
        <StudentHeader />
        <div className="flex w-full justify-center px-4 py-8">
          <div className="w-full max-w-5xl">Chargement…</div>
        </div>
      </>
    )
  }

  const onValidate = async () => {
    const answer = shortText

    const res = await checkAnswerMutation.mutateAsync({
      exerciseId: data.id,
      stepId: current.id,
      answer,
    })
    setResult({ correct: res.correct, feedback: res.feedback })

    if (res.correct && stepIndex < data.steps.length - 1) {
      setStepIndex(stepIndex + 1)
      setShortText('')
      setResult(null)
    }
  }

  const progressValue = ((stepIndex + 1) / data.steps.length) * 100

  return (
    <>
      <StudentHeader />
      <div className="flex w-full justify-center px-4 py-6">
        <div className="flex w-full max-w-5xl flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Exercices interactifs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
                <Badge variant="secondary" className="rounded-full">
                  Exercices interactifs
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Étape {stepIndex + 1} / {data.steps.length}
              </p>
            </div>

            <Progress value={progressValue} className="h-2" />
            <p className="text-sm text-gray-600">{data.description}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Question</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-base font-medium text-gray-900">{current.prompt}</p>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900">Votre réponse</label>
                <Textarea
                  value={shortText}
                  onChange={(e) => {
                    setShortText(e.target.value)
                  }}
                  placeholder="Écrivez une réponse courte et claire…"
                  className="min-h-28 resize-y"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Réponse attendue: court texte</span>
                  <span className="text-xs text-gray-400">{shortText.length} caractères</span>
                </div>
              </div>

              {result && (
                <div className={result.correct ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
                  {result.feedback}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-600">
                  Étape {stepIndex + 1} / {data.steps.length}
                </p>
                <Button onClick={onValidate} disabled={shortText.trim().length === 0}>
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
