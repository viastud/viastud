import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { Star } from 'lucide-react'

export function AllStudentComments() {
  const navigate = useNavigate()
  // Utiliser le typage automatique de trpc
  const { data: comments = [], isLoading } = trpc.rating.getLatestStudentEvaluations.useQuery()
  type Comment = typeof comments extends (infer T)[] ? T : never

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Button variant="secondary" className="mb-4" onClick={() => navigate({ to: '/' })}>
        ← Retour
      </Button>
      <h1 className="mb-6 text-2xl font-bold">Tous les commentaires</h1>
      {isLoading ? (
        <div>Chargement...</div>
      ) : comments.length === 0 ? (
        <div className="text-gray-400">Aucun commentaire pour l’instant.</div>
      ) : (
        comments.map((c: Comment, idx: number) => (
          <div key={idx} className="mb-6 rounded-xl bg-white p-4 shadow">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-semibold">
                {c.professor?.firstName} {c.professor?.lastName}
              </span>
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4"
                    fill={c.avgRating && i < c.avgRating ? '#FFD600' : '#E5E7EB'}
                    color={c.avgRating && i < c.avgRating ? '#FFD600' : '#E5E7EB'}
                  />
                ))}
              </span>
            </div>
            <div className="mb-2 text-gray-700">{c.comment}</div>
            <div className="mb-2 text-xs text-gray-400">
              {c.createdAt
                ? new Date(c.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : ''}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>Maîtrise du cours : {c.courseMasteryRating ?? '-'} /5</div>
              <div>Maîtrise des fondamentaux : {c.fundamentalsMasteryRating ?? '-'} /5</div>
              <div>Concentration : {c.focusRating ?? '-'} /5</div>
              <div>Discipline : {c.disciplineRating ?? '-'} /5</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
