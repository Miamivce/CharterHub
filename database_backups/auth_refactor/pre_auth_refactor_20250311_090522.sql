-- MySQL dump 10.13  Distrib 9.2.0, for macos14.7 (arm64)
--
-- Host: localhost    Database: charterhub_local
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dev_users`
--

DROP TABLE IF EXISTS `dev_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dev_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_users`
--

LOCK TABLES `dev_users` WRITE;
/*!40000 ALTER TABLE `dev_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `dev_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_auth_logs`
--

DROP TABLE IF EXISTS `wp_auth_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_auth_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `action` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wp_auth_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `wp_users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_auth_logs`
--

LOCK TABLES `wp_auth_logs` WRITE;
/*!40000 ALTER TABLE `wp_auth_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_auth_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_booking_documents`
--

DROP TABLE IF EXISTS `wp_booking_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_booking_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('proposal','brochure','contract','payment_overview','preference_sheet','sample_menu','crew_profiles','itinerary','passport_details','captains_details','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('file','link','form') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'file',
  `visibility` enum('main_charterer','all') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'main_charterer',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `wp_booking_documents_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `wp_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_booking_documents`
--

LOCK TABLES `wp_booking_documents` WRITE;
/*!40000 ALTER TABLE `wp_booking_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_booking_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_booking_guests`
--

DROP TABLE IF EXISTS `wp_booking_guests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_booking_guests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_main_charterer` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `wp_booking_guests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `wp_bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_booking_guests`
--

LOCK TABLES `wp_booking_guests` WRITE;
/*!40000 ALTER TABLE `wp_booking_guests` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_booking_guests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bookings`
--

DROP TABLE IF EXISTS `wp_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `yacht_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `guests` int NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `special_requests` text COLLATE utf8mb4_unicode_ci,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `wp_bookings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `wp_users` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bookings`
--

LOCK TABLES `wp_bookings` WRITE;
/*!40000 ALTER TABLE `wp_bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_charterhub_auth_logs`
--

DROP TABLE IF EXISTS `wp_charterhub_auth_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_charterhub_auth_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `status` enum('success','failure') NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `action` (`action`),
  KEY `status` (`status`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=159 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_charterhub_auth_logs`
--

LOCK TABLES `wp_charterhub_auth_logs` WRITE;
/*!40000 ALTER TABLE `wp_charterhub_auth_logs` DISABLE KEYS */;
INSERT INTO `wp_charterhub_auth_logs` VALUES (1,28,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-04 20:14:21'),(2,28,'token_refresh','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-04 21:11:18'),(3,28,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-04 21:12:04'),(4,28,'token_refresh','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-04 23:06:15'),(8,28,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-05 08:48:23'),(9,28,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-05 08:58:26'),(10,1,'login','success','::1','curl/8.7.1','{\"token_id\": \"5\", \"expires_at\": \"2025-03-07 12:16:31\"}','2025-03-07 12:16:31'),(11,1,'login','success','::1','curl/8.7.1','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test1@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"curl/8.7.1\"}','2025-03-07 12:16:31'),(12,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"6\", \"expires_at\": \"2025-03-07 12:17:00\"}','2025-03-07 12:17:00'),(13,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-07 12:17:00'),(14,8,'login','success','::1','curl/8.7.1','{\"token_id\": \"7\", \"expires_at\": \"2025-03-07 12:29:49\"}','2025-03-07 12:29:49'),(15,8,'login','success','::1','curl/8.7.1','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:29:49'),(16,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"8\", \"expires_at\": \"2025-03-07 12:31:58\"}','2025-03-07 12:31:58'),(17,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:31:58'),(18,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"9\", \"expires_at\": \"2025-03-07 12:32:10\"}','2025-03-07 12:32:10'),(19,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:32:10'),(20,8,'login','success','::1','curl/8.7.1','{\"token_id\": \"10\", \"expires_at\": \"2025-03-07 12:35:25\"}','2025-03-07 12:35:25'),(21,8,'login','success','::1','curl/8.7.1','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:35:25'),(22,8,'login','success','::1','curl/8.7.1','{\"token_id\": \"11\", \"expires_at\": \"2025-03-07 12:36:03\"}','2025-03-07 12:36:03'),(23,8,'login','success','::1','curl/8.7.1','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:36:03'),(24,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"12\", \"expires_at\": \"2025-03-07 12:37:18\"}','2025-03-07 12:37:18'),(25,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:37:18'),(26,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"13\", \"expires_at\": \"2025-03-07 12:47:16\"}','2025-03-07 12:47:16'),(27,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:47:16'),(28,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"15\", \"expires_at\": \"2025-03-07 12:50:14\"}','2025-03-07 12:50:14'),(29,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:50:14'),(30,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"17\", \"expires_at\": \"2025-03-07 12:55:28\"}','2025-03-07 12:55:28'),(31,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 12:55:29'),(32,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"19\", \"expires_at\": \"2025-03-07 13:00:45\"}','2025-03-07 13:00:45'),(33,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 13:00:45'),(34,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"21\", \"expires_at\": \"2025-03-07 13:08:18\"}','2025-03-07 13:08:18'),(35,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 13:08:19'),(36,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"23\", \"expires_at\": \"2025-03-07 13:12:54\"}','2025-03-07 13:12:54'),(37,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 13:12:54'),(38,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"25\", \"expires_at\": \"2025-03-07 13:22:29\"}','2025-03-07 13:22:29'),(39,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 13:22:29'),(40,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"27\", \"expires_at\": \"2025-03-07 13:39:33\"}','2025-03-07 13:39:33'),(41,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 13:39:33'),(42,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"29\", \"expires_at\": \"2025-03-07 13:54:26\"}','2025-03-07 13:54:26'),(43,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 13:54:26'),(44,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"31\", \"expires_at\": \"2025-03-07 13:54:45\"}','2025-03-07 13:54:45'),(45,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-07 13:54:45'),(46,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"33\", \"expires_at\": \"2025-03-07 14:15:04\"}','2025-03-07 14:15:04'),(47,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-07 14:15:04'),(48,4,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"35\", \"expires_at\": \"2025-03-07 14:19:01\"}','2025-03-07 14:19:01'),(49,4,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test2@me.com\"}','2025-03-07 14:19:01'),(50,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"37\", \"expires_at\": \"2025-03-07 14:23:40\"}','2025-03-07 14:23:40'),(51,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test1@me.com\"}','2025-03-07 14:23:40'),(52,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"39\", \"expires_at\": \"2025-03-07 14:24:10\"}','2025-03-07 14:24:10'),(53,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test1@me.com\"}','2025-03-07 14:24:10'),(54,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"41\", \"expires_at\": \"2025-03-07 14:27:14\"}','2025-03-07 14:27:14'),(55,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 14:27:14'),(56,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"43\", \"expires_at\": \"2025-03-07 14:28:01\"}','2025-03-07 14:28:01'),(57,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test1@me.com\"}','2025-03-07 14:28:01'),(58,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"45\", \"expires_at\": \"2025-03-07 14:28:12\"}','2025-03-07 14:28:12'),(59,1,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test1@me.com\"}','2025-03-07 14:28:12'),(60,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"47\", \"expires_at\": \"2025-03-07 14:28:22\"}','2025-03-07 14:28:22'),(61,8,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test5@me.com\"}','2025-03-07 14:28:22'),(62,NULL,'signup','failure','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test8@me.com\", \"reason\": \"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'user_registered\' in \'field list\'\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-07 14:29:05'),(63,4,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"49\", \"expires_at\": \"2025-03-07 14:46:48\"}','2025-03-07 14:46:48'),(64,4,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test2@me.com\"}','2025-03-07 14:46:48'),(65,NULL,'signup','failure','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test9@me.com\", \"reason\": \"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'user_registered\' in \'field list\'\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-07 14:48:19'),(66,NULL,'signup','failure','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test8@me.com\", \"reason\": \"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'user_registered\' in \'field list\'\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-07 14:51:45'),(67,NULL,'signup','failure','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test10@me.com\", \"reason\": \"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'user_registered\' in \'field list\'\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-07 14:53:48'),(68,NULL,'signup','failure','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test11@me.com\", \"reason\": \"SQLSTATE[42S22]: Column not found: 1054 Unknown column \'user_registered\' in \'field list\'\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}','2025-03-07 14:56:18'),(69,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"51\", \"expires_at\": \"2025-03-07 15:15:50\"}','2025-03-07 15:15:50'),(70,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\"}','2025-03-07 15:15:50'),(71,12,'register','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test10@me.com\", \"lastName\": \"Kippur\", \"username\": \"jomkippur\", \"firstName\": \"Jom\"}','2025-03-07 15:21:09'),(72,12,'dev_email_verification','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"test10@me.com\", \"dev_mode\": true, \"verification_time\": \"2025-03-07 14:21:12\"}','2025-03-07 15:21:12'),(73,12,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"53\", \"expires_at\": \"2025-03-07 15:21:25\"}','2025-03-07 15:21:25'),(74,12,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test10@me.com\"}','2025-03-07 15:21:25'),(75,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"55\", \"expires_at\": \"2025-03-08 10:13:03\"}','2025-03-08 10:13:03'),(76,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\"}','2025-03-08 10:13:03'),(77,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"57\", \"expires_at\": \"2025-03-08 10:20:50\"}','2025-03-08 10:20:50'),(78,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-08 10:20:50'),(79,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"59\", \"expires_at\": \"2025-03-08 10:31:06\"}','2025-03-08 10:31:06'),(80,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\"}','2025-03-08 10:31:06'),(81,13,'register','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"Test11@me.com\", \"lastName\": \"Verryck\", \"username\": \"marieverryck\", \"firstName\": \"Marie\"}','2025-03-08 10:45:22'),(82,13,'dev_email_verification','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"email\": \"test11@me.com\", \"dev_mode\": true, \"verification_time\": \"2025-03-08 09:45:25\"}','2025-03-08 10:45:25'),(83,13,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"61\", \"expires_at\": \"2025-03-08 10:45:41\"}','2025-03-08 10:45:41'),(84,13,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test11@me.com\"}','2025-03-08 10:45:41'),(85,13,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"63\", \"expires_at\": \"2025-03-08 12:09:44\"}','2025-03-08 12:09:44'),(86,13,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test11@me.com\"}','2025-03-08 12:09:44'),(87,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"65\", \"expires_at\": \"2025-03-10 09:12:10\"}','2025-03-10 09:12:10'),(88,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 09:12:10'),(89,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"67\", \"expires_at\": \"2025-03-10 10:04:48\"}','2025-03-10 10:04:48'),(90,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 10:04:48'),(91,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"69\", \"expires_at\": \"2025-03-10 10:45:40\"}','2025-03-10 10:45:40'),(92,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 10:45:40'),(93,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"71\", \"expires_at\": \"2025-03-10 11:12:36\"}','2025-03-10 11:12:36'),(94,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:12:36'),(95,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"73\", \"expires_at\": \"2025-03-10 11:29:48\"}','2025-03-10 11:29:48'),(96,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:29:48'),(97,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"75\", \"expires_at\": \"2025-03-10 11:45:19\"}','2025-03-10 11:45:19'),(98,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:45:19'),(99,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"77\", \"expires_at\": \"2025-03-10 11:47:37\"}','2025-03-10 11:47:37'),(100,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:47:37'),(101,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"79\", \"expires_at\": \"2025-03-10 11:51:33\"}','2025-03-10 11:51:33'),(102,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:51:33'),(103,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"81\", \"expires_at\": \"2025-03-10 11:53:16\"}','2025-03-10 11:53:16'),(104,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\"}','2025-03-10 11:53:16'),(105,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"83\", \"expires_at\": \"2025-03-10 11:54:41\"}','2025-03-10 11:54:41'),(106,5,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\"}','2025-03-10 11:54:41'),(107,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"85\", \"expires_at\": \"2025-03-10 11:57:49\"}','2025-03-10 11:57:49'),(108,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:57:49'),(109,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"87\", \"expires_at\": \"2025-03-10 11:59:06\"}','2025-03-10 11:59:06'),(110,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:59:06'),(111,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"89\", \"expires_at\": \"2025-03-10 11:59:24\"}','2025-03-10 11:59:24'),(112,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 11:59:24'),(113,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"91\", \"expires_at\": \"2025-03-10 12:01:35\"}','2025-03-10 12:01:35'),(114,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 12:01:35'),(115,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"93\", \"expires_at\": \"2025-03-10 12:03:40\"}','2025-03-10 12:03:40'),(116,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 12:03:40'),(117,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"95\", \"expires_at\": \"2025-03-10 12:07:45\"}','2025-03-10 12:07:45'),(118,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 12:07:45'),(119,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"97\", \"expires_at\": \"2025-03-10 13:01:46\"}','2025-03-10 13:01:46'),(120,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 13:01:46'),(121,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"99\", \"expires_at\": \"2025-03-10 13:42:29\"}','2025-03-10 13:42:29'),(122,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 13:42:29'),(123,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"101\", \"expires_at\": \"2025-03-10 13:52:21\"}','2025-03-10 13:52:21'),(124,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 13:52:21'),(125,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"103\", \"expires_at\": \"2025-03-10 14:55:48\"}','2025-03-10 14:55:48'),(126,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 14:55:48'),(127,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"105\", \"expires_at\": \"2025-03-10 15:08:04\"}','2025-03-10 15:08:04'),(128,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 15:08:04'),(129,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"107\", \"expires_at\": \"2025-03-10 15:24:49\"}','2025-03-10 15:24:49'),(130,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 15:24:49'),(131,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"109\", \"expires_at\": \"2025-03-10 15:30:42\"}','2025-03-10 15:30:42'),(132,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 15:30:42'),(133,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"111\", \"expires_at\": \"2025-03-10 15:54:39\"}','2025-03-10 15:54:39'),(134,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 15:54:39'),(135,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"113\", \"expires_at\": \"2025-03-10 16:05:26\"}','2025-03-10 16:05:26'),(136,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 16:05:26'),(137,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"115\", \"expires_at\": \"2025-03-10 16:43:50\"}','2025-03-10 16:43:50'),(138,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 16:43:50'),(139,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"117\", \"expires_at\": \"2025-03-10 16:53:53\"}','2025-03-10 16:53:53'),(140,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 16:53:53'),(141,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"119\", \"expires_at\": \"2025-03-10 17:10:08\"}','2025-03-10 17:10:08'),(142,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 17:10:08'),(143,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"121\", \"expires_at\": \"2025-03-10 17:20:14\"}','2025-03-10 17:20:14'),(144,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 17:20:14'),(145,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"123\", \"expires_at\": \"2025-03-10 20:17:02\"}','2025-03-10 20:17:02'),(146,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:17:02'),(147,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"125\", \"expires_at\": \"2025-03-10 20:22:56\"}','2025-03-10 20:22:56'),(148,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:22:56'),(149,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"127\", \"expires_at\": \"2025-03-10 20:26:38\"}','2025-03-10 20:26:38'),(150,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:26:38'),(151,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"129\", \"expires_at\": \"2025-03-10 20:31:12\"}','2025-03-10 20:31:12'),(152,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:31:12'),(153,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"131\", \"expires_at\": \"2025-03-10 20:35:55\"}','2025-03-10 20:35:55'),(154,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:35:55'),(155,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"133\", \"expires_at\": \"2025-03-10 20:45:19\"}','2025-03-10 20:45:19'),(156,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:45:19'),(157,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"token_id\": \"135\", \"expires_at\": \"2025-03-10 20:54:26\"}','2025-03-10 20:54:26'),(158,6,'login','success','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test4@me.com\"}','2025-03-10 20:54:26');
/*!40000 ALTER TABLE `wp_charterhub_auth_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_charterhub_booking_guests`
--

DROP TABLE IF EXISTS `wp_charterhub_booking_guests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_charterhub_booking_guests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_user` (`booking_id`,`user_id`),
  KEY `booking_id` (`booking_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wp_charterhub_booking_guests_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `wp_charterhub_bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wp_charterhub_booking_guests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `wp_users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_charterhub_booking_guests`
--

LOCK TABLES `wp_charterhub_booking_guests` WRITE;
/*!40000 ALTER TABLE `wp_charterhub_booking_guests` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_charterhub_booking_guests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_charterhub_bookings`
--

DROP TABLE IF EXISTS `wp_charterhub_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_charterhub_bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `yacht_id` bigint NOT NULL,
  `main_charterer_id` bigint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `main_charterer_id` (`main_charterer_id`),
  KEY `yacht_id` (`yacht_id`),
  KEY `status` (`status`),
  CONSTRAINT `wp_charterhub_bookings_ibfk_1` FOREIGN KEY (`main_charterer_id`) REFERENCES `wp_users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_charterhub_bookings`
--

LOCK TABLES `wp_charterhub_bookings` WRITE;
/*!40000 ALTER TABLE `wp_charterhub_bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_charterhub_bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_charterhub_clients`
--

DROP TABLE IF EXISTS `wp_charterhub_clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_charterhub_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'charter_client',
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `verification_token` varchar(255) DEFAULT NULL,
  `verification_expires` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_charterhub_clients`
--

LOCK TABLES `wp_charterhub_clients` WRITE;
/*!40000 ALTER TABLE `wp_charterhub_clients` DISABLE KEYS */;
INSERT INTO `wp_charterhub_clients` VALUES (1,'kevinpeters','test1@me.com','$2y$12$5SpXqq3FtKCrrCqCCGUCL.vSlMZNaKBir4sJ6NFG0NCE1BYc8ZUKa','Kevin Peters','Kevin','Peters','charter_client',1,NULL,NULL,NULL,'2025-03-07 09:06:27','2025-03-07 09:06:27'),(4,'robinjansses','test2@me.com','$2y$12$kNk/8F8.8LptUTnM54Sd7OSTv18wVGIT8AgZUbFwvn2SxrfX7hrW2','Robin Jansses','Robin','Jansses','charter_client',1,NULL,NULL,NULL,'2025-03-07 09:57:29','2025-03-07 09:57:29'),(5,'tesslaurys','test3@me.com','$2y$12$BHI3s4sLQEV14vXzWgEbiOU9HKPN1af/qweY63nWqanmDY5XeLrv2','Tess Laurys','Tess','Laurys','charter_client',1,NULL,NULL,NULL,'2025-03-07 10:08:23','2025-03-07 10:08:23'),(6,'testertesters','test4@me.com','$2y$12$UfMrLdJKQkzJ8yEYrThPNuJrkpwPlWeW2HYZFRW7rFkVn9QmJMaUy','Tester Testers','Tester','Testers','charter_client',1,NULL,NULL,NULL,'2025-03-07 10:11:11','2025-03-07 10:11:11'),(8,'jefbas','test5@me.com','$2y$12$DxI7fMmlRTZvLDaVDUUkOeF5mDq2QXO.C5bA.c2qbrpJv9XlFgbr.','Jef Bas','Jef','Bas','charter_client',1,NULL,NULL,NULL,'2025-03-07 10:41:28','2025-03-07 12:28:45'),(9,'rafarts','test7@me.com','$2y$12$dgpZzO.G3WJ5.Xxprf6bhumT9LpOW4kXiJUuzS5RJBGTD4.KmYhAO','Raf Arts','Raf','Arts','charter_client',1,NULL,NULL,NULL,'2025-03-07 11:02:18','2025-03-07 11:02:18'),(12,'jomkippur','test10@me.com','$2y$12$Rf8JpiksZnGzEYpNPEHFB.VWOlyj2clwhKqffEKaDaGfo/QZVL6ri','Jom Kippur','Jom','Kippur','charter_client',1,NULL,NULL,NULL,'2025-03-07 15:21:09','2025-03-07 15:21:12'),(13,'marieverryck','test11@me.com','$2y$12$ArkTeDmnzyIkLXYMsi9Cbuu1pDlIc7cntnT9WYHcMkhfaslP9Ljx.','Marie Verryck','Marie','Verryck','charter_client',1,NULL,NULL,NULL,'2025-03-08 10:45:22','2025-03-08 10:45:25');
/*!40000 ALTER TABLE `wp_charterhub_clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_charterhub_document_relations`
--

DROP TABLE IF EXISTS `wp_charterhub_document_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_charterhub_document_relations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `document_id` bigint NOT NULL,
  `related_id` bigint NOT NULL,
  `relation_type` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  KEY `related_id` (`related_id`),
  KEY `relation_type` (`relation_type`),
  CONSTRAINT `wp_charterhub_document_relations_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `wp_charterhub_documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_charterhub_document_relations`
--

LOCK TABLES `wp_charterhub_document_relations` WRITE;
/*!40000 ALTER TABLE `wp_charterhub_document_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_charterhub_document_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_charterhub_documents`
--

DROP TABLE IF EXISTS `wp_charterhub_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_charterhub_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_size` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `visibility` varchar(20) NOT NULL DEFAULT 'private',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `visibility` (`visibility`),
  CONSTRAINT `wp_charterhub_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `wp_users` (`ID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_charterhub_documents`
--

LOCK TABLES `wp_charterhub_documents` WRITE;
/*!40000 ALTER TABLE `wp_charterhub_documents` DISABLE KEYS */;
INSERT INTO `wp_charterhub_documents` VALUES (1,'Test Document 1','charterhub-documents/test1.pdf','application/pdf',1024,1,'private','2025-02-24 18:10:06','2025-02-24 18:10:06'),(2,'Test Document 2','charterhub-documents/test2.pdf','application/pdf',2048,2,'public','2025-02-24 18:10:06','2025-02-24 18:10:06');
/*!40000 ALTER TABLE `wp_charterhub_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_jwt_tokens`
--

DROP TABLE IF EXISTS `wp_jwt_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_jwt_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `refresh_token_hash` varchar(255) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `refresh_expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `last_used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `token_hash` (`token_hash`),
  KEY `refresh_token_hash` (`refresh_token_hash`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_jwt_tokens`
--

LOCK TABLES `wp_jwt_tokens` WRITE;
/*!40000 ALTER TABLE `wp_jwt_tokens` DISABLE KEYS */;
INSERT INTO `wp_jwt_tokens` VALUES (1,1,'9cb72b9992cc269648d66d9dd7f2e281fc456f50347639f1aa53a3e32eb1a75a','664d1608742c192e9fb0454f58f72953779787aa91e285c27609140a724dd992','2025-03-05 11:31:59',NULL,'2025-03-04 11:31:59',0,'2025-03-04 11:31:59'),(2,1,'6ffeb9bd0be4df61f4265e3c065a773e5a2ade5bf8e0c4c8393cd31b75973c87','8d54d22210d662ad5217ab27b9f4cc5edb27d316c4dbd74204fd68bd5dc25ea1','2025-03-05 11:38:42',NULL,'2025-03-04 11:38:42',0,'2025-03-04 11:38:42'),(3,1,'b690fbf14075b29285e383f52da02bcd58cafd92adfbef75b6eb33bdd6fe3c47','dd0d51e93c9522f5abc8c54ef8be4170c4b786b7f74e00403c074a98cec79f31','2025-03-05 11:47:01',NULL,'2025-03-04 11:47:01',0,'2025-03-04 11:47:01'),(5,1,'c093a277469776dc59a0ea37364be702bb49635cf42e9800e60c46cf8931e76a',NULL,'2025-03-07 12:16:31',NULL,'2025-03-07 12:16:31',0,NULL),(6,8,'21fead5edcd091837d93fb0588415ac3f990742b47d64a8bcce02467cd716702',NULL,'2025-03-07 12:17:00',NULL,'2025-03-07 12:17:00',0,NULL),(7,8,'b7f8501da4125d6a67636e4e4b450cd1dfcd541d4809421c8d65cc61b605fbca',NULL,'2025-03-07 12:29:49',NULL,'2025-03-07 12:29:49',0,NULL),(8,8,'3f71625f47b0c411caa71351c272401d4a94cffe0d7e471ead96b76feb5bfb3a',NULL,'2025-03-07 12:31:58',NULL,'2025-03-07 12:31:58',0,NULL),(9,8,'b0bba70e0c43acc9db4717f0706d398803c09dab38815e2d93b262eb4f02c386',NULL,'2025-03-07 12:32:10',NULL,'2025-03-07 12:32:10',0,NULL),(10,8,'f206796ed8df567e998aafb863459670e1879e7752c0c81a7592c1c1d3275da1',NULL,'2025-03-07 12:35:25',NULL,'2025-03-07 12:35:25',0,NULL),(11,8,'733b343d4fc4884b9c21a016dfca239c7ce969572e77990c82578c9dfedaf95b',NULL,'2025-03-07 12:36:03',NULL,'2025-03-07 12:36:03',0,NULL),(12,8,'042251c0d8a5f9aa5f6a6377ee8f062a2aaedfd53b083415c8f4913ef864e962',NULL,'2025-03-07 12:37:18',NULL,'2025-03-07 12:37:18',0,NULL),(13,8,'e68a81e42e225181376d55d5ad468a6b33cbd65997a7ce05fa240389c71def60',NULL,'2025-03-07 12:47:16',NULL,'2025-03-07 12:47:16',0,NULL),(14,8,'e68a81e42e225181376d55d5ad468a6b33cbd65997a7ce05fa240389c71def60','f513c291c8bb64ca74427186f215b1a4357840da0d553e09586714b093c031be','2025-03-07 13:47:16','2025-04-06 12:47:16','2025-03-07 12:47:16',0,NULL),(15,8,'c1ac4e21d93b6e13ab9928fbd4c747937f53392efe711b8498a8190633db62a9',NULL,'2025-03-07 12:50:14',NULL,'2025-03-07 12:50:14',0,NULL),(16,8,'c1ac4e21d93b6e13ab9928fbd4c747937f53392efe711b8498a8190633db62a9','bea8c956a66025a0dce1720d04758bb9e8a28e173c8c1800551fb466e27a9389','2025-03-07 13:50:14','2025-04-06 12:50:14','2025-03-07 12:50:14',0,NULL),(17,8,'388b13eb478e5d111b471e6437cd7c242a2f56a71bea89a905df49bc013557b3',NULL,'2025-03-07 12:55:28',NULL,'2025-03-07 12:55:28',0,NULL),(18,8,'388b13eb478e5d111b471e6437cd7c242a2f56a71bea89a905df49bc013557b3','d72d1d4a72a8114851ee812dd2ad4faf601fc977c9c25d4bc72e7af2d0f2fe53','2025-03-07 13:55:29','2025-04-06 12:55:29','2025-03-07 12:55:29',0,NULL),(19,8,'bf3249e1fed357b404c7bb08b5b32951ca4ad6d789a1094ec9c7347f1bae5cb7',NULL,'2025-03-07 13:00:45',NULL,'2025-03-07 13:00:45',0,NULL),(20,8,'bf3249e1fed357b404c7bb08b5b32951ca4ad6d789a1094ec9c7347f1bae5cb7','5675f79bb318a4efa3fea979bbe01a727cd19b4be36c1fbe70fc42c07bf56e4e','2025-03-07 14:00:45','2025-04-06 13:00:45','2025-03-07 13:00:45',0,NULL),(21,8,'32765dcdd990b3347c049522884675f0ffe1100f62eb1305c0e2f283216293d5',NULL,'2025-03-07 13:08:18',NULL,'2025-03-07 13:08:18',0,NULL),(22,8,'32765dcdd990b3347c049522884675f0ffe1100f62eb1305c0e2f283216293d5','a28697031032e0d19ae82ae24afb9724d015cdfc33586d32f4b7f768f2b8ebb2','2025-03-07 14:08:19','2025-04-06 13:08:19','2025-03-07 13:08:19',0,NULL),(23,8,'876f44dffad457761e0a8f34288c412ae1eaccdcd8cf84d4a8bc84b28ca9c4c3',NULL,'2025-03-07 13:12:54',NULL,'2025-03-07 13:12:54',0,NULL),(24,8,'876f44dffad457761e0a8f34288c412ae1eaccdcd8cf84d4a8bc84b28ca9c4c3','28cd8c6ebedb8d0eec9c0e050a7c790fb8717577a0c5077162608490d8da3d35','2025-03-07 14:12:54','2025-04-06 13:12:54','2025-03-07 13:12:54',0,NULL),(25,8,'5cbfb8adc8bd332534b70ed95e3e6c5e253a649e899af1a4c79badda77150528',NULL,'2025-03-07 13:22:29',NULL,'2025-03-07 13:22:29',0,NULL),(26,8,'5cbfb8adc8bd332534b70ed95e3e6c5e253a649e899af1a4c79badda77150528','d3f76384c85af297c4fa34beb7a03533958483dbe8c147721fbd66ff927f192e','2025-03-07 14:22:29','2025-04-06 13:22:29','2025-03-07 13:22:29',0,NULL),(27,8,'12f5d5c9faa7b8587547634b388f0e7bf28e7f33f108a3d87d64c2ff90e0cb61',NULL,'2025-03-07 13:39:33',NULL,'2025-03-07 13:39:33',0,NULL),(28,8,'12f5d5c9faa7b8587547634b388f0e7bf28e7f33f108a3d87d64c2ff90e0cb61','5e0fa10e2c515df0bcbdfeb3f68652cead0c34f5020a859af588e18c01c9e4fc','2025-03-07 14:39:33','2025-04-06 13:39:33','2025-03-07 13:39:33',0,NULL),(29,8,'1c72f9f3f7342e9ae39ce9eee2aa5c81581381e9dd9617c0fc7381505a1bf08f',NULL,'2025-03-07 13:54:26',NULL,'2025-03-07 13:54:26',0,NULL),(30,8,'1c72f9f3f7342e9ae39ce9eee2aa5c81581381e9dd9617c0fc7381505a1bf08f','51ebd9317961bb4ac5cc7d5025c63f72d881b9979076ca27823a2acca8027073','2025-03-07 14:54:26','2025-04-06 13:54:26','2025-03-07 13:54:26',0,NULL),(31,6,'070441c97e43516c98b628e6a18255edebb7fe8eba55fd7fca1af4d77018616e',NULL,'2025-03-07 13:54:45',NULL,'2025-03-07 13:54:45',0,NULL),(32,6,'070441c97e43516c98b628e6a18255edebb7fe8eba55fd7fca1af4d77018616e','80c6e5c263fc9205523b4bc3dc9965a3a074ee5e7aeae1f03bb5ec2ae8310561','2025-03-07 14:54:45','2025-04-06 13:54:45','2025-03-07 13:54:45',0,NULL),(33,6,'bb729c7086566b645215d8d1377ca873070442592f03ea326029b0518fa8fff3',NULL,'2025-03-07 14:15:04',NULL,'2025-03-07 14:15:04',0,NULL),(34,6,'bb729c7086566b645215d8d1377ca873070442592f03ea326029b0518fa8fff3','9dfe5945a15bdaea1f1d73abd8d460a9e3e5a08ffa52528cd3eba20d53184a9d','2025-03-07 15:15:04','2025-04-06 14:15:04','2025-03-07 14:15:04',0,NULL),(35,4,'0e083e3b265c1cfb83029c0455551b2ecbd2afc0de118af2b9b3310014ac9af0',NULL,'2025-03-07 14:19:01',NULL,'2025-03-07 14:19:01',0,NULL),(36,4,'0e083e3b265c1cfb83029c0455551b2ecbd2afc0de118af2b9b3310014ac9af0','a0c2fc951ec666f95d9c325370c45350d96456ede57b3edbc4200322cef3ae01','2025-03-07 15:19:01','2025-04-06 14:19:01','2025-03-07 14:19:01',0,NULL),(37,1,'7e7eee7d4a88f55545389a755ee7dbac88941d46aa6d12dfa859ac07427b2339',NULL,'2025-03-07 14:23:40',NULL,'2025-03-07 14:23:40',0,NULL),(38,1,'7e7eee7d4a88f55545389a755ee7dbac88941d46aa6d12dfa859ac07427b2339','f46b19e3a7751928cfc47b2f8c64c750cf5cf74c0f2c3e855dc189bd73f10166','2025-03-07 15:23:40','2025-04-06 14:23:40','2025-03-07 14:23:40',0,NULL),(39,1,'a082d0e88444e3c40031dd4a9a0f9c92dcff1f140acd43d05e799c49742cdd76',NULL,'2025-03-07 14:24:10',NULL,'2025-03-07 14:24:10',0,NULL),(40,1,'a082d0e88444e3c40031dd4a9a0f9c92dcff1f140acd43d05e799c49742cdd76','c28e768d52eea7c000b65ab99704b486198de3a804a7a6d1bc9aa68bbc8cd0af','2025-03-07 15:24:10','2025-04-06 14:24:10','2025-03-07 14:24:10',0,NULL),(41,8,'4ca2f99a11ac78b21394aee047746a2e6709efc64c9a38b106fb89e856196def',NULL,'2025-03-07 14:27:14',NULL,'2025-03-07 14:27:14',0,NULL),(42,8,'4ca2f99a11ac78b21394aee047746a2e6709efc64c9a38b106fb89e856196def','84e3c4735e9844fc43b3c067a1ff58c1753b80aec377da2f3e6e8060e41dcd2e','2025-03-07 15:27:14','2025-04-06 14:27:14','2025-03-07 14:27:14',0,NULL),(43,1,'1e747f87f470cf369d09d96c5f0e321193365baf3a26ce8eb3cf088d75edaea5',NULL,'2025-03-07 14:28:01',NULL,'2025-03-07 14:28:01',0,NULL),(44,1,'1e747f87f470cf369d09d96c5f0e321193365baf3a26ce8eb3cf088d75edaea5','755476f39fa372c924caf002c5b3c0d7cadf9db4ea76b7dee9def61cd3993b4f','2025-03-07 15:28:01','2025-04-06 14:28:01','2025-03-07 14:28:01',0,NULL),(45,1,'dd1956b23c72066a8cd97820ac2e97289336f66b9d105e2c81667260517a99a8',NULL,'2025-03-07 14:28:12',NULL,'2025-03-07 14:28:12',0,NULL),(46,1,'dd1956b23c72066a8cd97820ac2e97289336f66b9d105e2c81667260517a99a8','839ede83e2118d2daf4a0810bc6f29031e8c6541fdcc3963da20cce973848b32','2025-03-07 15:28:12','2025-04-06 14:28:12','2025-03-07 14:28:12',0,NULL),(47,8,'e21240aeb744a328d6b1ca343ae4647def140d935372e997e40bfc786b4cad4e',NULL,'2025-03-07 14:28:22',NULL,'2025-03-07 14:28:22',0,NULL),(48,8,'e21240aeb744a328d6b1ca343ae4647def140d935372e997e40bfc786b4cad4e','cb5f39070d053b2dc1fe459ae424cbd5139add6b149ab8ef94b49014c9f7b906','2025-03-07 15:28:22','2025-04-06 14:28:22','2025-03-07 14:28:22',0,NULL),(49,4,'59e7a91eca9b46e21aeacefab677eee13fe5d01b8fb4f5119d91aa01024762c5',NULL,'2025-03-07 14:46:48',NULL,'2025-03-07 14:46:48',0,NULL),(50,4,'59e7a91eca9b46e21aeacefab677eee13fe5d01b8fb4f5119d91aa01024762c5','583c3daa2644c98976443c39a8cd0323091ae7517e9c8cef50e9ccd190ab4715','2025-03-07 15:46:48','2025-04-06 14:46:48','2025-03-07 14:46:48',0,NULL),(51,5,'bbc9a87b7b2fcec1f48f27ff4b642fea6c271bcd5e020993621fb1176c5354b6',NULL,'2025-03-07 15:15:50',NULL,'2025-03-07 15:15:50',0,NULL),(52,5,'bbc9a87b7b2fcec1f48f27ff4b642fea6c271bcd5e020993621fb1176c5354b6','35ae0253746131bbee43ee4b8816413967f2df1386faa54a74aef3443b6268ca','2025-03-07 16:15:50','2025-04-06 15:15:50','2025-03-07 15:15:50',0,NULL),(53,12,'bc5986c1340e72f42fa3396d2a32004d4e2ee24cddacfdbecba9806940bf1d53',NULL,'2025-03-07 15:21:25',NULL,'2025-03-07 15:21:25',0,NULL),(54,12,'bc5986c1340e72f42fa3396d2a32004d4e2ee24cddacfdbecba9806940bf1d53','c4c1f7d4e70b0075656dd29246600f4d243d601ab823d87618f0cf024b21c373','2025-03-07 16:21:25','2025-04-06 15:21:25','2025-03-07 15:21:25',0,NULL),(55,5,'ec579a50214c6bb6f4612dac96cb93c198de59efbb1a3cc80e64ee54535fdde7',NULL,'2025-03-08 10:13:03',NULL,'2025-03-08 10:13:03',0,NULL),(56,5,'ec579a50214c6bb6f4612dac96cb93c198de59efbb1a3cc80e64ee54535fdde7','fbbeb4192692bbe1dacc381668db4d0262ff52e3bca23d482f79dbfc903658ee','2025-03-08 11:13:03','2025-04-07 10:13:03','2025-03-08 10:13:03',0,NULL),(57,6,'ef03a14d64d8c790929a136edb5e2c0ed5cc62747ee39d0f7a8c17e1db83887b',NULL,'2025-03-08 10:20:50',NULL,'2025-03-08 10:20:50',0,NULL),(58,6,'ef03a14d64d8c790929a136edb5e2c0ed5cc62747ee39d0f7a8c17e1db83887b','690fbdc9007447f9c03766c72ed4f8f62d78394bbef5df127bff8d7502e05b7f','2025-03-08 11:20:50','2025-04-07 10:20:50','2025-03-08 10:20:50',0,NULL),(59,5,'6b00e09ca1db0a6e7cfce0469198b8a653b26f49961c81b746e2e9c32b1bfc47',NULL,'2025-03-08 10:31:06',NULL,'2025-03-08 10:31:06',0,NULL),(60,5,'6b00e09ca1db0a6e7cfce0469198b8a653b26f49961c81b746e2e9c32b1bfc47','972cf77fa897e399debdd5321e68a66b689e937a8a8d48adee1f816f11df1a8e','2025-03-08 11:31:06','2025-04-07 10:31:06','2025-03-08 10:31:06',0,NULL),(61,13,'9951b4bca766d30f0e24a8c3def80c1725aaa889807e7385020c35ce3839f93f',NULL,'2025-03-08 10:45:41',NULL,'2025-03-08 10:45:41',0,NULL),(62,13,'9951b4bca766d30f0e24a8c3def80c1725aaa889807e7385020c35ce3839f93f','2a04f708dbe12cf4cd659166957a49ba476b3b64d88a4a26440173d526f8051e','2025-03-08 11:45:41','2025-04-07 10:45:41','2025-03-08 10:45:41',0,NULL),(63,13,'eb2b45dc05859db70988c1a6daef6e9a9b22341c72276f64be8e393d64887234',NULL,'2025-03-08 12:09:44',NULL,'2025-03-08 12:09:44',0,NULL),(64,13,'eb2b45dc05859db70988c1a6daef6e9a9b22341c72276f64be8e393d64887234','cff893b246e51b72dd43f436a60d7f8c61ac5100f18f407242c352c225542e16','2025-03-08 13:09:44','2025-04-07 12:09:44','2025-03-08 12:09:44',0,NULL),(65,6,'3c854ef08a8de46556cdf590918640e1d14f7cedd4068fb20f8e1d93f4709e9a',NULL,'2025-03-10 09:12:10',NULL,'2025-03-10 09:12:10',0,NULL),(66,6,'3c854ef08a8de46556cdf590918640e1d14f7cedd4068fb20f8e1d93f4709e9a','2249abd71375aaccabbf09e1f2d6e53d628b6361698ef6e1b1c51f63884847b5','2025-03-10 10:12:10','2025-04-09 09:12:10','2025-03-10 09:12:10',0,NULL),(67,6,'17f96fa34ca2b49c45e3803bde85b2030154edb327d6370229bb29373a63f9c6',NULL,'2025-03-10 10:04:48',NULL,'2025-03-10 10:04:48',0,NULL),(68,6,'17f96fa34ca2b49c45e3803bde85b2030154edb327d6370229bb29373a63f9c6','d018cf6c8930c358bd8e9c65c41fb00054b9401309cf4640882f495b3c49627e','2025-03-10 11:04:48','2025-04-09 10:04:48','2025-03-10 10:04:48',0,NULL),(69,6,'b8dfcbb46a9e9f678cffbf3347828b1d07cb6c59eba8cfc45d097d1042216620',NULL,'2025-03-10 10:45:40','2025-04-09 10:45:40','2025-03-10 10:45:40',0,'2025-03-10 10:45:40'),(70,6,'b8dfcbb46a9e9f678cffbf3347828b1d07cb6c59eba8cfc45d097d1042216620','a6cb63efc2cc7ac28a5b609128ee029cab446b6e9500ad136b2d485cce202423','2025-03-10 11:45:40','2025-04-09 10:45:40','2025-03-10 10:45:40',0,NULL),(71,6,'3af794ea1fc79b1c92a131bc16a1a7a09c51d42e954271823c28baaaa1c34c0a',NULL,'2025-03-10 11:12:36',NULL,'2025-03-10 11:12:36',0,NULL),(72,6,'3af794ea1fc79b1c92a131bc16a1a7a09c51d42e954271823c28baaaa1c34c0a','c6f2c421b03253bc2613df9978a2369f336bd8159c1037659b237c3602416e74','2025-03-10 12:12:36','2025-04-09 11:12:36','2025-03-10 11:12:36',0,NULL),(73,6,'f21fff9ebe7b0e0b34adfa489165a37d412fc65f16f1b713e8a99f17301dcfd8',NULL,'2025-03-10 11:29:48',NULL,'2025-03-10 11:29:48',0,NULL),(74,6,'f21fff9ebe7b0e0b34adfa489165a37d412fc65f16f1b713e8a99f17301dcfd8','1b5d5594954a8ef25a413624d8011eea5e9287f475d2540172f00dabd4ba4108','2025-03-10 12:29:48','2025-04-09 11:29:48','2025-03-10 11:29:48',0,NULL),(75,6,'ecb9de130f3da7c700b4fb599c4237fc5479a14d058fe56955e617593a23c175',NULL,'2025-03-10 11:45:19',NULL,'2025-03-10 11:45:19',0,NULL),(76,6,'ecb9de130f3da7c700b4fb599c4237fc5479a14d058fe56955e617593a23c175','ce2860308f99931b224cddca2aaa34d163eb524e952c0079991b2c92fcf000b8','2025-03-10 12:45:19','2025-04-09 11:45:19','2025-03-10 11:45:19',0,NULL),(77,6,'6d36291318bbfde6d3471e3e97342b3e0eef317304f5e02433cfd3637165706b',NULL,'2025-03-10 11:47:37',NULL,'2025-03-10 11:47:37',0,NULL),(78,6,'6d36291318bbfde6d3471e3e97342b3e0eef317304f5e02433cfd3637165706b','fba16ccbc80a09eb04d36f597062d7466c3e7bbbac5f86321e6624fc2409d64e','2025-03-10 12:47:37','2025-04-09 11:47:37','2025-03-10 11:47:37',0,NULL),(79,6,'670d8d30d8edb323a7ac94d2a64b4159fa155db949310c7080c8748331869bce',NULL,'2025-03-10 11:51:33',NULL,'2025-03-10 11:51:33',0,NULL),(80,6,'670d8d30d8edb323a7ac94d2a64b4159fa155db949310c7080c8748331869bce','aff06812eb3ba03b0f1d92dbb863ce1a62cc1ecf4be842c57d5f56b8261a3d3e','2025-03-10 12:51:33','2025-04-09 11:51:33','2025-03-10 11:51:33',0,NULL),(81,5,'9672e2b6e3065efee157e7df547aec56ae73df5bec94af73092965ff3862ffdf',NULL,'2025-03-10 11:53:16',NULL,'2025-03-10 11:53:16',0,NULL),(82,5,'9672e2b6e3065efee157e7df547aec56ae73df5bec94af73092965ff3862ffdf','cb7030fe1d134e18d282070e3d00acb17c3f63cd89b71b167bc1ba536ac0226a','2025-03-10 12:53:16','2025-04-09 11:53:16','2025-03-10 11:53:16',0,NULL),(83,5,'764b927b515108ab8af08fb652c3fc27ed83f3d20e3cf69176a16e3ac43968be',NULL,'2025-03-10 11:54:41',NULL,'2025-03-10 11:54:41',0,NULL),(84,5,'764b927b515108ab8af08fb652c3fc27ed83f3d20e3cf69176a16e3ac43968be','a24e9e989102055de62a62c8ae4840d4ad06170ba5ff1d8015e0abb734f74caa','2025-03-10 12:54:41','2025-04-09 11:54:41','2025-03-10 11:54:41',0,NULL),(85,6,'ebc6f5e6e76e02e75a199a6d753f74872d9e02461439235c3ecfda23f5efe677',NULL,'2025-03-10 11:57:49',NULL,'2025-03-10 11:57:49',0,NULL),(86,6,'ebc6f5e6e76e02e75a199a6d753f74872d9e02461439235c3ecfda23f5efe677','b44215ed0bb8397587b7ba9802b7b9fef15ad8300b66cecda70fea204ed63ba3','2025-03-10 12:57:49','2025-04-09 11:57:49','2025-03-10 11:57:49',0,NULL),(87,6,'0d48f1a3358e61422a06f6f1f6f24ef9bd3f92dd1347e49b9e83d09056bee33f',NULL,'2025-03-10 11:59:06',NULL,'2025-03-10 11:59:06',0,NULL),(88,6,'0d48f1a3358e61422a06f6f1f6f24ef9bd3f92dd1347e49b9e83d09056bee33f','6167ce016be5f1c1aa03393d09e2aec5e39310c69b6c850206f94a5fa9e86514','2025-03-10 12:59:06','2025-04-09 11:59:06','2025-03-10 11:59:06',0,NULL),(89,6,'6eb01c0e6ba93f9295a2ac7d3b1439ec5cbc509a7fb65e2ce7a169726c5ea802',NULL,'2025-03-10 11:59:24',NULL,'2025-03-10 11:59:24',0,NULL),(90,6,'6eb01c0e6ba93f9295a2ac7d3b1439ec5cbc509a7fb65e2ce7a169726c5ea802','67ce3b7e7a62b4704064f89e8d51edd484f8db5a437f684efc7c6d075dd47a34','2025-03-10 12:59:24','2025-04-09 11:59:24','2025-03-10 11:59:24',0,NULL),(91,6,'827fcadc3c5b6096618da6189800dadecb598500e84103faf0181401189f6aa1',NULL,'2025-03-10 12:01:35',NULL,'2025-03-10 12:01:35',0,NULL),(92,6,'827fcadc3c5b6096618da6189800dadecb598500e84103faf0181401189f6aa1','cacd8e5ee39381d0526cc29e9c509b899a2b687eda9c4038a61540a9d065266a','2025-03-10 13:01:35','2025-04-09 12:01:35','2025-03-10 12:01:35',0,NULL),(93,6,'34b2c188ef518d1d4423aae7c25891f80022e5d705029496240aea68d718f3ef',NULL,'2025-03-10 12:03:40',NULL,'2025-03-10 12:03:40',0,NULL),(94,6,'34b2c188ef518d1d4423aae7c25891f80022e5d705029496240aea68d718f3ef','a92e1b5bb58f9fe00f09a331c2bcf1ed8fc79206fe56ce68a8e5200118fdcb51','2025-03-10 13:03:40','2025-04-09 12:03:40','2025-03-10 12:03:40',0,NULL),(95,6,'30be0669f4b495f31b6455da3e971a7e1bd640c258f56abb73a0e826c744ad38',NULL,'2025-03-10 12:07:45',NULL,'2025-03-10 12:07:45',0,NULL),(96,6,'30be0669f4b495f31b6455da3e971a7e1bd640c258f56abb73a0e826c744ad38','ac4c93c953b7bee33c4ad7e5cdb5cedbe5f0d69f941d6c4885ba41ff9889a7a6','2025-03-10 13:07:45','2025-04-09 12:07:45','2025-03-10 12:07:45',0,NULL),(97,6,'0bdca1d76804088b23f16e94413d864e9317c21bf7b884afddb083cb8b2a71e2',NULL,'2025-03-10 13:01:46',NULL,'2025-03-10 13:01:46',0,NULL),(98,6,'0bdca1d76804088b23f16e94413d864e9317c21bf7b884afddb083cb8b2a71e2','0e42ea747c10d4d20f019823c2f451738fdb1dc8ea5c7da58873070bea7574d8','2025-03-10 14:01:46','2025-04-09 13:01:46','2025-03-10 13:01:46',0,NULL),(99,6,'ae46e82ca729586b3a3852d30e4cc172ae622a610c1891c584295c415cb8968b',NULL,'2025-03-10 13:42:29',NULL,'2025-03-10 13:42:29',0,NULL),(100,6,'ae46e82ca729586b3a3852d30e4cc172ae622a610c1891c584295c415cb8968b','50250e803db08c65aa6c4f857c77164b3de816b1adb9600a220402ba153997b1','2025-03-10 14:42:29','2025-04-09 13:42:29','2025-03-10 13:42:29',0,NULL),(101,6,'9e10eeb19b48629a64b4c414dc6cc8c76bf47076013532bb0b89330b70da6d6f',NULL,'2025-03-10 13:52:21',NULL,'2025-03-10 13:52:21',0,NULL),(102,6,'9e10eeb19b48629a64b4c414dc6cc8c76bf47076013532bb0b89330b70da6d6f','8a381534783971b51a34811bce7bcc423f34bb1aed51e0e2bfc482d41db6a0b6','2025-03-10 14:52:21','2025-04-09 13:52:21','2025-03-10 13:52:21',0,NULL),(103,6,'4d592f4a4e1fbbd4ea8b4e80f1c08b771fc79d0b7b60814aa6bf75a1bd5c2379',NULL,'2025-03-10 14:55:48',NULL,'2025-03-10 14:55:48',0,NULL),(104,6,'4d592f4a4e1fbbd4ea8b4e80f1c08b771fc79d0b7b60814aa6bf75a1bd5c2379','da2ba53beb9c2f7ec26a7bcac8cda97b63c5e8dc7fc01d0b7fc7e64c549e9b3f','2025-03-10 15:55:48','2025-04-09 14:55:48','2025-03-10 14:55:48',0,NULL),(105,6,'604b2c46129f743dbbb9219a73dafdbe0f848b705959b8a1debf8176898bd943',NULL,'2025-03-10 15:08:04',NULL,'2025-03-10 15:08:04',0,NULL),(106,6,'604b2c46129f743dbbb9219a73dafdbe0f848b705959b8a1debf8176898bd943','dfb1de1a0184e9b1274911ef3f8f33da99b7252c1b78285f366a46a1c500c0cb','2025-03-10 16:08:04','2025-04-09 15:08:04','2025-03-10 15:08:04',0,NULL),(107,6,'37de932656e47f529bdf6becc4ae030cd5e5362ee288617161960b758bea4423',NULL,'2025-03-10 15:24:49',NULL,'2025-03-10 15:24:49',0,NULL),(108,6,'37de932656e47f529bdf6becc4ae030cd5e5362ee288617161960b758bea4423','a94caf7b2d85feb833785b10af0594db86f5841ece6400ebba8ce85885dc1f9c','2025-03-10 16:24:49','2025-04-09 15:24:49','2025-03-10 15:24:49',0,NULL),(109,6,'eb909cc3bcd7d7c22640085ac6d813ceaa0de96017d899055d1a3503c87ce9f8',NULL,'2025-03-10 15:30:42',NULL,'2025-03-10 15:30:42',0,NULL),(110,6,'eb909cc3bcd7d7c22640085ac6d813ceaa0de96017d899055d1a3503c87ce9f8','1162a51a89b77c3c079a80d0ef1691ec41940e88261ef1112e1899f9a0b93a45','2025-03-10 16:30:42','2025-04-09 15:30:42','2025-03-10 15:30:42',0,NULL),(111,6,'ce3825a9745d6b9f310c8631343a4d1e0adda0aa096e9ba1c5fd2ef3195b403f',NULL,'2025-03-10 15:54:39',NULL,'2025-03-10 15:54:39',0,NULL),(112,6,'ce3825a9745d6b9f310c8631343a4d1e0adda0aa096e9ba1c5fd2ef3195b403f','26b90e449769f494daa0aab36cf7779f3a98beba3411a3caefda247eba960d27','2025-03-10 16:54:39','2025-04-09 15:54:39','2025-03-10 15:54:39',0,NULL),(113,6,'8f31e3f9cb85551ebf71b484525dc59e70b9b83681a426caca0365599a266705',NULL,'2025-03-10 16:05:26',NULL,'2025-03-10 16:05:26',0,NULL),(114,6,'8f31e3f9cb85551ebf71b484525dc59e70b9b83681a426caca0365599a266705','b8bf50aef60519cef4f736bcd29ee46504427a0a67392be78c7c1878531b8992','2025-03-10 17:05:26','2025-04-09 16:05:26','2025-03-10 16:05:26',0,NULL),(115,6,'2de45faf3d7cbc880f5030cefdc14a817984fdec62b9172ad85d27ff1bca9025',NULL,'2025-03-10 16:43:50',NULL,'2025-03-10 16:43:50',0,NULL),(116,6,'2de45faf3d7cbc880f5030cefdc14a817984fdec62b9172ad85d27ff1bca9025','13923f75589ba00ba49c927c41040d08bb3aaec022567b658b083ae3f6cf129c','2025-03-10 17:43:50','2025-04-09 16:43:50','2025-03-10 16:43:50',0,NULL),(117,6,'31349fbbfd5fd5b4d2ff1b340d99ea131153365a33e7d851109be1d191713306',NULL,'2025-03-10 16:53:53',NULL,'2025-03-10 16:53:53',0,NULL),(118,6,'31349fbbfd5fd5b4d2ff1b340d99ea131153365a33e7d851109be1d191713306','8b5d6bee6866e16014b7b18ca651090891b04610d048fb91be8adbcaab676af3','2025-03-10 17:53:53','2025-04-09 16:53:53','2025-03-10 16:53:53',0,NULL),(119,6,'f2fd1efdc6d461b3ce4734240a9e963018ff7b866cfd4906d90f0bc7bd95cd0c',NULL,'2025-03-10 17:10:08',NULL,'2025-03-10 17:10:08',0,NULL),(120,6,'f2fd1efdc6d461b3ce4734240a9e963018ff7b866cfd4906d90f0bc7bd95cd0c','54e9e39d71a430cf1b90302340f146b632b2ecaf184cf6232ee6b2f821a2e5d6','2025-03-10 18:10:08','2025-04-09 17:10:08','2025-03-10 17:10:08',0,NULL),(121,6,'fa09ac97bf86c6612cbfc4a2fa9e25780838a81edad68bd284e04159bfcaf96f',NULL,'2025-03-10 17:20:14',NULL,'2025-03-10 17:20:14',0,NULL),(122,6,'fa09ac97bf86c6612cbfc4a2fa9e25780838a81edad68bd284e04159bfcaf96f','79948273edf1dea165b51fabe058165dbaefe910672f0250af72419356b5961a','2025-03-10 18:20:14','2025-04-09 17:20:14','2025-03-10 17:20:14',0,NULL),(123,6,'b3f9d64be7cc8fe14240b9c04a6ecbca8c3ea87f01de753079289adeaa5e87af',NULL,'2025-03-10 20:17:02',NULL,'2025-03-10 20:17:02',0,NULL),(124,6,'b3f9d64be7cc8fe14240b9c04a6ecbca8c3ea87f01de753079289adeaa5e87af','a20998e731baf4572420b09c95ee58c043123927ae97c0e5f7d37156b15bf640','2025-03-10 21:17:02','2025-04-09 20:17:02','2025-03-10 20:17:02',0,NULL),(125,6,'3d4b061a40a3a8f7eae7fca2459d67787016c12a56dfa44ae7608fd508251d83',NULL,'2025-03-10 20:22:56',NULL,'2025-03-10 20:22:56',0,NULL),(126,6,'3d4b061a40a3a8f7eae7fca2459d67787016c12a56dfa44ae7608fd508251d83','d8c9b2fbbe58447752e6139217d5d314c7ce9c92f39619b16a3feaefd5ff5437','2025-03-10 21:22:56','2025-04-09 20:22:56','2025-03-10 20:22:56',0,NULL),(127,6,'27ccf4656aa3f4eaad197359b23056437b958d4630fcb3b397676cc5a09b8e74',NULL,'2025-03-10 20:26:38',NULL,'2025-03-10 20:26:38',0,NULL),(128,6,'27ccf4656aa3f4eaad197359b23056437b958d4630fcb3b397676cc5a09b8e74','f7b4e506aa93c418e78d9bfa63798baacf5a1be6c553ce3c6f34a1013089f923','2025-03-10 21:26:38','2025-04-09 20:26:38','2025-03-10 20:26:38',0,NULL),(129,6,'76798a1735a46830a336826f0bd47f73ea25dce7e97d5fc358683b94a79c814a',NULL,'2025-03-10 20:31:12',NULL,'2025-03-10 20:31:12',0,NULL),(130,6,'76798a1735a46830a336826f0bd47f73ea25dce7e97d5fc358683b94a79c814a','d3de17c1a34e9dc54c01fded2e5fd07e76ba17699f9bc06e07ab59621f74ded6','2025-03-10 21:31:12','2025-04-09 20:31:12','2025-03-10 20:31:12',0,NULL),(131,6,'b18c5396fccf8a489b1d2d9b19ec18ab87d86794846eec0acd2af59a699fe6aa',NULL,'2025-03-10 20:35:55',NULL,'2025-03-10 20:35:55',0,NULL),(132,6,'b18c5396fccf8a489b1d2d9b19ec18ab87d86794846eec0acd2af59a699fe6aa','db84b447435c576273499739658ceb1f3990650d047c66958b8cb82041ca976d','2025-03-10 21:35:55','2025-04-09 20:35:55','2025-03-10 20:35:55',0,NULL),(133,6,'f4d9643f8c304afd1a6d1b10772387549ede9e3cdb90d2a8cdb920147dadd691',NULL,'2025-03-10 20:45:19',NULL,'2025-03-10 20:45:19',0,NULL),(134,6,'f4d9643f8c304afd1a6d1b10772387549ede9e3cdb90d2a8cdb920147dadd691','692bb115e173f6be4774fbe3aacf3c3df02b7028ff4fc34e1bedb390abb2eb72','2025-03-10 21:45:19','2025-04-09 20:45:19','2025-03-10 20:45:19',0,NULL),(135,6,'dbf8ae2c936c8b31a9f3d2d7f4a2255f8c96562a24621ddbfcf473dacec007c2',NULL,'2025-03-10 20:54:26',NULL,'2025-03-10 20:54:26',0,NULL),(136,6,'dbf8ae2c936c8b31a9f3d2d7f4a2255f8c96562a24621ddbfcf473dacec007c2','0be2201b8915f15b8c297ed8839bd1b926112898009e5bde4a48637f9f4a462a','2025-03-10 21:54:26','2025-04-09 20:54:26','2025-03-10 20:54:26',0,NULL);
/*!40000 ALTER TABLE `wp_jwt_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_options`
--

DROP TABLE IF EXISTS `wp_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_options` (
  `option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `option_value` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `autoload` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `option_name` (`option_name`),
  KEY `autoload` (`autoload`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_options`
--

LOCK TABLES `wp_options` WRITE;
/*!40000 ALTER TABLE `wp_options` DISABLE KEYS */;
INSERT INTO `wp_options` VALUES (1,'siteurl','http://localhost:8888','yes'),(2,'home','http://localhost:8888','yes'),(3,'blogname','CharterHub','yes'),(4,'admin_email','admin@example.com','yes'),(5,'active_plugins','a:1:{i:0;s:29:\"charterhub-api/charterhub-api.php\";}','yes'),(6,'permalink_structure','/%postname%/','yes'),(7,'cron','a:5:{i:1740489884;a:1:{s:34:\"wp_privacy_delete_old_export_files\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:6:\"hourly\";s:4:\"args\";a:0:{}s:8:\"interval\";i:3600;}}}i:1740529484;a:3:{s:16:\"wp_version_check\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:10:\"twicedaily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:43200;}}s:17:\"wp_update_plugins\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:10:\"twicedaily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:43200;}}s:16:\"wp_update_themes\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:10:\"twicedaily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:43200;}}}i:1740572683;a:1:{s:32:\"recovery_mode_clean_expired_keys\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:5:\"daily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:86400;}}}i:1740572684;a:1:{s:30:\"wp_site_health_scheduled_check\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:6:\"weekly\";s:4:\"args\";a:0:{}s:8:\"interval\";i:604800;}}}s:7:\"version\";i:2;}','on'),(8,'widget_pages','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(9,'widget_calendar','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(10,'widget_archives','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(11,'widget_links','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(12,'widget_media_audio','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(13,'widget_media_image','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(14,'widget_media_gallery','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(15,'widget_media_video','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(16,'widget_meta','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(17,'widget_search','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(18,'widget_text','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(19,'widget_categories','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(20,'widget_recent-posts','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(21,'widget_recent-comments','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(22,'widget_rss','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(23,'widget_tag_cloud','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(24,'widget_nav_menu','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(25,'widget_custom_html','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(26,'widget_block','a:1:{s:12:\"_multiwidget\";i:1;}','auto'),(27,'_site_transient_timeout_wp_theme_files_patterns-eba7854ab25d611571a56fe97fa52f88','1740488084','off'),(28,'_site_transient_wp_theme_files_patterns-eba7854ab25d611571a56fe97fa52f88','a:2:{s:7:\"version\";b:0;s:8:\"patterns\";a:0:{}}','off'),(30,'recovery_keys','a:0:{}','off'),(31,'_site_transient_update_core','O:8:\"stdClass\":4:{s:7:\"updates\";a:1:{i:0;O:8:\"stdClass\":10:{s:8:\"response\";s:6:\"latest\";s:8:\"download\";s:59:\"https://downloads.wordpress.org/release/wordpress-6.7.2.zip\";s:6:\"locale\";s:5:\"en_US\";s:8:\"packages\";O:8:\"stdClass\":5:{s:4:\"full\";s:59:\"https://downloads.wordpress.org/release/wordpress-6.7.2.zip\";s:10:\"no_content\";s:70:\"https://downloads.wordpress.org/release/wordpress-6.7.2-no-content.zip\";s:11:\"new_bundled\";s:71:\"https://downloads.wordpress.org/release/wordpress-6.7.2-new-bundled.zip\";s:7:\"partial\";s:0:\"\";s:8:\"rollback\";s:0:\"\";}s:7:\"current\";s:5:\"6.7.2\";s:7:\"version\";s:5:\"6.7.2\";s:11:\"php_version\";s:6:\"7.2.24\";s:13:\"mysql_version\";s:5:\"5.5.5\";s:11:\"new_bundled\";s:3:\"6.7\";s:15:\"partial_version\";s:0:\"\";}}s:12:\"last_checked\";i:1740486285;s:15:\"version_checked\";s:5:\"6.7.2\";s:12:\"translations\";a:0:{}}','off'),(32,'_site_transient_update_plugins','O:8:\"stdClass\":4:{s:12:\"last_checked\";i:1740486285;s:8:\"response\";a:0:{}s:12:\"translations\";a:0:{}s:9:\"no_update\";a:11:{s:30:\"advanced-custom-fields/acf.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:36:\"w.org/plugins/advanced-custom-fields\";s:4:\"slug\";s:22:\"advanced-custom-fields\";s:6:\"plugin\";s:30:\"advanced-custom-fields/acf.php\";s:11:\"new_version\";s:6:\"6.3.12\";s:3:\"url\";s:53:\"https://wordpress.org/plugins/advanced-custom-fields/\";s:7:\"package\";s:72:\"https://downloads.wordpress.org/plugin/advanced-custom-fields.6.3.12.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:67:\"https://ps.w.org/advanced-custom-fields/assets/icon.svg?rev=3207824\";s:3:\"svg\";s:67:\"https://ps.w.org/advanced-custom-fields/assets/icon.svg?rev=3207824\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:78:\"https://ps.w.org/advanced-custom-fields/assets/banner-1544x500.jpg?rev=3207824\";s:2:\"1x\";s:77:\"https://ps.w.org/advanced-custom-fields/assets/banner-772x250.jpg?rev=3207824\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"6.0\";}s:51:\"all-in-one-wp-migration/all-in-one-wp-migration.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:37:\"w.org/plugins/all-in-one-wp-migration\";s:4:\"slug\";s:23:\"all-in-one-wp-migration\";s:6:\"plugin\";s:51:\"all-in-one-wp-migration/all-in-one-wp-migration.php\";s:11:\"new_version\";s:4:\"7.89\";s:3:\"url\";s:54:\"https://wordpress.org/plugins/all-in-one-wp-migration/\";s:7:\"package\";s:71:\"https://downloads.wordpress.org/plugin/all-in-one-wp-migration.7.89.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:76:\"https://ps.w.org/all-in-one-wp-migration/assets/icon-256x256.png?rev=2458334\";s:2:\"1x\";s:76:\"https://ps.w.org/all-in-one-wp-migration/assets/icon-128x128.png?rev=2458334\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:79:\"https://ps.w.org/all-in-one-wp-migration/assets/banner-1544x500.png?rev=3209691\";s:2:\"1x\";s:78:\"https://ps.w.org/all-in-one-wp-migration/assets/banner-772x250.png?rev=3209691\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"3.3\";}s:45:\"taxonomy-terms-order/taxonomy-terms-order.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:34:\"w.org/plugins/taxonomy-terms-order\";s:4:\"slug\";s:20:\"taxonomy-terms-order\";s:6:\"plugin\";s:45:\"taxonomy-terms-order/taxonomy-terms-order.php\";s:11:\"new_version\";s:5:\"1.8.7\";s:3:\"url\";s:51:\"https://wordpress.org/plugins/taxonomy-terms-order/\";s:7:\"package\";s:69:\"https://downloads.wordpress.org/plugin/taxonomy-terms-order.1.8.7.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:73:\"https://ps.w.org/taxonomy-terms-order/assets/icon-256x256.png?rev=1564412\";s:2:\"1x\";s:73:\"https://ps.w.org/taxonomy-terms-order/assets/icon-128x128.png?rev=1564412\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:76:\"https://ps.w.org/taxonomy-terms-order/assets/banner-1544x500.png?rev=1564412\";s:2:\"1x\";s:75:\"https://ps.w.org/taxonomy-terms-order/assets/banner-772x250.png?rev=1564412\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"2.8\";}s:43:\"custom-post-type-ui/custom-post-type-ui.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:33:\"w.org/plugins/custom-post-type-ui\";s:4:\"slug\";s:19:\"custom-post-type-ui\";s:6:\"plugin\";s:43:\"custom-post-type-ui/custom-post-type-ui.php\";s:11:\"new_version\";s:6:\"1.17.2\";s:3:\"url\";s:50:\"https://wordpress.org/plugins/custom-post-type-ui/\";s:7:\"package\";s:69:\"https://downloads.wordpress.org/plugin/custom-post-type-ui.1.17.2.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:72:\"https://ps.w.org/custom-post-type-ui/assets/icon-256x256.png?rev=2744389\";s:2:\"1x\";s:72:\"https://ps.w.org/custom-post-type-ui/assets/icon-128x128.png?rev=2744389\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:75:\"https://ps.w.org/custom-post-type-ui/assets/banner-1544x500.png?rev=2744389\";s:2:\"1x\";s:74:\"https://ps.w.org/custom-post-type-ui/assets/banner-772x250.png?rev=2744389\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"6.5\";}s:47:\"jwt-authentication-for-wp-rest-api/jwt-auth.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:48:\"w.org/plugins/jwt-authentication-for-wp-rest-api\";s:4:\"slug\";s:34:\"jwt-authentication-for-wp-rest-api\";s:6:\"plugin\";s:47:\"jwt-authentication-for-wp-rest-api/jwt-auth.php\";s:11:\"new_version\";s:5:\"1.3.6\";s:3:\"url\";s:65:\"https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/\";s:7:\"package\";s:83:\"https://downloads.wordpress.org/plugin/jwt-authentication-for-wp-rest-api.1.3.6.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:79:\"https://ps.w.org/jwt-authentication-for-wp-rest-api/assets/icon.svg?rev=2787935\";s:3:\"svg\";s:79:\"https://ps.w.org/jwt-authentication-for-wp-rest-api/assets/icon.svg?rev=2787935\";}s:7:\"banners\";a:1:{s:2:\"1x\";s:89:\"https://ps.w.org/jwt-authentication-for-wp-rest-api/assets/banner-772x250.jpg?rev=2787935\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.2\";}s:37:\"post-types-order/post-types-order.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:30:\"w.org/plugins/post-types-order\";s:4:\"slug\";s:16:\"post-types-order\";s:6:\"plugin\";s:37:\"post-types-order/post-types-order.php\";s:11:\"new_version\";s:5:\"2.3.3\";s:3:\"url\";s:47:\"https://wordpress.org/plugins/post-types-order/\";s:7:\"package\";s:65:\"https://downloads.wordpress.org/plugin/post-types-order.2.3.3.zip\";s:5:\"icons\";a:1:{s:2:\"1x\";s:69:\"https://ps.w.org/post-types-order/assets/icon-128x128.png?rev=1226428\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:72:\"https://ps.w.org/post-types-order/assets/banner-1544x500.png?rev=3164418\";s:2:\"1x\";s:71:\"https://ps.w.org/post-types-order/assets/banner-772x250.png?rev=3164418\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"2.8\";}s:23:\"wordfence/wordfence.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:23:\"w.org/plugins/wordfence\";s:4:\"slug\";s:9:\"wordfence\";s:6:\"plugin\";s:23:\"wordfence/wordfence.php\";s:11:\"new_version\";s:5:\"8.0.3\";s:3:\"url\";s:40:\"https://wordpress.org/plugins/wordfence/\";s:7:\"package\";s:58:\"https://downloads.wordpress.org/plugin/wordfence.8.0.3.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:54:\"https://ps.w.org/wordfence/assets/icon.svg?rev=2070865\";s:3:\"svg\";s:54:\"https://ps.w.org/wordfence/assets/icon.svg?rev=2070865\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:65:\"https://ps.w.org/wordfence/assets/banner-1544x500.jpg?rev=2124102\";s:2:\"1x\";s:64:\"https://ps.w.org/wordfence/assets/banner-772x250.jpg?rev=2124102\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.7\";}s:41:\"wordpress-importer/wordpress-importer.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:32:\"w.org/plugins/wordpress-importer\";s:4:\"slug\";s:18:\"wordpress-importer\";s:6:\"plugin\";s:41:\"wordpress-importer/wordpress-importer.php\";s:11:\"new_version\";s:5:\"0.8.3\";s:3:\"url\";s:49:\"https://wordpress.org/plugins/wordpress-importer/\";s:7:\"package\";s:67:\"https://downloads.wordpress.org/plugin/wordpress-importer.0.8.3.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:63:\"https://ps.w.org/wordpress-importer/assets/icon.svg?rev=2791650\";s:3:\"svg\";s:63:\"https://ps.w.org/wordpress-importer/assets/icon.svg?rev=2791650\";}s:7:\"banners\";a:1:{s:2:\"1x\";s:72:\"https://ps.w.org/wordpress-importer/assets/banner-772x250.png?rev=547654\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"5.2\";}s:27:\"wp-optimize/wp-optimize.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:25:\"w.org/plugins/wp-optimize\";s:4:\"slug\";s:11:\"wp-optimize\";s:6:\"plugin\";s:27:\"wp-optimize/wp-optimize.php\";s:11:\"new_version\";s:5:\"4.0.1\";s:3:\"url\";s:42:\"https://wordpress.org/plugins/wp-optimize/\";s:7:\"package\";s:60:\"https://downloads.wordpress.org/plugin/wp-optimize.4.0.1.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:64:\"https://ps.w.org/wp-optimize/assets/icon-256x256.png?rev=1552899\";s:2:\"1x\";s:64:\"https://ps.w.org/wp-optimize/assets/icon-128x128.png?rev=1552899\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:67:\"https://ps.w.org/wp-optimize/assets/banner-1544x500.png?rev=2125385\";s:2:\"1x\";s:66:\"https://ps.w.org/wp-optimize/assets/banner-772x250.png?rev=2125385\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.9\";}s:39:\"wp-file-manager/file_folder_manager.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:29:\"w.org/plugins/wp-file-manager\";s:4:\"slug\";s:15:\"wp-file-manager\";s:6:\"plugin\";s:39:\"wp-file-manager/file_folder_manager.php\";s:11:\"new_version\";s:5:\"8.0.1\";s:3:\"url\";s:46:\"https://wordpress.org/plugins/wp-file-manager/\";s:7:\"package\";s:58:\"https://downloads.wordpress.org/plugin/wp-file-manager.zip\";s:5:\"icons\";a:1:{s:2:\"1x\";s:68:\"https://ps.w.org/wp-file-manager/assets/icon-128x128.png?rev=2491299\";}s:7:\"banners\";a:1:{s:2:\"1x\";s:70:\"https://ps.w.org/wp-file-manager/assets/banner-772x250.jpg?rev=2491299\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.0\";}s:29:\"wp-mail-smtp/wp_mail_smtp.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:26:\"w.org/plugins/wp-mail-smtp\";s:4:\"slug\";s:12:\"wp-mail-smtp\";s:6:\"plugin\";s:29:\"wp-mail-smtp/wp_mail_smtp.php\";s:11:\"new_version\";s:5:\"4.3.0\";s:3:\"url\";s:43:\"https://wordpress.org/plugins/wp-mail-smtp/\";s:7:\"package\";s:61:\"https://downloads.wordpress.org/plugin/wp-mail-smtp.4.3.0.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:65:\"https://ps.w.org/wp-mail-smtp/assets/icon-256x256.png?rev=1755440\";s:2:\"1x\";s:65:\"https://ps.w.org/wp-mail-smtp/assets/icon-128x128.png?rev=1755440\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:68:\"https://ps.w.org/wp-mail-smtp/assets/banner-1544x500.png?rev=3206423\";s:2:\"1x\";s:67:\"https://ps.w.org/wp-mail-smtp/assets/banner-772x250.png?rev=3206423\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"5.5\";}}}','off'),(33,'_site_transient_timeout_theme_roots','1740488086','off'),(34,'_site_transient_theme_roots','a:3:{s:12:\"bricks-child\";s:7:\"/themes\";s:6:\"bricks\";s:7:\"/themes\";s:16:\"twentytwentyfive\";s:7:\"/themes\";}','off'),(35,'_site_transient_update_themes','O:8:\"stdClass\":5:{s:12:\"last_checked\";i:1740486286;s:7:\"checked\";a:3:{s:12:\"bricks-child\";s:3:\"1.1\";s:6:\"bricks\";s:6:\"1.12.1\";s:16:\"twentytwentyfive\";s:3:\"1.0\";}s:8:\"response\";a:1:{s:16:\"twentytwentyfive\";a:6:{s:5:\"theme\";s:16:\"twentytwentyfive\";s:11:\"new_version\";s:3:\"1.1\";s:3:\"url\";s:46:\"https://wordpress.org/themes/twentytwentyfive/\";s:7:\"package\";s:62:\"https://downloads.wordpress.org/theme/twentytwentyfive.1.1.zip\";s:8:\"requires\";s:3:\"6.7\";s:12:\"requires_php\";s:3:\"7.2\";}}s:9:\"no_update\";a:0:{}s:12:\"translations\";a:0:{}}','off');
/*!40000 ALTER TABLE `wp_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_posts`
--

DROP TABLE IF EXISTS `wp_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_posts` (
  `ID` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_author` bigint unsigned NOT NULL DEFAULT '0',
  `post_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `post_date_gmt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `post_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_title` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_excerpt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `post_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'publish',
  `comment_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `ping_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `post_password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `post_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `post_modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `post_modified_gmt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `post_parent` bigint unsigned NOT NULL DEFAULT '0',
  `guid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `post_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'post',
  `comment_count` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `post_name` (`post_name`(191)),
  KEY `type_status_date` (`post_type`,`post_status`,`post_date`,`ID`),
  KEY `post_parent` (`post_parent`),
  KEY `post_author` (`post_author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_posts`
--

LOCK TABLES `wp_posts` WRITE;
/*!40000 ALTER TABLE `wp_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_usermeta`
--

DROP TABLE IF EXISTS `wp_usermeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_usermeta` (
  `umeta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_value` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`umeta_id`),
  KEY `user_id` (`user_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_usermeta`
--

LOCK TABLES `wp_usermeta` WRITE;
/*!40000 ALTER TABLE `wp_usermeta` DISABLE KEYS */;
INSERT INTO `wp_usermeta` VALUES (2,21,'verified','1'),(3,21,'verified','1'),(4,22,'verified','1'),(5,13,'verified','1'),(7,26,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(10,26,'phone','+1234567890'),(11,26,'company','Test Company'),(14,26,'first_name','Updated'),(15,26,'last_name','Client'),(16,27,'first_name','Kevin'),(17,27,'last_name','Peters'),(18,27,'phone','+1111144444'),(19,27,'company','ndfionqso'),(21,27,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(23,28,'first_name','Carlos'),(24,28,'last_name','JanssenSSS'),(25,28,'phone','+33344555'),(26,28,'company',''),(28,28,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(30,29,'first_name','Jeanno'),(31,29,'last_name','Pieters'),(32,29,'phone','3245'),(33,29,'company','Z5342('),(35,29,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(37,30,'first_name','Pierre '),(38,30,'last_name','Lončar'),(39,30,'phone','6567564Z'),(40,30,'company','qfdsdf'),(41,30,'verified','1'),(42,30,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(43,30,'verification_token','17a4a53ad5cb39479166d6759fa055ff'),(46,27,'verified','1'),(47,28,'verified','1'),(48,29,'verified','1'),(55,26,'verified','1'),(56,31,'first_name','Test'),(57,31,'last_name','Customer'),(58,31,'phone','+1234567890'),(59,31,'company','Test Company Ltd'),(60,31,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(61,31,'verified','1'),(62,1,'wp_capabilities','a:1:{s:13:\"administrator\";b:1;}'),(63,32,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(64,32,'verified','1'),(65,29,'phone_number','3245'),(66,33,'first_name','Jefri'),(67,33,'last_name','Wolles'),(68,33,'phone','+1222332232'),(69,33,'company','Nope'),(70,33,'verified','1'),(71,33,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(73,34,'first_name','Joss'),(74,34,'last_name','Jespers'),(75,34,'phone','123'),(76,34,'company','Test'),(77,34,'verified','1'),(78,34,'wp_capabilities','a:1:{s:14:\"charter_client\";b:1;}'),(79,34,'verification_token',NULL),(80,34,'phone_number','123'),(81,28,'address',''),(82,28,'city',''),(83,28,'state',''),(84,28,'zip',''),(85,28,'country',''),(86,28,'notes',''),(87,28,'phone_number','+33344555'),(88,28,'invite_token','bab85595b483fbe5c997a5c9882b0fbf47b43ab0729a23ad8d4b2002d84d1b54'),(89,28,'invite_token','ed97f23f72a80df3bbe5cab1f76724b1855f7e487b5d6c2fe9fad0964bf9b9a6'),(90,28,'invite_token','2b1eacde67d081418a2a226b994bf04e27fc3881b657a44d3363cd290a775738');
/*!40000 ALTER TABLE `wp_usermeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_users`
--

DROP TABLE IF EXISTS `wp_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_users` (
  `ID` bigint NOT NULL AUTO_INCREMENT,
  `user_login` varchar(60) NOT NULL DEFAULT '',
  `user_pass` varchar(255) NOT NULL DEFAULT '',
  `user_email` varchar(100) NOT NULL DEFAULT '',
  `user_registered` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `display_name` varchar(250) NOT NULL DEFAULT '',
  `first_name` varchar(100) NOT NULL DEFAULT '',
  `last_name` varchar(100) NOT NULL DEFAULT '',
  `address` text,
  `role` varchar(20) NOT NULL DEFAULT 'charter_client',
  `verified` tinyint(1) DEFAULT '0',
  `verification_token` varchar(255) DEFAULT NULL,
  `reset_password_token` varchar(255) DEFAULT NULL,
  `reset_password_expires` datetime DEFAULT NULL,
  `refresh_token` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `last_ip` varchar(45) DEFAULT NULL,
  `last_user_agent` varchar(255) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `login_attempts` int DEFAULT '0',
  PRIMARY KEY (`ID`),
  UNIQUE KEY `user_login` (`user_login`),
  UNIQUE KEY `user_email` (`user_email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_users`
--

LOCK TABLES `wp_users` WRITE;
/*!40000 ALTER TABLE `wp_users` DISABLE KEYS */;
INSERT INTO `wp_users` VALUES (1,'admin','$2y$12$LvZ1r5nVgAv6UScTFAzxxebXSmaj/t5ccf99BQdv9VUQNsWuy7Z7i','admin@charterhub.com','2025-02-25 20:00:21','Admin User','Admin','User',NULL,'administrator',1,NULL,NULL,NULL,'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluaXN0cmF0b3IiLCJleHAiOjE3NDExNjc3ODIyMDQsImlhdCI6MTc0MTE2MDU4Mn0.8MDpfb21UpSg4MfVANjj4scnJ1U0YRWISG98PUf7xxo',NULL,NULL,NULL,NULL,NULL,0),(2,'manager','$2y$12$XcBPndkg2oEdf.UKZxLnbuUYscMUAuJsL0zY8moizBXPqpmwb8T9G','manager@charterhub.com','2025-02-25 20:00:21','Charter Manager','Charter','Manager',NULL,'manager',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),(26,'test1@me.com','$2y$12$TdVG.YMpfPrgLqIn0DaIUOVKrDZd.lvslH5tnF50wkijg8z7KiqDi','updated@example.com','2025-03-02 08:59:32','Updated Client','Maurits','Dierick',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$owVNUF7F7QbxNLS1ui.ME.6mnT9jAPm8LoXJ.eQXmEBDHkJ06RmTS','2025-03-04 11:29:34','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0),(27,'Test2@me.com','$2y$12$linUcHfthKlihStRFYJAjudfDhjpXccnp3GtUmSPLB9t4o20jxEa6','Test2@me.com','2025-03-02 15:39:55','Kevin Peters','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$FMB8MTneIBh3TUpNjmf.ueqsf3bFlMeYP2Oj0W21xLHkiozknWGS6','2025-03-04 11:05:58','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0),(28,'test3mecom','$2y$12$WrIaj8ViTgmh6s6FHkr/deqjcJpi37Wg08Dw3tAxDN98DzcOxl4u6','test3@me.com','2025-03-02 15:43:50','Karlo Janssen','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$OcdyiD3WQnWObHgdb67Bwubc5IWWfFcHP.Vl/DAK2S7xLB1dzky4G','2025-03-05 08:58:26','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0),(29,'Test4@me.com','$2y$12$pa46c6aoor/ZIWz66fMKAensd9fhQ7b57rg.Ms1Io5X8IH89QDDQG','Test4@me.com','2025-03-02 15:49:21','Jeanno Pieters','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$fOOrEUDeZtFgSO6KnTdza.FzBxb8iAvVqZKsMMgoV2I5CSUD5LOZ.','2025-03-04 15:39:17','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0),(30,'Test5@me.com','$2y$12$N8sf10xC.gbsMijb9hrYwOfFEIkUU8quytWNj8oZivx/FskxmjemW','Test5@me.com','2025-03-02 16:38:04','Pierre  Lončar','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$6UqLWzf0ZkrgW0996H/j8OGCnWxScy20Mcsyvio0QLIWF5uP0yV3a','2025-03-03 19:06:32','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0),(31,'testcustomer','$2y$12$LZSwu9OD8qMbd1WZy.wXJO3WYNmDltzymIRrdwSfJneKFL072KiPm','customer@example.com','2025-03-03 12:36:48','Test Customer','','',NULL,'charter_client',1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0),(32,'testclient','$2y$12$alIr8rUX6J7JBINDPHGyJOvXv3WB1Uy6bxynIuI8rN3fDb0E4pVU2','testclient@example.com','2025-03-03 14:32:32','Test Client','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$1DMTQDXOe89OsrlGjQT8BOYLl7USjY4ycYCHIBT/KpPsJht2z3psW','2025-03-03 15:43:49','::1',NULL,NULL,NULL,0),(33,'Test6@me.com','$2y$12$cVVlEcI98IXAzl4/IaVMQO9yhnjWjdPnC//JsVjXKyD38IS3.jQe6','Test6@me.com','2025-03-04 12:18:43','Jefri Wolles','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$hYP61.05HghnHY1xN/k4CudqGTqhlpKUI3kgi.PisgTvEkSjPfhnC','2025-03-04 12:20:05','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0),(34,'Test7@me.com','$2y$12$QcUBb7Z7ZbwEOdGVXXFzZ./stpiiSKJUxYKXbzywa/wwsi6Jqa7/e','Test7@me.com','2025-03-04 12:30:54','Joss Jespers','','',NULL,'charter_client',1,NULL,NULL,NULL,'$2y$12$3fCKFnxWQhm.u6wwxFbEv.fdCmF0nTqnhBVBVSmgiQL6gWH7RzY76','2025-03-04 13:42:33','::1','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',NULL,NULL,0);
/*!40000 ALTER TABLE `wp_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-11  9:06:28
