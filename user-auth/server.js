'use strict';

var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var passport = require('passport');
var mongoose = require('mongoose');
var bluebird = require('bluebird');
var bcrypt = require('bcrypt');
var md5 = require("MD5");

var app = express();
var currentUserEmail = "";
var facebookAuth = false;

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Mongo DB credentials and log in
var dbConfig = require('./secret/mongo-config.json');
var fbConfig = require('./secret/oauth-facebook.json');
mongoose.connect(dbConfig.url);
mongoose.connection.on('error', function(err) {
    console.error(err);
});

// Mongoose User model
var User = mongoose.model('User', {
    firstname: String,
    lastname: String,
    email: String,
    password: String
});

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
                        password: hash
                    });
                    newUser.save(function(err) {
                        if (err) {
                            res.send("Something went wrong...");
                        } else {
                            res.redirect('/');
                        }
                    });
                }
            });
        });
    });
});

// INITIALIZING  SESSION STORES //
// Set Cookie Value
var COOKIE_SIG_SECRET = process.env.COOKIE_SIG_SECRET;
if (!COOKIE_SIG_SECRET) {
    console.error('Please set COOKIE_SIG_SECRET');
    process.exit(1);
}

// Add session support to the application and tell it to store session data in our
// local Redis database (you can also pass) a {host: host-name} object to the RedisStore()
// constructor to use a different host 
app.use(session({
    secret: COOKIE_SIG_SECRET,
    resave: false,              // don't resave unmodified session data
    saveUninitialized: false,   // don't save uninitialized session data
    store: new RedisStore()     // new RedisStore({host: some.subdomain.amazonaws.com})
}));

// Local and Facebook strategy for passport authentication 
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

var facebookStrategy = new FacebookStrategy(fbConfig, 
    function(accessToken, refreshToken, profile, done) {
        console.log('Facebook Authentication Successful!');
        facebookAuth = true;
        currentUserEmail = profile.emails[0].value;
        User.findOne({ email : currentUserEmail }, function(err, user) {
            if (err)
                return done(err);
            if (user) {     // User with email already exists in database, return it
                return done(null, user); 
            } else {        // Save new user information from facebook to DB
                var newUser = new User({
                    email: currentUserEmail,
                    firstname: profile.name.givenName,
                    lastname: profile.name.familyName    
                });
                newUser.save(function(err) {
                    if (err)
                        throw err;
		            console.log("Successfully saved and authenticated new user with FB.");
                    return done(null, newUser);
                });
            }
        });
    }); 

var localStrategy = new LocalStrategy(function(username, password, done) {   
    facebookAuth = false;  
    User.findOne({ email: username }, function (err, user) {
        if (err) { 
            return done(err);
        }
        if (!user) { 
            console.log("User not found...");
            return done(null, false); 
        }
        bcrypt.compare(password, user.password, function(err, res) {
            if (res) {
                currentUserEmail = user.email;
		        console.log("Successfully authenticated user!");
                return done(null, user);
            } else {
                console.log("Passwords don't match...");
                return done(null, false); 
            }
        });
    });
});

// Use the configured local strategy and facebook authentication strategy 
passport.use(localStrategy);  
passport.use(facebookStrategy);    

passport.serializeUser(function(user, done) { 
    done(null, user); 
});
passport.deserializeUser(function(user, done) { 
    done(null, user); 
});

app.use(passport.initialize()); //add authentication to the app 
app.use(passport.session());    //add session support to the app

// Tell express to serve static files from the /static/public -- subdirectory (any user can see these)
app.use(express.static(__dirname + '/static/public'));

require('./app/routes.js')(app, passport); 

// This properly redirects bad credential users back to home page, and successfully signins in
app.post('/signin', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) { 
            return next(err); 
        }
        if (!user) { 
            console.log("Email does not exist in db");
            return res.send('Incorrect email and/or password'); 
        }
        req.logIn(user, function(err) {
            if (err) { 
                console.log("Login unsuccessful...");
                return next(err); 
            }
	        console.log("Successful authentication: "+req.isAuthenticated());
            return res.redirect('/secure-home.html');
        });
    })(req, res, next);
}); 

