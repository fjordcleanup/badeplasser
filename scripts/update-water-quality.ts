/**
 * Refresh the water quality of every bathing spot in the static dataset.
 *
 *   node --experimental-transform-types scripts/update-water-quality.ts
 *
 * Iterates the bathing spots already in src/badeplasser/badeplasser.json,
 * re-fetches each Oslo kommune detail page, parses the latest
 * «Badevannskvalitet» (and temperature), and writes the updated values back.
 * Everything else (name, location, facilities) is preserved, so this is safe
 * to run on a schedule during the bathing season.
 *
 * Use generate-badeplasser.ts instead when the set of spots itself changes.
 */
import { Value } from '@sinclair/typebox/value'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
	type Dataset,
	Dataset as DatasetSchema,
} from '../src/badeplasser/schema.ts'
import { fetchDetail, parseDetailPage, sleep, summarize } from './lib/oslo.ts'

const FILE = fileURLToPath(
	new URL('../src/badeplasser/badeplasser.json', import.meta.url),
)

const CONCURRENCY = 4

const mapPool = async <T>(
	items: T[],
	worker: (item: T, index: number) => Promise<void>,
	concurrency: number,
): Promise<void> => {
	let next = 0
	const run = async (): Promise<void> => {
		while (next < items.length) {
			const i = next++
			await worker(items[i]!, i)
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, run),
	)
}

const main = async (): Promise<void> => {
	const dataset = JSON.parse(readFileSync(FILE, 'utf-8')) as Dataset
	console.log(
		`Updating water quality for ${dataset.badeplasser.length} bathing spots …`,
	)

	let updated = 0
	let failed = 0

	await mapPool(
		dataset.badeplasser,
		async (beach, i) => {
			try {
				const detail = parseDetailPage(await fetchDetail(beach.url))
				beach.waterQuality = summarize(detail.measurements)
				if (detail.temperature !== undefined)
					beach.temperature = detail.temperature
				else delete beach.temperature
				updated++
				console.log(
					`  [${i + 1}/${dataset.badeplasser.length}] ${beach.name} — ` +
						`${beach.waterQuality?.label ?? 'måles ikke'}`,
				)
			} catch (err) {
				failed++
				console.warn(
					`  ! ${beach.name}: ${(err as Error).message} (kept old value)`,
				)
			}
			await sleep(100)
		},
		CONCURRENCY,
	)

	// Don't touch the dataset when nothing could be refreshed: bumping `updated`
	// (and rewriting the file) on an all-failed run would open a PR / cut a patch
	// release that only changes the timestamp, falsely implying a fresh update.
	if (updated === 0) {
		console.warn(
			`\nNo spots were updated (${failed} failed); leaving ${FILE} unchanged.`,
		)
		// Signal failure so a scheduled run surfaces the problem instead of
		// looking like a successful no-op refresh.
		process.exitCode = 1
		return
	}

	dataset.updated = new Date().toISOString()

	if (!Value.Check(DatasetSchema, dataset)) {
		for (const error of Value.Errors(DatasetSchema, dataset))
			console.error('Schema error:', error.path, error.message)
		throw new Error('Updated dataset does not match the schema.')
	}

	writeFileSync(FILE, JSON.stringify(dataset, null, '\t') + '\n')
	console.log(
		`\nUpdated ${updated} spot(s)${failed > 0 ? `, ${failed} failed` : ''}.`,
	)
}

await main()
