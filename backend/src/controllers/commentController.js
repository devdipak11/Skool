const Comment = require('../models/Comment');

// Post a new comment
exports.postComment = async (req, res) => {
    try {
        const { announcementId, content } = req.body;
        const newComment = new Comment({
            announcementId,
            content,
            studentId: req.user.id, // Assuming req.user is populated with the authenticated user's info
            createdAt: new Date(),
        });
        await newComment.save();
        res.status(201).json({ message: 'Comment posted successfully', comment: newComment });
    } catch (error) {
        res.status(500).json({ message: 'Error posting comment', error: error.message });
    }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);

        // Log for debugging
        console.log('DeleteComment req.user:', req.user);
        console.log('DeleteComment comment:', comment);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const userRole = (req.user.role || '').toLowerCase();

        // Allow: student can delete their own, faculty can delete any, admin can delete any
        if (
            (comment.studentId && comment.studentId.toString() === req.user.id) ||
            (comment.facultyId && comment.facultyId.toString() === req.user.id) ||
            userRole === 'admin' ||
            userRole === 'faculty'
        ) {
            await Comment.findByIdAndDelete(commentId);
            return res.status(200).json({ message: 'Comment deleted successfully' });
        }

        return res.status(403).json({ message: 'You do not have permission to delete this comment' });
    } catch (error) {
        console.error('Error in deleteComment:', error);
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};

// Get all comments for a specific announcement
exports.getComments = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const comments = await Comment.find({ announcementId })
            .populate('studentId', 'name')
            .populate('facultyId', 'name');
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};