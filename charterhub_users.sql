-- ChartHub Users Table
-- Created for Aiven MySQL

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create the users table with PRIMARY KEY
CREATE TABLE `wp_charterhub_users` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `token_version` int NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes
CREATE INDEX `email_index` ON `wp_charterhub_users` (`email`);
CREATE INDEX `role_index` ON `wp_charterhub_users` (`role`);

-- Sample user data (you can replace these with your actual users)
INSERT INTO `wp_charterhub_users` 
(`email`, `password`, `first_name`, `last_name`, `display_name`, `role`, `verified`) 
VALUES 
('admin@charterhub.com', '$2y$10$abcdefghijklmnopqrstuuWVpIt9g3FDTrjQfb90YUMScTrFuRXDO', 'Admin', 'User', 'Admin User', 'admin', 1),
('client@example.com', '$2y$10$abcdefghijklmnopqrstuu38V.a4zZDFBnpgkZ2vAR.pEKK0SvVHO', 'Client', 'User', 'Client User', 'client', 1);

-- Create bookings table
CREATE TABLE `wp_charterhub_bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `yacht_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `total_price` decimal(10,2) NOT NULL,
  `main_charterer_id` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for bookings
CREATE INDEX `yacht_index` ON `wp_charterhub_bookings` (`yacht_id`);
CREATE INDEX `charterer_index` ON `wp_charterhub_bookings` (`main_charterer_id`);
CREATE INDEX `status_index` ON `wp_charterhub_bookings` (`status`);

-- Sample booking data
INSERT INTO `wp_charterhub_bookings` 
(`yacht_id`, `start_date`, `end_date`, `status`, `total_price`, `main_charterer_id`) 
VALUES 
(1, '2025-06-01', '2025-06-08', 'confirmed', 5000.00, 2),
(2, '2025-07-15', '2025-07-22', 'pending', 7500.00, 2);

COMMIT; 