import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "db", "app-database.sqlite");

declare global {
  // eslint-disable-next-line no-var
  var __squirrelDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (!globalThis.__squirrelDb) {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = DELETE");
    db.exec(`
      CREATE TABLE IF NOT EXISTS harnesses (
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS guidance_scores (
        harness TEXT NOT NULL,
        source TEXT NOT NULL,
        lines INTEGER NOT NULL,
        score REAL NOT NULL,
        nb_lignes INTEGER,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (harness, source)
      );
    `);
    // Existing databases predate nb_lignes; CREATE TABLE IF NOT EXISTS won't add it.
    const columns = db
      .prepare("PRAGMA table_info(guidance_scores)")
      .all() as { name: string }[];
    if (!columns.some((c) => c.name === "nb_lignes")) {
      db.exec("ALTER TABLE guidance_scores ADD COLUMN nb_lignes INTEGER");
    }
    globalThis.__squirrelDb = db;
  }
  return globalThis.__squirrelDb;
}

export type Harness = { name: string; description: string };

export const harnesses = {
  list(): Harness[] {
    return getDb()
      .prepare("SELECT name, description FROM harnesses ORDER BY name")
      .all() as Harness[];
  },
  get(name: string): Harness | undefined {
    return getDb()
      .prepare("SELECT name, description FROM harnesses WHERE name = ?")
      .get(name) as Harness | undefined;
  },
  create(name: string, description: string): Harness {
    getDb()
      .prepare("INSERT INTO harnesses (name, description) VALUES (?, ?)")
      .run(name, description);
    return { name, description };
  },
  update(name: string, description: string): Harness | undefined {
    const result = getDb()
      .prepare("UPDATE harnesses SET description = ? WHERE name = ?")
      .run(description, name);
    if (result.changes === 0) return undefined;
    return { name, description };
  },
  remove(name: string): boolean {
    const result = getDb()
      .prepare("DELETE FROM harnesses WHERE name = ?")
      .run(name);
    return result.changes > 0;
  },
};

export type GuidanceScore = {
  harness: string;
  source: string;
  lines: number;
  score: number;
  nb_lignes: number | null;
  updated_at: string;
};

export const guidanceScores = {
  upsert(
    harness: string,
    source: string,
    lines: number,
    score: number,
    nbLignes: number | null,
  ): void {
    getDb()
      .prepare(
        `INSERT INTO guidance_scores (harness, source, lines, score, nb_lignes, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT (harness, source) DO UPDATE SET
           lines = excluded.lines,
           score = excluded.score,
           nb_lignes = excluded.nb_lignes,
           updated_at = excluded.updated_at`,
      )
      .run(harness, source, lines, score, nbLignes);
  },
  listFor(harness: string): GuidanceScore[] {
    return getDb()
      .prepare(
        "SELECT harness, source, lines, score, nb_lignes, updated_at FROM guidance_scores WHERE harness = ? ORDER BY source",
      )
      .all(harness) as GuidanceScore[];
  },
};
