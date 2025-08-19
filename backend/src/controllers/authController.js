const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty'); // add this
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// In-memory OTP store (mobileNo: otp)
const otpStore = {};

// Utility to generate 6-digit OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to mobile number (prints to terminal for now)
exports.sendOtp = (req, res) => {
    const { mobileNo } = req.body;
    if (!mobileNo) return res.status(400).json({ message: 'Mobile number is required' });
    const otp = generateOtp();
    otpStore[mobileNo] = otp;
    console.log(`OTP for ${mobileNo}: ${otp}`); // Print OTP to terminal
    // Return OTP in response for development convenience
    res.status(200).json({ message: 'OTP sent successfully', otp });
};

// Resend OTP to mobile number (same as sendOtp)
exports.resendOtp = (req, res) => {
    const { mobileNo } = req.body;
    if (!mobileNo) return res.status(400).json({ message: 'Mobile number is required' });
    const otp = generateOtp();
    otpStore[mobileNo] = otp;
    console.log(`Resent OTP for ${mobileNo}: ${otp}`); // Print OTP to terminal
    // Return OTP in response for development convenience
    res.status(200).json({ message: 'OTP resent successfully', otp });
};

// Register a new student (with OTP verification)
exports.registerStudent = async (req, res) => {
    const { name, fatherName, address, class: studentClass, rollNo, mobileNo, password, otp } = req.body;

    // OTP verification logic
    if (!otp || otpStore[mobileNo] !== otp) {
        return res.status(400).json({ message: 'Invalid or missing OTP' });
    }
    // Remove OTP after verification
    delete otpStore[mobileNo];

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Save to Student collection instead of User
        const newStudent = new Student({
            name,
            fatherName,
            address,
            class: studentClass,
            rollNo,
            mobileNo,
            password: hashedPassword,
            approved: false
            // Add other fields if your Student model supports them
        });
        await newStudent.save();
        res.status(201).json({ message: 'Registration successful. Awaiting admin approval.' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering student', error });
    }
};

// Login a user (admin/faculty/student logic)
exports.login = async (req, res) => {
    const { adminId, mobileNo, facultyId, password, role } = req.body;

    // Admin login (hardcoded)
    if (role === 'Admin') {
        if (adminId === 'ADMIN' && password === '1234') {
            // Generate real JWT token for admin
            const token = jwt.sign({ id: 'admin', role: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return res.status(200).json({ token, user: { name: 'Admin', role: 'Admin' } });
        } else {
            return res.status(401).json({ message: 'Invalid admin credentials' });
        }
    }

    // Faculty login (by facultyId, use Faculty model)
    if (role === 'Faculty') {
        try {
            const faculty = await Faculty.findOne({ facultyId });
            if (!faculty) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const isMatch = await bcrypt.compare(password, faculty.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const token = jwt.sign({ id: faculty._id, role: faculty.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return res.status(200).json({ token, user: { id: faculty._id, name: faculty.name, role: faculty.role, facultyId: faculty.facultyId } });
        } catch (error) {
            return res.status(500).json({ message: 'Error logging in', error });
        }
    }

    // Student login (by mobileNo)
    if (role === 'Student') {
        try {
            const student = await Student.findOne({ mobileNo });
            if (!student) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            const isMatch = await bcrypt.compare(password, student.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            if (!student.approved) {
                return res.status(403).json({ message: 'Account not approved by admin' });
            }
            const token = jwt.sign({ id: student._id, role: 'Student' }, process.env.JWT_SECRET, { expiresIn: '24h' });
            return res.status(200).json({ 
                token, 
                user: { 
                    id: student._id, 
                    name: student.name, 
                    role: 'Student',
                    fatherName: student.fatherName || '',
                    address: student.address || '',
                    class: student.class,
                    rollNo: student.rollNo,
                    mobileNo: student.mobileNo
                } 
            });
        } catch (error) {
            return res.status(500).json({ message: 'Error logging in', error });
        }
    }

    return res.status(400).json({ message: 'Invalid role' });
};