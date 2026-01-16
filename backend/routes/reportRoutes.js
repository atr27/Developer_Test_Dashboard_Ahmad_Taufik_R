const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/options', reportController.getFilterOptions);
router.get('/data', reportController.getReportData);

module.exports = router;