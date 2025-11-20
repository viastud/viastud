import 'chart.js/auto'

import type { ChartProps } from 'chartjs-react'
import { ReactChart } from 'chartjs-react'

export function Chart({ data, type, options }: ChartProps) {
  return (
    <ReactChart
      data={data}
      type={type}
      options={{
        ...options,
        elements: {
          line: {
            borderWidth: 3,
          },
        },
        plugins: {
          legend: { display: false },
        },
        responsive: true,
        maintainAspectRatio: false,
      }}
    />
  )
}
