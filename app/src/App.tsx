import { useEffect, useRef, useState } from 'react'
import { buildDayLayout } from './schedule-layout'
import { resolveSeedEntryTitle } from './lecture-names'
import './App.css'

type PersonId = 'rosa' | 'blau'

type ScheduleEntry = {
  id: string
  weekKey: string
  dayIndex: number
  title: string
  person: PersonId
  start: string
  end: string
  note: string
}

const STORAGE_KEY = 'vorlesungen-wochenplan-v1'
const DAY_START_HOUR = 7
const DAY_END_HOUR = 19
const SLOT_MINUTES = 30

const people: Record<PersonId, { label: string; accent: string }> = {
  rosa: { label: 'Rosa', accent: 'rose' },
  blau: { label: 'Blau', accent: 'blue' },
}

const weekdayLabels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']

const rosaSeedSlots = [
  { date: '2026-10-13', start: '11:00', end: '12:00' },
  { date: '2026-10-13', start: '16:00', end: '16:30' },
  { date: '2026-10-14', start: '09:30', end: '12:00' },
  { date: '2026-10-14', start: '13:00', end: '16:00' },
  { date: '2026-10-15', start: '13:00', end: '16:00' },
  { date: '2026-10-19', start: '08:30', end: '12:00' },
  { date: '2026-10-21', start: '09:30', end: '12:00' },
  { date: '2026-10-22', start: '09:00', end: '12:00' },
  { date: '2026-10-22', start: '13:00', end: '16:00' },
  { date: '2026-10-29', start: '09:00', end: '12:00' },
  { date: '2026-10-29', start: '13:00', end: '16:00' },
  { date: '2026-11-02', start: '08:30', end: '12:00' },
  { date: '2026-11-03', start: '08:30', end: '12:00' },
  { date: '2026-11-03', start: '13:00', end: '15:30' },
  { date: '2026-11-04', start: '09:30', end: '12:00' },
  { date: '2026-11-09', start: '08:30', end: '12:00' },
  { date: '2026-11-11', start: '09:30', end: '12:00' },
  { date: '2026-11-11', start: '13:00', end: '16:00' },
  { date: '2026-11-13', start: '09:00', end: '12:00' },
  { date: '2026-11-16', start: '08:30', end: '12:00' },
  { date: '2026-11-18', start: '13:00', end: '16:00' },
  { date: '2026-11-20', start: '09:00', end: '13:00' },
  { date: '2026-11-23', start: '08:30', end: '12:00' },
  { date: '2026-11-25', start: '09:30', end: '12:00' },
  { date: '2026-11-30', start: '08:30', end: '12:00' },
  { date: '2026-12-02', start: '09:30', end: '12:00' },
  { date: '2026-12-02', start: '13:00', end: '16:00' },
  { date: '2026-12-07', start: '08:30', end: '12:00' },
  { date: '2026-12-09', start: '09:30', end: '12:00' },
  { date: '2026-12-10', start: '09:00', end: '12:00' },
  { date: '2026-12-10', start: '13:00', end: '16:00' },
  { date: '2026-12-15', start: '13:00', end: '15:00' },
  { date: '2026-12-16', start: '08:30', end: '10:30' },
]

