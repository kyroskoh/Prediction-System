const express = require('express');
const router = express.Router();

// Placeholder prediction routes - actual functionality is in legacy routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'Modern prediction API not implemented yet',
    note: 'Use legacy endpoints at /prediction/:channel/* for full functionality'
  });
});

module.exports = router;