const mongoose = require('mongoose');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Announcement = require('../models/announcement');
const Comment = require('../models/Comment');
// const Bill = require('../models/Bill'); // <-- Remove this line
const Fees = require('../models/fees'); // Add this line if not already present
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // add for login

// Register a new student
exports.registerStudent = async (req, res) => {
    const { name, fatherName, address, class: studentClass, rollNo, mobileNo, password } = req.body;

    try {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStudent = new Student({ 
            name,
            fatherName,
            address,
            class: studentClass, 
            rollNo, 
            mobileNo, 
            password: hashedPassword, 
            approved: false // always set to false, admin must approve
        });
        await newStudent.save();
        res.status(201).json({ message: 'Registration request sent to admin for approval.' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering student', error });
    }
};

// Student Login
exports.loginStudent = async (req, res) => {
    const { mobileNo, password } = req.body;
    try {
        const student = await Student.findOne({ mobileNo });
        if (!student) return res.status(401).json({ message: 'Invalid credentials' });
        // Check approval
        if (!student.approved) {
            return res.status(403).json({ message: 'Account not approved by admin' });
        }
        const match = await bcrypt.compare(password, student.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });
        // Generate JWT
        const token = jwt.sign({ id: student._id, role: 'Student' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token, user: { id: student._id, name: student.name, role: 'Student', approved: student.approved, fatherName: student.fatherName, address: student.address, class: student.class, rollNo: student.rollNo, mobileNo: student.mobileNo } });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};




//subjects

// Enroll in a subject
exports.enrollInSubject = async (req, res) => {
    const { subjectCode } = req.body;
    const studentId = req.user.id;

    try {
        const subject = await Subject.findOne({ code: subjectCode });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const student = await Student.findById(studentId);
        if (student.subjects.includes(subject._id)) {
            return res.status(400).json({ message: 'Already enrolled in this subject' });
        }

        student.subjects.push(subject._id);
        await student.save();
        res.status(200).json({ message: 'Successfully enrolled in subject' });
    } catch (error) {
        res.status(500).json({ message: 'Error enrolling in subject', error });
    }
};




// Unenroll from a subject
exports.unenrollSubject = async (req, res) => {
    const { subjectCode } = req.body;
    const studentId = req.user.id;
    try {
        const subject = await Subject.findOne({ code: subjectCode });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const index = student.subjects.indexOf(subject._id);
        if (index === -1) {
            return res.status(400).json({ message: 'Student is not enrolled in this subject' });
        }
        student.subjects.splice(index, 1);
        await student.save();
        res.status(200).json({ message: 'Successfully unenrolled from subject' });
    } catch (error) {
        res.status(500).json({ message: 'Error unenrolling from subject', error });
    }
};


// Get Enrolled Subjects
exports.getEnrolledSubjects = async (req, res) => {
    try {
        console.log('getEnrolledSubjects - User in request:', req.user);
        
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User ID not found in token' });
        }
        
        console.log('Fetching subjects for student ID:', req.user.id);
        // Make sure we have a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
            console.error('Invalid student ID format:', req.user.id);
            return res.status(400).json({ message: 'Invalid student ID format' });
        }
        
        const student = await Student.findById(req.user.id).populate({
            path: 'subjects',
            select: 'name code description faculty className', // Select specific fields
            populate: {
                path: 'faculty',
                select: 'name' // Only get faculty name
            }
        });
        
        if (!student) {
            console.log('Student not found with ID:', req.user.id);
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Handle the case where subjects might be undefined
        const subjects = student.subjects || [];
        console.log('Found student:', student.name);
        console.log('Subjects count:', subjects.length);
        console.log('Subjects:', JSON.stringify(subjects));
        
        // If subjects array is empty, return an empty array rather than null
        res.status(200).json(subjects);
    } catch (error) {
        console.error('Error in getEnrolledSubjects:', error);
        res.status(500).json({ message: 'Error fetching enrolled subjects', error: error.message });
    }
};

// Get all students enrolled in a subject (for students)
exports.getEnrolledStudentsForSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        // Check if the student is enrolled in the subject
        if (!student.subjects.map(id => String(id)).includes(subjectId)) {
            return res.status(403).json({ message: 'You are not enrolled in this subject' });
        }
        // Get all students enrolled in this subject
        const students = await Student.find({ subjects: subjectId }).select('name rollNo');
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching enrolled students', error });
    }
};



