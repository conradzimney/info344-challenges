'use strict';

var maximum = 20;
var source;
var isDone;

// Load suggestions from the server and display them on the page
function getSuggestions(input) {
    if (isDone) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var text = xhttp.responseText;
                var json = JSON.parse(text);
                console.log(json);
                $("#suggestionsTable tr").remove();
                var tr;
                for (var i = 0; i < json.length; i++) {
                    tr = $('<tr/>');
                    if (source == "wiki") {     // Load Wikipedia page links
                        tr.append("<td><a target=\"_blank\" href=\"https://en.wikipedia.org/wiki/"+json[i]+"\">"+json[i]+"</a></td>");
                    } else {                    // Default to using Dictionary links
                        tr.append("<td><a target=\"_blank\" href=\"http://dictionary.reference.com/browse/"+json[i]+"\">"+json[i]+"</a></td>");
                    }
                    $('#suggestionsTable').append(tr);
                }
            }
        };
        var query = "/api/v1/suggestions/q=" + input + "&max=" + maximum;
        xhttp.open("POST", query, true);
        xhttp.send();
    } else {
        $("#suggestionsTable tr").remove();
        var tr = $('<tr/>');
        tr.append("<td>Data is not done loading yet. Please try again in 30 seconds.</td>");
        $('#suggestionsTable').append(tr);
    }
    
};

// Load the source file name from the server to determine what links to provide on suggestions
function getSource() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var text = xhttp.responseText;
            var json = JSON.parse(text);
            source = json[0];
        }
    };
    xhttp.open("POST", "/api/v1/source", true);
    xhttp.send();
}

// Check whether or not the data is done being loaded request to the server
function checkStatus() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var text = xhttp.responseText;
            var json = JSON.parse(text);
            isDone = json[0];
        }
    };
    xhttp.open("POST", "/api/v1/check", true);
    xhttp.send();
}

// Handle changing the maximum value from dropdown menu
document.getElementById("max").onchange = function() {
    maximum = this.value;
}

// Check the loading status every 5 seconds
setInterval(function() {
    checkStatus();
}, 1000);