const multer = require('multer');
const { AppError } = require('../utils/errors');

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/webp',
  'application/pdf',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type '${file.mimetype}' not allowed. Use JPEG, PNG, TIFF, or PDF.`, 400, 'INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE, files: 50 },
});

const uploadSingle = upload.single('document');
const uploadBatch = upload.array('documents', 50);

module.exports = { uploadSingle, uploadBatch };
