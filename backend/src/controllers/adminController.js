const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Result = require('../models/Result');
const Banner = require('../models/Banner');
const multer = require('multer');
const path = require('path');
const Fees = require('../models/fees');
const fs = require('fs');

// Multer setup for banner image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/banners'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

exports.uploadBannerImage = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed (jpeg, jpg, png, gif)'), false);
        }
    }
});

// Manage Students

//view all students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error });
    }
};

// ADMIN: View student details (with enrolled subjects)
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate({ path: 'subjects', select: 'name code className faculty', populate: { path: 'faculty', select: 'name' } })
            .select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });
        // Optionally, add result, fee info, etc.
        const studentObj = student.toObject();
        // Add result status if needed (legacy)
        studentObj.result = 'pass';
        res.status(200).json(studentObj);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student details', error });
    }
};

// Add a new student (admin)
exports.createStudent = async (req, res) => {
    try {
        const { name, class: studentClass, rollNo, mobileNo, password } = req.body;
        if (!name || !studentClass || !rollNo) {
            return res.status(400).json({ message: 'Name, class, and rollNo are required.' });
        }
        // Only block if rollNo and class are both the same (rollNo unique within class)
        const existing = await Student.findOne({ rollNo, class: studentClass });
        if (existing) {
            return res.status(409).json({ message: 'Student with this roll number already exists in this class.' });
        }
        // If mobileNo is provided, check for duplicate mobileNo
        if (mobileNo) {
            const mobileExists = await Student.findOne({ mobileNo });
            if (mobileExists) {
                return res.status(409).json({ message: 'Student with this mobile number already exists.' });
            }
        }
        // Hash password if provided, else generate a random one
        const bcrypt = require('bcrypt');
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        } else {
            // Generate a random 8-character password
            const randomPass = Math.random().toString(36).slice(-8);
            hashedPassword = await bcrypt.hash(randomPass, 10);
        }
        const newStudent = new Student({
            name,
            class: studentClass,
            rollNo,
            password: hashedPassword,
            approved: true,
            ...(mobileNo ? { mobileNo } : {})
        });
        await newStudent.save();
        res.status(201).json({ message: 'Student created successfully', student: { _id: newStudent._id, name: newStudent.name, class: newStudent.class, rollNo: newStudent.rollNo, mobileNo: newStudent.mobileNo, approved: newStudent.approved } });
    } catch (error) {
        res.status(500).json({ message: 'Error creating student', error });
    }
};

// Edit student details (admin)
exports.editStudent = async (req, res) => {
    const { id } = req.params;
    const { name, class: studentClass, rollNo, mobileNo, fatherName, address } = req.body;
    try {
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // If rollNo or class is being changed, check for duplicate rollNo in class
        if (
            (rollNo && rollNo !== student.rollNo) ||
            (studentClass && studentClass !== student.class)
        ) {
            const exists = await Student.findOne({
                _id: { $ne: id },
                rollNo: rollNo || student.rollNo,
                class: studentClass || student.class
            });
            if (exists) {
                return res.status(409).json({ message: 'Student with this roll number already exists in this class.' });
            }
        }
        // If mobileNo is being changed, check for duplicate mobileNo
        if (mobileNo && mobileNo !== student.mobileNo) {
            const exists = await Student.findOne({ _id: { $ne: id }, mobileNo });
            if (exists) {
                return res.status(409).json({ message: 'Student with this mobile number already exists.' });
            }
        }

        if (name !== undefined) student.name = name;
        if (studentClass !== undefined) student.class = studentClass;
        if (rollNo !== undefined) student.rollNo = rollNo;
        if (mobileNo !== undefined) student.mobileNo = mobileNo;
        if (fatherName !== undefined) student.fatherName = fatherName;
        if (address !== undefined) student.address = address;

        await student.save();
        res.status(200).json({ message: 'Student updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error });
    }
};

// Approve a student registration request
exports.approveStudent = async (req, res) => {
    const { id } = req.params; // changed from studentId to id for consistency with route
    try {
        const student = await Student.findByIdAndUpdate(id, { approved: true }, { new: true });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.status(200).json({ message: 'Student approved', student });
    } catch (error) {
        res.status(500).json({ message: 'Error approving student', error });
    }
};

// Disapprove (delete) a student registration request
exports.disapproveStudent = async (req, res) => {
    const { id } = req.params; // changed from studentId to id
    try {
        const deleted = await Student.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json({ message: 'Student registration disapproved and deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error disapproving student', error });
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Student.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error });
    }
};

