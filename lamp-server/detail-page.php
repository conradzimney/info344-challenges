<?php 

require_once 'connection.php';
require_once 'models/movie-model.php';

// Retrieve the movie ID from the URL
$url = $_SERVER['REQUEST_URI'];
$splitURL = explode('=', $url);
$id = $splitURL[count($splitURL) - 1];

// Load movie from database with corresponding ID 
$conn = getConnection();
$movieModel = new Movies($conn);
$movie = $movieModel->select($id);  

// Format and save movie data properly
$title = $movie[0]['title'];   
$genre = $movie[0]['genre'];
$dist = $movie[0]['distributor'];
$rating = $movie[0]['rating'];
$date = calculateDate($movie[0]['released']);
$tickets = number_format($movie[0]['tickets']);
$gross = '$' . number_format($movie[0]['gross']);  
$imdb_id = $movie[0]['imdb_id'];

// Function to format a date from the database properly
function calculateDate($d) {
    $monthNum = substr($d, 5, 2);
    $day = substr($d, 8, 2);
    if ($monthNum == '01') {
        $month = 'Jan';
    } else if ($monthNum == '02') {
        $month = 'Feb';
    } else if ($monthNum == '03') {
        $month = 'Mar';
    } else if ($monthNum == '04') {
        $month = 'Apr';
    } else if ($monthNum == '05') {
        $month = 'May';
    } else if ($monthNum == '06') {
        $month = 'Jun';
    } else if ($monthNum == '07') {
        $month = 'Jul';
    } else if ($monthNum == '08') {
        $month = 'Aug';
    } else if ($monthNum == '09') {
        $month = 'Sep';
    } else if ($monthNum == '10') {
        $month = 'Oct';
    } else if ($monthNum == '11') {
        $month = 'Nov';
    } else if ($monthNum == '12') {
        $month = 'Dec';
    } 
    return $day . '-' . $month . '-2014';
}
    
// Retrieve movie data from Rotten Tomatoes API       
$url = "http://www.omdbapi.com/?i={$imdb_id}&tomatoes=true";
$json = file_get_contents($url);
$movieData = json_decode($json);     
  
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta charset="UTF-8">
    <link rel="icon" href="img/reel.jpeg">
    <title><?=htmlentities($title)?></title>
    
    <!-- Bootstrap & CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous"> 
    <link rel="stylesheet" href="css/main.css">

</head>
<body class="container">
   
    <div class="detail-text">
        <h1><?=htmlentities($title)?></h1>
        <p><?= htmlentities($genre)?> movie, rated <?=htmlentities($rating)?></p>
        <p>Released on <?=htmlentities($date)?></p>
        <p>Sold <?=htmlentities($tickets)?> tickets, earning a gross revenue of <?=htmlentities($gross)?></p>
        <h3>Rotten Tomatoes</h3>
        <p>Rated <?=htmlentities($movieData->tomatoUserMeter)?>% by <?=htmlentities($movieData->tomatoReviews)?></p>
        <p><?=htmlentities($movieData->tomatoConsensus)?></p>
    </div>
   
</body>
</html>