const express = require('express');
const router = express.Router();

// Placeholder channel routes - actual functionality is in legacy routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'Modern channel API not implemented yet',
    note: 'Channels are auto-created through legacy endpoints at /prediction/:channel/*'
  });
});

module.exports = router;