// View all pending student registration requests
exports.getAllPendingStudents = async (req, res) => {
    try {
        const students = await Student.find({ approved: false });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending students', error });
    }
};

// Search Students
exports.searchStudents = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required.' });
        }
        // Search by name or rollNo (case-insensitive)
        const students = await Student.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { rollNo: { $regex: query, $options: 'i' } }
            ]
        });
        res.status(200).json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error searching students', error });
    }
};

// ADMIN: Get monthly attendance for a student (optionally for a subject)
exports.getStudentMonthlyAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year, subjectId } = req.query;
        if (!month || !year) {
            return res.status(400).json({ message: 'Month and year are required' });
        }
        const Attendance = require('../models/attendance.model');
        const monthStr = month.padStart ? month.padStart(2, '0') : String(month).padStart(2, '0');
        const regex = new RegExp(`^${year}-${monthStr}-\\d{2}$`);
        const query = {
            student: studentId,
            date: { $regex: regex }
        };
        if (subjectId) query.subject = subjectId;
        const records = await Attendance.find(query).select('date status subject -_id');
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student attendance', error });
    }
};

// Manage Teachers/faculty
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Faculty.find();
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching teachers', error });
    }
};

exports.updateTeacher = async (req, res) => {
    const { id } = req.params;
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            const bcrypt = require('bcrypt');
            updateData.password = await bcrypt.hash(updateData.password, 10);
        } else {
            delete updateData.password;
        }
        const updatedTeacher = await Faculty.findByIdAndUpdate(id, updateData, { new: true });
        if (!updatedTeacher) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        res.status(200).json(updatedTeacher);
    } catch (error) {
        res.status(500).json({ message: 'Error updating teacher', error });
    }
};

// Add a new teacher/faculty
exports.createTeacher = async (req, res) => {
    const { name, facultyId, password } = req.body;
    if (!name || !facultyId || !password) {
        return res.status(400).json({ message: 'Name, facultyId, and password are required.' });
    }
    try {
        // Check if faculty already exists by facultyId
        const existing = await Faculty.findOne({ facultyId });
        if (existing) {
            return res.status(409).json({ message: 'Faculty with this facultyId already exists.' });
        }
        // Hash password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new faculty
        const newFaculty = new Faculty({
            name,
            facultyId,
            password: hashedPassword
        });
        await newFaculty.save();
        res.status(201).json({ message: 'Faculty created successfully', faculty: { _id: newFaculty._id, name: newFaculty.name, facultyId: newFaculty.facultyId } });
    } catch (error) {
        res.status(500).json({ message: 'Error creating faculty', error });
    }
};

// Delete a teacher/faculty
exports.deleteTeacher = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Faculty.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        res.status(200).json({ message: 'Faculty deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting faculty', error });
    }
};

// Search Faculty/Teachers
exports.searchTeachers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required.' });
        }
        // Search by name or facultyId (case-insensitive)
        const teachers = await Faculty.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { facultyId: { $regex: query, $options: 'i' } }
            ]
        });
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Error searching teachers', error });
    }
};

