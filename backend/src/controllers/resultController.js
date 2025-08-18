const Result = require('../models/Result');

// Upload or update student results
exports.uploadResult = async (req, res) => {
    const { studentId, subjectId, marks } = req.body;

    try {
        let result = await Result.findOne({ studentId, subjectId });

        if (result) {
            // Update existing result
            result.marks = marks;
            await result.save();
            return res.status(200).json({ message: 'Result updated successfully', result });
        } else {
            // Create new result
            result = new Result({ studentId, subjectId, marks });
            await result.save();
            return res.status(201).json({ message: 'Result uploaded successfully', result });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error uploading result', error });
    }
};

// Get results for a specific student
exports.getResultsByStudent = async (req, res) => {
    const { studentId } = req.params;

    try {
        const results = await Result.find({ studentId }).populate('subjectId', 'name');
        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching results', error });
    }
};

// Get all results for a specific subject
exports.getResultsBySubject = async (req, res) => {
    const { subjectId } = req.params;

    try {
        const results = await Result.find({ subjectId }).populate('studentId', 'name');
        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching results', error });
    }
};

// Update a specific result
exports.updateResult = async (req, res) => {
    const { resultId } = req.params;
    const { marks } = req.body;
    try {
        const result = await Result.findByIdAndUpdate(resultId, { marks }, { new: true });
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }
        return res.status(200).json({ message: 'Result updated successfully', result });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating result', error });
    }
};

// Delete a specific result
exports.deleteResult = async (req, res) => {
    const { resultId } = req.params;
    try {
        const result = await Result.findByIdAndDelete(resultId);
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }
        return res.status(200).json({ message: 'Result deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting result', error });
    }
};