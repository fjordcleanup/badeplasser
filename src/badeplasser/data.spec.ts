import { Value } from '@sinclair/typebox/value'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { type Dataset as DatasetType, Dataset } from './schema.ts'

const dataset = JSON.parse(
	readFileSync(
		fileURLToPath(new URL('./badeplasser.json', import.meta.url)),
		'utf-8',
	),
) as DatasetType

void describe('badeplasser.json', () => {
	void it('matches the schema', () => {
		const errors = [...Value.Errors(Dataset, dataset)]
		assert.deepEqual(
			errors.map((e) => `${e.path}: ${e.message}`),
			[],
		)
	})

	void it('contains the published bathing spots', () => {
		assert.ok(dataset.badeplasser.length >= 69)
	})

	void it('places every spot within the greater Oslo area', () => {
		for (const beach of dataset.badeplasser) {
			assert.ok(
				beach.location.lat >= 59.5 &&
					beach.location.lat <= 60.2 &&
					beach.location.lng >= 10.3 &&
					beach.location.lng <= 11.1,
				`${beach.name} has out-of-range coordinates`,
			)
		}
	})

	void it('has unique ids', () => {
		const ids = dataset.badeplasser.map((b) => b.id)
		assert.equal(new Set(ids).size, ids.length)
	})
})