// Manage Subjects
exports.createSubject = async (req, res) => {
    const { name, code, className, teacherName, isClassTeacher } = req.body;
    try {
        let facultyId = undefined;
        let classTeacherFlag = false;
        if (teacherName) {
            const faculty = await Faculty.findOne({ name: teacherName });
            if (!faculty) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            facultyId = faculty._id;
            classTeacherFlag = !!isClassTeacher;
        }
        // Allow duplicate names but require unique code+className
        const existing = await Subject.findOne({ code, className });
        if (existing) {
            return res.status(409).json({ message: 'A subject with this code and class already exists.' });
        }
        const newSubject = new Subject({
            name,
            code,
            className,
            faculty: facultyId, // can be undefined if no teacherName provided
            isClassTeacher: facultyId ? classTeacherFlag : false
        });
        const savedSubject = await newSubject.save();
        // Always populate faculty (will be null if not assigned)
        const populatedSubject = await Subject.findById(savedSubject._id).populate('faculty', 'name');
        res.status(201).json(populatedSubject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating subject', error });
    }
};

exports.getAllSubjects = async (req, res) => {
    try {
        // Always populate faculty (will be null if not assigned)
        const subjects = await Subject.find().populate('faculty', 'name');
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects', error });
    }
};

// Update subject details
exports.updateSubject = async (req, res) => {
    const { id } = req.params;
    try {
        let updateData = { ...req.body };
        // If teacherName is provided, assign faculty by name
        if (updateData.teacherName) {
            const faculty = await Faculty.findOne({ name: updateData.teacherName });
            if (!faculty) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            updateData.faculty = faculty._id;
            // Only set isClassTeacher if teacher is assigned
            updateData.isClassTeacher = !!updateData.isClassTeacher;
            delete updateData.teacherName;
        } else {
            // If no teacher, ensure isClassTeacher is false
            updateData.faculty = undefined;
            updateData.isClassTeacher = false;
            delete updateData.teacherName;
        }
        const updatedSubject = await Subject.findByIdAndUpdate(id, updateData, { new: true }).populate('faculty', 'name');
        if (!updatedSubject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject updated', subject: updatedSubject });
    } catch (error) {
        res.status(500).json({ message: 'Error updating subject', error });
    }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Subject.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subject', error });
    }
};

// Manage Results
exports.uploadResults = async (req, res) => {
    const { studentId } = req.params;
    const newResult = new Result({ studentId, ...req.body });
    try {
        const savedResult = await newResult.save();
        res.status(201).json(savedResult);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading results', error });
    }
};

// Results Management
exports.getAllResults = async (req, res) => { res.status(501).json({ message: 'Not implemented' }); };
exports.updateResult = async (req, res) => { res.status(501).json({ message: 'Not implemented' }); };

// Assign a teacher to a subject
exports.assignTeacherToSubject = async (req, res) => {
    const { subjectId, facultyId } = req.body;
    try {
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        const faculty = await Faculty.findById(facultyId);
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }
        subject.faculty = facultyId;
        await subject.save();
        res.status(200).json({ message: 'Teacher assigned to subject successfully', subject });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning teacher to subject', error });
    }
};

// Search Subjects
exports.searchSubjects = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Search query is required.' });
        }
        // Search by name or code (case-insensitive)
        const subjects = await Subject.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { code: { $regex: query, $options: 'i' } }
            ]
        }).populate('faculty', 'name');
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error searching subjects', error });
    }
};

// FEES MANAGEMENT

// Add new fees
exports.addFees = async (req, res) => {
    try {
        const { title, amount, className } = req.body;
        if (!title || !amount || !className) {
            return res.status(400).json({ message: 'Title, amount, and className are required.' });
        }
        const fees = new Fees({ title, amount, className });
        await fees.save();
        res.status(201).json({ message: 'Fees created successfully', fees });
    } catch (error) {
        res.status(500).json({ message: 'Error creating fees', error });
    }
};

// View all fees
exports.getAllFees = async (req, res) => {
    try {
        const fees = await Fees.find();
        res.status(200).json(fees);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fees', error });
    }
};

// Edit fees
exports.editFees = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Fees.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Fees not found' });
        }
        res.status(200).json({ message: 'Fees updated successfully', fees: updated });
    } catch (error) {
        res.status(500).json({ message: 'Error updating fees', error });
    }
};

// Delete fees
exports.deleteFees = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Fees.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Fees not found' });
        }
        res.status(200).json({ message: 'Fees deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting fees', error });
    }
};

// View current month's fee status for a student (admin)
exports.viewStudentMonthlyFeeStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        let { year } = req.query;
        year = parseInt(year) || new Date().getFullYear();

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Build a map for quick lookup
        const paymentsMap = {};
        (student.feePayments || []).forEach(p => {
            if (p.year === year) {
                paymentsMap[p.month] = p;
            }
        });

        // For each month, return the payment or default to Pending
        const result = [];
        for (let month = 1; month <= 12; month++) {
            if (paymentsMap[month]) {
                result.push({
                    month,
                    year,
                    status: paymentsMap[month].status,
                    amount: paymentsMap[month].amount,
                    paidAt: paymentsMap[month].paidAt
                });
            } else {
                result.push({
                    month,
                    year,
                    status: 'Pending',
                    amount: undefined,
                    paidAt: undefined
                });
            }
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee status', error });
    }
};

