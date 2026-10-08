import { useEffect, useId, useRef, useState } from 'react'
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

type FormState = {
  title: string
  dayIndex: number
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

const buildSeedEntries = (weekStart: Date): ScheduleEntry[] => {
  const weekKey = formatDateKey(weekStart)

  return [
    {
      id: 'seed-mathe',
      weekKey,
      dayIndex: 0,
      title: 'Mathe',
      person: 'rosa',
      start: '09:00',
      end: '10:30',
      note: 'A-102',
    },
    {
      id: 'seed-programmierung',
      weekKey,
      dayIndex: 0,
      title: 'Programmierung',
      person: 'blau',
      start: '09:30',
      end: '11:00',
      note: 'PC-Labor',
    },
    {
      id: 'seed-physik',
      weekKey,
      dayIndex: 1,
      title: 'Physik',
      person: 'rosa',
      start: '10:00',
      end: '11:30',
      note: 'Hörsaal 2',
    },
    {
      id: 'seed-geschichte',
      weekKey,
      dayIndex: 2,
      title: 'Geschichte',
      person: 'blau',
      start: '08:30',
      end: '10:00',
      note: 'Seminarraum',
    },
    {
      id: 'seed-projekt',
      weekKey,
      dayIndex: 3,
      title: 'Projektarbeit',
      person: 'rosa',
      start: '13:00',
      end: '15:30',
      note: 'Teammeeting',
    },
    {
      id: 'seed-sport',
      weekKey,
      dayIndex: 4,
      title: 'Sport',
      person: 'blau',
      start: '11:00',
      end: '12:30',
      note: 'Halle B',
    },
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

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) {
    return `${hours} Std.`
  }

  return `${hours} Std. ${rest} Min.`
}

function getEntryMinutes(entry: Pick<ScheduleEntry, 'start' | 'end'>) {
  return parseTimeToMinutes(entry.end) - parseTimeToMinutes(entry.start)
}

function getDefaultDayIndex(referenceDate: Date, weekStart: Date) {
  const diffInDays = Math.floor(
    (new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime() -
      weekStart.getTime()) /
    86400000,
  )

  if (diffInDays < 0) {
    return 0
  }

  if (diffInDays > 4) {
    return 4
  }

  return diffInDays
}

function createFormState(referenceDate: Date, weekStart: Date): FormState {
  return {
    title: '',
    dayIndex: getDefaultDayIndex(referenceDate, weekStart),
    person: 'rosa',
    start: '09:00',
    end: '10:30',
    note: '',
  }
}

function sortEntries(entries: ScheduleEntry[]) {
  return [...entries].sort((left, right) => {
    if (left.dayIndex !== right.dayIndex) {
      return left.dayIndex - right.dayIndex
    }

    return parseTimeToMinutes(left.start) - parseTimeToMinutes(right.start)
  })
}

function App() {
  const now = new Date()
  const [weekOffset, setWeekOffset] = useState(0)
  const [entries, setEntries] = useState<ScheduleEntry[]>(() => {
    const seededEntries = buildSeedEntries(currentWeekStart)

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

  const currentWeekStart = addWeeks(getMonday(now), weekOffset)
  const currentWeekKey = formatDateKey(currentWeekStart)
  const [form, setForm] = useState<FormState>(() => createFormState(now, currentWeekStart))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const importId = useId()
  const importRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const currentWeekEntries = sortEntries(
    entries.filter((entry) => entry.weekKey === currentWeekKey),
  )

  const weekDays = weekdayLabels.map((label, dayIndex) => {
    const date = addDays(currentWeekStart, dayIndex)
    const items = currentWeekEntries.filter((entry) => entry.dayIndex === dayIndex)
    return { label, date, dayIndex, items }
  })

  const totals = (Object.keys(people) as PersonId[]).map((person) => {
    const minutes = currentWeekEntries
      .filter((entry) => entry.person === person)
      .reduce((sum, entry) => sum + getEntryMinutes(entry), 0)

    return { person, minutes }
  })

  const weekEnd = addDays(currentWeekStart, 4)
  const weekNumber = getIsoWeekNumber(currentWeekStart)

  function resetForm() {
    setEditingId(null)
    setForm(createFormState(new Date(), currentWeekStart))
  }

  function handleFieldChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const startMinutes = parseTimeToMinutes(form.start)
    const endMinutes = parseTimeToMinutes(form.end)

    if (form.title.trim().length < 2) {
      setErrorMessage('Bitte gib einen aussagekräftigen Titel ein.')
      return
    }

    if (endMinutes <= startMinutes) {
      setErrorMessage('Die Endzeit muss nach der Startzeit liegen.')
      return
    }

    const entry: ScheduleEntry = {
      id: editingId ?? crypto.randomUUID(),
      weekKey: currentWeekKey,
      dayIndex: form.dayIndex,
      title: form.title.trim(),
      person: form.person,
      start: form.start,
      end: form.end,
      note: form.note.trim(),
    }

    setEntries((current) => {
      if (!editingId) {
        return sortEntries([...current, entry])
      }

      return sortEntries(current.map((item) => (item.id === editingId ? entry : item)))
    })

    setSuccessMessage(editingId ? 'Eintrag aktualisiert.' : 'Eintrag gespeichert.')
    resetForm()
  }

  function handleEdit(entry: ScheduleEntry) {
    setEditingId(entry.id)
    setErrorMessage('')
    setSuccessMessage('')
    setForm({
      title: entry.title,
      dayIndex: entry.dayIndex,
      person: entry.person,
      start: entry.start,
      end: entry.end,
      note: entry.note,
    })
  }

  function handleDelete(entryId: string) {
    setEntries((current) => current.filter((entry) => entry.id !== entryId))
    setSuccessMessage('Eintrag gelöscht.')

    if (editingId === entryId) {
      resetForm()
    }
  }

  function handleClearWeek() {
    setEntries((current) => current.filter((entry) => entry.weekKey !== currentWeekKey))
    setSuccessMessage('Die aktuelle Woche wurde geleert.')

    if (editingId) {
      resetForm()
    }
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'wochenplan-backup.json'
    link.click()
    URL.revokeObjectURL(url)
    setSuccessMessage('Backup exportiert.')
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        throw new Error('Ungültiges Backup')
      }

      const importedEntries = parsed.filter((entry): entry is ScheduleEntry => {
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

      setEntries(sortEntries(importedEntries))
      setSuccessMessage('Backup importiert.')
      setErrorMessage('')
    } catch {
      setErrorMessage('Das Backup konnte nicht gelesen werden.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="eyebrow">Online-Wochenplan</div>
        <div className="hero-grid">
          <div>
            <h1>Minimalistischer Planer fuer zwei Personen, direkt auf die aktuelle Woche gesetzt.</h1>
            <p className="hero-copy">
              Montag bis Freitag, farblich getrennt in Rosa und Blau, mit lokaler
              Speicherung im Browser und klarer Eingabe fuer Zeiten und Termine.
            </p>
          </div>

          <aside className="week-summary">
            <p className="summary-label">Aktive Woche</p>
            <strong>
              KW {weekNumber} · {formatHeaderDate(currentWeekStart)} bis {formatHeaderDate(weekEnd)}
            </strong>
            <p>{currentWeekEntries.length} Eintraege gespeichert</p>

            <div className="summary-people">
              {totals.map(({ person, minutes }) => (
                <div className={`summary-chip ${people[person].accent}`} key={person}>
                  <span>{people[person].label}</span>
                  <strong>{minutes === 0 ? 'Noch frei' : formatDuration(minutes)}</strong>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="toolbar-card">
        <div className="week-nav">
          <button type="button" className="ghost-button" onClick={() => setWeekOffset((value) => value - 1)}>
            Vorige Woche
          </button>
          <div>
            <p className="summary-label">Wochenansicht</p>
            <h2>
              KW {weekNumber} · {formatLongDate(currentWeekStart)}
            </h2>
          </div>
          <button type="button" className="ghost-button" onClick={() => setWeekOffset(0)}>
            Diese Woche
          </button>
          <button type="button" className="ghost-button" onClick={() => setWeekOffset((value) => value + 1)}>
            Naechste Woche
          </button>
        </div>

        <div className="storage-actions">
          <span className="storage-note">Gespeichert im Browser auf diesem Geraet</span>
          <button type="button" className="ghost-button" onClick={handleExport}>
            Backup exportieren
          </button>
          <button type="button" className="ghost-button" onClick={() => importRef.current?.click()}>
            Backup importieren
          </button>
          <button type="button" className="ghost-button danger" onClick={handleClearWeek}>
            Woche leeren
          </button>
          <input
            id={importId}
            ref={importRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            hidden
          />
        </div>
      </section>

      <section className="workspace-grid">
        <article className="form-card">
          <div className="card-heading">
            <div>
              <p className="summary-label">Eintrag</p>
              <h3>{editingId ? 'Termin bearbeiten' : 'Termin anlegen'}</h3>
            </div>
            {editingId ? (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Abbrechen
              </button>
            ) : null}
          </div>

          <form className="entry-form" onSubmit={handleSubmit}>
            <label>
              Titel
              <input
                type="text"
                placeholder="z. B. Vorlesung, Arbeit, Meeting"
                value={form.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
              />
            </label>

            <div className="form-row two-columns">
              <label>
                Tag
                <select
                  value={form.dayIndex}
                  onChange={(event) => handleFieldChange('dayIndex', Number(event.target.value))}
                >
                  {weekdayLabels.map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Person
                <select
                  value={form.person}
                  onChange={(event) => handleFieldChange('person', event.target.value as PersonId)}
                >
                  {(Object.keys(people) as PersonId[]).map((person) => (
                    <option key={person} value={person}>
                      {people[person].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row two-columns">
              <label>
                Start
                <input
                  type="time"
                  value={form.start}
                  onChange={(event) => handleFieldChange('start', event.target.value)}
                />
              </label>

              <label>
                Ende
                <input
                  type="time"
                  value={form.end}
                  onChange={(event) => handleFieldChange('end', event.target.value)}
                />
              </label>
            </div>

            <label>
              Notiz
              <textarea
                rows={4}
                placeholder="Raum, Link, Aufgabe oder kurzer Hinweis"
                value={form.note}
                onChange={(event) => handleFieldChange('note', event.target.value)}
              />
            </label>

            {errorMessage ? <p className="message error">{errorMessage}</p> : null}
            {successMessage ? <p className="message success">{successMessage}</p> : null}

            <button type="submit" className="primary-button">
              {editingId ? 'Aenderung speichern' : 'Im Kalender eintragen'}
            </button>
          </form>
        </article>

        <article className="planner-card">
          <div className="card-heading">
            <div>
              <p className="summary-label">Kalender</p>
              <h3>Montag bis Freitag</h3>
            </div>
            <span className="mobile-hint">Kompakt fuer iPhone und Desktop</span>
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
                {weekDays.map(({ label, date, items, dayIndex }) => (
                  <section key={label} className="day-column">
                    <div className="day-surface">
                      <div className="day-surface-label" aria-hidden="true">
                        <span>{label}</span>
                        <strong>{formatHeaderDate(date)}</strong>
                      </div>

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
                          <button
                            key={entry.id}
                            type="button"
                            className={`entry-block ${people[entry.person].accent}`}
                            style={{
                              top: `${top}%`,
                              height: `${height}%`,
                              left: `${box.left}%`,
                              width: `${box.width}%`,
                              right: 'auto',
                            }}
                            onClick={() => handleEdit(entry)}
                          >
                            <span className="entry-person">{people[entry.person].label}</span>
                            <strong>{entry.title}</strong>
                            <div className="entry-footer">
                              <span className="entry-time">
                                {entry.start} - {entry.end}
                              </span>
                              {entry.note ? <small>{entry.note}</small> : null}
                            </div>
                          </button>
                        )
                      })}

                      {items.length === 0 ? (
                        <button
                          type="button"
                          className="empty-day"
                          onClick={() => {
                            setEditingId(null)
                            setForm((current) => ({ ...current, dayIndex }))
                          }}
                        >
                          Frei · Termin hinzufuegen
                        </button>
                      ) : null}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>

          <div className="mobile-days">
            {weekDays.map(({ label, date, items }) => (
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
                      <p>
                        {entry.start} - {entry.end}
                      </p>
                      <strong>{entry.title}</strong>
                      {entry.note ? <span>{entry.note}</span> : null}
                    </div>
                    <div className="mobile-entry-actions">
                      <button type="button" onClick={() => handleEdit(entry)}>
                        Bearbeiten
                      </button>
                      <button type="button" onClick={() => handleDelete(entry.id)}>
                        Loeschen
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </article>
      </section>

      <section className="list-card">
        <div className="card-heading">
          <div>
            <p className="summary-label">Wochenliste</p>
            <h3>Alle Eintraege dieser Woche</h3>
          </div>
        </div>

        {currentWeekEntries.length === 0 ? (
          <p className="empty-list">Noch keine Termine gespeichert. Lege links den ersten Eintrag an.</p>
        ) : (
          <div className="entry-list">
            {currentWeekEntries.map((entry) => {
              const entryDate = addDays(currentWeekStart, entry.dayIndex)
              return (
                <article key={`${entry.id}-list`} className="entry-row">
                  <div className={`entry-avatar ${people[entry.person].accent}`}>{people[entry.person].label}</div>
                  <div className="entry-copy">
                    <strong>{entry.title}</strong>
                    <p>
                      {weekdayLabels[entry.dayIndex]} · {formatHeaderDate(entryDate)} · {entry.start} - {entry.end}
                    </p>
                    {entry.note ? <span>{entry.note}</span> : null}
                  </div>
                  <div className="entry-actions">
                    <button type="button" className="ghost-button" onClick={() => handleEdit(entry)}>
                      Bearbeiten
                    </button>
                    <button type="button" className="ghost-button danger" onClick={() => handleDelete(entry.id)}>
                      Loeschen
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default App
