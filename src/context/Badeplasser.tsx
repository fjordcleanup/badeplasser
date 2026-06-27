import { badeplasser, datasetUpdated } from '#badeplasser/data.ts'
import type { Badeplass } from '#badeplasser/schema.ts'
import { createContext, type ComponentChildren } from 'preact'
import { useContext } from 'preact/hooks'

export const BadeplasserContext = createContext<{
	/** All bathing spots from the static dataset. */
	badeplasser: Badeplass[]
	/** When the water quality was last refreshed. */
	updated: Date
}>({
	badeplasser,
	updated: datasetUpdated,
})

export const Provider = ({ children }: { children: ComponentChildren }) => (
	<BadeplasserContext.Provider value={{ badeplasser, updated: datasetUpdated }}>
		{children}
	</BadeplasserContext.Provider>
)

export const Consumer = BadeplasserContext.Consumer

export const useBadeplasser = () => useContext(BadeplasserContext)
