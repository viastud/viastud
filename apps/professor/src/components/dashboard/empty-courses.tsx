interface EmptyCoursesProps {
  message: string
}

export function EmptyCourses({ message }: EmptyCoursesProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-800">Aucune séance pour l’instant</h2>
      <p className="text-gray-500">{message}</p>
    </div>
  )
}
