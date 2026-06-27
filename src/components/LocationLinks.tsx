import { useMemo } from 'preact/hooks'
import proj4 from 'proj4'

const toEUREF89 = (gps: { lat: number; lng: number }) => {
	// Define the projection from WGS84 (GPS) to EUREF89 UTM for the calculated zone
	const wgs84 = '+proj=longlat +datum=WGS84 +no_defs'
	const utm = `+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs`

	// Transform the coordinates
	const [easting, northing] = (proj4 as any)(wgs84, utm, [gps.lng, gps.lat])

	return {
		easting,
		northing,
	}
}

export const LocationLinks = ({
	location,
}: {
	location: { lat: number; lng: number }
}) => {
	const utm = useMemo(() => {
		if (location === undefined) return null
		const utm = toEUREF89(location)
		return {
			easting: utm.easting,
			northing: utm.northing,
		}
	}, [location])

	return (
		<>
			<a
				href={`https://kart.finn.no/?lng=${location.lng}&lat=${location.lat}&zoom=19&mapType=norortho&markers=${location.lng},${location.lat},r,Trash`}
				target="_blank"
				class="me-2"
			>
				kart.finn.no
			</a>
			{utm !== null && (
				<a
					href={`https://www.norgeskart.no/#!?project=norgeskart&layers=1001&zoom=17&lat=${utm.northing}&lon=${utm.easting}&markerLat=${utm.northing}&markerLon=${utm.easting}`}
					target="_blank"
					class="me-2"
				>
					Norgeskart
				</a>
			)}
			<a
				href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
				target="_blank"
			>
				Google Maps
			</a>
		</>
	)
}
