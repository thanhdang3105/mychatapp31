const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Users = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        photoURL: {
            type: String,
            default: '',
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            default: '',
        },
        provider: {
            type: String,
            default: 'email/pwd',
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model('Users', Users);
