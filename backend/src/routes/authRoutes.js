const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration route
router.post('/register', authController.registerStudent);

// Send OTP route
router.post('/send-otp', authController.sendOtp);

// Resend OTP route
router.post('/resend-otp', authController.resendOtp);

// Login route (students: mobileNo + otp, faculty/admin: id + password)
router.post('/login', authController.login);

// Change password route
router.post('/change-password', authController.changePassword);

// Export the router
module.exports = router;