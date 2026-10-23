const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Role-scoped: dept accounts see for_dept=1, public accounts see for_dept=0.
router.get('/', requireAuth, (req, res) => {
  const forDept = req.user.role === 'dept' ? 1 : 0;
  const rows = db.prepare('SELECT * FROM notifications WHERE for_dept = ? ORDER BY time DESC').all(forDept);
  res.json(rows.map((n) => ({ id: n.id, title: n.title, body: n.body, time: n.time, forDept: !!n.for_dept })));
});

module.exports = router;
