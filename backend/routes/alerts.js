const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM alerts ORDER BY time DESC').all();
  res.json(rows.map((a) => ({
    id: a.id, reportId: a.report_id, animal: a.animal, risk: a.risk, time: a.time, status: a.status,
  })));
});

module.exports = router;
