import test from 'node:test'
import assert from 'node:assert/strict'

import { buildDayLayout } from './schedule-layout'

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
