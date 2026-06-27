import { FormatRegistry, Type, type Static } from '@sinclair/typebox'

// Register the string formats used below so `Value.Check` can validate them.
// TypeBox treats an unknown format as a failed check, so this must run before
// any validation. The app only uses the derived types, so this is a no-op there.
if (!FormatRegistry.Has('date-time'))
	FormatRegistry.Set('date-time', (value) => !Number.isNaN(Date.parse(value)))
if (!FormatRegistry.Has('uri'))
	FormatRegistry.Set('uri', (value) => {
		try {
			new URL(value)
			return true
		} catch {
			return false
		}
	})

/**
 * Water quality classification.
 *
 * Oslo kommune publishes the result of the last sample taken at a bathing
 * spot using the words below (Norwegian) together with a colored thumbs
 * icon. We normalize them to a stable enum so the map can pick an icon and
 * color independently of the source wording.
 *
 * @see https://www.oslo.kommune.no/natur-kultur-og-fritid/tur-og-friluftsliv/badeplasser/
 */
export const WaterQualityRating = Type.Union(
	[
		Type.Literal('excellent'), // Utmerket
		Type.Literal('good'), // God
		Type.Literal('fair'), // Tilfredsstillende / Akseptabel
		Type.Literal('poor'), // Dårlig
		Type.Literal('notMeasured'), // «Vi måler ikke kvalitet her»
		Type.Literal('unknown'), // could not be parsed
	],
	{
		title: 'WaterQualityRating',
		description: 'Normalized bathing water quality classification.',
	},
)

export type WaterQualityRating = Static<typeof WaterQualityRating>

/** Result of the last water quality sample at a single measurement point. */
export const Measurement = Type.Object(
	{
		/** The measurement point, e.g. «Huk, ved restauranten». */
		point: Type.String({ minLength: 1 }),
		/** Normalized classification used to pick the map icon. */
		rating: WaterQualityRating,
		/** The original Norwegian word as shown by Oslo kommune, e.g. «God». */
		label: Type.String(),
		/** The explanatory text shown next to the rating. */
		description: Type.String(),
		/** ISO 8601 timestamp of the last sample, or `null` when not measured. */
		measuredAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
	},
	{ title: 'Measurement' },
)

export type Measurement = Static<typeof Measurement>

/** The latest measured water temperature, when available. */
export const Temperature = Type.Object(
	{
		/** Temperature in degrees Celsius. */
		celsius: Type.Number(),
		/** ISO 8601 timestamp of the measurement. */
		measuredAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
	},
	{ title: 'Temperature' },
)

export type Temperature = Static<typeof Temperature>

/** A group of facilities under a heading, e.g. «Toaletter». */
export const FacilitySection = Type.Object(
	{
		heading: Type.String(),
		items: Type.Array(Type.String()),
	},
	{ title: 'FacilitySection' },
)

export type FacilitySection = Static<typeof FacilitySection>

/** A geographic location in WGS84 (the coordinate system used by Leaflet). */
export const Location = Type.Object(
	{
		lat: Type.Number({ minimum: -90, maximum: 90 }),
		lng: Type.Number({ minimum: -180, maximum: 180 }),
	},
	{ title: 'Location' },
)

export type Location = Static<typeof Location>

/** A single bathing spot (badeplass). */
export const Badeplass = Type.Object(
	{
		/** Stable identifier, derived from the detail page slug. */
		id: Type.String({ minLength: 1 }),
		/** Display name, e.g. «Huk». */
		name: Type.String({ minLength: 1 }),
		/** Canonical Oslo kommune detail page. */
		url: Type.String({ format: 'uri' }),
		/** Where to place the marker on the map. */
		location: Location,
		/** Facilities (FasiliteterKopier) shown when the marker is opened. */
		facilities: Type.Array(FacilitySection),
		/**
		 * The result of the last water quality check shown as the marker icon.
		 * `null` when the spot has no measured water quality at all.
		 */
		waterQuality: Type.Union([Measurement, Type.Null()]),
		/** Latest water temperature, when published. */
		temperature: Type.Optional(Temperature),
	},
	{ title: 'Badeplass' },
)

export type Badeplass = Static<typeof Badeplass>

/** The static JSON document that is the source for the map. */
export const Dataset = Type.Object(
	{
		/** Where the data was collected from. */
		source: Type.String({ format: 'uri' }),
		/** ISO 8601 timestamp of the last time the dataset was written. */
		updated: Type.String({ format: 'date-time' }),
		badeplasser: Type.Array(Badeplass),
	},
	{ title: 'BadeplasserDataset' },
)

export type Dataset = Static<typeof Dataset>
