import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isStale, markerRating, STALE_AFTER_DAYS } from './quality.ts'

const now = Date.parse('2026-06-28T12:00:00Z')
const daysAgo = (n: number): string =>
	new Date(now - n * 24 * 60 * 60 * 1000).toISOString()

void describe('isStale', () => {
	void it('is false without a date', () => {
		assert.equal(isStale(null, now), false)
		assert.equal(isStale({ measuredAt: null }, now), false)
	})
	void it('is false within the window and true beyond it', () => {
		assert.equal(
			isStale({ measuredAt: daysAgo(STALE_AFTER_DAYS - 1) }, now),
			false,
		)
		assert.equal(
			isStale({ measuredAt: daysAgo(STALE_AFTER_DAYS + 1) }, now),
			true,
		)
	})
})

void describe('markerRating', () => {
	void it('is gray when missing or stale', () => {
		assert.equal(markerRating(null, now), 'notMeasured')
		assert.equal(
			markerRating(
				{ rating: 'good', measuredAt: daysAgo(STALE_AFTER_DAYS + 3) },
				now,
			),
			'notMeasured',
		)
	})
	void it('keeps the rating for a recent reading', () => {
		assert.equal(
			markerRating({ rating: 'good', measuredAt: daysAgo(2) }, now),
			'good',
		)
		assert.equal(
			markerRating({ rating: 'poor', measuredAt: daysAgo(1) }, now),
			'poor',
		)
	})
})
