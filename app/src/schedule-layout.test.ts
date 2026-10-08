import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDayLayout } from './schedule-layout'
import { resolveDefaultWeekOffset } from './week-state'

test('overlapping entries split into parallel columns', () => {
    const entries = [
        { id: 'a', start: '09:00', end: '10:30' },
        { id: 'b', start: '09:30', end: '11:00' },
        { id: 'c', start: '13:00', end: '14:00' },
    ]

    const layout = buildDayLayout(entries)

    assert.equal(layout.a.left, 0)
    assert.equal(layout.a.width, 50)
    assert.equal(layout.b.left, 50)
    assert.equal(layout.b.width, 50)
    assert.equal(layout.c.left, 0)
    assert.equal(layout.c.width, 100)
})

test('defaults to the current or nearest available week instead of the earliest semester week', () => {
    const now = new Date('2026-10-08T12:00:00')
    const entries = [
        { weekKey: '2026-10-12', id: 'future', dayIndex: 0, title: '<3', person: 'rosa', start: '08:00', end: '09:00', note: '' },
        { weekKey: '2026-12-07', id: 'later', dayIndex: 0, title: '<3', person: 'blau', start: '09:00', end: '10:00', note: '' },
    ]

    assert.equal(resolveDefaultWeekOffset(entries, now), 1)
})