//announcements

// View all announcements for a specific enrolled subject
exports.viewSubjectAnnouncements = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Check if the student is enrolled in the subject
        if (!student.subjects.map(id => String(id)).includes(subjectId)) {
            return res.status(403).json({ message: 'You are not enrolled in this subject' });
        }

        const announcements = await Announcement.find({ subject: subjectId })
            .populate('subject', 'name')
            .populate('faculty', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subject announcements', error });
    }
};

// View details of a specific announcement
exports.viewAnnouncementDetails = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const announcement = await Announcement.findById(announcementId)
            .populate('subject', 'name')
            .populate('faculty', 'name');
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.status(200).json(announcement);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcement details', error });
    }
};



// Post a comment to an announcement
exports.postCommentToAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const { content } = req.body;
        // Find the announcement to ensure it exists
        const announcement = await Announcement.findById(announcementId);
        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        // Create comment
        const comment = new Comment({
            studentId: req.user.id,
            announcementId: announcementId,
            content
        });
        await comment.save();
        res.status(201).json({ message: 'Comment posted successfully', comment });
    } catch (error) {
        res.status(500).json({ message: 'Error posting comment', error });
    }
};




//comments

// View posted comments for an announcement
exports.viewPostedComments = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const comments = await Comment.find({ announcementId })
            .populate('studentId', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
};

// Edit a posted comment
exports.editPostedComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        // Only allow the student who posted the comment to edit
        if (String(comment.studentId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }
        comment.content = content;
        await comment.save();
        res.status(200).json({ message: 'Comment updated successfully', comment });
    } catch (error) {
        res.status(500).json({ message: 'Error updating comment', error });
    }
};

// Delete a posted comment
exports.deletePostedComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);

        // Log for debugging
        console.log('deletePostedComment req.user:', req.user);
        console.log('deletePostedComment comment:', comment);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const userRole = (req.user.role || '').toLowerCase();
        if (
            String(comment.studentId) !== String(req.user.id) &&
            userRole !== 'admin' &&
            userRole !== 'faculty'
        ) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }
        await comment.remove();
        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error in deletePostedComment:', error); // <--- Add this line
        res.status(500).json({ message: 'Error deleting comment', error });
    }
};






//profile management
// Get Student Profile
exports.getStudentProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).select('-password').populate('subjects');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        // Always show result as 'pass' by default
        const studentObj = student.toObject();
        studentObj.result = 'pass';
        res.status(200).json(studentObj);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error });
    }
};

// Edit Profile
exports.editProfile = async (req, res) => {
    try {
        const updates = req.body;
        delete updates.password; // Prevent password update here
        const student = await Student.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.status(200).json({ message: 'Profile updated', student });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const match = await bcrypt.compare(oldPassword, student.password);
        if (!match) return res.status(400).json({ message: 'Old password incorrect' });
        student.password = await bcrypt.hash(newPassword, 10);
        await student.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error });
    }
};





//fee management

// View fee amount for my class
exports.viewMonthlyFeeAmount = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Find the latest fee for the student's class
        const fee = await Fees.findOne({ className: student.class })
            .sort({ createdAt: -1 }); // Get the latest fee if multiple exist

        if (!fee) {
            return res.status(404).json({ message: 'No fee set for your class' });
        }

        res.status(200).json({
            className: fee.className,
            title: fee.title,
            amount: fee.amount,
            createdAt: fee.createdAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee amount', error });
    }
};

// View fee payment status according to month and year
exports.viewMonthlyFeeStatus = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { month, year } = req.query; // Optional filters

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        let payments = student.feePayments || [];
        if (month && year) {
            payments = payments.filter(
                p => p.month === parseInt(month) && p.year === parseInt(year)
            );
        }

        if (!payments.length) {
            return res.status(404).json({ message: 'No fee payment records found' });
        }

        // Return status for each payment
        res.status(200).json(payments.map(payment => ({
            month: payment.month,
            year: payment.year,
            status: payment.status, // 'Paid' or 'Unpaid'
            amount: payment.amount,
            paidAt: payment.paidAt
        })));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee status', error });
    }
};







