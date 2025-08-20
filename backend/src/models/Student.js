const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    fatherName: {
        type: String
    },
    address: {
        type: String
    },
    class: {
        type: String,
        required: true
    },
    rollNo: {
        type: String,
        required: true,
        unique: true
    },
    mobileNo: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    approved: {
        type: Boolean,
        default: false
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    feesStatus: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Pending'
    },
    // Add feePayments array for monthly fee tracking
    feePayments: [{
        month: { type: Number, required: true }, // 1-12
        year: { type: Number, required: true },
        status: { type: String, enum: ['Paid', 'Unpaid', 'Pending'], required: true },
        amount: { type: Number },
        paidAt: { type: Date },
        reason: { type: String } // Add this field for audit trail
    }],
    result: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result'
    }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);