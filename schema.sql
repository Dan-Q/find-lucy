/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `find_expedition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `start_at` datetime NOT NULL,
  `end_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `find` (
  `datetime` datetime NOT NULL,
  `latitude` decimal(12,8) NOT NULL,
  `longitude` decimal(12,8) NOT NULL,
  `course` smallint(5) unsigned NOT NULL,
  `battery` tinyint(3) unsigned NOT NULL,
  `popup` text DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `suppress` tinyint(1) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;