var mongoose = require('mongoose');

// Mongoose Account Model
module.exports = mongoose.model('Account', {
    name: String,
    userID: String,
    balance: Number
});
