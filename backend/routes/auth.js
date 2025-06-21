const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route: POST /auth/signup
router.post('/signup', authController.signup);
// Route: POST /auth/login
router.post('/login', authController.login);

module.exports = router;
