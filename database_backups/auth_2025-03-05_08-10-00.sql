-- Database backup for auth
-- Generated on 2025-03-05 08:10:00

DROP TABLE IF EXISTS `wp_auth_logs`;
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

DROP TABLE IF EXISTS `wp_booking_documents`;
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

DROP TABLE IF EXISTS `wp_booking_guests`;
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

DROP TABLE IF EXISTS `wp_bookings`;
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

DROP TABLE IF EXISTS `wp_charterhub_auth_logs`;
CREATE TABLE `wp_charterhub_auth_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `action` enum('login','signup','password_reset','verification','invitation','logout','token_refresh') NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `wp_charterhub_auth_logs` (`id`, `user_id`, `action`, `status`, `ip_address`, `user_agent`, `details`, `created_at`) VALUES
('1', '28', 'login', 'success', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}', '2025-03-04 20:14:21'),
('2', '28', 'token_refresh', 'success', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '{\"ip\": \"::1\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}', '2025-03-04 21:11:18'),
('3', '28', 'login', 'success', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}', '2025-03-04 21:12:04'),
('4', '28', 'token_refresh', 'success', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '{\"ip\": \"::1\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}', '2025-03-04 23:06:15'),
('8', '28', 'login', 'success', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}', '2025-03-05 08:48:23'),
('9', '28', 'login', 'success', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', '{\"ip\": \"::1\", \"role\": \"charter_client\", \"email\": \"test3@me.com\", \"ip_address\": \"::1\", \"user_agent\": \"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36\"}', '2025-03-05 08:58:26');

DROP TABLE IF EXISTS `wp_charterhub_booking_guests`;
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

DROP TABLE IF EXISTS `wp_charterhub_bookings`;
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

DROP TABLE IF EXISTS `wp_charterhub_document_relations`;
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

DROP TABLE IF EXISTS `wp_charterhub_documents`;
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

INSERT INTO `wp_charterhub_documents` (`id`, `title`, `file_path`, `file_type`, `file_size`, `user_id`, `visibility`, `created_at`, `updated_at`) VALUES
('1', 'Test Document 1', 'charterhub-documents/test1.pdf', 'application/pdf', '1024', '1', 'private', '2025-02-24 18:10:06', '2025-02-24 18:10:06'),
('2', 'Test Document 2', 'charterhub-documents/test2.pdf', 'application/pdf', '2048', '2', 'public', '2025-02-24 18:10:06', '2025-02-24 18:10:06');

DROP TABLE IF EXISTS `wp_jwt_tokens`;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `wp_jwt_tokens` (`id`, `user_id`, `token_hash`, `refresh_token_hash`, `expires_at`, `refresh_expires_at`, `created_at`, `revoked`, `last_used_at`) VALUES
('1', '1', '9cb72b9992cc269648d66d9dd7f2e281fc456f50347639f1aa53a3e32eb1a75a', '664d1608742c192e9fb0454f58f72953779787aa91e285c27609140a724dd992', '2025-03-05 11:31:59', NULL, '2025-03-04 11:31:59', '0', '2025-03-04 11:31:59'),
('2', '1', '6ffeb9bd0be4df61f4265e3c065a773e5a2ade5bf8e0c4c8393cd31b75973c87', '8d54d22210d662ad5217ab27b9f4cc5edb27d316c4dbd74204fd68bd5dc25ea1', '2025-03-05 11:38:42', NULL, '2025-03-04 11:38:42', '0', '2025-03-04 11:38:42'),
('3', '1', 'b690fbf14075b29285e383f52da02bcd58cafd92adfbef75b6eb33bdd6fe3c47', 'dd0d51e93c9522f5abc8c54ef8be4170c4b786b7f74e00403c074a98cec79f31', '2025-03-05 11:47:01', NULL, '2025-03-04 11:47:01', '0', '2025-03-04 11:47:01');

DROP TABLE IF EXISTS `wp_options`;
CREATE TABLE `wp_options` (
  `option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `option_value` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `autoload` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `option_name` (`option_name`),
  KEY `autoload` (`autoload`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `wp_options` (`option_id`, `option_name`, `option_value`, `autoload`) VALUES
('1', 'siteurl', 'http://localhost:8888', 'yes'),
('2', 'home', 'http://localhost:8888', 'yes'),
('3', 'blogname', 'CharterHub', 'yes'),
('4', 'admin_email', 'admin@example.com', 'yes'),
('5', 'active_plugins', 'a:1:{i:0;s:29:\"charterhub-api/charterhub-api.php\";}', 'yes'),
('6', 'permalink_structure', '/%postname%/', 'yes'),
('7', 'cron', 'a:5:{i:1740489884;a:1:{s:34:\"wp_privacy_delete_old_export_files\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:6:\"hourly\";s:4:\"args\";a:0:{}s:8:\"interval\";i:3600;}}}i:1740529484;a:3:{s:16:\"wp_version_check\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:10:\"twicedaily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:43200;}}s:17:\"wp_update_plugins\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:10:\"twicedaily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:43200;}}s:16:\"wp_update_themes\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:10:\"twicedaily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:43200;}}}i:1740572683;a:1:{s:32:\"recovery_mode_clean_expired_keys\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:5:\"daily\";s:4:\"args\";a:0:{}s:8:\"interval\";i:86400;}}}i:1740572684;a:1:{s:30:\"wp_site_health_scheduled_check\";a:1:{s:32:\"40cd750bba9870f18aada2478b24840a\";a:3:{s:8:\"schedule\";s:6:\"weekly\";s:4:\"args\";a:0:{}s:8:\"interval\";i:604800;}}}s:7:\"version\";i:2;}', 'on'),
('8', 'widget_pages', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('9', 'widget_calendar', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('10', 'widget_archives', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('11', 'widget_links', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('12', 'widget_media_audio', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('13', 'widget_media_image', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('14', 'widget_media_gallery', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('15', 'widget_media_video', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('16', 'widget_meta', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('17', 'widget_search', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('18', 'widget_text', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('19', 'widget_categories', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('20', 'widget_recent-posts', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('21', 'widget_recent-comments', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('22', 'widget_rss', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('23', 'widget_tag_cloud', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('24', 'widget_nav_menu', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('25', 'widget_custom_html', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('26', 'widget_block', 'a:1:{s:12:\"_multiwidget\";i:1;}', 'auto'),
('27', '_site_transient_timeout_wp_theme_files_patterns-eba7854ab25d611571a56fe97fa52f88', '1740488084', 'off'),
('28', '_site_transient_wp_theme_files_patterns-eba7854ab25d611571a56fe97fa52f88', 'a:2:{s:7:\"version\";b:0;s:8:\"patterns\";a:0:{}}', 'off'),
('30', 'recovery_keys', 'a:0:{}', 'off'),
('31', '_site_transient_update_core', 'O:8:\"stdClass\":4:{s:7:\"updates\";a:1:{i:0;O:8:\"stdClass\":10:{s:8:\"response\";s:6:\"latest\";s:8:\"download\";s:59:\"https://downloads.wordpress.org/release/wordpress-6.7.2.zip\";s:6:\"locale\";s:5:\"en_US\";s:8:\"packages\";O:8:\"stdClass\":5:{s:4:\"full\";s:59:\"https://downloads.wordpress.org/release/wordpress-6.7.2.zip\";s:10:\"no_content\";s:70:\"https://downloads.wordpress.org/release/wordpress-6.7.2-no-content.zip\";s:11:\"new_bundled\";s:71:\"https://downloads.wordpress.org/release/wordpress-6.7.2-new-bundled.zip\";s:7:\"partial\";s:0:\"\";s:8:\"rollback\";s:0:\"\";}s:7:\"current\";s:5:\"6.7.2\";s:7:\"version\";s:5:\"6.7.2\";s:11:\"php_version\";s:6:\"7.2.24\";s:13:\"mysql_version\";s:5:\"5.5.5\";s:11:\"new_bundled\";s:3:\"6.7\";s:15:\"partial_version\";s:0:\"\";}}s:12:\"last_checked\";i:1740486285;s:15:\"version_checked\";s:5:\"6.7.2\";s:12:\"translations\";a:0:{}}', 'off'),
('32', '_site_transient_update_plugins', 'O:8:\"stdClass\":4:{s:12:\"last_checked\";i:1740486285;s:8:\"response\";a:0:{}s:12:\"translations\";a:0:{}s:9:\"no_update\";a:11:{s:30:\"advanced-custom-fields/acf.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:36:\"w.org/plugins/advanced-custom-fields\";s:4:\"slug\";s:22:\"advanced-custom-fields\";s:6:\"plugin\";s:30:\"advanced-custom-fields/acf.php\";s:11:\"new_version\";s:6:\"6.3.12\";s:3:\"url\";s:53:\"https://wordpress.org/plugins/advanced-custom-fields/\";s:7:\"package\";s:72:\"https://downloads.wordpress.org/plugin/advanced-custom-fields.6.3.12.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:67:\"https://ps.w.org/advanced-custom-fields/assets/icon.svg?rev=3207824\";s:3:\"svg\";s:67:\"https://ps.w.org/advanced-custom-fields/assets/icon.svg?rev=3207824\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:78:\"https://ps.w.org/advanced-custom-fields/assets/banner-1544x500.jpg?rev=3207824\";s:2:\"1x\";s:77:\"https://ps.w.org/advanced-custom-fields/assets/banner-772x250.jpg?rev=3207824\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"6.0\";}s:51:\"all-in-one-wp-migration/all-in-one-wp-migration.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:37:\"w.org/plugins/all-in-one-wp-migration\";s:4:\"slug\";s:23:\"all-in-one-wp-migration\";s:6:\"plugin\";s:51:\"all-in-one-wp-migration/all-in-one-wp-migration.php\";s:11:\"new_version\";s:4:\"7.89\";s:3:\"url\";s:54:\"https://wordpress.org/plugins/all-in-one-wp-migration/\";s:7:\"package\";s:71:\"https://downloads.wordpress.org/plugin/all-in-one-wp-migration.7.89.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:76:\"https://ps.w.org/all-in-one-wp-migration/assets/icon-256x256.png?rev=2458334\";s:2:\"1x\";s:76:\"https://ps.w.org/all-in-one-wp-migration/assets/icon-128x128.png?rev=2458334\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:79:\"https://ps.w.org/all-in-one-wp-migration/assets/banner-1544x500.png?rev=3209691\";s:2:\"1x\";s:78:\"https://ps.w.org/all-in-one-wp-migration/assets/banner-772x250.png?rev=3209691\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"3.3\";}s:45:\"taxonomy-terms-order/taxonomy-terms-order.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:34:\"w.org/plugins/taxonomy-terms-order\";s:4:\"slug\";s:20:\"taxonomy-terms-order\";s:6:\"plugin\";s:45:\"taxonomy-terms-order/taxonomy-terms-order.php\";s:11:\"new_version\";s:5:\"1.8.7\";s:3:\"url\";s:51:\"https://wordpress.org/plugins/taxonomy-terms-order/\";s:7:\"package\";s:69:\"https://downloads.wordpress.org/plugin/taxonomy-terms-order.1.8.7.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:73:\"https://ps.w.org/taxonomy-terms-order/assets/icon-256x256.png?rev=1564412\";s:2:\"1x\";s:73:\"https://ps.w.org/taxonomy-terms-order/assets/icon-128x128.png?rev=1564412\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:76:\"https://ps.w.org/taxonomy-terms-order/assets/banner-1544x500.png?rev=1564412\";s:2:\"1x\";s:75:\"https://ps.w.org/taxonomy-terms-order/assets/banner-772x250.png?rev=1564412\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"2.8\";}s:43:\"custom-post-type-ui/custom-post-type-ui.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:33:\"w.org/plugins/custom-post-type-ui\";s:4:\"slug\";s:19:\"custom-post-type-ui\";s:6:\"plugin\";s:43:\"custom-post-type-ui/custom-post-type-ui.php\";s:11:\"new_version\";s:6:\"1.17.2\";s:3:\"url\";s:50:\"https://wordpress.org/plugins/custom-post-type-ui/\";s:7:\"package\";s:69:\"https://downloads.wordpress.org/plugin/custom-post-type-ui.1.17.2.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:72:\"https://ps.w.org/custom-post-type-ui/assets/icon-256x256.png?rev=2744389\";s:2:\"1x\";s:72:\"https://ps.w.org/custom-post-type-ui/assets/icon-128x128.png?rev=2744389\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:75:\"https://ps.w.org/custom-post-type-ui/assets/banner-1544x500.png?rev=2744389\";s:2:\"1x\";s:74:\"https://ps.w.org/custom-post-type-ui/assets/banner-772x250.png?rev=2744389\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"6.5\";}s:47:\"jwt-authentication-for-wp-rest-api/jwt-auth.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:48:\"w.org/plugins/jwt-authentication-for-wp-rest-api\";s:4:\"slug\";s:34:\"jwt-authentication-for-wp-rest-api\";s:6:\"plugin\";s:47:\"jwt-authentication-for-wp-rest-api/jwt-auth.php\";s:11:\"new_version\";s:5:\"1.3.6\";s:3:\"url\";s:65:\"https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/\";s:7:\"package\";s:83:\"https://downloads.wordpress.org/plugin/jwt-authentication-for-wp-rest-api.1.3.6.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:79:\"https://ps.w.org/jwt-authentication-for-wp-rest-api/assets/icon.svg?rev=2787935\";s:3:\"svg\";s:79:\"https://ps.w.org/jwt-authentication-for-wp-rest-api/assets/icon.svg?rev=2787935\";}s:7:\"banners\";a:1:{s:2:\"1x\";s:89:\"https://ps.w.org/jwt-authentication-for-wp-rest-api/assets/banner-772x250.jpg?rev=2787935\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.2\";}s:37:\"post-types-order/post-types-order.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:30:\"w.org/plugins/post-types-order\";s:4:\"slug\";s:16:\"post-types-order\";s:6:\"plugin\";s:37:\"post-types-order/post-types-order.php\";s:11:\"new_version\";s:5:\"2.3.3\";s:3:\"url\";s:47:\"https://wordpress.org/plugins/post-types-order/\";s:7:\"package\";s:65:\"https://downloads.wordpress.org/plugin/post-types-order.2.3.3.zip\";s:5:\"icons\";a:1:{s:2:\"1x\";s:69:\"https://ps.w.org/post-types-order/assets/icon-128x128.png?rev=1226428\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:72:\"https://ps.w.org/post-types-order/assets/banner-1544x500.png?rev=3164418\";s:2:\"1x\";s:71:\"https://ps.w.org/post-types-order/assets/banner-772x250.png?rev=3164418\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"2.8\";}s:23:\"wordfence/wordfence.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:23:\"w.org/plugins/wordfence\";s:4:\"slug\";s:9:\"wordfence\";s:6:\"plugin\";s:23:\"wordfence/wordfence.php\";s:11:\"new_version\";s:5:\"8.0.3\";s:3:\"url\";s:40:\"https://wordpress.org/plugins/wordfence/\";s:7:\"package\";s:58:\"https://downloads.wordpress.org/plugin/wordfence.8.0.3.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:54:\"https://ps.w.org/wordfence/assets/icon.svg?rev=2070865\";s:3:\"svg\";s:54:\"https://ps.w.org/wordfence/assets/icon.svg?rev=2070865\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:65:\"https://ps.w.org/wordfence/assets/banner-1544x500.jpg?rev=2124102\";s:2:\"1x\";s:64:\"https://ps.w.org/wordfence/assets/banner-772x250.jpg?rev=2124102\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.7\";}s:41:\"wordpress-importer/wordpress-importer.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:32:\"w.org/plugins/wordpress-importer\";s:4:\"slug\";s:18:\"wordpress-importer\";s:6:\"plugin\";s:41:\"wordpress-importer/wordpress-importer.php\";s:11:\"new_version\";s:5:\"0.8.3\";s:3:\"url\";s:49:\"https://wordpress.org/plugins/wordpress-importer/\";s:7:\"package\";s:67:\"https://downloads.wordpress.org/plugin/wordpress-importer.0.8.3.zip\";s:5:\"icons\";a:2:{s:2:\"1x\";s:63:\"https://ps.w.org/wordpress-importer/assets/icon.svg?rev=2791650\";s:3:\"svg\";s:63:\"https://ps.w.org/wordpress-importer/assets/icon.svg?rev=2791650\";}s:7:\"banners\";a:1:{s:2:\"1x\";s:72:\"https://ps.w.org/wordpress-importer/assets/banner-772x250.png?rev=547654\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"5.2\";}s:27:\"wp-optimize/wp-optimize.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:25:\"w.org/plugins/wp-optimize\";s:4:\"slug\";s:11:\"wp-optimize\";s:6:\"plugin\";s:27:\"wp-optimize/wp-optimize.php\";s:11:\"new_version\";s:5:\"4.0.1\";s:3:\"url\";s:42:\"https://wordpress.org/plugins/wp-optimize/\";s:7:\"package\";s:60:\"https://downloads.wordpress.org/plugin/wp-optimize.4.0.1.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:64:\"https://ps.w.org/wp-optimize/assets/icon-256x256.png?rev=1552899\";s:2:\"1x\";s:64:\"https://ps.w.org/wp-optimize/assets/icon-128x128.png?rev=1552899\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:67:\"https://ps.w.org/wp-optimize/assets/banner-1544x500.png?rev=2125385\";s:2:\"1x\";s:66:\"https://ps.w.org/wp-optimize/assets/banner-772x250.png?rev=2125385\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.9\";}s:39:\"wp-file-manager/file_folder_manager.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:29:\"w.org/plugins/wp-file-manager\";s:4:\"slug\";s:15:\"wp-file-manager\";s:6:\"plugin\";s:39:\"wp-file-manager/file_folder_manager.php\";s:11:\"new_version\";s:5:\"8.0.1\";s:3:\"url\";s:46:\"https://wordpress.org/plugins/wp-file-manager/\";s:7:\"package\";s:58:\"https://downloads.wordpress.org/plugin/wp-file-manager.zip\";s:5:\"icons\";a:1:{s:2:\"1x\";s:68:\"https://ps.w.org/wp-file-manager/assets/icon-128x128.png?rev=2491299\";}s:7:\"banners\";a:1:{s:2:\"1x\";s:70:\"https://ps.w.org/wp-file-manager/assets/banner-772x250.jpg?rev=2491299\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"4.0\";}s:29:\"wp-mail-smtp/wp_mail_smtp.php\";O:8:\"stdClass\":10:{s:2:\"id\";s:26:\"w.org/plugins/wp-mail-smtp\";s:4:\"slug\";s:12:\"wp-mail-smtp\";s:6:\"plugin\";s:29:\"wp-mail-smtp/wp_mail_smtp.php\";s:11:\"new_version\";s:5:\"4.3.0\";s:3:\"url\";s:43:\"https://wordpress.org/plugins/wp-mail-smtp/\";s:7:\"package\";s:61:\"https://downloads.wordpress.org/plugin/wp-mail-smtp.4.3.0.zip\";s:5:\"icons\";a:2:{s:2:\"2x\";s:65:\"https://ps.w.org/wp-mail-smtp/assets/icon-256x256.png?rev=1755440\";s:2:\"1x\";s:65:\"https://ps.w.org/wp-mail-smtp/assets/icon-128x128.png?rev=1755440\";}s:7:\"banners\";a:2:{s:2:\"2x\";s:68:\"https://ps.w.org/wp-mail-smtp/assets/banner-1544x500.png?rev=3206423\";s:2:\"1x\";s:67:\"https://ps.w.org/wp-mail-smtp/assets/banner-772x250.png?rev=3206423\";}s:11:\"banners_rtl\";a:0:{}s:8:\"requires\";s:3:\"5.5\";}}}', 'off'),
('33', '_site_transient_timeout_theme_roots', '1740488086', 'off'),
('34', '_site_transient_theme_roots', 'a:3:{s:12:\"bricks-child\";s:7:\"/themes\";s:6:\"bricks\";s:7:\"/themes\";s:16:\"twentytwentyfive\";s:7:\"/themes\";}', 'off'),
('35', '_site_transient_update_themes', 'O:8:\"stdClass\":5:{s:12:\"last_checked\";i:1740486286;s:7:\"checked\";a:3:{s:12:\"bricks-child\";s:3:\"1.1\";s:6:\"bricks\";s:6:\"1.12.1\";s:16:\"twentytwentyfive\";s:3:\"1.0\";}s:8:\"response\";a:1:{s:16:\"twentytwentyfive\";a:6:{s:5:\"theme\";s:16:\"twentytwentyfive\";s:11:\"new_version\";s:3:\"1.1\";s:3:\"url\";s:46:\"https://wordpress.org/themes/twentytwentyfive/\";s:7:\"package\";s:62:\"https://downloads.wordpress.org/theme/twentytwentyfive.1.1.zip\";s:8:\"requires\";s:3:\"6.7\";s:12:\"requires_php\";s:3:\"7.2\";}}s:9:\"no_update\";a:0:{}s:12:\"translations\";a:0:{}}', 'off');

DROP TABLE IF EXISTS `wp_posts`;
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

DROP TABLE IF EXISTS `wp_usermeta`;
CREATE TABLE `wp_usermeta` (
  `umeta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_value` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`umeta_id`),
  KEY `user_id` (`user_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `wp_usermeta` (`umeta_id`, `user_id`, `meta_key`, `meta_value`) VALUES
('2', '21', 'verified', '1'),
('3', '21', 'verified', '1'),
('4', '22', 'verified', '1'),
('5', '13', 'verified', '1'),
('7', '26', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('10', '26', 'phone', '+1234567890'),
('11', '26', 'company', 'Test Company'),
('14', '26', 'first_name', 'Updated'),
('15', '26', 'last_name', 'Client'),
('16', '27', 'first_name', 'Kevin'),
('17', '27', 'last_name', 'Peters'),
('18', '27', 'phone', '+1111144444'),
('19', '27', 'company', 'ndfionqso'),
('21', '27', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('23', '28', 'first_name', 'Carlos'),
('24', '28', 'last_name', 'JanssenSSS'),
('25', '28', 'phone', '+33344555'),
('26', '28', 'company', ''),
('28', '28', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('30', '29', 'first_name', 'Jeanno'),
('31', '29', 'last_name', 'Pieters'),
('32', '29', 'phone', '3245'),
('33', '29', 'company', 'Z5342('),
('35', '29', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('37', '30', 'first_name', 'Pierre '),
('38', '30', 'last_name', 'Lončar'),
('39', '30', 'phone', '6567564Z'),
('40', '30', 'company', 'qfdsdf'),
('41', '30', 'verified', '1'),
('42', '30', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('43', '30', 'verification_token', '17a4a53ad5cb39479166d6759fa055ff'),
('46', '27', 'verified', '1'),
('47', '28', 'verified', '1'),
('48', '29', 'verified', '1'),
('55', '26', 'verified', '1'),
('56', '31', 'first_name', 'Test'),
('57', '31', 'last_name', 'Customer'),
('58', '31', 'phone', '+1234567890'),
('59', '31', 'company', 'Test Company Ltd'),
('60', '31', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('61', '31', 'verified', '1'),
('62', '1', 'wp_capabilities', 'a:1:{s:13:\"administrator\";b:1;}'),
('63', '32', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('64', '32', 'verified', '1'),
('65', '29', 'phone_number', '3245'),
('66', '33', 'first_name', 'Jefri'),
('67', '33', 'last_name', 'Wolles'),
('68', '33', 'phone', '+1222332232'),
('69', '33', 'company', 'Nope'),
('70', '33', 'verified', '1'),
('71', '33', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('73', '34', 'first_name', 'Joss'),
('74', '34', 'last_name', 'Jespers'),
('75', '34', 'phone', '123'),
('76', '34', 'company', 'Test'),
('77', '34', 'verified', '1'),
('78', '34', 'wp_capabilities', 'a:1:{s:14:\"charter_client\";b:1;}'),
('79', '34', 'verification_token', NULL),
('80', '34', 'phone_number', '123'),
('81', '28', 'address', ''),
('82', '28', 'city', ''),
('83', '28', 'state', ''),
('84', '28', 'zip', ''),
('85', '28', 'country', ''),
('86', '28', 'notes', ''),
('87', '28', 'phone_number', '+33344555'),
('88', '28', 'invite_token', 'bab85595b483fbe5c997a5c9882b0fbf47b43ab0729a23ad8d4b2002d84d1b54'),
('89', '28', 'invite_token', 'ed97f23f72a80df3bbe5cab1f76724b1855f7e487b5d6c2fe9fad0964bf9b9a6'),
('90', '28', 'invite_token', '2b1eacde67d081418a2a226b994bf04e27fc3881b657a44d3363cd290a775738');

DROP TABLE IF EXISTS `wp_users`;
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

INSERT INTO `wp_users` (`ID`, `user_login`, `user_pass`, `user_email`, `user_registered`, `display_name`, `first_name`, `last_name`, `address`, `role`, `verified`, `verification_token`, `reset_password_token`, `reset_password_expires`, `refresh_token`, `last_login`, `last_ip`, `last_user_agent`, `metadata`, `phone_number`, `login_attempts`) VALUES
('1', 'admin', '$2y$12$LvZ1r5nVgAv6UScTFAzxxebXSmaj/t5ccf99BQdv9VUQNsWuy7Z7i', 'admin@charterhub.com', '2025-02-25 20:00:21', 'Admin User', 'Admin', 'User', NULL, 'administrator', '1', NULL, NULL, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluaXN0cmF0b3IiLCJleHAiOjE3NDExNjc3ODIyMDQsImlhdCI6MTc0MTE2MDU4Mn0.8MDpfb21UpSg4MfVANjj4scnJ1U0YRWISG98PUf7xxo', NULL, NULL, NULL, NULL, NULL, '0'),
('2', 'manager', '$2y$12$XcBPndkg2oEdf.UKZxLnbuUYscMUAuJsL0zY8moizBXPqpmwb8T9G', 'manager@charterhub.com', '2025-02-25 20:00:21', 'Charter Manager', 'Charter', 'Manager', NULL, 'manager', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0'),
('26', 'test1@me.com', '$2y$12$TdVG.YMpfPrgLqIn0DaIUOVKrDZd.lvslH5tnF50wkijg8z7KiqDi', 'updated@example.com', '2025-03-02 08:59:32', 'Updated Client', 'Maurits', 'Dierick', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$owVNUF7F7QbxNLS1ui.ME.6mnT9jAPm8LoXJ.eQXmEBDHkJ06RmTS', '2025-03-04 11:29:34', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0'),
('27', 'Test2@me.com', '$2y$12$linUcHfthKlihStRFYJAjudfDhjpXccnp3GtUmSPLB9t4o20jxEa6', 'Test2@me.com', '2025-03-02 15:39:55', 'Kevin Peters', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$FMB8MTneIBh3TUpNjmf.ueqsf3bFlMeYP2Oj0W21xLHkiozknWGS6', '2025-03-04 11:05:58', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0'),
('28', 'test3mecom', '$2y$12$WrIaj8ViTgmh6s6FHkr/deqjcJpi37Wg08Dw3tAxDN98DzcOxl4u6', 'test3@me.com', '2025-03-02 15:43:50', 'Karlo Janssen', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$OcdyiD3WQnWObHgdb67Bwubc5IWWfFcHP.Vl/DAK2S7xLB1dzky4G', '2025-03-05 08:58:26', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0'),
('29', 'Test4@me.com', '$2y$12$pa46c6aoor/ZIWz66fMKAensd9fhQ7b57rg.Ms1Io5X8IH89QDDQG', 'Test4@me.com', '2025-03-02 15:49:21', 'Jeanno Pieters', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$fOOrEUDeZtFgSO6KnTdza.FzBxb8iAvVqZKsMMgoV2I5CSUD5LOZ.', '2025-03-04 15:39:17', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0'),
('30', 'Test5@me.com', '$2y$12$N8sf10xC.gbsMijb9hrYwOfFEIkUU8quytWNj8oZivx/FskxmjemW', 'Test5@me.com', '2025-03-02 16:38:04', 'Pierre  Lončar', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$6UqLWzf0ZkrgW0996H/j8OGCnWxScy20Mcsyvio0QLIWF5uP0yV3a', '2025-03-03 19:06:32', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0'),
('31', 'testcustomer', '$2y$12$LZSwu9OD8qMbd1WZy.wXJO3WYNmDltzymIRrdwSfJneKFL072KiPm', 'customer@example.com', '2025-03-03 12:36:48', 'Test Customer', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '0'),
('32', 'testclient', '$2y$12$alIr8rUX6J7JBINDPHGyJOvXv3WB1Uy6bxynIuI8rN3fDb0E4pVU2', 'testclient@example.com', '2025-03-03 14:32:32', 'Test Client', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$1DMTQDXOe89OsrlGjQT8BOYLl7USjY4ycYCHIBT/KpPsJht2z3psW', '2025-03-03 15:43:49', '::1', NULL, NULL, NULL, '0'),
('33', 'Test6@me.com', '$2y$12$cVVlEcI98IXAzl4/IaVMQO9yhnjWjdPnC//JsVjXKyD38IS3.jQe6', 'Test6@me.com', '2025-03-04 12:18:43', 'Jefri Wolles', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$hYP61.05HghnHY1xN/k4CudqGTqhlpKUI3kgi.PisgTvEkSjPfhnC', '2025-03-04 12:20:05', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0'),
('34', 'Test7@me.com', '$2y$12$QcUBb7Z7ZbwEOdGVXXFzZ./stpiiSKJUxYKXbzywa/wwsi6Jqa7/e', 'Test7@me.com', '2025-03-04 12:30:54', 'Joss Jespers', '', '', NULL, 'charter_client', '1', NULL, NULL, NULL, '$2y$12$3fCKFnxWQhm.u6wwxFbEv.fdCmF0nTqnhBVBVSmgiQL6gWH7RzY76', '2025-03-04 13:42:33', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36', NULL, NULL, '0');

