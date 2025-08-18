const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    facultyId: {
        type: String,
        unique: true,
        sparse: true // allows null for non-faculty users
    },
    mobileNo: {
        type: String,
        unique: true,
        sparse: true // allows null for non-admin users
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Faculty', 'Admin'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;