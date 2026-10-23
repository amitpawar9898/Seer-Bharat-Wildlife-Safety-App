/**
 * seed.js — seeds a short demo movement trail (3 historical tiger sightings
 * + 1 active alert + 2 notifications) the first time the DB is empty, so a
 * fresh checkout of the app isn't a blank screen. Mirrors the original
 * front-end-only prototype's seedHistory().
 */
const db = require('./db');

function seededJitter(seed, spreadDeg) {
  let hh = 0;
  for (let i = 0; i < seed.length; i++) hh = (hh * 31 + seed.charCodeAt(i)) | 0;
  const a = (Math.abs(hh % 1000) / 1000 - 0.5) * 2;
  const b = (Math.abs((hh >> 4) % 1000) / 1000 - 0.5) * 2;
  return { dLat: a * spreadDeg, dLng: b * spreadDeg };
}

const DEFAULT_CENTER = [18.5204, 73.8567]; // Pune, Maharashtra

function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  if (count > 0) return;

  const now = Date.now();
  const seedPts = [
    { t: now - 45 * 60000, key: 'seed-a' },
    { t: now - 25 * 60000, key: 'seed-b' },
    { t: now - 8 * 60000, key: 'seed-c' },
  ];

  const insertReport = db.prepare(`
    INSERT INTO reports (species, animal_name, confidence, ai_status, photo, media_type, note, lat, lng, has_loc, time, dept_status, source)
    VALUES (@species, @animal_name, @confidence, @ai_status, NULL, 'photo', NULL, @lat, @lng, 0, @time, @dept_status, 'seed')
  `);

  let lastId, lastTime;
  seedPts.forEach((p, i) => {
    const j = seededJitter(p.key, 0.01);
    const info = insertReport.run({
      species: 'tiger',
      animal_name: 'Tiger',
      confidence: 86 + i * 4,
      ai_status: 'verified',
      lat: DEFAULT_CENTER[0] + j.dLat,
      lng: DEFAULT_CENTER[1] + j.dLng,
      time: new Date(p.t).toISOString(),
      dept_status: i === seedPts.length - 1 ? 'verified' : 'resolved',
    });
    lastId = info.lastInsertRowid;
    lastTime = new Date(p.t).toISOString();
  });

  db.prepare(`
    INSERT INTO alerts (report_id, animal, risk, time, status) VALUES (?, 'Tiger', 'High', ?, 'active')
  `).run(lastId, lastTime);

  const insertNotif = db.prepare(`INSERT INTO notifications (title, body, time, for_dept) VALUES (?, ?, ?, ?)`);
  insertNotif.run('New Tiger Report', 'A tiger has been reported nearby. Review the image and location.', lastTime, 1);
  insertNotif.run('Wildlife Alert', 'A tiger has been reported near your area. Please avoid the marked danger zone.', lastTime, 0);

  console.log('Seeded demo data (3 reports, 1 alert, 2 notifications).');
}

module.exports = { seedIfEmpty };
