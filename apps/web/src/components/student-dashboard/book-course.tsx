import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { Button } from '@viastud/ui/button'
import { Input } from '@viastud/ui/input'
import { cn } from '@viastud/ui/lib/utils'
import { MultiSelect } from '@viastud/ui/multi-select'
import { grade, GradeEnum, LevelEnum, SubjectEnum, subjectsOptions } from '@viastud/utils'
import { ChartNoAxesColumnIncreasing, Clock } from 'lucide-react'
type RouterOutputs = inferRouterOutputs<AppRouter>
type ModuleWithSheets = RouterOutputs['module']['getAllWithSheets'][number]

export function BookCourse({
  selectedGrade,
  setSelectedGrade,
  selectedSubjects,
  setSelectedSubjects,
  searchValue,
  setSearchValue,
  selectedModuleId,
  setSelectedModuleId,
  filteredModules,
  navigate,
  setCurrentPage,
}: {
  selectedGrade: string
  setSelectedGrade: (grade: string) => void
  selectedSubjects: string[]
  setSelectedSubjects: (subjects: string[]) => void
  searchValue: string
  setSearchValue: (value: string) => void
  selectedModuleId: string | null
  setSelectedModuleId: (id: string | null) => void
  filteredModules: ModuleWithSheets[]
  navigate: (opts: { to: string }) => void
  setCurrentPage: (page: string) => void
}) {
  return (
    <div className="flex w-4/5 flex-col">
      <div className="flex justify-between gap-4 p-6">
        <div className="text-2xl font-bold">Réserver un cours</div>
        <Button
          onClick={() => {
            setCurrentPage('LESSONS')
          }}
        >
          Revenir à mon tableau de bord
        </Button>
      </div>
      <div className="mt-4 flex w-full flex-row items-center justify-between gap-8">
        <div className="flex items-center rounded-full bg-blue-100 p-[2px]">
          {grade.map((key) => (
            <Button
              variant="none"
              className={cn(
                'flex h-8 grow items-center justify-center gap-[10px] rounded-full px-3 py-1.5 hover:bg-white hover:text-blue-600',
                selectedGrade === key && 'bg-white text-blue-600'
              )}
              key={key}
              onClick={() => {
                setSelectedGrade(key)
              }}
            >
              {GradeEnum[key]}
            </Button>
          ))}
        </div>
        <MultiSelect
          options={subjectsOptions}
          onValueChange={setSelectedSubjects}
          defaultValue={selectedSubjects}
          placeholder="Matières"
          variant="default"
          className="flex w-fit"
        />
        <Input
          placeholder="Rechercher par nom..."
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value)
          }}
          className="rounded-3xl"
        />
      </div>
      <div
        className="mt-4 grid w-full place-items-center gap-y-4"
        style={{
          gridTemplateColumns: 'repeat(3, minmax(325px, 1fr))',
        }}
      >
        {filteredModules?.map((module: ModuleWithSheets) => (
          <div
            key={module.id}
            onClick={() => {
              setSelectedModuleId(module.id)
            }}
            className={cn(
              'flex h-full min-h-[180px] w-[325px] cursor-pointer flex-col items-start justify-start gap-2 rounded-xl border bg-white p-4 text-gray-700 shadow-md',
              selectedModuleId === module.id ? 'border-blue-200 bg-blue-50' : 'border-transparent'
            )}
          >
            <Button
              variant="icon"
              className={cn(module.subject === 'MATHS' ? 'bg-[#FFF189]' : 'bg-[#FED7AA]')}
            >
              &nbsp;&nbsp;{SubjectEnum[module.subject]}
            </Button>
            <div className="flex flex-col items-start gap-1">
              <p className="text-base font-medium text-gray-700">{module.chapter.name}</p>
              <p className="text-sm text-gray-500">{module.name}</p>
            </div>
            <div className="flex flex-row items-start justify-between gap-2 text-sm">
              <div className="flex items-center gap-1">
                <ChartNoAxesColumnIncreasing size="15" /> {GradeEnum[module.grade]}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={15} />
                <p>1h</p>
              </div>
            </div>
            {selectedModuleId === module.id && (
              <div className="w-full">
                <p className="text-sm font-light text-gray-700">Choisissez votre niveau</p>
                <div className="mt-2 flex gap-2">
                  {module.sheets.standardSheet.id && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate({ to: `/course/${module.sheets.standardSheet.id}` })
                      }}
                      className="flex-1"
                    >
                      {LevelEnum.STANDARD}
                    </Button>
                  )}
                  {module.sheets.advancedSheet.id && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigate({ to: `/course/${module.sheets.advancedSheet.id}` })
                      }}
                      className="flex-1"
                    >
                      {LevelEnum.ADVANCED}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
