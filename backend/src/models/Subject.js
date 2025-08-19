const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }
});

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
    },
    className: {
        type: String,
        required: true
    },
    announcements: [announcementSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

subjectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;