const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Route to create a new subject
router.post('/', authMiddleware, roleMiddleware(['admin']), subjectController.createSubject);

// Route to get all subjects
router.get('/', subjectController.getAllSubjects);

// Route to get a subject by ID
router.get('/:id', subjectController.getSubjectById);

// Route to update a subject by ID
router.put('/:id', authMiddleware, roleMiddleware(['admin']), subjectController.updateSubject);

// Route to delete a subject by ID
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), subjectController.deleteSubject);

// Route to assign faculty to a subject
router.post('/:id/faculty', authMiddleware, roleMiddleware(['admin']), subjectController.assignFacultyToSubject);

module.exports = router;