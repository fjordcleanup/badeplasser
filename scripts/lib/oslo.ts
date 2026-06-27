/**
 * Collect bathing spot (badeplass) data from oslo.kommune.no.
 *
 * There is no public JSON API, so this module reverse-engineers the two data
 * sources the website itself uses:
 *
 *  1. The list of all bathing spots comes from the public Algolia search index
 *     (the same one the «io-filter» component on the page queries).
 *  2. Water quality, facilities and temperature are server-rendered into each
 *     spot's detail page HTML, which we parse here.
 *
 * Coordinates are not available from either source, so {@link geocode} resolves
 * them from Kartverket's open place-name API (Geonorge), with an OpenStreetMap
 * (Nominatim) fallback.
 */
import type {
	FacilitySection,
	Location,
	Measurement,
	Temperature,
	WaterQualityRating,
} from '../../src/badeplasser/schema.ts'

const USER_AGENT =
	'fjordcleanup-badeplasser (+https://github.com/fjordcleanup/badeplasser)'

/** Public Algolia credentials, taken from the «io-filter» component on the page. */
const ALGOLIA = {
	appId: 'NJ4QX1MFJ2',
	apiKey: '4ce897d2ad7bca6a9fbcac2888b35801',
	index: 'prod_oslo_kommune_no',
	/** Tag id for the «Badested» source – selects bathing spots only. */
	badestedTag: 500,
} as const

export const BADEPLASSER_PAGE =
	'https://www.oslo.kommune.no/natur-kultur-og-fritid/tur-og-friluftsliv/badeplasser/'

export type BeachListing = {
	id: string
	name: string
	url: string
}

/** Sleep, to stay polite to the upstream services. */
export const sleep = async (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms))

const decodeEntities = (s: string): string =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;|&apos;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&#x([0-9a-fA-F]+);/g, (_: string, h: string) =>
			String.fromCodePoint(parseInt(h, 16)),
		)
		.replace(/&#(\d+);/g, (_: string, d: string) =>
			String.fromCodePoint(parseInt(d, 10)),
		)

const stripTags = (html: string): string =>
	decodeEntities(html.replace(/<[^>]+>/g, ' '))
		.replace(/\s+/g, ' ')
		.trim()

const slugFromUrl = (url: string): string =>
	new URL(url).pathname.split('/').filter(Boolean).pop() ?? url

/**
 * List every bathing spot published by Oslo kommune (currently 69) using the
 * public Algolia index.
 */
export const listBeaches = async (): Promise<BeachListing[]> => {
	const res = await fetch(
		`https://${ALGOLIA.appId}-dsn.algolia.net/1/indexes/${ALGOLIA.index}/query`,
		{
			method: 'POST',
			headers: {
				'X-Algolia-API-Key': ALGOLIA.apiKey,
				'X-Algolia-Application-Id': ALGOLIA.appId,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: '',
				facetFilters: [[`tags:${ALGOLIA.badestedTag}`]],
				hitsPerPage: 1000,
				attributesToRetrieve: ['name', 'meta'],
			}),
		},
	)
	if (!res.ok) throw new Error(`Algolia query failed: ${res.status}`)
	const body = (await res.json()) as {
		hits: { name: string; meta: { url: string; type: string } }[]
	}
	return body.hits
		.filter(
			(h) =>
				h.meta?.type === 'entry_article_location' &&
				h.meta.url.includes('/badeplasser/'),
		)
		.map((h) => ({
			id: slugFromUrl(h.meta.url),
			name: decodeEntities(h.name).trim(),
			url: h.meta.url,
		}))
		.sort((a, b) => a.name.localeCompare(b.name, 'nb'))
}

/**
 * Map the Norwegian wording used on the page to a stable rating.
 *
 * The wording comes in two shapes: a leading word («God: …», «Utmerket: …»)
 * and a full sentence («Badevannskvaliteten er dårlig»), so we match keywords
 * anywhere in the text, checking the most specific ones first.
 */
export const ratingFromText = (text: string): WaterQualityRating => {
	const t = text.toLowerCase()
	if (t.includes('måler ikke')) return 'notMeasured'
	if (t.includes('utmerket')) return 'excellent'
	if (t.includes('dårlig') || t.includes('dårleg')) return 'poor'
	if (t.includes('tilfredsstillende') || t.includes('akseptabel')) return 'fair'
	if (t.includes('god') || t.includes('stort sett bra')) return 'good'
	return 'unknown'
}

