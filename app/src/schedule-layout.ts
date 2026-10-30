export type TimeRangeEntry = {
    id: string
    start: string
    end: string
}

export type DayLayoutEntry = {
    left: number
    width: number
}

function parseTimeToMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number)
    return hours * 60 + minutes
}

function overlaps(left: TimeRangeEntry, right: TimeRangeEntry) {
    return parseTimeToMinutes(left.start) < parseTimeToMinutes(right.end) &&
        parseTimeToMinutes(right.start) < parseTimeToMinutes(left.end)
}

export function buildDayLayout(entries: TimeRangeEntry[]) {
    const sortedEntries = [...entries].sort(
        (left, right) => parseTimeToMinutes(left.start) - parseTimeToMinutes(right.start),
    )

    const groups: TimeRangeEntry[][] = []

    for (const entry of sortedEntries) {
        const groupIndex = groups.findIndex((group) =>
            group.some((existingEntry) => overlaps(existingEntry, entry)),
        )

        if (groupIndex === -1) {
            groups.push([entry])
            continue
        }

        groups[groupIndex].push(entry)
    }

    const layout: Record<string, DayLayoutEntry> = {}

    for (const group of groups) {
        const columns: TimeRangeEntry[][] = []

        for (const entry of group) {
            let columnIndex = 0

            while (
                columnIndex < columns.length &&
                columns[columnIndex].some((existingEntry) => overlaps(existingEntry, entry))
            ) {
                columnIndex += 1
            }

            if (!columns[columnIndex]) {
                columns[columnIndex] = []
            }

            columns[columnIndex].push(entry)
        }

        const columnCount = columns.length || 1
        const columnWidth = 100 / columnCount

        columns.forEach((columnEntries, columnIndex) => {
            columnEntries.forEach((entry) => {
                layout[entry.id] = {
                    left: columnIndex * columnWidth,
                    width: columnWidth,
                }
            })
        })
    }

    return layout
}

export type RecurringRelationshipEntry = {
    id: string
    weekKey: string
    dayIndex: number
    title: string
    person: 'neutral'
    start: string
    end: string
    note: string
}

export const relationshipReviewText = `1. Haben sich unsere Beziehungen in dieser Woche verbessert, verschlechtert oder sind sie unverändert geblieben?
2. Was hat dir gefehlt?
3. Was kann ich diese Woche tun, damit du dich glücklicher fühlst?`

function pad(value: number) {
    return value.toString().padStart(2, '0')
}

function addDays(date: Date, days: number) {
    const copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
}

export function buildRecurringRelationshipEntries<T extends { weekKey: string }>(entries: T[]) {
    const weekKeys = [...new Set(entries.map((entry) => entry.weekKey))].sort()

    if (weekKeys.length === 0) {
        return [] as RecurringRelationshipEntry[]
    }

    const startDate = new Date(`${weekKeys[0]}T12:00:00`)
    const endDate = new Date(`${weekKeys[weekKeys.length - 1]}T12:00:00`)

    const generated: RecurringRelationshipEntry[] = []

    for (let current = new Date(startDate); current <= endDate; current = addDays(current, 7)) {
        const weekKey = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`

        generated.push({
            id: `relationship-${weekKey}`,
            weekKey,
            dayIndex: 0,
            title: 'Retrospektive Beziehung',
            person: 'neutral',
            start: '16:00',
            end: '17:00',
            note: relationshipReviewText,
        })
    }

    return generated
}
