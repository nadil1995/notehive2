const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

router.get('/', (req, res) => {
  logger.info('Health check performed');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
