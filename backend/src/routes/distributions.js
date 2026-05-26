const express = require('express');
const router = express.Router();
const {
  getDistributions, getDistribution, updateDistributionStatus, uploadProof,
} = require('../controllers/distributionsController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

const proofMiddleware = (req, res, next) => {
  req.uploadType = 'proof';
  next();
};

const injectIO = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

router.use(authenticate);
router.use(authorize('admin', 'panitia'));

router.get('/', getDistributions);
router.get('/:id', getDistribution);
router.put('/:id/status', injectIO, proofMiddleware, upload.single('proof'), updateDistributionStatus);
router.post('/:id/proof', proofMiddleware, upload.single('proof'), uploadProof);

module.exports = router;
