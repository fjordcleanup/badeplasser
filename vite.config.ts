import pJson from './package.json' with { type: 'json' }
import { createConfig } from './vite/config.ts'

export default createConfig({
	leafletVersion: pJson.dependencies.leaflet,
})
