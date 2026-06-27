import { Provider as BadeplasserProvider } from '#context/Badeplasser.tsx'
import { Provider as MapSettingsProvider } from '#context/MapSettings.tsx'
import { About } from '#page/About.tsx'
import { Map } from '#page/Map.tsx'
import { Route, Router } from 'preact-router'

export const App = () => (
	<BadeplasserProvider>
		<MapSettingsProvider>
			<Routing />
		</MapSettingsProvider>
	</BadeplasserProvider>
)

export const Routing = () => (
	<Router>
		<Route path="/" component={Map} />
		<Route path="/map" component={Map} />
		<Route path="/about" component={About} />
	</Router>
)
