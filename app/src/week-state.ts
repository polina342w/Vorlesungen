export type WeekEntryLike = {
    weekKey: string
}

function getMonday(date: Date) {
    const monday = new Date(date)
    monday.setHours(0, 0, 0, 0)
    const day = monday.getDay()
    const shift = day === 0 ? -6 : 1 - day
    monday.setDate(monday.getDate() + shift)
    return monday
}

export function resolveDefaultWeekOffset(entries: WeekEntryLike[], now: Date = new Date()) {
    const weekKeys = [...new Set(entries.map((entry) => entry.weekKey).filter(Boolean))]

    if (weekKeys.length === 0) {
        return 0
    }

    const currentWeekStart = getMonday(now)

    const candidates = weekKeys
        .map((weekKey) => {
            const weekDate = new Date(`${weekKey}T00:00:00`)
            const weekStart = getMonday(weekDate)
            const diffMs = weekStart.getTime() - currentWeekStart.getTime()
            const offset = Math.round(diffMs / 604800000)
            return { weekKey, offset, distance: Math.abs(offset) }
        })
        .sort((left, right) => left.distance - right.distance || left.offset - right.offset)

    return candidates[0]?.offset ?? 0
}
