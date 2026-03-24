const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

router.post('/run-analysis', analysisController.runAnalysis);
router.post('/get-issues', analysisController.getIssues);

module.exports = router;
