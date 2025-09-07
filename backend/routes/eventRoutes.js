const express = require('express');
const { getEvents, getEventById, createEvent } = require('../controllers/eventController.js');
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(upload.single('bannerImage'), createEvent);

router.route('/:id').get(getEventById);

module.exports = router;
