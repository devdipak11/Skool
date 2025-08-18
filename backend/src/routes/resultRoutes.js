const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Route to upload or update student results
router.post('/results', authMiddleware, roleMiddleware(['admin', 'faculty']), resultController.uploadResult);

// Route to get results for a specific student
router.get('/results/:studentId', authMiddleware, roleMiddleware(['admin', 'faculty', 'student']), resultController.getResultsByStudent);

// Route to update a specific result
router.put('/results/:resultId', authMiddleware, roleMiddleware(['admin', 'faculty']), resultController.updateResult);

// Route to delete a specific result
router.delete('/results/:resultId', authMiddleware, roleMiddleware(['admin', 'faculty']), resultController.deleteResult);

module.exports = router;