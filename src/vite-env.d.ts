/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public agent API origin, e.g. https://agent-diagram-studio.elevatics.site */
  readonly VITE_DIAGRAM_AGENT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
