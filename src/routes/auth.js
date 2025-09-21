const express = require('express');
const router = express.Router();

// Placeholder auth routes
router.post('/register', (req, res) => {
  res.status(501).json({ error: 'Authentication not implemented in legacy compatibility mode' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ error: 'Authentication not implemented in legacy compatibility mode' });
});

router.post('/refresh', (req, res) => {
  res.status(501).json({ error: 'Authentication not implemented in legacy compatibility mode' });
});

router.post('/logout', (req, res) => {
  res.status(501).json({ error: 'Authentication not implemented in legacy compatibility mode' });
});

module.exports = router;