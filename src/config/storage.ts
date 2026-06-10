export const storageConfig = {
  dbName: 'MermaidStudio',
  autosaveDebounceMs: 1500,
  versioning: {
    enabled: true,
    throttleMs: 60_000,
    maxSnapshotsPerDiagram: 50,
  },
} as const
