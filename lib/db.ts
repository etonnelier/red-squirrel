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
    `);
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
