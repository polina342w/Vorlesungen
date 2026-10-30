import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDayLayout, buildRecurringRelationshipEntries } from './schedule-layout'
import { resolveDefaultWeekOffset } from './week-state'
import { resolveSeedEntryTitle } from './lecture-names'

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

test('uses the exact lecture names for known seeded dates and times', () => {
    assert.equal(resolveSeedEntryTitle('2026-10-19', '08:30', '12:00'), 'GL K. Intelligenz')
    assert.equal(resolveSeedEntryTitle('2026-10-21', '09:30', '12:00'), 'GL M. Lernverfahren')
    assert.equal(resolveSeedEntryTitle('2026-10-22', '13:00', '16:00'), 'IT-Sicherheit')
    assert.equal(resolveSeedEntryTitle('2026-12-16', '08:30', '09:30'), 'GL K. Intelligenz')
    assert.equal(resolveSeedEntryTitle('2026-12-16', '09:30', '10:30'), 'GL M. Lernverfahren')
})

test('adds the relationship review block every Monday up to the last seeded week', () => {
    const entries = [
        { id: 'a', weekKey: '2026-10-12', dayIndex: 0, title: 'Alpha', person: 'rosa', start: '09:00', end: '10:00', note: '' },
        { id: 'b', weekKey: '2026-10-19', dayIndex: 0, title: 'Beta', person: 'blau', start: '10:00', end: '11:00', note: '' },
        { id: 'c', weekKey: '2026-10-26', dayIndex: 0, title: 'Gamma', person: 'rosa', start: '11:00', end: '12:00', note: '' },
    ] as const

    const generated = buildRecurringRelationshipEntries(entries as any)

    assert.deepEqual(
        generated.map((entry) => entry.weekKey),
        ['2026-10-12', '2026-10-19', '2026-10-26'],
    )
    assert.equal(generated[0].title, 'Retrospektive Beziehung')
    assert.equal(generated[0].start, '16:00')
    assert.equal(generated[0].end, '17:00')
    assert.equal(generated[0].person, 'neutral')
    assert.match(generated[0].note, /Haben sich unsere Beziehungen/)
})
