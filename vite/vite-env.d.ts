// These constants are string-replaced compile time.

// See https://vitejs.dev/config/shared-options.html#define
declare const VERSION: string
declare const HOMEPAGE: string
declare const BUILD_TIME: string
declare const LEAFLET_VERSION: string

// oxlint-disable-next-line typescript/consistent-type-definitions
interface ImportMeta {
  readonly env: ImportMetaEnv
}
