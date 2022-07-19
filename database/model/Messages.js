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
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model('Messages', Messages);
