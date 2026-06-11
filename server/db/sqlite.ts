import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

let db: DatabaseSync | null = null

function runMigrations(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `)

  const applied = new Set(
    database
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row) => (row as { version: string }).version),
  )

  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()

  const applyMigration = database.prepare(
    'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
  )

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    database.exec('BEGIN')
    try {
      database.exec(sql)
      applyMigration.run(file, new Date().toISOString())
      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  }
}

export function initDatabase(): DatabaseSync {
  if (db) return db

  mkdirSync(dirname(config.sqlite.path), { recursive: true })
  db = new DatabaseSync(config.sqlite.path)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  runMigrations(db)
  return db
}

export function getDatabase(): DatabaseSync {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function closeDatabase(): void {
  if (!db) return
  db.close()
  db = null
}
