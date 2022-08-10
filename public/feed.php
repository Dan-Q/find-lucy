<?php
header('Content-type: application/atom+xml');

define( 'DB_NAME', '52reflect' );
define( 'DB_USER', '52reflect' );
define( 'DB_PASSWORD', 'DB PASSWORD GOES HERE' );
define( 'DB_HOST', 'localhost' );

$output = [];
$db = new mysqli( DB_HOST, DB_USER, DB_PASSWORD, DB_NAME );

date_default_timezone_set('UTC');
$db->query("SET time_zone = '+00:00';"); // GPS, and therefore our code, works in UTC

$result = $db->query("SELECT `datetime`, `latitude`, `longitude`, `popup`, `author`, `battery` FROM `find` WHERE `battery` = 10 OR (`battery` <= 2 AND `battery` > 0) OR `popup` IS NOT NULL ORDER BY `datetime` DESC LIMIT 30");
while ($row = $result->fetch_array(MYSQLI_ASSOC)){ $output[] = $row; }

echo '<?xml version="1.0" encoding="UTF-8" ?>'; ?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>Lucy Tracker Highlights</title>
<link href="https://theimprobable.blog/find/feed.php" rel="self" />
<id>https://theimprobable.blog/find/feed.php</id>
<updated><?php echo date('c', strtotime($output[0]['datetime'])); ?></updated>
<?php foreach ($output as $row) { ?>
<entry>
  <title><?php echo $row['datetime']; ?><?php if($row['battery'] > 0) echo ' (battery: ', $row['battery'], '%)'; ?></title>
  <id>https://theimprobable.blog/find/feed.php#<?php echo date('c', strtotime($row['datetime'])); ?></id>
  <updated><?php echo date('c', strtotime($row['datetime'])); ?></updated>
  <content type="html"><![CDATA[
    <p>
      Location:
      <a href="https://www.openstreetmap.org/?mlat=<?php echo $row['latitude']; ?>&amp;mlon=<?php echo $row['longitude']; ?>&amp;zoom=11#map=11/<?php echo $row['latitude']; ?>/<?php echo $row['longitude']; ?>">
        <?php echo $row['longitude'] ?>, <?php echo $row['latitude']; ?>
      </a>
    </p>
    <?php echo $row['popup']; ?>
    <?php if($row['battery'] > 0) { ?>
      <p>
        Tracker battery level: <?php echo $row['battery']; ?>%.
      </p>
    <?php } ?>
  ]]></content>
  <author>
    <name><?php echo($row['author'] ? $row['author'] : 'Lucy Tracker') ?></name>
  </author>
</entry>
<?php } ?>
</feed>
