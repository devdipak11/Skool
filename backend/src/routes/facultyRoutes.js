const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Route to get all subjects assigned to the faculty
router.get('/subjects', authMiddleware, roleMiddleware('Faculty'), facultyController.getAssignedSubjects);

// Route to get details of an assigned subject (students count and names)
router.get('/subjects/:subjectId', authMiddleware, roleMiddleware('Faculty'), facultyController.getAssignedSubjectDetails);

// Route to get students enrolled in a subject (for class teacher)
router.get('/subjects/:subjectId/students', authMiddleware, roleMiddleware('Faculty'), facultyController.getStudentsOfSubject);

// Route to create a new announcement
router.post('/announcements', authMiddleware, roleMiddleware('Faculty'), facultyController.addAnnouncement);

// Route to edit an existing announcement
router.put('/announcements', authMiddleware, roleMiddleware('Faculty'), facultyController.editAnnouncement);

// Route to delete an announcement
router.delete('/announcements', authMiddleware, roleMiddleware('Faculty'), facultyController.deleteAnnouncement);

// Route to manage classwork sections
router.post('/classwork', authMiddleware, roleMiddleware('Faculty'), facultyController.createClassworkSection);

// Route to assign marks to students
router.post('/assign-marks/:quizId', authMiddleware, roleMiddleware('Faculty'), facultyController.assignMarksToStudents);

// View all announcements for a subject
router.get('/announcements/:subjectId', authMiddleware, roleMiddleware('Faculty'), facultyController.viewAllAnnouncements);

// View details of a specific announcement
router.get('/announcements/:subjectId/:announcementId', authMiddleware, roleMiddleware('Faculty'), facultyController.viewAnnouncementDetails);

// Profile routes for faculty
router.get('/profile', authMiddleware, roleMiddleware('Faculty'), facultyController.viewProfile);
router.put('/profile/change-password', authMiddleware, roleMiddleware('Faculty'), facultyController.changePassword);

// Comments management for faculty
const roleFaculty = [authMiddleware, roleMiddleware('Faculty')];

// Faculty posts a comment to an announcement
router.post('/announcements/:announcementId/comments', ...roleFaculty, facultyController.postCommentToAnnouncementAsFaculty);

// Attendance management
router.post('/subjects/:subjectId/attendance', authMiddleware, roleMiddleware('Faculty'), facultyController.markAttendance);
router.get('/subjects/:subjectId/attendance', authMiddleware, roleMiddleware('Faculty'), facultyController.getAttendanceForSubjectDate);

module.exports = router;