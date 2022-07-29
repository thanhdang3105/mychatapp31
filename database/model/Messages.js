const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Messages = new Schema({
    foreignId: {
        type: mongoose.ObjectId,
        required: true,
    },
    userId: {
        type: mongoose.ObjectId,
        required: true,
    },
    text: {
        type: mongoose.Mixed,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    type: {
        type: String,
        default: 'text',
    },
});

module.exports = mongoose.model('Messages', Messages);
