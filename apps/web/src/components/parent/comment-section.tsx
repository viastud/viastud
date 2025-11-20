import { trpc } from '@viastud/ui/lib/trpc'
import { MessageCircle } from 'lucide-react'

import { TeacherCommentsCard } from './teacher-comments-card'

export function CommentSection({ selectedChildId }: { selectedChildId: string }) {
  const { data: comments = [], isLoading: isLoadingComments } =
    trpc.rating.getLatestStudentEvaluations.useQuery({ studentId: selectedChildId })

  return (
    <div>
      <div className="mb-4 flex items-center justify-start gap-2">
        <MessageCircle className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold">Commentaires des professeurs</h2>
      </div>
      <div className="flex flex-col gap-4">
        <div>
          {isLoadingComments ? (
            <div>Chargement...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-400">
              Aucun commentaire disponible pour cet élève.
            </div>
          ) : (
            comments.slice(0, 3).map((c, idx) => (
              <TeacherCommentsCard
                key={idx}
                teacherName={`${c.professor?.firstName ?? ''} ${c.professor?.lastName ?? ''}`.trim()}
                subject=""
                date={
                  c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : ''
                }
                rating={c.avgRating ?? 0}
                comment={c.comment ?? ''}
              />
            ))
          )}
          {comments.length > 3 && !isLoadingComments && (
            <button className="mx-auto mt-6 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
              Voir tous les commentaires
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
