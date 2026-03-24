const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.post('/generate-project', projectController.generateProject);

module.exports = router;
