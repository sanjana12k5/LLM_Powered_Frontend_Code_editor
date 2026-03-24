const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/read-files', fileController.readFiles);
router.post('/save-files', fileController.saveFiles);
router.post('/upload-project', fileController.uploadProject);

module.exports = router;
