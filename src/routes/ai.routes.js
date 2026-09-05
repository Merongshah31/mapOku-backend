const express = require('express');
const { upload } = require('../controllers/obstacles.controller');
const { validateImage } = require('../controllers/ai.controller');

const router = express.Router();

router.post('/validate-image', upload.single('image'), validateImage);

module.exports = router;
