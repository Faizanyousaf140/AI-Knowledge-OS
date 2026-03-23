const express = require('express');
const router = express.Router();
const oauthController = require('./oauth.controller');

router.get('/:provider', oauthController.startOAuth);
router.get('/:provider/callback', oauthController.handleCallback);

module.exports = router;
