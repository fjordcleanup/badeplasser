import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

/**
 * The app uses history-based routing (`/`, `/map`, `/about`), but GitHub Pages
 * is a static host: a direct visit, refresh, or new tab on `/about` asks for a
 * file that does not exist and gets a 404. GitHub Pages serves `404.html` for
 * any unknown path, so by copying the built `index.html` to `404.html` those
 * deep links boot the single-page app, which then renders the right route from
 * `window.location`.
 */
export const spaFallback = (): Plugin => {
	let outDir = 'build'
	let root = process.cwd()
	return {
		name: 'spa-fallback',
		apply: 'build',
		configResolved: (config: ResolvedConfig): void => {
			outDir = config.build.outDir
			root = config.root
		},
		closeBundle: (): void => {
			const index = path.resolve(root, outDir, 'index.html')
			if (!existsSync(index)) return
			copyFileSync(index, path.resolve(root, outDir, '404.html'))
		},
	}
}
