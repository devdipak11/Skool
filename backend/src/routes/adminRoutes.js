const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const fs = require('fs');
const path = require('path');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/banners');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}



// Dashboard counts
router.get('/dashboard-counts', authMiddleware, roleMiddleware('Admin'), adminController.getDashboardCounts);

// Manage Students
router.get('/students', authMiddleware, roleMiddleware('Admin'), adminController.getAllStudents);
router.get('/students/:id', authMiddleware, roleMiddleware('Admin'), adminController.getStudentById);

// Add new student (admin)
router.post('/students', authMiddleware, roleMiddleware('Admin'), adminController.createStudent);

// Edit student (admin)
router.put('/students/:id', authMiddleware, roleMiddleware('Admin'), adminController.editStudent);

router.delete('/students/:id', authMiddleware, roleMiddleware('Admin'), adminController.deleteStudent);
router.post('/students/approve/:id', authMiddleware, roleMiddleware('Admin'), adminController.approveStudent);
router.delete('/students/disapprove/:id', authMiddleware, roleMiddleware('Admin'), adminController.disapproveStudent);
// Pending student registrations
router.get('/students/pending', authMiddleware, roleMiddleware('Admin'), adminController.getAllPendingStudents);
// Search Students
router.get('/students/search', authMiddleware, roleMiddleware('Admin'), adminController.searchStudents);
// Fee status management for students (admin)
router.get('/students/:studentId/fee-status', authMiddleware, roleMiddleware('Admin'), adminController.viewStudentMonthlyFeeStatus);
router.put('/students/:studentId/fee-status', authMiddleware, roleMiddleware('Admin'), adminController.updateStudentMonthlyFeeStatus);
// Admin: Get monthly attendance for a student (optionally by subject)
router.get('/students/:studentId/attendance', authMiddleware, roleMiddleware('Admin'), adminController.getStudentMonthlyAttendance);

// Manage Teachers
router.get('/teachers', authMiddleware, roleMiddleware('Admin'), adminController.getAllTeachers);
router.post('/teachers', authMiddleware, roleMiddleware('Admin'), adminController.createTeacher);
router.put('/teachers/:id', authMiddleware, roleMiddleware('Admin'), adminController.updateTeacher);
router.delete('/teachers/:id', authMiddleware, roleMiddleware('Admin'), adminController.deleteTeacher);
// Search Teachers/Faculty
router.get('/teachers/search', authMiddleware, roleMiddleware('Admin'), adminController.searchTeachers);

// Manage Subjects
router.post('/subjects', authMiddleware, roleMiddleware('Admin'), adminController.createSubject);
router.get('/subjects', authMiddleware, roleMiddleware('Admin'), adminController.getAllSubjects);
router.put('/subjects/:id', authMiddleware, roleMiddleware('Admin'), adminController.updateSubject);
router.delete('/subjects/:id', authMiddleware, roleMiddleware('Admin'), adminController.deleteSubject);
router.post('/subjects/assign-teacher', authMiddleware, roleMiddleware('Admin'), adminController.assignTeacherToSubject);
// Search Subjects
router.get('/subjects/search', authMiddleware, roleMiddleware('Admin'), adminController.searchSubjects);
// Subject details (faculty, students)
router.get('/subjects/:subjectId/details', authMiddleware, roleMiddleware('Admin'), adminController.getSubjectDetails);
// All announcements for a subject
router.get('/subjects/:subjectId/announcements', authMiddleware, roleMiddleware('Admin'), adminController.getSubjectAnnouncements);
// All comments for an announcement
router.get('/announcements/:announcementId/comments', authMiddleware, roleMiddleware('Admin'), adminController.getAnnouncementComments);

// Manage Results
router.post('/results', authMiddleware, roleMiddleware('Admin'), adminController.uploadResults);
router.get('/results', authMiddleware, roleMiddleware('Admin'), adminController.getAllResults);
router.put('/results/:id', authMiddleware, roleMiddleware('Admin'), adminController.updateResult);

// FEES MANAGEMENT
router.post('/fees', authMiddleware, roleMiddleware('Admin'), adminController.addFees);
router.get('/fees', authMiddleware, roleMiddleware('Admin'), adminController.getAllFees);
router.put('/fees/:id', authMiddleware, roleMiddleware('Admin'), adminController.editFees);
router.delete('/fees/:id', authMiddleware, roleMiddleware('Admin'), adminController.deleteFees);

// Banner Management (Admin)
router.post('/banners', authMiddleware, roleMiddleware('Admin'), adminController.uploadBannerImage.single('image'), adminController.createBanner);
router.get('/banners', authMiddleware, roleMiddleware('Admin'), adminController.getAllBanners);
router.get('/banners/:id', authMiddleware, roleMiddleware('Admin'), adminController.getBannerById);
router.put('/banners/:id', authMiddleware, roleMiddleware('Admin'), adminController.uploadBannerImage.single('image'), adminController.editBanner);
router.delete('/banners/:id', authMiddleware, roleMiddleware('Admin'), adminController.deleteBanner);

module.exports = router;