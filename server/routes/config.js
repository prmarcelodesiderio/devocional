const { Router } = require('express');
const { envConfig } = require('../config/env');

const router = Router();

router.get('/feature-flags', (_req, res) => {
  res.json({
    flags: envConfig.featureFlags,
  });
});

module.exports = router;
