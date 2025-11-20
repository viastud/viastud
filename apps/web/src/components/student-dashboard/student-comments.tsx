import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { MessageCircle, Star } from 'lucide-react'

// Get the correct type from the TRPC router
// This matches exactly what the backend returns

type LatestStudentEvaluation =
  inferRouterOutputs<AppRouter>['rating']['getLatestStudentEvaluations']

export function StudentComments({
  navigate,
  moduleId,
}: {
  navigate: (opts: { to: string }) => void
  moduleId: number
}) {
  const { data: comments = [], isLoading } =
    trpc.rating.getLatestStudentEvaluations.useQuery<LatestStudentEvaluation>({ moduleId })

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <span className="text-md">Derniers commentaires</span>
      </div>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div>Chargement...</div>
        ) : comments.length === 0 ? (
          <div className="text-gray-400">Aucun commentaire pour l’instant.</div>
        ) : (
          comments.slice(0, 3).map((c, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-base font-bold text-white">
                {c.professor?.firstName?.[0]}
                {c.professor?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{c.professor?.subject}</span>
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4"
                        fill={c.avgRating !== null && i < c.avgRating ? '#FFD600' : '#E5E7EB'}
                        color={c.avgRating !== null && i < c.avgRating ? '#FFD600' : '#E5E7EB'}
                      />
                    ))}
                  </span>
                </div>
                <div className="text-gray-700">{c.comment}</div>
                <div className="mt-1 text-xs text-gray-400">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : ''}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {comments.length > 3 && !isLoading && (
        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => {
            navigate({ to: `/comments` })
          }}
        >
          Voir tous les commentaires
        </Button>
      )}
    </>
  )
}