const blueSeedSlots = [
  { date: '2026-10-12', start: '08:15', end: '12:15', title: 'Parall. Programm.' },
  { date: '2026-10-13', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-10-14', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-10-14', start: '13:00', end: '14:30', title: 'Form. S+A. Gr. A' },
  { date: '2026-10-15', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-10-15', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-10-15', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-10-16', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-10-16', start: '12:30', end: '14:00', title: 'Form. S+A. Gr. A' },
  { date: '2026-10-19', start: '08:15', end: '12:15', title: 'Parall. Programm.' },
  { date: '2026-10-20', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-10-20', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-10-20', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-10-21', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-10-21', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-10-22', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-10-22', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-10-22', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-10-26', start: '08:15', end: '12:15', title: 'Parall. Programm.' },
  { date: '2026-10-27', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-10-27', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-10-27', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-10-28', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-10-28', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-10-29', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-10-29', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-10-29', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-11-02', start: '08:15', end: '12:15', title: 'Parall. Programm.' },
  { date: '2026-11-03', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-03', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-03', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-11-04', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-04', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-11-05', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-11-05', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-05', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-11-09', start: '08:15', end: '12:15', title: 'Parall. Programm.' },
  { date: '2026-11-10', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-10', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-10', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-11-11', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-11', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-11-12', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-11-12', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-12', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-11-17', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-17', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-17', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-11-18', start: '11:00', end: '12:30', title: 'Form. S+A. Gr. B' },
  { date: '2026-11-18', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-18', start: '15:00', end: '16:30', title: 'Form. S+A. Gr. A' },
  { date: '2026-11-19', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-11-19', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-19', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-11-23', start: '08:30', end: '10:00', title: 'Parall. Programm.' },
  { date: '2026-11-23', start: '10:00', end: '10:30', title: 'Parall. Programm.' },
  { date: '2026-11-24', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-24', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-11-24', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-11-25', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-25', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-11-26', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-11-26', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-11-26', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-11-30', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-12-01', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-12-01', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-12-01', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-12-02', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-12-02', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-12-03', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-12-03', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-12-08', start: '09:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-12-08', start: '13:00', end: '16:00', title: 'GL von DB-Systemen' },
  { date: '2026-12-08', start: '16:00', end: '19:00', title: 'Angewandte Mathe' },
  { date: '2026-12-09', start: '11:00', end: '12:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-12-09', start: '12:45', end: '14:15', title: 'Form. S+A. Gr. A' },
  { date: '2026-12-10', start: '09:00', end: '12:15', title: 'GL des SWE' },
  { date: '2026-12-10', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-12-10', start: '15:30', end: '18:45', title: 'C/C++' },
  { date: '2026-12-14', start: '11:00', end: '12:00', title: 'GL von DB-Systemen' },
  { date: '2026-12-15', start: '10:30', end: '12:30', title: 'Angewandte Mathe' },
  { date: '2026-12-16', start: '11:00', end: '13:00', title: 'Form. Sp+Autom. 1+2' },
  { date: '2026-12-17', start: '11:00', end: '13:00', title: 'GL des SWE' },
]

const currentWeekSeedSlots: Array<{
  date: string
  start: string
  end: string
  title: string
  person: PersonId
}> = [
  { date: '2026-10-08', start: '13:00', end: '16:00', title: 'IT-Sicherheit', person: 'rosa' },
  { date: '2026-10-08', start: '13:00', end: '14:30', title: 'Form. Sp+Autom. 1+2', person: 'blau' },
  { date: '2026-10-08', start: '15:30', end: '18:45', title: 'C/C++', person: 'blau' },
]

function buildSeedEntries(): ScheduleEntry[] {
  const createEntry = (
    slot: { date: string; start: string; end: string; title?: string },
    person: PersonId,
    index: number,
  ): ScheduleEntry => {
    const date = new Date(`${slot.date}T12:00:00`)
    const weekStart = getMonday(date)
    const dayIndex = (date.getDay() + 6) % 7

    return {
      id: `seed-${person}-${slot.date}-${slot.start}-${index}`,
      weekKey: formatDateKey(weekStart),
      dayIndex,
      title:
        slot.title ??
        resolveSeedEntryTitle(slot.date, slot.start, slot.end) ??
        (person === 'rosa' ? '<3' : 'Termin'),
      person,
      start: slot.start,
      end: slot.end,
      note: '',
    }
  }

  return [
    ...rosaSeedSlots.map((slot, index) => createEntry(slot, 'rosa', index)),
    ...blueSeedSlots.map((slot, index) => createEntry(slot, 'blau', index)),
    ...currentWeekSeedSlots.map((slot, index) => createEntry(slot, slot.person, index)),
  ]
}

const timeMarks = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * (60 / SLOT_MINUTES) + 1 },
  (_, index) => DAY_START_HOUR * 60 + index * SLOT_MINUTES,
)

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getMonday(date: Date) {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  const day = monday.getDay()
  const shift = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + shift)
  return monday
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7)
}

function getIsoWeekNumber(date: Date) {
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7))
  const diff = target.getTime() - firstThursday.getTime()
  return 1 + Math.round(diff / 604800000)
}

function formatHeaderDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function sortEntries(entries: ScheduleEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.dayIndex !== right.dayIndex) {
      return left.dayIndex - right.dayIndex
    }

    const startDiff = parseTimeToMinutes(left.start) - parseTimeToMinutes(right.start)
    if (startDiff !== 0) {
      return startDiff
    }

    if (left.person !== right.person) {
      return left.person === 'blau' ? -1 : 1
    }

    return left.title.localeCompare(right.title)
  })
}