// Update monthly fee status for a student (admin)
exports.updateStudentMonthlyFeeStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year, status, amount, paidAt, reason } = req.body;
        if (!month || !year || !status) {
            return res.status(400).json({ message: 'month, year, and status are required.' });
        }
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Find if payment record exists for this month/year
        let payment = student.feePayments?.find(
            p => p.month === parseInt(month) && p.year === parseInt(year)
        );
        if (payment) {
            // If current status is Paid or Unpaid, require reason to change
            if (['Paid', 'Unpaid'].includes(payment.status) && payment.status !== status) {
                if (!reason || !reason.trim()) {
                    return res.status(400).json({ message: 'Reason is required to change status from Paid/Unpaid.' });
                }
                payment.reason = reason;
            }
            // If current status is Pending, allow direct change (no reason needed)
            payment.status = status;
            if (amount !== undefined) payment.amount = amount;
            if (paidAt !== undefined) payment.paidAt = paidAt;
            if (status === 'Paid' && !payment.paidAt) payment.paidAt = new Date();
            if (status !== 'Paid') payment.paidAt = undefined;
            // If status is changed to Pending, clear reason
            if (status === 'Pending') payment.reason = undefined;
        } else {
            // No record exists, allow direct creation (no reason needed)
            if (!student.feePayments) student.feePayments = [];
            student.feePayments.push({
                month: parseInt(month),
                year: parseInt(year),
                status,
                amount: amount !== undefined ? amount : undefined,
                paidAt: status === 'Paid' ? (paidAt || new Date()) : undefined,
                reason: undefined
            });
        }
        await student.save();
        res.status(200).json({ message: 'Fee status updated successfully', feePayments: student.feePayments });
    } catch (error) {
        res.status(500).json({ message: 'Error updating fee status', error });
    }
};

// ADMIN: View subject details (faculty, enrolled students)
exports.getSubjectDetails = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const subject = await Subject.findById(subjectId).populate('faculty', 'name');
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        // Get students enrolled in this subject
        const students = await Student.find({ subjects: subjectId }).select('name rollNo');
        res.status(200).json({
            subject,
            faculty: subject.faculty,
            studentCount: students.length,
            students
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subject details', error });
    }
};

// ADMIN: View all announcements for a subject
exports.getSubjectAnnouncements = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const Announcement = require('../models/announcement');
        const announcements = await Announcement.find({ subject: subjectId }).populate('faculty', 'name');
        res.status(200).json(announcements);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching announcements', error });
    }
};

// ADMIN: View all comments for an announcement
exports.getAnnouncementComments = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const Comment = require('../models/Comment');
        const comments = await Comment.find({ announcementId })
            .populate('studentId', 'name')
            .populate('facultyId', 'name');
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error });
    }
};

// --- Dashboard Counts ---

exports.getDashboardCounts = async (req, res) => {
    try {
        // Count approved students
        const approvedStudentsCount = await Student.countDocuments({ approved: true });
        // Count all faculty
        const facultyCount = await Faculty.countDocuments();
        // Count all subjects
        const subjectCount = await Subject.countDocuments();
        res.status(200).json({
            approvedStudentsCount,
            facultyCount,
            subjectCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard counts', error });
    }
};

// BANNER MANAGEMENT (Admin)

// Create a new banner (title, description, image file)
exports.createBanner = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'Banner image is required' });
        }
        const imageUrl = `/uploads/banners/${req.file.filename}`;
        const banner = new Banner({ title, description, imageUrl });
        await banner.save();
        return res.status(201).json({ message: 'Banner created', banner });
    } catch (error) {
        console.error('createBanner error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Edit banner (title, description, optionally replace image)
exports.editBanner = async (req, res) => {
    const { id } = req.params;
    try {
        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        const { title, description } = req.body;
        if (title) banner.title = title;
        if (description) banner.description = description;

        // If a new file uploaded, remove old file and update imageUrl
        if (req.file) {
            // remove old image file from disk
            if (banner.imageUrl) {
                const oldPath = path.join(__dirname, '../../public', banner.imageUrl.replace(/^\//, ''));
                try {
                    if (fs.existsSync(oldPath)) {
                        fs.unlinkSync(oldPath);
                    }
                } catch (unlinkErr) {
                    console.warn('Failed to remove old banner image:', unlinkErr);
                }
            }
            banner.imageUrl = `/uploads/banners/${req.file.filename}`;
        }

        banner.updatedAt = Date.now();
        await banner.save();
        return res.status(200).json({ message: 'Banner updated', banner });
    } catch (error) {
        console.error('editBanner error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Delete banner and remove image file
exports.deleteBanner = async (req, res) => {
    const { id } = req.params;
    try {
        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        // delete image file
        if (banner.imageUrl) {
            const filePath = path.join(__dirname, '../../public', banner.imageUrl.replace(/^\//, ''));
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.warn('Failed to delete banner image file:', err);
            }
        }

        await Banner.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Banner deleted' });
    } catch (error) {
        console.error('deleteBanner error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get all banners
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        return res.status(200).json({ banners });
    } catch (error) {
        console.error('getAllBanners error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get single banner by id
exports.getBannerById = async (req, res) => {
    const { id } = req.params;
    try {
        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        return res.status(200).json({ banner });
    } catch (error) {
        console.error('getBannerById error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};



