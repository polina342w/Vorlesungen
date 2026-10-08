import { useState } from 'react'
import { buildDayLayout } from './schedule-layout'
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
const DAY_END_HOUR = 21
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
  { date: '2026-10-12', start: '08:15', end: '12:15' },
  { date: '2026-10-13', start: '16:00', end: '19:00' },
  { date: '2026-10-14', start: '11:00', end: '12:30' },
  { date: '2026-10-14', start: '13:00', end: '14:30' },
  { date: '2026-10-15', start: '09:00', end: '12:15' },
  { date: '2026-10-15', start: '13:00', end: '14:30' },
  { date: '2026-10-15', start: '15:30', end: '18:45' },
  { date: '2026-10-16', start: '09:00', end: '12:00' },
  { date: '2026-10-16', start: '12:30', end: '14:00' },
  { date: '2026-10-19', start: '08:15', end: '12:15' },
  { date: '2026-10-20', start: '09:00', end: '12:00' },
  { date: '2026-10-20', start: '13:00', end: '16:00' },
  { date: '2026-10-20', start: '16:00', end: '19:00' },
  { date: '2026-10-21', start: '11:00', end: '12:30' },
  { date: '2026-10-21', start: '12:45', end: '14:15' },
  { date: '2026-10-22', start: '09:00', end: '12:15' },
  { date: '2026-10-22', start: '13:00', end: '14:30' },
  { date: '2026-10-22', start: '15:30', end: '18:45' },
  { date: '2026-10-26', start: '08:15', end: '12:15' },
  { date: '2026-10-27', start: '09:00', end: '12:00' },
  { date: '2026-10-27', start: '13:00', end: '16:00' },
  { date: '2026-10-27', start: '16:00', end: '19:00' },
  { date: '2026-10-28', start: '11:00', end: '12:30' },
  { date: '2026-10-28', start: '12:45', end: '14:15' },
  { date: '2026-10-29', start: '09:00', end: '12:15' },
  { date: '2026-10-29', start: '13:00', end: '14:30' },
  { date: '2026-10-29', start: '15:30', end: '18:45' },
  { date: '2026-11-02', start: '08:15', end: '12:15' },
  { date: '2026-11-03', start: '09:00', end: '12:00' },
  { date: '2026-11-03', start: '13:00', end: '16:00' },
  { date: '2026-11-03', start: '16:00', end: '19:00' },
  { date: '2026-11-04', start: '11:00', end: '12:30' },
  { date: '2026-11-04', start: '12:45', end: '14:15' },
  { date: '2026-11-05', start: '09:00', end: '12:15' },
  { date: '2026-11-05', start: '13:00', end: '14:30' },
  { date: '2026-11-05', start: '15:30', end: '18:45' },
  { date: '2026-11-09', start: '08:15', end: '12:15' },
  { date: '2026-11-10', start: '09:00', end: '12:00' },
  { date: '2026-11-10', start: '13:00', end: '16:00' },
  { date: '2026-11-10', start: '16:00', end: '19:00' },
  { date: '2026-11-11', start: '11:00', end: '12:30' },
  { date: '2026-11-11', start: '12:45', end: '14:15' },
  { date: '2026-11-12', start: '09:00', end: '12:15' },
  { date: '2026-11-12', start: '13:00', end: '14:30' },
  { date: '2026-11-12', start: '15:30', end: '18:45' },
  { date: '2026-11-17', start: '09:00', end: '12:00' },
  { date: '2026-11-17', start: '13:00', end: '16:00' },
  { date: '2026-11-17', start: '16:00', end: '19:00' },
  { date: '2026-11-18', start: '11:00', end: '12:30' },
  { date: '2026-11-18', start: '13:00', end: '14:30' },
  { date: '2026-11-18', start: '15:00', end: '16:30' },
  { date: '2026-11-19', start: '09:00', end: '12:15' },
  { date: '2026-11-19', start: '13:00', end: '14:30' },
  { date: '2026-11-19', start: '15:30', end: '18:45' },
  { date: '2026-11-23', start: '08:30', end: '10:00' },
  { date: '2026-11-23', start: '10:00', end: '10:30' },
  { date: '2026-11-24', start: '09:00', end: '12:00' },
  { date: '2026-11-24', start: '13:00', end: '16:00' },
  { date: '2026-11-24', start: '16:00', end: '19:00' },
  { date: '2026-11-25', start: '11:00', end: '12:30' },
  { date: '2026-11-25', start: '12:45', end: '14:15' },
  { date: '2026-11-26', start: '09:00', end: '12:15' },
  { date: '2026-11-26', start: '13:00', end: '14:30' },
  { date: '2026-11-26', start: '15:30', end: '18:45' },
  { date: '2026-11-30', start: '09:00', end: '12:15' },
  { date: '2026-12-01', start: '09:00', end: '12:00' },
  { date: '2026-12-01', start: '13:00', end: '16:00' },
  { date: '2026-12-01', start: '16:00', end: '19:00' },
  { date: '2026-12-02', start: '11:00', end: '12:30' },
  { date: '2026-12-02', start: '12:45', end: '14:15' },
  { date: '2026-12-03', start: '13:00', end: '14:30' },
  { date: '2026-12-03', start: '15:30', end: '18:45' },
  { date: '2026-12-08', start: '09:00', end: '12:00' },
  { date: '2026-12-08', start: '13:00', end: '16:00' },
  { date: '2026-12-08', start: '16:00', end: '19:00' },
  { date: '2026-12-09', start: '11:00', end: '12:30' },
  { date: '2026-12-09', start: '12:45', end: '14:15' },
  { date: '2026-12-10', start: '09:00', end: '12:15' },
  { date: '2026-12-10', start: '13:00', end: '14:30' },
  { date: '2026-12-10', start: '15:30', end: '18:45' },
  { date: '2026-12-14', start: '11:00', end: '12:00' },
  { date: '2026-12-15', start: '10:30', end: '12:30' },
  { date: '2026-12-16', start: '11:00', end: '13:00' },
  { date: '2026-12-17', start: '11:00', end: '13:00' },
]

