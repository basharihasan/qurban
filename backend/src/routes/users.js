const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, createUser, updateUser, deleteUser, resetPassword, importUsers,
} = require('../controllers/usersController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../config/multer');

// Set upload type for import
const importMiddleware = (req, res, next) => {
  req.uploadType = 'import';
  next();
};

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPassword);
router.post('/import/excel', importMiddleware, upload.single('file'), importUsers);

module.exports = router;
