var mongoose = require('mongoose');

// Mongoose Transaction Model
module.exports = mongoose.model('Transaction', {
    sourceUserID: String,
    destUserID: String,
    sourceAccountID: String,
    destinationAccountID: String, 
    initiatorEmail: String,
    destinationUserEmail: String,
    amount: Number,
    desc: String,
    dateString: String,
    date: {type: Date, default: Date.now}
});
