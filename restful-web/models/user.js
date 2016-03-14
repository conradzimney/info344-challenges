var mongoose = require('mongoose');

// Mongoose User Model
module.exports = mongoose.model('User', {
    firstname: String,
    lastname: String,
    email: String,
    password: String,
    accounts: Array
});
