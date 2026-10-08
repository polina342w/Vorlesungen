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
