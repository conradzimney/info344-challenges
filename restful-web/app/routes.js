// Encryption and MD5 hashing node modules
var bcrypt = require('bcrypt');
var md5 = require('MD5');

// User and Account Mongoose models
var User = require('../models/user.js');
var Account = require('../models/account.js');

module.exports = function(app, passport) {

    // Sign Up function for writing a new user to the database
    app.post('/signup', function(req, res, next) { 
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
                User.findOne({ email : req.body.email }, function(err, user) {
                    if (err)
                        res.send(err);
                    if (user) {
                        res.send("User already exists with this email address. Please use a different email."); 
                    } else {
                        var newUser = new User({
                            firstname: req.body.firstname,
                            lastname: req.body.lastname,
                            email: req.body.email,
                            password: hash,
                            accounts: []
                        });
                        var newAccount = new Account({
                            name: "Main",
                            userID: newUser._id,
                            balance: 100
                        });
                        newUser.accounts[0] = newAccount;
                        newAccount.save(function(err) {
                            if (err) {
                                res.send("Something went wrong...");
                            } else {
                                // console.log(newAccount);
                            }
                        });
                        newUser.save(function(err) {
                            if (err) {
                                res.send("Something went wrong...");
                            } else {
                                // console.log(newUser);
                                res.redirect('/');
                            }
                        });
                    }
                });
            });
        });
    });

    // This properly redirects bad credential users back to home page, and successfully signs users in 
    app.post('/signin', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) { 
                return next(err); 
            }
            if (!user) { 
                return res.send('Incorrect email and/or password'); 
            }
            req.logIn(user, function(err) {
                if (err) { 
                    console.log("Login unsuccessful...");
                    return next(err); 
                }
                return res.redirect('/secure-home.html');
            });
        })(req, res, next);
    });

    // GET of /signout should end the session and redirect back to the home page    
    app.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // Function to return the current user
    app.get('/getUser', function(req, res) {
        User.findOne({ 'email': req.user.email }, function (err, user) {
            if (err) {
                res.send(null);
            } else {
                res.send(user);
            }
        });
    });
    
    // Function to return the md5 hash to the client 
    app.get('/getmd5Hash', function(req, res) {
        var hash = md5(req.user.email);
        res.send(hash);
    });
    
};  // End Module Exports
