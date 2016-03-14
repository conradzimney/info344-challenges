'use strict';

// Node modules
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
var moment = require("moment-timezone");

var app = express();                    // Start express

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

// Mongo DB credentials and log in
var dbConfig = require('./secret/mongo-config.json');
mongoose.connect(dbConfig.url);
mongoose.connection.on('error', function(err) {
    console.error(err);
});

// Mongoose User, Account, and Transaction models
var User = require('./models/user.js');
var Account = require('./models/account.js');
var Transaction = require('./models/transaction.js');

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

// Local strategy for passport authentication 
var LocalStrategy = require('passport-local').Strategy; 

var localStrategy = new LocalStrategy(function(username, password, done) {   
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
                return done(null, user);
            } else {
                return done(null, false); 
            }
        });
    });
});

// Use the configured local strategy
passport.use(localStrategy);  

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

// Require the routes to sign in, up, and out, and retrieve other information about the current user
var routes = require('./app/routes.js');
routes(app, passport); 

// Add a middleware function to verify that the user is authenticated: if so, continue processing; 
// if not, redirect back to the home page
app.use(function(req, res, next) {
    if (req.isAuthenticated()) {
        next();    
    } else {
        res.redirect('/');
    }
});

// Serve files from statis secure folder since the user is authenticated at this point
app.use(express.static(__dirname + '/static/secure')); 

// Start the server
app.listen(80, function() {
    console.log('Server is listening...');
});

// Require the routes to edit user's information on their profile page
var userRoutes = require('./app/user-routes.js');
userRoutes(app);

// Require the routes to edit user account information 
var accountRoutes = require('./app/account-routes.js');
accountRoutes(app);

// Require the routes to create new transactions
var transactionRoutes = require('./app/transaction-routes.js');
transactionRoutes(app);