const express = require('express');
const router = express.Router();
const { getDashboardStats, getAuditLogs, exportMudhohi } = require('../controllers/reportsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/audit-logs', getAuditLogs);
router.get('/export/mudhohi', exportMudhohi);

module.exports = router;
