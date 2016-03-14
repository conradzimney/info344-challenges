<?php

require_once 'connection.php';
require_once 'models/movie-model.php';

// Get user input query
$q = $_GET['q'];

// Load movies from database with $q in their title
$conn = getConnection();
$movieModel = new Movies($conn);
$matches = $movieModel->search($q);   

// Array of movie arrays with proper formatting with column 'ID' as array index 
$moviesToShow = array();              

// Process each matched movie, format it properly, and save it in $moviesToShow
foreach ($matches as $match) {         
    $moviesToShow[$match['ID']] = array(
        'title' => $match['title'],
        'release-date' => calculateDate($match['released']), 
        'tickets-sold' => number_format($match['tickets']),
        'gross' => '$' . number_format($match['gross']),
        'imdb_id' => $match['imdb_id'],
        'ID' => $match['ID']
    );
}

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

// For debugging
function debug_to_console( $data ) {
    if ( is_array( $data ) )
        $output = "<script>console.log( 'Debug Objects: " . implode( ',', $data) . "' );</script>";
    else
        $output = "<script>console.log( 'Debug Objects: " . $data . "' );</script>";
    echo $output;
}

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta charset="UTF-8">
    <link rel="icon" href="img/reel.jpeg">
    <title>Movies of 2014</title>
    
    <!-- Bootstrap & CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/main.css">

</head>
<body class="container">
    <h1>Movies of 2014</h1>
    <form action="" method="GET">
        <div class="form-group">
            <input type="text" 
                id="qInput" 
                name="q"
                class="form-control" 
                value="<?=htmlentities($q)?>"
                placeholder="Search by movie title"
                >
        </div>
    </form>
    <table class="table">
        <thead>
            <th class="text-left">Title</th>
            <th class="text-right">Release Date</th>
            <th class="text-right">Tickets Sold</th>
            <th class="text-right">Gross Revenue</th>
        </thead>
        <tbody>
            <?php foreach($moviesToShow as $movie):?>
                <tr>
                    <td class="text-left"><a href="detail-page.php?id=<?=htmlentities($movie['ID'])?>"><?=htmlentities($movie['title'])?></a></td>
                    <td class="text-right"><?=htmlentities($movie['release-date'])?></td> 
                    <td class="text-right"><?=htmlentities($movie['tickets-sold'])?></td> 
                    <td class="text-right"><?=htmlentities($movie['gross'])?></td> 
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <p>
        <a rel="GitHub Repo" class="center" href="https://github.com/INFO344-win-2016/challenges-conradzimney">Link to Repository on GitHub</a>
    </p>
</body>
</html>