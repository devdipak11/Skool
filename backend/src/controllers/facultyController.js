const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Announcement = require('../models/announcement');
const Comment = require('../models/Comment');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');




//faculty subject management
// Get all subjects assigned to the faculty
exports.getAssignedSubjects = async (req, res) => {
    try {
        const facultyId = req.user.id; // Assuming user ID is stored in req.user
        // Populate faculty name for each subject
        const subjects = await Subject.find({ faculty: facultyId }).populate('faculty', 'name');
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects', error });
    }
};

// Get details of an assigned subject, including student count and names
exports.getAssignedSubjectDetails = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { subjectId } = req.params;

        // Ensure the subject is assigned to this faculty
        const subject = await Subject.findOne({ _id: subjectId, faculty: facultyId });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found or not assigned to you' });
        }

        // Find students registered in this subject
        const students = await require('../models/Student').find({ subjects: subjectId }).select('name rollNo');
        res.status(200).json({
            subject,
            studentCount: students.length,
            students // now includes name and rollNo for each student
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subject details', error });
    }
};




//faculty announcement management

// Add an announcement to an assigned subject
exports.addAnnouncement = async (req, res) => {
    const { subjectId, content } = req.body;
    try {
        const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found or not assigned to you' });
        }
        // Add to Subject subdocument array (optional, for legacy UI)
        subject.announcements.push({
            content,
            faculty: req.user.id
        });
        await subject.save();

        // Also create in Announcement collection for student queries
        const announcementDoc = new Announcement({
            subject: subjectId,
            faculty: req.user.id,
            content
        });
        await announcementDoc.save();

        res.status(201).json({ message: 'Announcement added successfully', announcement: announcementDoc });
    } catch (error) {
        res.status(500).json({ message: 'Error adding announcement', error });
    }
};

// Edit an announcement
exports.editAnnouncement = async (req, res) => {
    const { subjectId, announcementId, content } = req.body;
    try {
        // Update in Announcement collection
        const announcement = await Announcement.findOneAndUpdate(
            { _id: announcementId, subject: subjectId, faculty: req.user.id },
            { content },
            { new: true }
        );
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        // Optionally, update in Subject subdocument array for legacy UI
        const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
        if (subject) {
            const subAnn = subject.announcements.id(announcementId);
            if (subAnn) {
                subAnn.content = content;
                await subject.save();
            }
        }

        res.status(200).json({ message: 'Announcement updated successfully', announcement });
    } catch (error) {
        res.status(500).json({ message: 'Error editing announcement', error });
    }
};

// Delete an announcement
exports.deleteAnnouncement = async (req, res) => {
    const { subjectId, announcementId } = req.body;
    try {
        // Remove from Announcement collection
        const announcement = await Announcement.findOneAndDelete({
            _id: announcementId,
            subject: subjectId,
            faculty: req.user.id
        });
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        // Optionally, remove from Subject subdocument array for legacy UI
        const subject = await Subject.findOne({ _id: subjectId, faculty: req.user.id });
        if (subject) {
            const subAnn = subject.announcements.id(announcementId);
            if (subAnn) {
                subAnn.remove();
                await subject.save();
            }
        }

        res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting announcement', error });
    }
};

// View all announcements for an assigned subject
exports.viewAllAnnouncements = async (req, res) => {
    const { subjectId } = req.params;
    try {
        // Fetch announcements for this subject and faculty, populate faculty name
        const announcements = await require('../models/announcement')
            .find({ subject: subjectId })
            .populate('faculty', 'name');
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error });
    }
};

// View details of a specific announcement
exports.viewAnnouncementDetails = async (req, res) => {
    const { subjectId, announcementId } = req.params;
    try {
        // Find the announcement and ensure it belongs to this faculty and subject
        const announcement = await Announcement.findOne({ _id: announcementId, subject: subjectId, faculty: req.user.id });
        if (!announcement) return res.status(404).json({ message: 'Announcement not found or not assigned to you' });
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcement details', error });
    }
};




// Faculty posts a comment to an announcement
exports.postCommentToAnnouncementAsFaculty = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const { content } = req.body;
        // Find the announcement to ensure it exists and belongs to this faculty
        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        // Optionally, check if the faculty owns the announcement
        // if (String(announcement.faculty) !== String(req.user.id)) {
        //     return res.status(403).json({ message: 'Not authorized to comment on this announcement' });
        // }
        // Create comment as faculty
        const comment = new Comment({
            facultyId: req.user.id,
            announcementId: announcementId,
            content
        });
        await comment.save();
        res.status(201).json({ message: 'Comment posted successfully', comment });
    } catch (error) {
        res.status(500).json({ message: 'Error posting comment', error });
    }
};



//faculty profile management

// View faculty profile
exports.viewProfile = async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.user.id).select('-password');
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        res.status(200).json(faculty);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error });
    }
};

// Change faculty password
exports.changePassword = async (req, res) => {
    try {
        const { facultyId, oldPassword, newPassword } = req.body;
        if (!facultyId || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'facultyId, oldPassword, and newPassword are required.' });
        }
        const faculty = await Faculty.findOne({ facultyId });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        // Use bcrypt to compare hashed password
        const isMatch = await bcrypt.compare(oldPassword, faculty.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }
        faculty.password = await bcrypt.hash(newPassword, 10);
        await faculty.save();
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error });
    }
};

// Manage classwork sections
exports.createClassworkSection = async (req, res) => { res.status(501).json({ message: 'Not implemented' }); };

// Assign marks to students
exports.assignMarksToStudents = async (req, res) => { res.status(501).json({ message: 'Not implemented' }); };

