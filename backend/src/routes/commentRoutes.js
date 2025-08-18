const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Route to post a comment
router.post('/:announcementId', authMiddleware, roleMiddleware(['student']), commentController.postComment);

// Route to delete a comment (allow student, faculty, admin)
router.delete('/:commentId', authMiddleware, commentController.deleteComment);

// Route to get all comments for a specific announcement
router.get('/:announcementId', authMiddleware, commentController.getComments);

module.exports = router;