// Add a middleware function to verify that the user is authenticated: if so, continue processing; 
// if not, redirect back to the home page
app.use(function(req, res, next) {
    console.log("Are you authenticated?");
    if (req.isAuthenticated()) {
        console.log("Authenticated!");
        next();    
    } else {
        console.log("Not authenticated!");
        res.redirect('/');
    }
});

app.use(express.static(__dirname + '/static/secure')); 

// Start the server
app.listen(80, function() {
    console.log('Server is listening...');
});

app.get('/getUser', function(req, res) {
    User.findOne({ 'email': currentUserEmail }, function (err, user) {
        if (err) {
            res.send(null);
        } else {
            res.send(user);
        }
    });
});

// Function to change the user's email
app.post('/changeEmail', function(req, res) {
    console.log("Changing user email...");
    User.findOne({ 'email': req.body.email }, function (err, user) {
        if (err) {
            console.log("There was an error: "+err);
        } else if (user) { 
            console.log("Email is already in use by another user.");
        } else {
            var conditions = { email: currentUserEmail };
            var update = { $set: { email: req.body.email}};
            var options = { multi: false };
            User.update(conditions, update, options, callback);
            function callback(err, numAffected) {
                if (err) { 
                    console.log(err);
                } else {
                    currentUserEmail = req.body.email;
                    console.log(numAffected);
                } 
            };            
        }
    });
    res.redirect('/profile.html');
});

// Function to change the user's password
app.post('/changePassword', function(req, res) {
    console.log("Changing user password...");
    console.log("FacebookAuth? "+facebookAuth);
    if (facebookAuth) {
        console.log("Cannot change Facebook password through this site.");
        res.send("Cannot change Facebook password through this site.");
    } else { // facebookAuth == false
        User.findOne({ 'email': currentUserEmail }, function (err, user) {
            if (err) {
                console.log(err);
            }
            if (!user) { 
                console.log("User associated with "+currentUserEmail+" not found...");
            }
            bcrypt.compare(req.body.oldpassword, user.password, function(error, result) {
                console.log("Saving new password to db...");
                if (error) {
                    console.log("Something went wrong with the compare");
                }
                if (result) {
                    bcrypt.genSalt(10, function(err, salt) {
                        bcrypt.hash(req.body.confirmpassword, salt, function(err, hash) {
                            var conditions = { email: currentUserEmail };
                            var update = { $set: { password: hash}};
                            var options = { multi: false };
                            User.update(conditions, update, options, callback);
                            function callback(err, numAffected) {
                                if (err) { 
                                    console.log(err);
                                } else {
                                    console.log(numAffected);
                                } 
                            };
                        });
                    });
                } else {
                    console.log("Old password is incorrect...");
                }
            }); 
        });        
    }
    res.redirect('/profile.html');
});

// Function to change the user's first name
app.post('/changeFirstName', function(req, res) {
    console.log("Changing user first name...");
    var conditions = { email: currentUserEmail };
    var update = { $set: { firstname: req.body.firstname}};
    var options = { multi: false };
    User.update(conditions, update, options, callback);
    function callback(err, numAffected) {
        if (err) { 
            console.log(err);
        } else {
            console.log(numAffected);
        } 
    };
    res.redirect('/profile.html');
});

// Function to change the user's last name
app.post('/changeLastName', function(req, res) {
    console.log("Changing user last name...");
    var conditions = { email: currentUserEmail };
    var update = { $set: { lastname: req.body.lastname}};
    var options = { multi: false };
    User.update(conditions, update, options, callback);
    function callback(err, numAffected) {
        if (err) { 
            console.log(err);
        } else {
            console.log(numAffected);
        } 
    };
    res.redirect('/profile.html');
});

// Function to return the md5 hash to the client 
app.get('/getmd5Hash', function(req, res) {
    var hash = md5(currentUserEmail);
    res.send(hash);
});