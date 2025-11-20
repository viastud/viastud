import type { ModuleQuizGradeForStudent, QuizGrade } from '@viastud/server/routers/question_router'
import { Chart } from '@viastud/ui/shared/react-chart'
import { useState } from 'react'

export function ProfileComponent({
  lastFourStudentQuizGrades,
  lastStudentQuizGradesPerModule,
}: {
  lastFourStudentQuizGrades: QuizGrade[]
  lastStudentQuizGradesPerModule: ModuleQuizGradeForStudent[]
}) {
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'MATHS'>('ALL')

  const handleTabClick = (tab: 'ALL' | 'MATHS') => {
    setSelectedTab(tab)
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-start gap-4 self-stretch px-8">
        <h1 className="text-2xl font-extrabold text-gray-950">Notes</h1>
        <div className="flex rounded-full bg-blue-100 p-0.5">
          {['ALL', 'MATHS'].map((tab, index) => (
            <div
              key={tab}
              className={
                tab === selectedTab
                  ? 'flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-sm text-blue-600'
                  : 'flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-gray-700'
              }
              onClick={() => {
                handleTabClick(tab as 'ALL' | 'MATHS')
              }}
            >
              {['Toutes', 'Maths'][index]}
            </div>
          ))}
        </div>
        <div className="flex gap-2 self-stretch">
          {lastFourStudentQuizGrades
            .filter((grade) => selectedTab === 'ALL' || grade.moduleSubject === selectedTab)
            .map((grade) => (
              <div
                key={grade.id}
                className="flex grow flex-col items-center rounded-2xl bg-gray-100 p-8"
              >
                <p className="text-sm text-gray-700">{grade.moduleName}</p>
                <h1 className="text-2xl font-extrabold text-gray-950">{`${grade.grade} / 10`}</h1>
              </div>
            ))}
        </div>
      </div>
      <div className="flex flex-col gap-8 self-stretch">
        <h1 className="self-start px-8 text-2xl font-extrabold text-gray-950">Progression</h1>
        {lastStudentQuizGradesPerModule.length > 0 && (
          <div className="h-[60vh] w-[60vw] self-center rounded-2xl bg-white p-4">
            <Chart
              data={{
                labels: lastStudentQuizGradesPerModule.map(
                  (studentGrade) => studentGrade.moduleName
                ),
                datasets: [
                  {
                    label: 'Dernière note',
                    data: lastStudentQuizGradesPerModule.map((studentGrade) => studentGrade.grade),
                    fill: true,
                    backgroundColor: 'rgba(236, 179, 6, 0.2)',
                    borderColor: 'rgb(253, 205, 18)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgb(253, 205, 18)',
                    animation: false,
                  },
                ],
              }}
              type={lastStudentQuizGradesPerModule.length > 3 ? 'radar' : 'bar'}
              options={{
                scales:
                  lastStudentQuizGradesPerModule.length > 3
                    ? {
                        r: {
                          axis: 'r',
                          min: 0,
                          max: 10,
                          ticks: {
                            font: { family: 'poppins', size: 14 },
                            color: '#0C111D',
                          },
                          pointLabels: {
                            font: { family: 'poppins', size: 14, weight: 'bold' },
                            color: '#0C111D',
                          },
                        },
                      }
                    : {
                        y: {
                          beginAtZero: true,
                          min: 0,
                          max: 10,
                          ticks: {
                            font: { family: 'poppins', size: 14 },
                            color: '#0C111D',
                          },
                          pointLabels: {
                            font: { family: 'poppins', size: 14, weight: 'bold' },
                            color: '#0C111D',
                          },
                        },
                      },
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
