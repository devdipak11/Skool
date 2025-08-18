const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');

// Create a new subject
exports.createSubject = async (req, res) => {
    try {
        const { name, code, className, teacherName } = req.body;
        let faculty = undefined;
        if (teacherName) {
            const foundFaculty = await Faculty.findOne({ name: teacherName });
            if (!foundFaculty) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            faculty = foundFaculty._id;
        }
        const newSubject = new Subject({ name, code, className, faculty });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (error) {
        res.status(500).json({ message: 'Error creating subject', error: error.message });
    }
};

// Get all subjects
exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate('faculty', 'name');
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subjects', error: error.message });
    }
};

// Get a subject by ID
exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id).populate('faculty', 'name');
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subject', error: error.message });
    }
};

// Update a subject
exports.updateSubject = async (req, res) => {
    try {
        const { name, code, className, teacherName } = req.body;
        let faculty = undefined;
        if (teacherName) {
            const foundFaculty = await Faculty.findOne({ name: teacherName });
            if (!foundFaculty) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            faculty = foundFaculty._id;
        }
        const updatedSubject = await Subject.findByIdAndUpdate(
            req.params.id,
            { name, code, className, faculty },
            { new: true }
        ).populate('faculty', 'name');
        if (!updatedSubject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json(updatedSubject);
    } catch (error) {
        res.status(500).json({ message: 'Error updating subject', error: error.message });
    }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
    try {
        const deletedSubject = await Subject.findByIdAndDelete(req.params.id);
        if (!deletedSubject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting subject', error: error.message });
    }
};

// Assign faculty to a subject
exports.assignFacultyToSubject = async (req, res) => {
    try {
        const { facultyId } = req.body;
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            { faculty: facultyId },
            { new: true }
        ).populate('faculty', 'name');
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json({ message: 'Faculty assigned successfully', subject });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning faculty', error: error.message });
    }
};