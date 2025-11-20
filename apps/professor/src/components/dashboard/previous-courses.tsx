import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@viastud/ui/carousel'
import { useIsMobile } from '@viastud/ui/hooks/use-mobile'
import { SlotCard } from '@viastud/ui/shared/slot-card'

import { EmptyCourses } from './empty-courses'

type Courses = inferRouterOutputs<AppRouter>['reservations']['getProfessorSlots']

interface PreviousCoursesProps {
  previousCourses: Courses | undefined
}

export function PreviousCourses({ previousCourses }: PreviousCoursesProps) {
  const isMobile = useIsMobile()

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-4 rounded-2xl py-6">
        <div>
          <div className="text-2xl font-bold">Séances passées</div>
          <div className="text-muted-foreground mt-1 text-sm">
            Retrouvez l&apos;historique de toutes vos séances terminées
          </div>
        </div>
      </div>
      {!previousCourses || previousCourses.length === 0 ? (
        <div className="p-6">
          <EmptyCourses message="Dès qu'une séance est terminée, elle s'affichera ici." />
        </div>
      ) : (
        <div className="p-6">
          <Carousel orientation={isMobile ? 'vertical' : 'horizontal'}>
            <CarouselContent>
              {previousCourses.map((course) => (
                <CarouselItem key={course.id} className="basis-1/3">
                  <SlotCard
                    key={course.id}
                    date={course.date}
                    courseName={course.courseName}
                    sheetName={course.sheetName}
                    courseSubject={course.courseSubject}
                    courseGrade={course.courseGrade}
                    courseLevel={course.courseLevel}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      )}
    </>
  )
}
