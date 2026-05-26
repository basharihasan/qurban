const express = require('express');
const router = express.Router();
const { getDashboard, saveDeliveryConfirmation, getCertificate } = require('../controllers/mudhohiController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('mudhohi', 'admin'));

router.get('/dashboard', getDashboard);
router.post('/delivery-confirmation', saveDeliveryConfirmation);
router.get('/certificate/:animalId', getCertificate);

module.exports = router;
