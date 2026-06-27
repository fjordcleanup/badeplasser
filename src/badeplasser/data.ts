import dataset from './badeplasser.json' with { type: 'json' }
import type { Badeplass, Dataset } from './schema.ts'

// The dataset is validated against the schema when it is generated
// (see scripts/generate-badeplasser.ts), so we can trust its shape here.
const data = dataset as unknown as Dataset

/** All bathing spots, the source for the map. */
export const badeplasser: Badeplass[] = data.badeplasser

/** When the dataset (notably the water quality) was last refreshed. */
export const datasetUpdated = new Date(data.updated)

/** Where the data was collected from. */
export const datasetSource = data.source
