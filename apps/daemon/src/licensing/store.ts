// SQLite persistence for activated plugin licenses.

import type Database from 'better-sqlite3';

type SqliteDb = Database.Database;

export interface PluginLicenseRow {
  plugin_id: string;
  token: string;
  plan: string;
  domain: string;
  license_id: string;
  expires_at: number;
  activated_at: number;
}

export function migrateLicensing(db: SqliteDb): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plugin_licenses (
      plugin_id TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      plan TEXT NOT NULL,
      domain TEXT NOT NULL,
      license_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      activated_at INTEGER NOT NULL
    );
  `);
}

export function upsertPluginLicense(db: SqliteDb, row: PluginLicenseRow): void {
  db.prepare(
    `INSERT INTO plugin_licenses (plugin_id, token, plan, domain, license_id, expires_at, activated_at)
     VALUES (@plugin_id, @token, @plan, @domain, @license_id, @expires_at, @activated_at)
     ON CONFLICT(plugin_id) DO UPDATE SET
       token=excluded.token, plan=excluded.plan, domain=excluded.domain,
       license_id=excluded.license_id, expires_at=excluded.expires_at,
       activated_at=excluded.activated_at`,
  ).run(row);
}

export function getPluginLicense(db: SqliteDb, pluginId: string): PluginLicenseRow | undefined {
  return db.prepare(`SELECT * FROM plugin_licenses WHERE plugin_id = ?`).get(pluginId) as
    | PluginLicenseRow
    | undefined;
}

export function deletePluginLicense(db: SqliteDb, pluginId: string): void {
  db.prepare(`DELETE FROM plugin_licenses WHERE plugin_id = ?`).run(pluginId);
}

export function listPluginLicenses(db: SqliteDb): PluginLicenseRow[] {
  return db.prepare(`SELECT * FROM plugin_licenses`).all() as PluginLicenseRow[];
}

/** The installed plugin's `source` string (used to detect premium plugins). */
export function getInstalledPluginSource(db: SqliteDb, pluginId: string): string | undefined {
  const row = db.prepare(`SELECT source FROM installed_plugins WHERE id = ?`).get(pluginId) as
    | { source?: string }
    | undefined;
  return row?.source;
}

/**
 * A plugin is premium when its source is inside the premium ecosystem — e.g.
 * `premium-ecosystem/premium_plugins/...` or `github:…/premium-ecosystem/…`.
 * Matching the exact path segments avoids false positives like the bundled
 * official design system at `…/design-systems/premium`. Premium plugins
 * require an activation license to apply.
 */
export function isPremiumSource(source: string | null | undefined): boolean {
  return typeof source === 'string' && /(^|\/)(premium-ecosystem|premium_plugins)(\/|$)/i.test(source);
}