/** The canonical Norwegian word for a rating, used when the page has no label. */
const LABEL_FOR_RATING: Record<WaterQualityRating, string> = {
	excellent: 'Utmerket',
	good: 'God',
	fair: 'Tilfredsstillende',
	poor: 'Dårlig',
	notMeasured: 'Vi måler ikke kvalitet her',
	unknown: 'Ukjent',
}

export type ParsedDetail = {
	facilities: FacilitySection[]
	measurements: Measurement[]
	temperature?: Temperature
}

/** Parse a bathing spot detail page (server-rendered HTML). */
export const parseDetailPage = (html: string): ParsedDetail => {
	return {
		facilities: parseFacilities(html),
		measurements: parseMeasurements(html),
		temperature: parseTemperature(html),
	}
}

/**
 * Extract the «Fasiliteter» section: the items directly under the heading plus
 * any sub-sections (e.g. «Andre fasiliteter»).
 */
const parseFacilities = (html: string): FacilitySection[] => {
	const start = html.search(/<h2[^>]*>\s*Fasiliteter\s*<\/h2>/i)
	if (start === -1) return []
	// The facilities block runs until the next <h2> heading.
	const after = html
		.slice(start)
		.replace(/<h2[^>]*>\s*Fasiliteter\s*<\/h2>/i, '')
	const end = after.search(/<h2[\s>]/i)
	const region = end === -1 ? after : after.slice(0, end)

	const sections: FacilitySection[] = []
	let heading = 'Fasiliteter'
	const token = /<h3[^>]*>([\s\S]*?)<\/h3>|<ul[^>]*>([\s\S]*?)<\/ul>/gi
	let m: RegExpExecArray | null
	while ((m = token.exec(region)) !== null) {
		if (m[1] !== undefined) {
			heading = stripTags(m[1])
			continue
		}
		const items = [...m[2]!.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
			.map((li) => stripTags(li[1]!))
			.filter((t) => t.length > 0)
		if (items.length > 0) sections.push({ heading, items })
	}
	return sections
}

/** The bathing spot's own name, from the page title. */
const beachName = (html: string): string | undefined => {
	const title = /<meta\s+property="og:title"\s+content="([^"]*)"/i.exec(
		html,
	)?.[1]
	const name = title?.split(/\s[-–]\s/)[0]?.trim()
	return name !== undefined && name.length > 0
		? decodeEntities(name)
		: undefined
}

/**
 * Parse every water-quality block. The heading is either «Badevannskvalitet ved
 * <point>» (spots with several named points) or just «Badevannskvalitet» (spots
 * with a single point – then the point is the spot itself). Each block shows the
 * date of the last sample and a rating (or «Vi måler ikke kvalitet her»). The
 * «Gjennomsnittlig badevannskvalitet …» (four-year average) block is ignored.
 */
const parseMeasurements = (html: string): Measurement[] => {
	const fallbackPoint = beachName(html) ?? 'Badevannskvalitet'
	const block =
		/<h3[^>]*>\s*Badevannskvalitet(?:\s+ved\s+([^<]+?))?\s*<\/h3>([\s\S]*?)(?=<h3[\s>]|io-bathing-spot__blue-flag|<\/section|$)/gi
	const measurements: Measurement[] = []
	let m: RegExpExecArray | null
	while ((m = block.exec(html)) !== null) {
		const point =
			m[1] !== undefined ? decodeEntities(m[1]).trim() : fallbackPoint
		const body = m[2]!
		if (/Vi måler ikke kvalitet her/i.test(body)) {
			measurements.push({
				point,
				rating: 'notMeasured',
				label: 'Vi måler ikke kvalitet her',
				description: '',
				measuredAt: null,
			})
			continue
		}
		const measuredAt = /data-ods-dat-from="([^"]+)"/.exec(body)?.[1] ?? null
		const sr = /ods-sr-only"[^>]*>([^<]+)</.exec(body)?.[1]
		const text = sr !== undefined ? decodeEntities(sr).trim() : ''
		const rating = ratingFromText(text)
		// «God: explanation …» → label «God», else fall back to the canonical word.
		const sep = text.indexOf(':')
		const label =
			sep === -1 ? LABEL_FOR_RATING[rating] : text.slice(0, sep).trim()
		const description = sep === -1 ? text : text.slice(sep + 1).trim()
		measurements.push({ point, rating, label, description, measuredAt })
	}
	return measurements
}

