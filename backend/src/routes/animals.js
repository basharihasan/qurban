const express = require('express');
const router = express.Router();
const {
  getAnimals, getAnimal, createAnimal, updateAnimal, deleteAnimal, updateStatus, getQRCode, assignMudhohi,
} = require('../controllers/animalsController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

const animalPhotoMiddleware = (req, res, next) => {
  req.uploadType = 'animal';
  next();
};

// Inject socket.io instance
const injectIO = (req, res, next) => {
  req.io = req.app.get('io');
  next();
};

router.use(authenticate);

router.get('/', getAnimals);
router.get('/:id', getAnimal);
router.get('/:id/qr', getQRCode);

// Admin only
router.post('/', authorize('admin'), animalPhotoMiddleware, upload.single('photo'), createAnimal);
router.put('/:id', authorize('admin'), animalPhotoMiddleware, upload.single('photo'), updateAnimal);
router.delete('/:id', authorize('admin'), deleteAnimal);
router.post('/assign-mudhohi', authorize('admin'), assignMudhohi);

// Panitia + admin
router.put('/:id/status', authorize('admin', 'panitia'), injectIO, updateStatus);

module.exports = router;
