const express = require('express');
const db = require('../db');
const { SPECIES } = require('../species');
const { requireAuth, requireDept } = require('../middleware/auth');

const router = express.Router();

function rowToReport(r) {
  return {
    id: r.id,
    species: r.species,
    animalName: r.animal_name,
    confidence: r.confidence,
    aiStatus: r.ai_status,
    photo: r.photo,
    mediaType: r.media_type,
    note: r.note,
    lat: r.lat,
    lng: r.lng,
    hasLoc: !!r.has_loc,
    time: r.time,
    deptStatus: r.dept_status,
    source: r.source,
  };
}

// GET /api/reports — full list, newest first.
// A "public" caller gets coordinates rounded to ~1.1km precision (2 decimal
// places) instead of the exact GPS fix — dept accounts see exact coordinates.
// This is enforced server-side, not just hidden in the UI, since the whole
// point of the role split is that the raw endpoint shouldn't leak precise
// citizen-submitted locations to any logged-in public user.
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY time DESC').all();
  const reports = rows.map(rowToReport).map((r) => {
    if (req.user.role === 'dept') return r;
    return { ...r, lat: Math.round(r.lat * 100) / 100, lng: Math.round(r.lng * 100) / 100 };
  });
  res.json(reports);
});

// POST /api/reports — create a report. Body mirrors the frontend's report shape.
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {};
  const required = ['species', 'animalName', 'confidence', 'aiStatus', 'lat', 'lng', 'time'];
  for (const f of required) {
    if (b[f] === undefined || b[f] === null) return res.status(400).json({ error: `${f} is required` });
  }

  const info = db.prepare(`
    INSERT INTO reports (species, animal_name, confidence, ai_status, photo, media_type, note, lat, lng, has_loc, time, dept_status, source, reporter_id)
    VALUES (@species, @animalName, @confidence, @aiStatus, @photo, @mediaType, @note, @lat, @lng, @hasLoc, @time, 'new', 'user', @reporterId)
  `).run({
    species: b.species,
    animalName: b.animalName,
    confidence: b.confidence,
    aiStatus: b.aiStatus,
    photo: b.photo || null,
    mediaType: b.mediaType || 'photo',
    note: b.note || null,
    lat: b.lat,
    lng: b.lng,
    hasLoc: b.hasLoc ? 1 : 0,
    time: b.time,
    reporterId: req.user.id,
  });

  const report = rowToReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(info.lastInsertRowid));
  const io = req.app.get('io');
  io.emit('report:new', report);

  const sp = SPECIES[b.species] || SPECIES.unknown;
  let alert = null;
  const notifications = [];
  if (sp.dangerous && b.confidence >= 60) {
    const risk = b.confidence >= 85 ? 'High' : 'Medium';
    const alertInfo = db.prepare(`
      INSERT INTO alerts (report_id, animal, risk, time, status) VALUES (?, ?, ?, ?, 'active')
    `).run(report.id, sp.name, risk, b.time);
    alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertInfo.lastInsertRowid);
    io.emit('alert:new', alert);

    const notifRows = [
      { title: `New ${sp.name} Report`, body: `A ${sp.name.toLowerCase()} has been reported nearby. Review the image and location.`, forDept: 1 },
      { title: 'Wildlife Alert', body: `A ${sp.name.toLowerCase()} has been reported near your area. Please avoid the marked danger zone.`, forDept: 0 },
    ];
    const insertNotif = db.prepare('INSERT INTO notifications (title, body, time, for_dept) VALUES (?, ?, ?, ?)');
    notifRows.forEach((n) => {
      const nInfo = insertNotif.run(n.title, n.body, b.time, n.forDept);
      const saved = db.prepare('SELECT * FROM notifications WHERE id = ?').get(nInfo.lastInsertRowid);
      notifications.push(saved);
      io.emit('notification:new', saved);
    });
  }

  res.status(201).json({ report, alert, notifications });
});

// PATCH /api/reports/:id/status — Forest Dept only. { status }
router.patch('/:id/status', requireAuth, requireDept, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'verified', 'responding', 'resolved', 'false_report'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });

  const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Report not found' });

  db.prepare('UPDATE reports SET dept_status = ? WHERE id = ?').run(status, req.params.id);

  if (status === 'resolved' || status === 'false_report') {
    db.prepare(`UPDATE alerts SET status = 'resolved' WHERE report_id = ?`).run(req.params.id);
  }

  const report = rowToReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id));
  req.app.get('io').emit('report:updated', report);
  res.json(report);
});

module.exports = router;
