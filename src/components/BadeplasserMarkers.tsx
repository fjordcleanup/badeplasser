import {
	LEGEND_ORDER,
	markerRating,
	QUALITY_PRESENTATION,
} from '#badeplasser/quality.ts'
import type { Temperature, WaterQualityRating } from '#badeplasser/schema.ts'
import { useBadeplasser } from '#context/Badeplasser.tsx'
import * as L from 'leaflet'
import { render } from 'preact'
import { useEffect } from 'preact/hooks'
import { BeachPopup } from './BeachPopup.tsx'

import './Badeplasser.css'

/** Water temperature in whole/half degrees, Norwegian-formatted, e.g. «17,5°». */
const tempFormat = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 })

/**
 * A colored map-pin whose color encodes the water quality, with the latest
 * measured water temperature shown as a chip next to the pin when available.
 */
const qualityIcon = (() => {
	// Keyed by rating and temperature so pins that only differ in temperature do
	// not share a cached icon (and pins without a reading still share one icon).
	const cache = new Map<string, L.DivIcon>()
	return (rating: WaterQualityRating, temperature?: Temperature): L.DivIcon => {
		const celsius = temperature?.celsius
		const key = `${rating}|${celsius ?? ''}`
		const cached = cache.get(key)
		if (cached !== undefined) return cached
		const { color } = QUALITY_PRESENTATION[rating]
		const tempChip =
			celsius !== undefined
				? `<span class="bq-marker__temp">${tempFormat.format(celsius)}°</span>`
				: ''
		const icon = L.divIcon({
			className: 'bq-marker',
			html: `<svg width="28" height="40" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path d="M12 0C5.37 0 0 5.37 0 12c0 8.4 10.5 22.5 11.1 23.3a1.2 1.2 0 0 0 1.8 0C13.5 34.5 24 20.4 24 12 24 5.37 18.63 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
				<circle cx="12" cy="12.5" r="4.5" fill="#fff"/>
			</svg>${tempChip}`,
			iconSize: [28, 40],
			iconAnchor: [14, 40],
			popupAnchor: [0, -38],
		})
		cache.set(key, icon)
		return icon
	}
})()

const legendControl = (): L.Control => {
	const control = new L.Control({ position: 'bottomright' })
	control.onAdd = () => {
		const div = L.DomUtil.create('div', 'bq-legend')
		div.innerHTML =
			`<strong>Badevannskvalitet</strong>` +
			LEGEND_ORDER.map((rating) => {
				const { color, label } = QUALITY_PRESENTATION[rating]
				return `<span class="bq-legend__item"><span class="bq-legend__dot" style="background:${color}"></span>${label}</span>`
			}).join('')
		return div
	}
	return control
}

/** Renders the bathing spots from the context onto the given Leaflet map. */
export const BadeplasserMarkers = ({ map }: { map: L.Map }) => {
	const { badeplasser } = useBadeplasser()

	useEffect(() => {
		const layer = L.layerGroup().addTo(map)
		// Each popup is a Preact component rendered into a detached container.
		const popupContainers: HTMLElement[] = []

		for (const beach of badeplasser) {
			const container = document.createElement('div')
			render(<BeachPopup beach={beach} />, container)
			popupContainers.push(container)

			// Derive the icon and the tooltip from the same rating so a grayed-out
			// (stale or unmeasured) pin never claims a quality like «God».
			const rating = markerRating(beach.waterQuality)
			L.marker([beach.location.lat, beach.location.lng], {
				icon: qualityIcon(rating, beach.temperature),
				title: `${beach.name} – ${QUALITY_PRESENTATION[rating].label}`,
				alt: beach.name,
			})
				.bindPopup(container, { minWidth: 240, maxWidth: 320 })
				.addTo(layer)
		}

		const legend = legendControl()
		legend.addTo(map)

		// Frame all spots.
		const bounds = L.latLngBounds(
			badeplasser.map(
				(b) => [b.location.lat, b.location.lng] as [number, number],
			),
		)
		if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30] })

		return () => {
			layer.remove()
			legend.remove()
			for (const container of popupContainers) render(null, container)
		}
	}, [map, badeplasser])

	return null
}
