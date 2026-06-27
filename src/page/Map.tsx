import { BadeplasserMarkers } from '#components/BadeplasserMarkers.tsx'
import { Map as MapComponent } from '#components/Map.tsx'
import { Navbar } from '#components/Navbar.tsx'
import type * as L from 'leaflet'
import { useState } from 'preact/hooks'

export const Map = () => {
	const [map, setMap] = useState<L.Map>()

	return (
		<>
			<MapComponent onReady={setMap} />
			{map !== undefined && <BadeplasserMarkers map={map} />}
			<Navbar />
		</>
	)
}
