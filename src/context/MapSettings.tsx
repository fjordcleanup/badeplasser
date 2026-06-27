import type { LatLng } from 'leaflet'
import { createContext, type ComponentChildren } from 'preact'
import { useContext, useState } from 'preact/hooks'

export const MapSettingsContext = createContext<{
	setCenter: (location: LatLng) => void
	center?: LatLng
}>({
	setCenter: () => {},
})

export const Provider = ({ children }: { children: ComponentChildren }) => {
	const [location, setLocation] = useState<LatLng>()

	return (
		<MapSettingsContext.Provider
			value={{
				setCenter: setLocation,
				center: location,
			}}
		>
			{children}
		</MapSettingsContext.Provider>
	)
}

export const Consumer = MapSettingsContext.Consumer

export const useMapSettings = () => useContext(MapSettingsContext)
