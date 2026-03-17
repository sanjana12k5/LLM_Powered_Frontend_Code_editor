const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/get-ai-fix', aiController.getAIFix);

module.exports = router;
