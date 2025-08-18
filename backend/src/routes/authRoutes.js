const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration route
router.post('/register', authController.registerStudent);

// Send OTP route
router.post('/send-otp', authController.sendOtp);

// Resend OTP route
router.post('/resend-otp', authController.resendOtp);

// Login route
router.post('/login', authController.login);

// Export the router
module.exports = router;