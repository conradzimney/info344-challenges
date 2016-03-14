'use strict';

var goodColor = "#66cc66";
var badColor = "#ff6666";

// Show user feedback about whether or not passwords match
function checkPasswords() {
    var pass1 = document.getElementById('new-password');
    var pass2 = document.getElementById('confirm-password');
    var message = document.getElementById('confirmMessage');
    if (pass1.value == pass2.value) {
        pass2.style.backgroundColor = goodColor;
        message.style.color = goodColor;
        message.innerHTML = "Passwords Match";
        return true;
    } else {
        pass2.style.backgroundColor = badColor;
        message.style.color = badColor;
        message.innerHTML = "Please use the same password";
        return false;
    } 
};        

// Validate that the new passwords match for signing up form
function validateForm() {
    if (document.forms["signup-form"]["password"].value != document.forms["signup-form"]["confirm-password"].value) {
        alert("Passwords do not match");
        return false;
    }
};

// Validate that the new passwords match for the profile form
function validateProfileForm() {
    if (document.forms["changepassword-form"]["new-password"].value != document.forms["changepassword-form"]["confirm-password"].value) {
        alert("Passwords do not match");
        return false;
    }
};

// Load user information onto the page on load
function loadProfilePage() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var text = xhttp.responseText;
            var json = JSON.parse(text);
            document.getElementById("header").innerHTML = json['firstname'] + "\'s Awesome Profile";
            document.getElementById("first").innerHTML = '<b>First Name:</b> ' + json['firstname'];
            document.getElementById("last").innerHTML = '<b>Last Name:</b> ' + json['lastname'];
            document.getElementById("email").innerHTML = '<b>Email:</b> ' + json['email'];
        }
    };
    xhttp.open("GET", "/getUser", true);
    xhttp.send();
};

// Load user Gravatar image 
function loadGravatar() {
    var xhttpHASH = new XMLHttpRequest();
    xhttpHASH.onreadystatechange = function() {
        if (xhttpHASH.readyState == 4 && xhttpHASH.status == 200) {
            var text = xhttpHASH.responseText;
            document.getElementById("gravatar").src = 'http://www.gravatar.com/avatar/' + text;
            console.log('Gravtar link: http://www.gravatar.com/avatar/' + text);
        }
    };
    xhttpHASH.open("GET", "/getmd5Hash", true);
    xhttpHASH.send();
}

// Load user data and accounts onto the page            
function loadSecurePage() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var text = xhttp.responseText;
            var json = JSON.parse(text);
            document.getElementById("header").innerHTML = json['firstname'] + "\'s Secure Rupee Exchange Home Page!";
        }
    };
    xhttp.open("GET", "/getUser", true);
    xhttp.send();
};

// Load user accounts onto the page
function loadAccounts() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var text = xhttp.responseText;
            var json = JSON.parse(text);
            var tr;
            for (var i = 0; i < json.length; i++) {
                tr = $('<tr/>');
                tr.append("<td>" + json[i]['_id'] + "</td>");
                tr.append("<td class=\"text-left\">" + json[i]['name'] + "</td>");
                tr.append("<td class=\"text-right\">" + json[i]['balance'] + "</td>");
                $('#accountsTable').append(tr);
            }
        }
    };
    xhttp.open("GET", "/getAccounts", true);
    xhttp.send();
}

// Load 20 most recent transactions
function loadTransactions() {
    var xhttp = new XMLHttpRequest();
    getTrans(xhttp);
    xhttp.open("GET", "/getTrans", true);
    xhttp.send();
};

// Load next 20 most recent transactions on top of the first loaded ones
function loadMoreTrans() {
    var xhttp = new XMLHttpRequest();
    $("#transTable td").remove();
    getTrans(xhttp);
    xhttp.open("GET", "/getMoreTrans", true);
    xhttp.send();
};

// Helper function to load and format user transactions onto the page
function getTrans(xhttp) {
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var text = xhttp.responseText;
            var json = JSON.parse(text);
            var tr;
            for (var i = 0; i < json.length; i++) {
                tr = $('<tr/>');
                tr.append("<td>" + json[i]['_id'] + "</td>");
                tr.append("<td>" + json[i]['sourceAccountID'] + "</td>");
                tr.append("<td>" + json[i]['destinationAccountID'] + "</td>");
                tr.append("<td>" + json[i]['initiatorEmail'] + "</td>");
                tr.append("<td>" + json[i]['destinationUserEmail'] + "</td>");
                tr.append("<td>" + json[i]['desc'] + "</td>");
                tr.append("<td class=\"text-right\">" + json[i]['dateString'] + "</td>");
                tr.append("<td class=\"text-right\">" + json[i]['amount'] + "</td>");
                $('#transTable').append(tr);
            }
        }
    };
}