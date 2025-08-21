const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Create a combined middleware for student routes
const studentAuth = [authMiddleware, roleMiddleware('student')];

// Registration & Login
router.post('/register', studentController.registerStudent);
router.post('/login', studentController.loginStudent);

// Profile
router.get('/profile', authMiddleware, studentController.getStudentProfile);
router.put('/profile', authMiddleware, studentController.editProfile);
router.put('/profile/password', authMiddleware, studentController.changePassword);

// Subjects
router.post('/enroll', authMiddleware, studentController.enrollInSubject);
router.post('/unenroll', authMiddleware, studentController.unenrollSubject);
router.get('/subjects', authMiddleware, studentController.getEnrolledSubjects);
router.get('/subjects/:subjectId/announcements', authMiddleware, studentController.viewSubjectAnnouncements);
router.get('/subjects/:subjectId/students', authMiddleware, roleMiddleware('student'), studentController.getEnrolledStudentsForSubject);

// Announcements
router.get('/announcements/:announcementId', authMiddleware, studentController.viewAnnouncementDetails);
router.post('/announcements/:announcementId/comments', authMiddleware, studentController.postCommentToAnnouncement);

// Comments
router.get('/comments/:announcementId', authMiddleware, studentController.viewPostedComments);
router.put('/comments/:commentId', authMiddleware, studentController.editPostedComment);
router.delete('/comments/:commentId', authMiddleware, studentController.deletePostedComment);

// Bill
// router.get('/bill', authMiddleware, studentController.viewBill);
// router.get('/bill/history', authMiddleware, studentController.viewBillHistory);

// Monthly School Fees
router.get('/fees/monthly-amount', authMiddleware, studentController.viewMonthlyFeeAmount);
router.get('/fees/monthly-status', authMiddleware, studentController.viewMonthlyFeeStatus);

// Get monthly attendance for student
router.get('/attendance/monthly', authMiddleware, studentController.getMonthlyAttendance);

module.exports = router;