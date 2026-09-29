import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Determine database path
const rawDbPath = process.env.DATABASE_URL
  ? path.resolve(process.cwd(), process.env.DATABASE_URL)
  : path.resolve(process.cwd(), 'data', 'client_finder.sqlite');

// Ensure parent dir exists
const dbDir = path.dirname(rawDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Format file URL for libsql
const fileUrl = `file:${rawDbPath.replace(/\\/g, '/')}`;

export const sqliteClient = createClient({
  url: fileUrl,
});

export const db = drizzle(sqliteClient, { schema });

// Auto-initialize SQLite tables
export async function initDatabase() {
  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT,
      public_phone TEXT,
      public_email TEXT,
      website TEXT,
      normalized_domain TEXT,
      social_url TEXT,
      source_url TEXT,
      source_type TEXT NOT NULL DEFAULT 'CSV',
      status TEXT NOT NULL DEFAULT 'NEW',
      do_not_contact INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS website_audits (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      website_status TEXT NOT NULL,
      https_enabled INTEGER,
      mobile_ready INTEGER,
      title TEXT,
      description TEXT,
      contact_path INTEGER,
      observations TEXT,
      audited_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
  `);

  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      website_score INTEGER NOT NULL DEFAULT 0,
      mobile_score INTEGER NOT NULL DEFAULT 0,
      conversion_score INTEGER NOT NULL DEFAULT 0,
      business_fit_score INTEGER NOT NULL DEFAULT 0,
      reasons TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
  `);

  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
  `);

  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS outreach (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONTACT_OPENED',
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE
    );
  `);

  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      action TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
    );
  `);

  await sqliteClient.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL DEFAULT 'Hemu',
      business_name TEXT NOT NULL DEFAULT 'Hemu Web Studio',
      service_description TEXT NOT NULL DEFAULT 'modern, fast websites for local businesses',
      default_city TEXT NOT NULL DEFAULT 'Chennai',
      default_categories TEXT NOT NULL DEFAULT '["Cricket Academy","Fitness Studio","Restaurant"]',
      default_message_tone TEXT NOT NULL DEFAULT 'friendly',
      min_opportunity_score INTEGER NOT NULL DEFAULT 50,
      updated_at TEXT NOT NULL
    );
  `);

  // Ensure default settings exist
  const existingSettings = await sqliteClient.execute({
    sql: 'SELECT id FROM settings WHERE id = ?',
    args: ['default'],
  });

  if (existingSettings.rows.length === 0) {
    await sqliteClient.execute({
      sql: `
        INSERT INTO settings (id, user_name, business_name, service_description, default_city, default_categories, default_message_tone, min_opportunity_score, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        'default',
        'Hemu',
        'Hemu Web Studio',
        'modern, fast websites for local businesses',
        'Chennai',
        JSON.stringify(['Cricket Academy', 'Fitness Studio', 'Restaurant', 'Sports Academy', 'Dance Studio']),
        'friendly',
        50,
        new Date().toISOString(),
      ],
    });
  }
}