const parseTemperature = (html: string): Temperature | undefined => {
	const block =
		/<h3[^>]*>\s*Målt temperatur\s*<\/h3>([\s\S]*?)(?=<h3[\s>]|io-bathing-spot__blue-flag|<\/section|$)/i.exec(
			html,
		)?.[1]
	if (block === undefined) return undefined
	const value = /(-?\d+(?:[.,]\d+)?)\s*°?\s*C/.exec(block)?.[1]
	if (value === undefined) return undefined
	const measuredAt = /data-ods-dat-from="([^"]+)"/.exec(block)?.[1] ?? null
	return { celsius: parseFloat(value.replace(',', '.')), measuredAt }
}

/**
 * Choose the single measurement that represents the spot on the map: the most
 * recent point that has an actual rating, falling back to any point (e.g. a
 * «not measured» one), or `null` when the spot has no measurements at all.
 */
export const summarize = (measurements: Measurement[]): Measurement | null => {
	const measured = measurements
		.filter(
			(m) =>
				m.measuredAt !== null &&
				['excellent', 'good', 'fair', 'poor'].includes(m.rating),
		)
		.sort((a, b) => (a.measuredAt! < b.measuredAt! ? 1 : -1))
	return measured[0] ?? measurements[0] ?? null
}

/** Fetch a detail page and return its HTML. */
export const fetchDetail = async (url: string): Promise<string> => {
	const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
	return res.text()
}

const OSLO_KOMMUNE_NUMBER = '0301'
/** Place-name object types that are good matches for a bathing spot, best first. */
const GEO_TYPE_PRIORITY = [
	'Badeplass',
	'Tjern',
	'Vann',
	'Innsjø',
	'Dam',
	'Bukt',
	'Strand',
	'Øy i sjø',
	'Holme',
]

type GeonorgeName = {
	skrivemåte: string
	navneobjekttype: string
	kommuner?: { kommunenummer: string; kommunenavn: string }[]
	representasjonspunkt?: { nord: number; øst: number }
}

const geonorge = async (query: string): Promise<Location | null> => {
	const url = new URL('https://ws.geonorge.no/stedsnavn/v1/navn')
	url.searchParams.set('sok', query)
	url.searchParams.set('fuzzy', 'true')
	url.searchParams.set('utkoordsys', '4326')
	url.searchParams.set('treffPerSide', '50')
	url.searchParams.set(
		'filtrer',
		'navn.skrivemåte,navn.navneobjekttype,navn.kommuner,navn.representasjonspunkt',
	)
	const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
	if (!res.ok) return null
	const body = (await res.json()) as { navn?: GeonorgeName[] }
	const inOslo = (body.navn ?? []).filter(
		(n) =>
			n.representasjonspunkt !== undefined &&
			(n.kommuner ?? []).some((k) => k.kommunenummer === OSLO_KOMMUNE_NUMBER),
	)
	if (inOslo.length === 0) return null
	inOslo.sort((a, b) => {
		const rank = (n: GeonorgeName) => {
			const i = GEO_TYPE_PRIORITY.indexOf(n.navneobjekttype)
			return i === -1 ? GEO_TYPE_PRIORITY.length : i
		}
		return rank(a) - rank(b)
	})
	const best = inOslo[0]!.representasjonspunkt!
	return { lat: best.nord, lng: best.øst }
}

const nominatim = async (query: string): Promise<Location | null> => {
	const url = new URL('https://nominatim.openstreetmap.org/search')
	url.searchParams.set('q', `${query}, Oslo, Norway`)
	url.searchParams.set('format', 'jsonv2')
	url.searchParams.set('limit', '1')
	url.searchParams.set('viewbox', '10.45,60.13,10.95,59.80')
	url.searchParams.set('bounded', '1')
	const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
	if (!res.ok) return null
	const body = (await res.json()) as { lat: string; lon: string }[]
	const hit = body[0]
	if (hit === undefined) return null
	return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) }
}

/**
 * Resolve a bathing spot's coordinates by name. Tries Geonorge (authoritative
 * Norwegian place names, restricted to Oslo) for a few query variants, then
 * falls back to OpenStreetMap. Returns `null` when nothing is found – the
 * coordinate then has to be filled in by hand in the JSON.
 */
export const geocode = async (name: string): Promise<Location | null> => {
	const variants = [
		name,
		name.replace(/\(.*?\)/g, '').trim(), // drop parentheticals
		name.split(/,| på | ved | i /)[0]!.trim(), // first significant token
	].filter((v, i, all) => v.length > 0 && all.indexOf(v) === i)

	for (const variant of variants) {
		const hit = await geonorge(variant)
		if (hit !== null) return hit
		await sleep(150)
	}
	for (const variant of variants) {
		const hit = await nominatim(variant)
		if (hit !== null) return hit
		await sleep(1100) // Nominatim asks for <= 1 request/second
	}
	return null
}
