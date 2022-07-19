const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Inboxs = new Schema({
    users: {
        type: [
            {
                type: String,
                ref: 'Users',
            },
        ],
        required: true,
        minLength: 2,
    },
    background: {
        type: String,
        default:
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/kamiHouse2.jpg?alt=media&token=df0fd7ec-b588-4def-9ba6-aa400d1d6664',
    },
    backgroundList: {
        type: Array,
        default: [
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/kamiHouse.png?alt=media&token=589effa1-7c63-45e0-922d-bb067034d75c',
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/kamiHouse2.jpg?alt=media&token=df0fd7ec-b588-4def-9ba6-aa400d1d6664',
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/kamiHouse3.jpg?alt=media&token=d4973e91-ea5c-47eb-8c93-d2f6a705a17a',
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/kamiHouse4.jpg?alt=media&token=af709eec-e159-432d-a57b-a2dab3c8087c',
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/Untitled%20design.png?alt=media&token=5693d9e4-21ad-406e-a2c9-17f82264ea8b',
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/hinh-nen-may-tinh-win-7-va-win-8-15.jpg?alt=media&token=31e3c188-e617-4418-bb8e-8c6e90eb5d0f',
            'https://firebasestorage.googleapis.com/v0/b/messenger-359a9.appspot.com/o/tn2t7q24j24z-1509955485683.jpg?alt=media&token=aa11460d-b2ba-417b-b876-e4a69a2a1668',
        ],
    },
    lastested: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model('Inboxs', Inboxs);