function mergeWithSeedEntries(storedEntries: ScheduleEntry[], seededEntries: ScheduleEntry[]) {
  const mergedEntries = new Map(seededEntries.map((entry) => [entry.id, entry]))

  storedEntries.forEach((entry) => {
    mergedEntries.set(entry.id, entry)
  })

  return [...mergedEntries.values()]
}

function App() {
  const now = new Date()
  const plannerGridRef = useRef<HTMLDivElement>(null)
  const plannerStageRef = useRef<HTMLDivElement>(null)
  const seededEntries = buildSeedEntries()
  const [entries] = useState<ScheduleEntry[]>(() => {
    if (typeof window === 'undefined') {
      return seededEntries
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return seededEntries
      }

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        return seededEntries
      }

      const validEntries = parsed.filter((entry): entry is ScheduleEntry => {
        return (
          typeof entry?.id === 'string' &&
          typeof entry?.weekKey === 'string' &&
          typeof entry?.dayIndex === 'number' &&
          typeof entry?.title === 'string' &&
          (entry?.person === 'rosa' || entry?.person === 'blau') &&
          typeof entry?.start === 'string' &&
          typeof entry?.end === 'string' &&
          typeof entry?.note === 'string'
        )
      })

      return mergeWithSeedEntries(validEntries, seededEntries)
    } catch {
      return seededEntries
    }
  })

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null)

  const currentWeekStart = addWeeks(getMonday(now), weekOffset)
  const currentWeekKey = formatDateKey(currentWeekStart)

  const currentWeekEntries = sortEntries(
    entries.filter((entry) => entry.weekKey === currentWeekKey),
  )

  const weekDays = weekdayLabels.map((label, dayIndex) => {
    const date = addDays(currentWeekStart, dayIndex)
    const items = currentWeekEntries.filter((entry) => entry.dayIndex === dayIndex)
    return { label, date, dayIndex, items }
  })

  const weekNumber = getIsoWeekNumber(currentWeekStart)

  useEffect(() => {
    if (!selectedEntry) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedEntry(null)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    document.body.classList.add('modal-open')

    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.classList.remove('modal-open')
    }
  }, [selectedEntry])

  useEffect(() => {
    const plannerGrid = plannerGridRef.current
    const plannerStage = plannerStageRef.current

    if (!plannerGrid || !plannerStage || !window.matchMedia('(max-width: 820px)').matches) {
      return
    }

    const visibleDayIndex = weekOffset === 0 ? (new Date().getDay() + 6) % 7 : 0
    const dayIndex = Math.min(visibleDayIndex, weekdayLabels.length - 1)
    const timelineWidth = plannerGrid.firstElementChild?.getBoundingClientRect().width ?? 58
    const dayWidth = plannerStage.getBoundingClientRect().width / weekdayLabels.length
    const calendarViewportWidth = plannerGrid.clientWidth - timelineWidth
    const centeredDayOffset = Math.max(0, (calendarViewportWidth - dayWidth) / 2)

    plannerGrid.scrollLeft = Math.max(
      0,
      timelineWidth + dayIndex * dayWidth - centeredDayOffset,
    )
  }, [weekOffset])

  const selectedDate = selectedEntry
    ? addDays(currentWeekStart, selectedEntry.dayIndex)
    : null

  return (
    <main className="app-shell">
      <section className="calendar-shell">
        <div className="calendar-topbar">
          <h1>Kalender</h1>

          <div className="week-nav">
            <button type="button" className="ghost-button" onClick={() => setWeekOffset((value) => value - 1)}>
              Vorige Woche
            </button>
            <div className="week-label">
              <span>KW {weekNumber}</span>
              <strong>{formatLongDate(currentWeekStart)}</strong>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setWeekOffset(0)}
            >
              Diese Woche
            </button>
            <button type="button" className="ghost-button" onClick={() => setWeekOffset((value) => value + 1)}>
              Nächste Woche
            </button>
          </div>
        </div>

        <div ref={plannerGridRef} className="planner-grid" aria-label="Wochenkalender">
          <div className="timeline-column" aria-hidden="true">
            <div className="calendar-corner">KW {weekNumber}</div>
            <div className="time-scale">
              {timeMarks.filter((minutes) => minutes % 60 === 0).map((minutes) => {
                const totalRange = (DAY_END_HOUR - DAY_START_HOUR) * 60
                const top = ((minutes - DAY_START_HOUR * 60) / totalRange) * 100

                return (
                  <div key={minutes} className="time-label" style={{ top: `${top}%` }}>
                    {pad(Math.floor(minutes / 60))}:00
                  </div>
                )
              })}
            </div>
          </div>

          <div ref={plannerStageRef} className="planner-stage">
            <div className="days-header-row">
              {weekDays.map(({ label, date }) => (
                <div key={`${label}-header`} className="day-pill">
                  <strong>{label.slice(0, 2)}</strong>
                  <span>{formatHeaderDate(date)}</span>
                </div>
              ))}
            </div>

            <div className="days-grid">
              {weekDays.map(({ label, items }) => (
                <section key={label} className="day-column">
                  <div className="day-surface">
                    {timeMarks.map((minutes) => {
                      const totalRange = (DAY_END_HOUR - DAY_START_HOUR) * 60
                      const top = ((minutes - DAY_START_HOUR * 60) / totalRange) * 100

                      return (
                        <div
                          key={`${label}-${minutes}`}
                          className={`grid-line ${minutes % 60 === 0 ? 'hour-line' : ''}`}
                          style={{ top: `${top}%` }}
                        />
                      )
                    })}

                    {items.map((entry) => {
                      const startMinutes = parseTimeToMinutes(entry.start)
                      const endMinutes = parseTimeToMinutes(entry.end)
                      const totalRange = (DAY_END_HOUR - DAY_START_HOUR) * 60
                      const top = ((startMinutes - DAY_START_HOUR * 60) / totalRange) * 100
                      const height = ((endMinutes - startMinutes) / totalRange) * 100
                      const layout = buildDayLayout(items)
                      const box = layout[entry.id] ?? { left: 0, width: 100 }
                      const hideShortHeartContent =
                        entry.title.trim() === '<3' && endMinutes - startMinutes <= SLOT_MINUTES

                      return (
                        <button
                          type="button"
                          key={entry.id}
                          className={`entry-block ${people[entry.person].accent}`}
                          onClick={() => setSelectedEntry(entry)}
                          aria-label={`${entry.title}, ${entry.start} bis ${entry.end}. Details öffnen`}
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            left: `${box.left}%`,
                            width: `${box.width}%`,
                            right: 'auto',
                          }}
                        >
                          {hideShortHeartContent ? null : (
                            <>
                              <span className="entry-time">
                                {entry.start}–{entry.end}
                              </span>
                              <strong>{entry.title}</strong>
                              {entry.note ? (
                                <div className="entry-footer">
                                  <small>{entry.note}</small>
                                </div>
                              ) : null}
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        <div className="mobile-days">
          {weekDays.map(({ label, items, date }) => (
            <section key={`${label}-mobile`} className="mobile-day-card">
              <header>
                <strong>{label}</strong>
                <span>{formatHeaderDate(date)}</span>
              </header>

              {items.length === 0 ? <p className="mobile-empty">Noch kein Eintrag.</p> : null}

              {items.map((entry) => (
                <button
                  type="button"
                  key={`${entry.id}-mobile`}
                  className={`mobile-entry ${people[entry.person].accent}`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="mobile-entry-copy">
                    <span className="mobile-person-tag">{people[entry.person].label}</span>
                    <p>{entry.start} - {entry.end}</p>
                    <strong>{entry.title}</strong>
                    {entry.note ? <span>{entry.note}</span> : null}
                  </div>
                </button>
              ))}
            </section>
          ))}
        </div>
      </section>

      {selectedEntry && selectedDate ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedEntry(null)}>
          <section
            className="lecture-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lecture-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedEntry(null)}
              aria-label="Popup schließen"
              autoFocus
            >
              ×
            </button>
            <span className={`modal-person ${people[selectedEntry.person].accent}`}>
              {people[selectedEntry.person].label}
            </span>
            <h2 id="lecture-modal-title">{selectedEntry.title}</h2>
            <p className="modal-date">{formatLongDate(selectedDate)}</p>
            <div className="modal-time-card">
              <span>Uhrzeit</span>
              <strong>{selectedEntry.start} – {selectedEntry.end} Uhr</strong>
            </div>
            {selectedEntry.note ? <p className="modal-note">{selectedEntry.note}</p> : null}
          </section>
        </div>
      ) : null}
    </main>
  )
}

export default App
