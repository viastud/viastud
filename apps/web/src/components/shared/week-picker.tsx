import { WeekManager } from '@viastud/ui/shared/week-manager'

interface WeekPickerProps {
  value?: Date
  onChange?: (startOfWeek: Date, endOfWeek: Date, rangeLabel: string) => void
  className?: string
}

export function WeekPicker({ value, onChange, className }: WeekPickerProps) {
  const handleWeekChange = (weekStart: Date, weekEnd: Date, weekLabel: string) => {
    if (onChange) {
      onChange(weekStart, weekEnd, weekLabel)
    }
  }

  return (
    <WeekManager
      initialDate={value}
      onChange={handleWeekChange}
      className={className}
      mode="picker"
    />
  )
}

export default WeekPicker
