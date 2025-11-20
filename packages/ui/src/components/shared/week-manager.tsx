import React, { useMemo, useState } from 'react'

import {
  addWeeks,
  formatDateForInput,
  generateWeekOptions,
  getEndOfWeek,
  getStartOfWeek,
  getWeekLabel,
  subtractWeeks,
} from '../../lib/week.utils'

export interface WeekManagerProps {
  /** Date initiale pour la semaine sélectionnée */
  initialDate?: Date
  /** Callback appelé quand la semaine change */
  onChange?: (weekStart: Date, weekEnd: Date, weekLabel: string, weekKey: string) => void
  /** Style personnalisé pour le conteneur */
  className?: string
  /** Mode d'affichage : 'picker' pour un sélecteur avec boutons, 'dropdown' pour une liste déroulante */
  mode?: 'picker' | 'dropdown'
  /** Nombre de semaines à afficher en mode dropdown (par défaut: 12) */
  weeksCount?: number
  /** Libellé personnalisé pour le sélecteur */
  label?: string
  /** Format de date pour l'affichage (par défaut: 'DD/MM/YYYY') */
  dateFormat?: string
}

/**
 * Hook personnalisé pour la gestion des semaines
 */
function useWeekManager(initialDate?: Date) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate ?? new Date())

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate])
  const weekEnd = useMemo(() => getEndOfWeek(currentDate), [currentDate])
  const weekLabel = useMemo(() => getWeekLabel(weekStart), [weekStart])
  const weekKey = useMemo(() => formatDateForInput(weekStart), [weekStart])

  const goToPreviousWeek = () => {
    setCurrentDate((prev) => subtractWeeks(prev, 1))
  }

  const goToNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1))
  }

  const goToWeek = (date: Date) => {
    setCurrentDate(date)
  }

  const goToCurrentWeek = () => {
    setCurrentDate(new Date())
  }

  return {
    currentDate,
    weekStart,
    weekEnd,
    weekLabel,
    weekKey,
    goToPreviousWeek,
    goToNextWeek,
    goToWeek,
    goToCurrentWeek,
    setCurrentDate,
  }
}

/**
 * Composant unifié pour la gestion des semaines
 */
export function WeekManager({
  initialDate,
  onChange,
  className = '',
  mode = 'picker',
  weeksCount = 12,
  label,
  dateFormat = 'DD/MM/YYYY',
}: WeekManagerProps) {
  const {
    currentDate,
    weekStart,
    weekEnd,
    weekLabel,
    weekKey,
    goToPreviousWeek,
    goToNextWeek,
    goToWeek,
  } = useWeekManager(initialDate)

  const weekOptions = useMemo(
    () => generateWeekOptions(weeksCount, dateFormat),
    [weeksCount, dateFormat]
  )

  // Notifier le parent du changement de semaine
  React.useEffect(() => {
    if (onChange) {
      onChange(weekStart, weekEnd, weekLabel, weekKey)
    }
  }, [weekStart, weekEnd, weekLabel, weekKey, onChange])

  if (mode === 'dropdown') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && <label className="text-sm font-medium text-neutral-700">{label}</label>}
        <select
          className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={weekKey}
          onChange={(e) => {
            const selectedWeekStart = new Date(e.target.value)
            if (selectedWeekStart) {
              goToWeek(selectedWeekStart)
            }
          }}
        >
          {weekOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}

      <button
        type="button"
        aria-label="Semaine précédente"
        className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-700 hover:bg-neutral-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        onClick={goToPreviousWeek}
      >
        ‹
      </button>

      <input
        className="w-[160px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        type="date"
        value={formatDateForInput(currentDate)}
        onChange={(e) => {
          const selectedDate = e.target.value ? new Date(e.target.value) : new Date()
          goToWeek(selectedDate)
        }}
      />

      <button
        type="button"
        aria-label="Semaine suivante"
        className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-700 hover:bg-neutral-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        onClick={goToNextWeek}
      >
        ›
      </button>

      <span className="ml-1 whitespace-nowrap text-sm text-neutral-700">{weekLabel}</span>
    </div>
  )
}

export default WeekManager
