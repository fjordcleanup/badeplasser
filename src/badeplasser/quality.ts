import type { WaterQualityRating } from './schema.ts'

/** Presentation (color + Norwegian word) for each water quality rating. */
export const QUALITY_PRESENTATION: Record<
	WaterQualityRating,
	{ color: string; label: string }
> = {
	excellent: { color: '#0b5fa5', label: 'Utmerket' },
	good: { color: '#3f8a00', label: 'God' },
	fair: { color: '#e0a300', label: 'Tilfredsstillende' },
	poor: { color: '#c9281e', label: 'Dårlig' },
	notMeasured: { color: '#8a8a8a', label: 'Måles ikke' },
	unknown: { color: '#8a8a8a', label: 'Ukjent' },
}

/** The rating to show for a spot, treating «no measurements» as not measured. */
export const ratingOf = (
	waterQuality: { rating: WaterQualityRating } | null,
): WaterQualityRating => waterQuality?.rating ?? 'notMeasured'

/** A water quality reading is considered out of date after about a month. */
export const STALE_AFTER_DAYS = 31

/** Whether the last sample is older than {@link STALE_AFTER_DAYS}. */
export const isStale = (
	waterQuality: { measuredAt: string | null } | null,
	now: number = Date.now(),
): boolean =>
	waterQuality?.measuredAt != null &&
	now - new Date(waterQuality.measuredAt).getTime() >
		STALE_AFTER_DAYS * 24 * 60 * 60 * 1000

/**
 * The rating used for the map marker: gray («notMeasured») when there is no
 * reading or the reading is stale, otherwise the actual rating.
 */
export const markerRating = (
	waterQuality: {
		rating: WaterQualityRating
		measuredAt: string | null
	} | null,
	now?: number,
): WaterQualityRating =>
	waterQuality === null || isStale(waterQuality, now)
		? 'notMeasured'
		: waterQuality.rating

/** Ratings shown in the map legend, in order of decreasing quality. */
export const LEGEND_ORDER: WaterQualityRating[] = [
	'excellent',
	'good',
	'fair',
	'poor',
	'notMeasured',
]
