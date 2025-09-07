const express = require('express');
const { createUserOrUpdate, setUserRole, getMyProfile } = require('../controllers/userController.js');

const router = express.Router();

router.route('/webhook').post(createUserOrUpdate);
router.route('/set-role').post(setUserRole);
router.route('/me').get(getMyProfile);

module.exports = router;
