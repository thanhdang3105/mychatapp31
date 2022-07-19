const mongoose = require('mongoose');

module.exports = function connectDB() {
    try {
        mongoose.connect(process.env.DB_URL);
        console.log('connect successfully');
    } catch (err) {
        console.log('error connecting', err);
    }
};
