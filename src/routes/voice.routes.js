const express = require('express');
const multer = require('multer');
const { transcribeNavigation } = require('../controllers/voice.controller');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('audio/')) return callback(Object.assign(new Error('Only audio files are allowed.'), { status: 400 }));
    callback(null, true);
  },
});

router.post('/transcribe', upload.single('audio'), transcribeNavigation);
module.exports = router;
