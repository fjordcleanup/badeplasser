/**
 * Build the static badeplasser dataset from scratch.
 *
 *   node --experimental-transform-types scripts/generate-badeplasser.ts
 *
 * Lists every bathing spot from Algolia, scrapes its detail page for
 * facilities / water quality / temperature, and geocodes its location. The
 * result is written to src/badeplasser/badeplasser.json, which is the static
 * source the map reads.
 *
 * Run this when the set of bathing spots or their facilities change. To only
 * refresh the water quality, use update-water-quality.ts instead.
 */
import { Value } from '@sinclair/typebox/value'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
	type Badeplass,
	type Dataset,
	Dataset as DatasetSchema,
} from '../src/badeplasser/schema.ts'
import {
	BADEPLASSER_PAGE,
	fetchDetail,
	geocode,
	listBeaches,
	parseDetailPage,
	sleep,
	summarize,
} from './lib/oslo.ts'

const OUTPUT = fileURLToPath(
	new URL('../src/badeplasser/badeplasser.json', import.meta.url),
)

/**
 * Hand-curated coordinates for spots that cannot be geocoded reliably (the
 * place name is ambiguous or missing from the open registries). These take
 * precedence over automatic geocoding.
 */
const COORDINATE_OVERRIDES: Record<string, { lat: number; lng: number }> = {
	// Just outside Oslo kommune, so not found by the Oslo-restricted geocoder.
	grinidammen: { lat: 59.95052, lng: 10.62863 }, // dam by Grini, Bærum
	haoya: { lat: 59.68329, lng: 10.58798 }, // island in the Oslofjord, Frogn
}

const CONCURRENCY = 4

/** Run `worker` over `items` with limited concurrency, preserving order. */
const mapPool = async <T, R>(
	items: T[],
	worker: (item: T, index: number) => Promise<R>,
	concurrency: number,
): Promise<R[]> => {
	const results = new Array<R>(items.length)
	let next = 0
	const run = async (): Promise<void> => {
		while (next < items.length) {
			const i = next++
			results[i] = await worker(items[i]!, i)
		}
	}
	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, run),
	)
	return results
}

const main = async (): Promise<void> => {
	console.log('Listing bathing spots from Algolia …')
	const listings = await listBeaches()
	console.log(`Found ${listings.length} bathing spots.`)

	const missingCoordinates: string[] = []
	const failed: string[] = []

	// A single failed fetch/parse must only drop that one spot — not abort the
	// whole run and leave the dataset unwritten. Failures are collected and
	// reported below (mirroring update-water-quality.ts).
	const badeplasser = (
		await mapPool(
			listings,
			async (listing, i): Promise<Badeplass | null> => {
				try {
					const html = await fetchDetail(listing.url)
					const detail = parseDetailPage(html)

					const override = COORDINATE_OVERRIDES[listing.id]
					const location = override ?? (await geocode(listing.name))
					if (location === null) missingCoordinates.push(listing.name)

					console.log(
						`  [${i + 1}/${listings.length}] ${listing.name} — ` +
							`${detail.measurements.length} measurement(s), ` +
							`${location === null ? 'NO COORDINATES' : 'located'}`,
					)

					return {
						id: listing.id,
						name: listing.name,
						url: listing.url,
						location: location ?? { lat: 0, lng: 0 },
						facilities: detail.facilities,
						waterQuality: summarize(detail.measurements),
						...(detail.temperature !== undefined
							? { temperature: detail.temperature }
							: {}),
					}
				} catch (err) {
					failed.push(listing.name)
					console.warn(
						`  ! ${listing.name}: ${(err as Error).message} (skipped)`,
					)
					return null
				} finally {
					await sleep(100)
				}
			},
			CONCURRENCY,
		)
	).filter((beach): beach is Badeplass => beach !== null)

	// Refuse to overwrite the dataset with nothing: an all-failed run would
	// otherwise wipe the map.
	if (badeplasser.length === 0)
		throw new Error(
			`All ${listings.length} bathing spot(s) failed to fetch; ` +
				`leaving ${OUTPUT} unchanged.`,
		)

	const dataset: Dataset = {
		source: BADEPLASSER_PAGE,
		updated: new Date().toISOString(),
		badeplasser,
	}

	if (!Value.Check(DatasetSchema, dataset)) {
		for (const error of Value.Errors(DatasetSchema, dataset))
			console.error('Schema error:', error.path, error.message)
		throw new Error('Generated dataset does not match the schema.')
	}

	writeFileSync(OUTPUT, JSON.stringify(dataset, null, '\t') + '\n')
	console.log(
		`\nWrote ${badeplasser.length} bathing spots to ${OUTPUT}` +
			`${failed.length > 0 ? ` (${failed.length} skipped)` : ''}`,
	)
	if (failed.length > 0) {
		console.warn(
			`\n⚠ ${failed.length} spot(s) failed to fetch and were skipped:\n  - ${failed.join('\n  - ')}`,
		)
	}
	if (missingCoordinates.length > 0) {
		console.warn(
			`\n⚠ ${missingCoordinates.length} spot(s) need manual coordinates ` +
				`(set in COORDINATE_OVERRIDES):\n  - ${missingCoordinates.join('\n  - ')}`,
		)
	}
}

await main()
