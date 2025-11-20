import { Star } from 'lucide-react'

interface TeacherCommentsCardProps {
  teacherName: string
  subject: string
  date: string
  rating: number
  comment: string
}

export function TeacherCommentsCard({
  teacherName,
  subject,
  date,
  rating,
  comment,
}: TeacherCommentsCardProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">{teacherName}</span>
          </div>
          <div className="mb-2 text-sm text-gray-500">{subject}</div>
          <span className="text-sm text-gray-400">{date}</span>
        </div>
        <span className="ml-auto flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
              fill={i < rating ? '#fde047' : 'none'}
            />
          ))}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-gray-700">{comment}</p>
    </div>
  )
}
