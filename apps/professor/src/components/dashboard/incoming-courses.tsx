import { useNavigate } from '@tanstack/react-router'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { Button } from '@viastud/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@viastud/ui/carousel'
import { useIsMobile } from '@viastud/ui/hooks/use-mobile'
import { isCourseNowFromDateString } from '@viastud/ui/lib/reservations.utils'
import { cn } from '@viastud/ui/lib/utils'
import { SlotCard } from '@viastud/ui/shared/slot-card'

import { EmptyCourses } from './empty-courses'

type Courses = inferRouterOutputs<AppRouter>['reservations']['getProfessorSlots']

interface IncomingCoursesProps {
  incomingCourses: Courses | undefined
}

export function IncomingCourses({ incomingCourses }: IncomingCoursesProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-4 rounded-2xl">
        <div>
          <div className="text-2xl font-bold">Prochaines séances</div>
          <div className="text-muted-foreground mt-1 text-sm">
            Consultez vos prochaines séances programmées et démarrez vos cours en direct
          </div>
        </div>
      </div>
      {!incomingCourses || incomingCourses.length === 0 ? (
        <div className="p-6">
          <EmptyCourses message="Vous n'avez pas de prochaines séances prévues." />
        </div>
      ) : (
        <div className="p-6">
          <Carousel orientation={isMobile ? 'vertical' : 'horizontal'}>
            <CarouselContent>
              {incomingCourses.map((course: Courses[number]) => (
                <CarouselItem key={course.id} className="basis-1/3">
                  <SlotCard
                    key={course.id}
                    date={course.date}
                    courseName={course.courseName}
                    sheetName={course.sheetName}
                    courseSubject={course.courseSubject}
                    courseGrade={course.courseGrade}
                    courseLevel={course.courseLevel}
                  >
                    {course.isEmpty ? (
                      <Button
                        variant="default"
                        className={cn('w-full bg-blue-600 text-white hover:bg-blue-700')}
                        disabled
                      >
                        En attente de reservation
                      </Button>
                    ) : isCourseNowFromDateString(course.date.fullDate) ? (
                      <Button
                        variant="default"
                        className={cn('w-full bg-blue-600 text-white hover:bg-blue-700')}
                        onClick={() => navigate({ to: `/meeting/${course.id}` })}
                      >
                        Démarrer le cours
                      </Button>
                    ) : (
                      <Button variant="outline" disabled className="w-full">
                        Bientôt
                      </Button>
                    )}
                  </SlotCard>
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
