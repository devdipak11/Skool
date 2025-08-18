const mongoose = require('mongoose');

const feesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    className: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fees', feesSchema);
