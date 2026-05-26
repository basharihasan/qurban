const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(`${uploadDir}/proofs`)) {
  fs.mkdirSync(`${uploadDir}/proofs`, { recursive: true });
}
if (!fs.existsSync(`${uploadDir}/imports`)) {
  fs.mkdirSync(`${uploadDir}/imports`, { recursive: true });
}
if (!fs.existsSync(`${uploadDir}/animals`)) {
  fs.mkdirSync(`${uploadDir}/animals`, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = uploadDir;
    if (req.uploadType === 'proof') dest = `${uploadDir}/proofs`;
    else if (req.uploadType === 'import') dest = `${uploadDir}/imports`;
    else if (req.uploadType === 'animal') dest = `${uploadDir}/animals`;
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (req.uploadType === 'import') {
    const allowed = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only Excel and CSV files are allowed for import'), false);
    }
  } else {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only image files are allowed'), false);
    }
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

module.exports = upload;
