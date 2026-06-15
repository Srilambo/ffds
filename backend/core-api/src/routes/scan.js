const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const scanController = require('../controllers/scanController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

router.post('/', auth, upload.single('image'), scanController.createScan);

module.exports = router;
