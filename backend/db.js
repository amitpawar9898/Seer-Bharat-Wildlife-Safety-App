/**
 * db.js — SQLite data layer for Seer Bharat.
 *
 * We use better-sqlite3 (synchronous, no callback/promise boilerplate) since
 * this app's write volume is low (field reports, not high-frequency writes)
 * and synchronous calls keep the route handlers simple and easy to reason
 * about. If this ever needs multi-server horizontal scaling, swap this file
 * for a Postgres client — every other file only talks to the functions
 * exported here, so the rest of the app doesn't need to change.
 */
const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(process.env.DB_PATH || path.join(__dirname, 'seer_bharat.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('public','dept')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species TEXT NOT NULL,
  animal_name TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  ai_status TEXT NOT NULL,
  photo TEXT,
  media_type TEXT,
  note TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  has_loc INTEGER NOT NULL DEFAULT 0,
  time TEXT NOT NULL,
  dept_status TEXT NOT NULL DEFAULT 'new',
  source TEXT NOT NULL DEFAULT 'user',
  reporter_id INTEGER,
  FOREIGN KEY(reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  animal TEXT NOT NULL,
  risk TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  FOREIGN KEY(report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  time TEXT NOT NULL,
  for_dept INTEGER NOT NULL
);
`);

module.exports = db;
