// User and Account Mongoose models
var User = require('../models/user.js');
var Account = require('../models/account.js');

module.exports = function(app) {
    
    // Function to return all of the accounts associated with the current user
    app.get('/getAccounts', function(req, res) {
        var query = Account.find({});
        query.where('userID', req.user._id);
        query.exec(function(err, accs) {
            if (err) {
                res.send(null);
            } else {
                res.send(accs);
            }
        });
    });           
    
    // Function to create a new account for the user
    app.post('/createAccount', function(req, res) {
        User.findOne({ 'email': req.user.email }, function (err, user) {
            if (err) {
                res.send(null);
            } else {            
                if (user.accounts.length == 5) {
                    res.status(400);
                    res.send("User already has 5 accounts. Please delete an account before creating a new one.");
                } else {
                    var query = Account.find( {$and: [ { 'userID': req.user._id }, { 'name': req.body.accountName} ]});  
                    query.exec(function(err, acc) {
                        if (err) {
                            console.log("Something went wrong.");
                        } else {
                            if (acc.length == 0) {
                                var conditions = { email: req.user.email };
                                var newAccount = new Account({
                                    name: req.body.accountName,
                                    userID: req.user._id,
                                    balance: 100
                                });
                                var update = {$push: {"accounts": newAccount}};
                                var options = { multi: false };
                                User.update(conditions, update, options, callback);
                                newAccount.save(function(err) {
                                    if (err) {
                                        res.send("Something went wrong...");
                                    } else {
                                        console.log(newAccount);
                                        res.status(200);
                                        res.redirect('/secure-home.html');
                                    }
                                });
                            } else {
                                res.status(400);
                                res.send("Account with given name already exists. Please select a different name.")
                            }
                        }
                    });
                }
            }
        });
    });
    
    // Function to delete an account for the user
    app.post('/deleteAccount', function(req, res) {
        var input = req.body.accountToDelete;
        var deleted = false;
        User.findOne({ 'email': req.user.email }, function (err, user) {
            if (err) {
                res.send(null);
            } else {
                var accountToDelete;
                var accounts = user['accounts']; 
                for (var i = 0; i < accounts.length; i++) {
                    if ((accounts[i]['_id'] == input) || (accounts[i]['name'] == input)) {
                        accountToDelete = accounts[i];
                        if (accountToDelete['balance'] != 0) {
                            res.status(400);
                            res.send("Account balance must be zero in order to delete the account.");
                        } else if (accountToDelete['name'] == "Main") {
                            res.status(400);
                            res.send("Cannot delete the Main user Account. Please select a different account.");
                        } else {
                            var accountIDtoDelete = accountToDelete['_id'];
                            deleted = true;
                            Account.remove({'_id': accountIDtoDelete}, function(err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log("DELETED!");
                                }
                            });
                            var conditions = { email: req.user.email };
                            var update = {$pull: {"accounts": {'_id': accountIDtoDelete}}};
                            var options = { multi: false };
                            User.update(conditions, update, options, callback);
                            res.redirect('/secure-home.html');
                        }
                    } else if (accountToDelete == null && i == accounts.length - 1 && !deleted) {
                        res.status(400);
                        res.send("Could not find account to delete. Please select a different account.");
                    }
                }
            }
        });
    });
    
    // Function to rename an existing account
    app.post('/renameAccount', function(req, res) {
        var inputAcc = req.body.accountToRename;
        var newName = req.body.newName;
        var renamed = false;
        User.findOne({'email': req.user.email}, function(err, currentUser) {
            if (err) {
                console.log("Something weird is going on....");
            } else {
                var currentUserAccounts = currentUser['accounts'];
                var accountToRename;
                for (var i = 0; i < currentUserAccounts.length; i++) {
                    if (currentUserAccounts[i]['_id'] == inputAcc || currentUserAccounts[i]['name'] == inputAcc) {
                        accountToRename = currentUserAccounts[i];
                        var query = Account.find( {$and: [ { 'userID': req.user._id }, { 'name': newName} ]});  
                        query.exec(function(err, acc) {
                            if (err) {
                                console.log("Something went wrong.");
                            } else {
                                if (acc.length == 0) {
                                    if (newName == "Main" || inputAcc == "Main") {
                                        res.status(400);
                                        res.send("Cannot rename Main account or name existing account Main.");
                                    } else {
                                        renamed = true;
                                        var conditions = {'_id': accountToRename['_id']};
                                        var update = { $set: {'name' : newName}};
                                        var options = { multi: false };
                                        Account.update(conditions, update, options, callback);
                                        accountToRename['name'] = newName;
                                        currentUser.markModified('accounts');
                                        currentUser.save(callback);
                                        res.redirect('/secure-home.html');
                                    } 
                                } else {
                                    res.status(400);
                                    res.send("Account with given name already exists. Please select a different name");
                                }
                            }
                        });
                    } else if (accountToRename == null && i == currentUserAccounts.length - 1) {
                        res.status(400);
                        res.send("Could not find account to rename.");
                    }
                } // End for loop over current user accounts
            }
        }); // End find current user
    });
    
}; // End Module Exports

// Callback function for saving new data to the database
function callback(err, numAffected) {
    if (err) { 
        console.log(err);
    } else {
        console.log(numAffected);
    } 
};
