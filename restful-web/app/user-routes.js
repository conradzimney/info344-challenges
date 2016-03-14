var bcrypt = require('bcrypt');

// User and Account Mogoose Models
var User = require('../models/user.js');
var Account = require('../models/account.js');

module.exports = function(app) {
      
    // Function to change the user's email
    app.post('/changeEmail', function(req, res) {
        User.findOne({ 'email': req.body.email }, function (err, user) {
            if (err) {
                console.log("There was an error: "+err);
            } else if (user) { 
                res.send("Email is already in use by another user.");
            } else {
                var conditions = { email: req.user.email };
                var update = { $set: { email: req.body.email}};
                var options = { multi: false };
                User.update(conditions, update, options, callback);
                function callback(err, numAffected) {
                    if (err) { 
                        console.log(err);
                        res.redirect('/profile.html');
                    } else {
                        req.user.email = req.body.email;
                        res.redirect('/profile.html');
                        console.log(numAffected);
                    } 
                };            
            }
        });
    });

    // Function to change the user's password
    app.post('/changePassword', function(req, res) {
        User.findOne({ 'email': req.user.email }, function (err, user) {
            if (err) {
                console.log(err);
            }
            if (!user) { 
                console.log("User associated with "+req.user.email+" not found...");
            }
            bcrypt.compare(req.body.oldpassword, user.password, function(error, result) {
                if (error) {
                    console.log("Something went wrong with the compare");
                }
                if (result) {
                    bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(req.body.confirmpassword, salt, function(err, hash) {
                            var conditions = { email: req.user.email };
                            var update = { $set: { password: hash}};
                            var options = { multi: false };
                            User.update(conditions, update, options, callback);
                        });
                    });
                } else {
                    res.status(400);
                    res.send("Old password is incorrect. Please try again.");
                }
            }); 
        });        
        res.redirect('/profile.html');
    });

    // Function to change the user's first name
    app.post('/changeFirstName', function(req, res) {
        var conditions = { email: req.user.email };
        var update = { $set: { firstname: req.body.firstname}};
        var options = { multi: false };
        User.update(conditions, update, options, callback);
        res.redirect('/profile.html');
    });

    // Function to change the user's last name
    app.post('/changeLastName', function(req, res) {
        var conditions = { email: req.user.email };
        var update = { $set: { lastname: req.body.lastname}};
        var options = { multi: false };
        User.update(conditions, update, options, callback);
        res.redirect('/profile.html');
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
