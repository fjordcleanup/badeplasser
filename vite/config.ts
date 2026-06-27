import { preact } from '@preact/preset-vite'
import { defineConfig, type PluginOption } from 'vite'
import { replaceInIndex } from './replaceInIndex.ts'
import { homepage, version } from './siteInfo.ts'
import { spaFallback } from './spaFallback.ts'

export const createConfig = ({
	plugins,
	leafletVersion,
}: {
	leafletVersion: string
	plugins?: PluginOption[]
}): ReturnType<typeof defineConfig> => {
	const define: Record<string, string> = {
		HOMEPAGE: JSON.stringify(homepage),
		VERSION: JSON.stringify(version),
		BUILD_TIME: JSON.stringify(new Date().toISOString()),
		LEAFLET_VERSION: JSON.stringify(leafletVersion),
	}
	for (const [k, v] of Object.entries(define)) {
		console.debug(`[vite define] ${k}:`, v)
	}

	return defineConfig({
		plugins: [
			preact({
				babel: {
					plugins: ['@babel/plugin-syntax-import-assertions'],
				},
			}),
			replaceInIndex({
				version,
			}),
			spaFallback(),
			...(plugins ?? []),
		],
		preview: {
			host: 'localhost',
			port: 8080,
		},
		server: {
			host: 'localhost',
			port: 8080,
		},
		resolve: {
			alias: [
				{ find: '#components/', replacement: '/src/components/' },
				{ find: '#context/', replacement: '/src/context/' },
				{ find: '#page/', replacement: '/src/page/' },
				{ find: '#icons/', replacement: '/src/icons/' },
				{ find: '#api/', replacement: '/src/api/' },
				{ find: '#badeplasser/', replacement: '/src/badeplasser/' },
			],
		},
		build: {
			outDir: './build',
			sourcemap: true,
		},
		// string values will be used as raw expressions, so if defining a string constant, it needs to be explicitly quoted
		define,
	})
}
