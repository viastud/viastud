import type { ChildProfile } from '@viastud/server/services/user/child_profile.dto'
import { useMemo } from 'react'

export function useParentDashboardData(childrenWithProfiles: ChildProfile[]) {
  const children = useMemo(() => {
    return childrenWithProfiles.map((childData) => {
      const progress = computeProgress(childData)
      const grade = childData.studentDetails?.grade ?? ''
      const lastExercise = computeLastExercise(childData)
      const taskStats = childData.taskActivity
      const weeklyCourseHours = childData.weeklyCourseHours ?? 0
      const recentReservations = childData.recentReservations ?? []

      return {
        id: childData.child.id,
        firstName: childData.child.firstName,
        lastName: childData.child.lastName,
        grade,
        progress,
        lastExercise,
        weeklyCourseHours,
        taskStats,
        recentReservations,
      }
    })
  }, [childrenWithProfiles])

  return { children }
}

function computeProgress(child: ChildProfile): number {
  const total = child.moduleProgress.length
  const completed = child.moduleProgress.filter((mp) => mp.done).length
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

function computeLastExercise(child: ChildProfile) {
  const current = child.moduleProgress.find((mp) => mp.doing)
  if (!current) return undefined

  return {
    name: current.moduleName,
    subject: current.chapterName,
    date: 'En cours', // You can later compute real date if needed
  }
}