function buildSeedEntries(): ScheduleEntry[] {
  const createEntry = (slot: { date: string; start: string; end: string }, person: PersonId, index: number): ScheduleEntry => {
    const date = new Date(`${slot.date}T12:00:00`)
    const weekStart = getMonday(date)
    const dayIndex = (date.getDay() + 6) % 7

    return {
      id: `seed-${person}-${slot.date}-${slot.start}-${index}`,
      weekKey: formatDateKey(weekStart),
      dayIndex,
      title: '<3',
      person,
      start: slot.start,
      end: slot.end,
      note: '',
    }
  }

  return [
    ...rosaSeedSlots.map((slot, index) => createEntry(slot, 'rosa', index)),
    ...blueSeedSlots.map((slot, index) => createEntry(slot, 'blau', index)),
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

function App() {
  const now = new Date()
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

      return validEntries.length > 0 ? validEntries : seededEntries
    } catch {
      return seededEntries
    }
  })

  const [weekOffset, setWeekOffset] = useState(() => {
    const weekKeys = [...new Set(entries.map((entry) => entry.weekKey))]

    if (weekKeys.length === 0) {
      return 0
    }

    const firstWeekKey = [...weekKeys].sort()[0]
    const firstWeekDate = new Date(`${firstWeekKey}T00:00:00`)
    const currentWeekDate = getMonday(now)
    const differenceInDays = firstWeekDate.getTime() - currentWeekDate.getTime()

    return Math.round(differenceInDays / 604800000)
  })

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
            <button type="button" className="ghost-button" onClick={() => setWeekOffset(0)}>
              Diese Woche
            </button>
            <button type="button" className="ghost-button" onClick={() => setWeekOffset((value) => value + 1)}>
              Nächste Woche
            </button>
          </div>
        </div>

        <div className="planner-grid" aria-label="Wochenkalender">
          <div className="timeline-column" aria-hidden="true">
            <div className="timeline-spacer">Zeit</div>
            {timeMarks.slice(0, -1).map((minutes) => (
              <div key={minutes} className="time-label">
                {pad(Math.floor(minutes / 60))}:00
              </div>
            ))}
          </div>

          <div className="planner-stage">
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
                    {timeMarks.slice(0, -1).map((minutes) => (
                      <div key={`${label}-${minutes}`} className="grid-line" />
                    ))}

                    {items.map((entry) => {
                      const startMinutes = parseTimeToMinutes(entry.start)
                      const endMinutes = parseTimeToMinutes(entry.end)
                      const totalRange = (DAY_END_HOUR - DAY_START_HOUR) * 60
                      const top = ((startMinutes - DAY_START_HOUR * 60) / totalRange) * 100
                      const height = ((endMinutes - startMinutes) / totalRange) * 100
                      const layout = buildDayLayout(items)
                      const box = layout[entry.id] ?? { left: 0, width: 100 }

                      return (
                        <div
                          key={entry.id}
                          className={`entry-block ${people[entry.person].accent}`}
                          style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            left: `${box.left}%`,
                            width: `${box.width}%`,
                            right: 'auto',
                          }}
                        >
                          <span className="entry-person">{people[entry.person].label}</span>
                          <strong>{entry.title}</strong>
                          <div className="entry-footer">
                            <span className="entry-time">
                              {entry.start} - {entry.end}
                            </span>
                            {entry.note ? <small>{entry.note}</small> : null}
                          </div>
                        </div>
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
                <div key={`${entry.id}-mobile`} className={`mobile-entry ${people[entry.person].accent}`}>
                  <div className="mobile-entry-copy">
                    <span className="mobile-person-tag">{people[entry.person].label}</span>
                    <p>{entry.start} - {entry.end}</p>
                    <strong>{entry.title}</strong>
                    {entry.note ? <span>{entry.note}</span> : null}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
