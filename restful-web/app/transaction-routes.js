// User, Account, and Transaction Mongoose models
var User = require('../models/user.js');
var Account = require('../models/account.js');
var Transaction = require('../models/transaction.js');
var moment = require("moment-timezone");

module.exports = function(app) {
    
    // Function to submit a new transaction 
    app.post('/newTransaction', function(req, res) {
        var sourceID = req.body.sourceAccount;          // Either local account name or account ID
        var sourceAccount;
        var destination = req.body.destinationAccount;  // Either local account name or account ID or another user Email
        var destinationAccount; 
        var desc = req.body.desc;
        var amount = Number(req.body.amount);
        var initiator = req.user.email;
        var saved = false;
        User.findOne({'email': req.user.email}, function(err, currentUser) {
            if (err) {
                console.log("Something weird is going on....");
            } else {
                var currentUserAccounts = currentUser['accounts'];
                for (var i = 0; i < currentUserAccounts.length; i++) {
                    var currentAccount = currentUserAccounts[i];
                    // Check to see if the source account is owned by the current user
                    if (currentAccount['_id'] == sourceID || currentAccount['name'] == sourceID) {
                        sourceAccount = currentAccount;
                        if (sourceAccount['balance'] < amount) {
                            res.status(400);
                            res.send("Account "+sourceAccount['_id']+" does not have sufficient funds for this transaction.");
                        } else {
                            // Loop over current user accounts again to see if user owns destination account. 
                            for (var j = 0; j < currentUserAccounts.length; j++) {
                                var currDestAccount = currentUserAccounts[j];
                                if (currDestAccount['_id'] == destination || currDestAccount['name'] == destination) {
                                    saved = true;
                                    destinationAccount = currDestAccount;
                                    updateAccounts(sourceAccount, destinationAccount, currentUser, amount);
                                    saveTransaction(req.user._id, req.user._id, sourceAccount['_id'], destinationAccount['_id'], initiator, initiator, amount, desc, res, saved);                    
                                } 
                            } 
                            // If we get here that means that the destination is a user email address, time to find it... 
                            if (!saved) { 
                                User.findOne({'email': destination}, function(err, destUser) {
                                    if (err) {
                                        res.status(404);
                                        res.send("Destination user email address not found. Please try a different email");
                                    } else {
                                        if (destUser != null) {
                                            saved = true;
                                            destinationAccount = destUser['accounts'][0];
                                            updateAccounts(sourceAccount, destinationAccount, currentUser, amount);
                                            destUser.markModified('accounts');
                                            destUser.save(callback);
                                            saveTransaction(req.user._id, destUser['_id'], sourceAccount['_id'], destinationAccount['_id'], initiator, destUser['email'], amount, desc, res, saved);  
                                        } else { // destUser == null
                                            console.log("Could not locate destination account. Please select a different destination account");
                                            res.status(400);
                                            res.send("Could not locate destination account. Please select a different destination.");
                                        }
                                    }
                                }); 
                            } // End finding destination user by email
                        }
                    } else if (sourceAccount == null && !saved && (i == currentUserAccounts.length - 1) ) {
                        console.log("Could not locate source account. Please select a different account");
                        res.status(400);
                        res.send("Could not locate source account. Please select a different account");
                    } 
                } // End current user accounts for loop
            } // End else case of successfully finding User
        }); // End find User
    }); // End new transaction

    // Function to return the 20 most recent transactions for the current user
    app.get('/getTrans', function(req, res) {
        req.user.loadNum = 1;
        var query = Transaction.find( {$or: [ { 'sourceUserID': req.user._id }, { 'destUserID': req.user._id} ]});  
        query.limit(20);
        query.sort({ 'date': -1 });
        execute(query, req, res);       
    });

    // Function to return the next 20 most recent transactions for the current user
    app.get('/getMoreTrans', function(req, res) {
        req.user.loadNum++;
        var query = Transaction.find( {$or: [ { 'sourceUserID': req.user._id }, { 'destUserID': req.user._id} ]});  
        query.limit(20*req.user.loadNum);
        execute(query, req, res);
    });
    
}; // End Module Exports

// Helper function to execute a transaction query
function execute(query, req, response) {
    query.sort({ 'date': -1 });
    query.exec(function(err, trans) {
        if (err) {
            response.send(null);
        } else {
            response.send(filterTrans(trans, req));
        }
    });
};

// Helper function to filter transactions such that no other user's account ID's are ever displayed
function filterTrans(transactions, req) {
    for (var i = 0; i < transactions.length; i++) {
        if (transactions[i]['sourceUserID'] != req.user._id) {
            transactions[i]['sourceAccountID'] = "XXXXXXXXXXXXXXXXXXXX";
        }
        if (transactions[i]['destinationUserEmail'] != req.user.email) {
            transactions[i]['destinationAccountID'] = "XXXXXXXXXXXXXXXXXXXX";
        }
    }
    return transactions;
};

// Helper function to update Accounts for user and in database
function updateAccounts(sAccount, dAccount, cUser, amount) {
    var sub = -1 * amount;
    var conditions = { '_id': sAccount['_id'] };
    var update = { $inc: { 'balance': sub}};
    var options = { multi: false };
    Account.update(conditions, update, options, callback);
    sAccount['balance'] = sAccount['balance'] + sub;
    conditions = { '_id': dAccount['_id'] };
    update = { $inc: { 'balance': amount}};
    Account.update(conditions, update, options, callback);
    dAccount['balance'] = dAccount['balance'] + amount;
    cUser.markModified('accounts');
    cUser.save(callback);
};

// Helper function to save a transaction to the database
function saveTransaction(sUserID, dUserID, sAccID, dAccID, iEmail, dEmail, amt, desc, res, saved) {
    var date = moment().tz("America/Los_Angeles").format('MMM Do YYYY, h:mm:ss a');
    var trans = new Transaction({
        sourceUserID: sUserID,
        destUserID: dUserID,
        sourceAccountID: sAccID,
        destinationAccountID: dAccID, 
        initiatorEmail: iEmail,
        destinationUserEmail: dEmail,
        amount: amt,
        desc: desc,
        dateString: date
    });
    trans.save(function(err) {
        if (err) {
            res.send("Something went wrong...");
        } else {
            saved = true;
            console.log("Successfully saved the transaction!");
            res.status(200);
            res.redirect('/secure-home.html');
        }
    });
};

// Callback function for saving new data to the database
function callback(err, numAffected) {
    if (err) { 
        console.log(err);
    } else {
        console.log(numAffected);
    } 
};