module.exports = function(app, passport) {
    // Route for facebook authentication 
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // Callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect : '/secure-home.html',
        failureRedirect : '/'
    }));

    // GET of /signout should end the session and redirect back to the home page    
    app.get('/signout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

};
