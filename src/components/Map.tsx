import { useMapSettings } from '#context/MapSettings.tsx'
import cx from 'classnames'
import * as L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'preact/hooks'

import 'leaflet/dist/leaflet.css'
import './Map.css'

const isLandscape = () => window.innerWidth > window.innerHeight

export const Map = ({
	center,
	onClick,
	onReady,
}: {
	onClick?: () => void
	onReady?: (map: L.Map) => void
	center?: { lat: number; lng: number }
}) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const initialized = useRef<boolean>(false)
	const settings = useMapSettings()
	const [, setMap] = useState<L.Map>()
	const defaultZoom = useMemo(() => (isLandscape() ? 12 : 10), [])
	const [zoom, setZoom] = useState<number>(defaultZoom)

	useEffect(() => {
		if (containerRef.current === null) return
		if (initialized.current) return
		initialized.current = true

		const map = L.map(containerRef.current, {
			center: [
				center?.lat ?? settings.center?.lat ?? 59.905900733292235,
				center?.lng ?? settings.center?.lng ?? 10.7496181292028,
			],
			zoom: defaultZoom,
			keyboard: false,
			maxZoom: 18,
		})

		// Base layers: the Norgeskart topographic map and aerial/satellite imagery.
		const kart = L.tileLayer(
			'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
			{
				attribution:
					'&copy; <a href="http://www.kartverket.no/">Kartverket</a>',
			},
		)
		const satellitt = L.tileLayer(
			'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			{
				attribution:
					'&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
				maxZoom: 18,
			},
		)
		kart.addTo(map)
		L.control
			.layers({ Kart: kart, Satellitt: satellitt }, undefined, {
				position: 'topright',
			})
			.addTo(map)

		map.whenReady(() => {
			console.debug(`[Map]`, `loaded`)
			setMap(map)
			onReady?.(map)
		})

		map.on('click', () => {
			onClick?.()
		})

		map.on('zoomend', () => {
			const newZoom = Math.floor(map.getZoom())
			if (newZoom !== zoom) {
				setZoom(newZoom)
			}
		})

		return () => {
			console.debug(`[Map]`, `unmounted`)
			console.debug(`[Map]`, `cleaning up`)
			map.remove()
		}
	}, [containerRef, initialized])

	return (
		<div
			id="map"
			class={cx({
				'zoom-detail': zoom >= 14,
			})}
			ref={containerRef}
		/>
	)
}
