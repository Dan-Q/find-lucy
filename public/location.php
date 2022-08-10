<?php
header('Content-type: application/json');

define( 'DB_NAME', '52reflect' );
define( 'DB_USER', '52reflect' );
define( 'DB_PASSWORD', 'DB PASSWORD GOES HERE' );
define( 'DB_HOST', 'localhost' );

$output = [];
$db = new mysqli( DB_HOST, DB_USER, DB_PASSWORD, DB_NAME );

$id = intval($_GET['expedition']);

if($id == 0){
  // list all expeditions
  $result = $db->query("SELECT `id`, `title`, CAST(`start_at` AS DATE) start_on FROM `find_expedition` ORDER BY start_at, end_at");
  while ($row = $result->fetch_array(MYSQLI_ASSOC)){ $output[] = $row; }
  echo( json_encode( $output ) );
  exit();
}

// get specific expedition
$result = $db->query("SELECT `title`, `start_at`, `end_at` FROM `find_expedition` WHERE `id` = $id");
$expedition = $result->fetch_array(MYSQLI_ASSOC);
$start_at = $expedition['start_at'];
$end_at = $expedition['end_at'];

$result = $db->query("
  SELECT `datetime`, `latitude`, `longitude`, `popup`, `author`, `battery` FROM `find` WHERE `datetime` >= '$start_at' AND `datetime` <= '$end_at'
  AND `suppress` = 0
  ORDER BY `datetime` DESC");
while ($row = $result->fetch_array(MYSQLI_ASSOC)){ $output[] = $row; }

echo( json_encode( $output ) );
