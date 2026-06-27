import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseDetailPage, ratingFromText, summarize } from './oslo.ts'

void describe('ratingFromText', () => {
	void it('maps the leading-word wording', () => {
		assert.equal(ratingFromText('Utmerket: stabilt bra'), 'excellent')
		assert.equal(ratingFromText('God: stort sett bra'), 'good')
		assert.equal(ratingFromText('Tilfredsstillende: …'), 'fair')
	})
	void it('maps the full-sentence wording', () => {
		assert.equal(ratingFromText('Badevannskvaliteten er dårlig'), 'poor')
	})
	void it('detects "not measured"', () => {
		assert.equal(ratingFromText('Vi måler ikke kvalitet her'), 'notMeasured')
	})
})

// A representative slice of a detail page covering every shape the parser meets:
// a measured point with a date, a "not measured" point, a temperature reading,
// and a facilities section with a sub-heading.
const FIXTURE = `
<h3>Badevannskvalitet ved Testvika, ved brygga</h3>
<p>Sist målt: <span data-ods-dat-from="2026-06-20T02:00:00+02:00"></span></p>
<span class="ods-icon io-icon-preset-1"></span>
<span class="ods-sr-only">God: Badevannskvaliteten er stort sett bra.</span>
<h3>Badevannskvalitet ved Testvika, søndre del</h3>
<p>Vi måler ikke kvalitet her</p>
<h3>Målt temperatur</h3>
<p>Sist målt: <span data-ods-dat-from="2026-06-26T02:00:00+02:00"></span></p>
<p class="io-text-preset-2">18°C</p>
<div class="io-bathing-spot__blue-flag"></div>
<h2>Fasiliteter</h2><ul><li>Toaletter</li><li>1 HC-toalett</li></ul>
<h3>Andre fasiliteter</h3><ul><li>Kiosk</li></ul>
<h2>Kontakt</h2>
`

void describe('parseDetailPage', () => {
	const detail = parseDetailPage(FIXTURE)

	void it('parses each measurement point with rating and date', () => {
		assert.equal(detail.measurements.length, 2)
		assert.deepEqual(detail.measurements[0], {
			point: 'Testvika, ved brygga',
			rating: 'good',
			label: 'God',
			description: 'Badevannskvaliteten er stort sett bra.',
			measuredAt: '2026-06-20T02:00:00+02:00',
		})
		assert.equal(detail.measurements[1]?.rating, 'notMeasured')
		assert.equal(detail.measurements[1]?.measuredAt, null)
	})

	void it('does not treat the temperature block as a measurement', () => {
		assert.ok(detail.measurements.every((m) => !m.point.includes('temperatur')))
	})

	void it('parses the temperature', () => {
		assert.deepEqual(detail.temperature, {
			celsius: 18,
			measuredAt: '2026-06-26T02:00:00+02:00',
		})
	})

	void it('parses facilities into sections', () => {
		assert.deepEqual(detail.facilities, [
			{ heading: 'Fasiliteter', items: ['Toaletter', '1 HC-toalett'] },
			{ heading: 'Andre fasiliteter', items: ['Kiosk'] },
		])
	})

	void it('summarizes to the measured point', () => {
		assert.equal(summarize(detail.measurements)?.point, 'Testvika, ved brygga')
	})
})

// Spots with a single point use a bare «Badevannskvalitet» heading (no «ved …»)
// and the point falls back to the spot name from og:title. The four-year
// average block must not be picked up as a measurement.
const SINGLE_POINT = `
<meta property="og:title" content="Nydalsdammen - Badeplasser - Oslo kommune">
<h3>Badevannskvalitet</h3>
<p>Sist målt: <span data-ods-dat-from="2026-06-24T00:00:00+02:00"></span></p>
<span class="ods-sr-only">God: Badevannskvaliteten er stort sett bra.</span>
<h3>Gjennomsnittlig badevannskvalitet siste fire år</h3>
<span class="ods-sr-only">Utmerket: stabilt bra</span>
`

void describe('parseDetailPage (single, unnamed point)', () => {
	const detail = parseDetailPage(SINGLE_POINT)

	void it('parses the bare heading and uses the spot name as the point', () => {
		assert.equal(detail.measurements.length, 1)
		assert.deepEqual(detail.measurements[0], {
			point: 'Nydalsdammen',
			rating: 'good',
			label: 'God',
			description: 'Badevannskvaliteten er stort sett bra.',
			measuredAt: '2026-06-24T00:00:00+02:00',
		})
	})

	void it('ignores the four-year average block', () => {
		assert.ok(detail.measurements.every((m) => m.rating !== 'excellent'))
	})
})
