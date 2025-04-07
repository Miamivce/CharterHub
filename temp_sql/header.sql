-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Apr 07, 2025 at 10:10 AM
-- Server version: 8.0.40
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `charterhub_local`
--

-- --------------------------------------------------------

--
-- Table structure for table `wp_actionscheduler_actions`
--

CREATE TABLE `wp_actionscheduler_actions` (
  `action_id` bigint UNSIGNED NOT NULL,
  `hook` varchar(191) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `scheduled_date_gmt` datetime DEFAULT '0000-00-00 00:00:00',
  `scheduled_date_local` datetime DEFAULT '0000-00-00 00:00:00',
  `priority` tinyint UNSIGNED NOT NULL DEFAULT '10',
  `args` varchar(191) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `schedule` longtext COLLATE utf8mb4_unicode_520_ci,
  `group_id` bigint UNSIGNED NOT NULL DEFAULT '0',
  `attempts` int NOT NULL DEFAULT '0',
  `last_attempt_gmt` datetime DEFAULT '0000-00-00 00:00:00',
  `last_attempt_local` datetime DEFAULT '0000-00-00 00:00:00',
  `claim_id` bigint UNSIGNED NOT NULL DEFAULT '0',
  `extended_args` varchar(8000) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `wp_actionscheduler_actions`
--

INSERT INTO `wp_actionscheduler_actions` (`action_id`, `hook`, `status`, `scheduled_date_gmt`, `scheduled_date_local`, `priority`, `args`, `schedule`, `group_id`, `attempts`, `last_attempt_gmt`, `last_attempt_local`, `claim_id`, `extended_args`) VALUES
(21, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-04 09:49:22', '2025-03-04 09:49:22', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741081762;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741081762;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-04 09:49:33', '2025-03-04 09:49:33', 0, NULL),
(22, 'wp_mail_smtp_summary_report_email', 'complete', '2025-03-10 14:00:44', '2025-03-10 14:00:44', 10, '[null]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741615244;s:18:\"\0*\0first_timestamp\";i:1741010400;s:13:\"\0*\0recurrence\";i:604800;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741615244;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:604800;}', 2, 1, '2025-03-10 15:57:13', '2025-03-10 15:57:13', 0, NULL),
(23, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-05 09:49:33', '2025-03-05 09:49:33', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741168173;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741168173;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-05 10:11:37', '2025-03-05 10:11:37', 0, NULL),
(24, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-06 10:11:37', '2025-03-06 10:11:37', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741255897;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741255897;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-06 10:24:27', '2025-03-06 10:24:27', 0, NULL),
(25, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-07 10:24:27', '2025-03-07 10:24:27', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741343067;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741343067;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-07 10:24:56', '2025-03-07 10:24:56', 0, NULL),
(26, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-08 10:24:56', '2025-03-08 10:24:56', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741429496;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741429496;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-10 09:27:49', '2025-03-10 09:27:49', 0, NULL),
(27, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-11 09:27:49', '2025-03-11 09:27:49', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741685269;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741685269;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-11 09:36:26', '2025-03-11 09:36:26', 0, NULL),
(28, 'wp_mail_smtp_summary_report_email', 'complete', '2025-03-17 15:57:13', '2025-03-17 15:57:13', 10, '[null]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742227033;s:18:\"\0*\0first_timestamp\";i:1741010400;s:13:\"\0*\0recurrence\";i:604800;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742227033;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:604800;}', 2, 1, '2025-03-18 17:12:38', '2025-03-18 17:12:38', 0, NULL),
(29, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-12 09:36:26', '2025-03-12 09:36:26', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741772186;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741772186;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-12 09:36:42', '2025-03-12 09:36:42', 0, NULL),
(30, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-13 09:36:42', '2025-03-13 09:36:42', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741858602;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741858602;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-13 13:34:52', '2025-03-13 13:34:52', 0, NULL),
(31, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-14 13:34:52', '2025-03-14 13:34:52', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1741959292;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1741959292;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-14 18:16:07', '2025-03-14 18:16:07', 0, NULL),
(32, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-15 18:16:07', '2025-03-15 18:16:07', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742062567;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742062567;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-15 19:12:11', '2025-03-15 19:12:11', 0, NULL),
(33, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-16 19:12:11', '2025-03-16 19:12:11', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742152331;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742152331;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-17 09:02:31', '2025-03-17 09:02:31', 0, NULL),
(34, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-18 09:02:31', '2025-03-18 09:02:31', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742288551;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742288551;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-18 17:12:39', '2025-03-18 17:12:39', 0, NULL),
(35, 'wp_mail_smtp_summary_report_email', 'complete', '2025-03-25 17:12:38', '2025-03-25 17:12:38', 10, '[null]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742922758;s:18:\"\0*\0first_timestamp\";i:1741010400;s:13:\"\0*\0recurrence\";i:604800;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742922758;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:604800;}', 2, 1, '2025-03-31 08:10:19', '2025-03-31 09:10:19', 0, NULL),
(36, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-19 17:12:39', '2025-03-19 17:12:39', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742404359;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742404359;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-20 10:20:33', '2025-03-20 10:20:33', 0, NULL),
(37, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-21 10:20:33', '2025-03-21 10:20:33', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742552433;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742552433;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-24 10:08:19', '2025-03-24 10:08:19', 0, NULL),
(38, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-25 10:08:19', '2025-03-25 10:08:19', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742897299;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742897299;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-25 10:09:57', '2025-03-25 10:09:57', 0, NULL),
(39, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-03-26 10:09:57', '2025-03-26 10:09:57', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1742983797;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1742983797;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-03-31 08:10:19', '2025-03-31 09:10:19', 0, NULL),
(40, 'wp_mail_smtp_summary_report_email', 'pending', '2025-04-07 08:10:19', '2025-04-07 09:10:19', 10, '[null]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1744013419;s:18:\"\0*\0first_timestamp\";i:1741010400;s:13:\"\0*\0recurrence\";i:604800;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1744013419;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:604800;}', 2, 0, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 0, NULL),
(41, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-04-01 08:10:19', '2025-04-01 09:10:19', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1743495019;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1743495019;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-04-01 08:28:55', '2025-04-01 09:28:55', 0, NULL),
(42, 'wp_mail_smtp_admin_notifications_update', 'complete', '2025-04-02 08:28:55', '2025-04-02 09:28:55', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1743582535;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1743582535;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 1, '2025-04-03 15:19:08', '2025-04-03 16:19:08', 0, NULL),
(43, 'wp_mail_smtp_admin_notifications_update', 'pending', '2025-04-04 15:19:08', '2025-04-04 16:19:08', 10, '[1]', 'O:32:\"ActionScheduler_IntervalSchedule\":5:{s:22:\"\0*\0scheduled_timestamp\";i:1743779948;s:18:\"\0*\0first_timestamp\";i:1740425317;s:13:\"\0*\0recurrence\";i:86400;s:49:\"\0ActionScheduler_IntervalSchedule\0start_timestamp\";i:1743779948;s:53:\"\0ActionScheduler_IntervalSchedule\0interval_in_seconds\";i:86400;}', 2, 0, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wp_actionscheduler_claims`
--

CREATE TABLE `wp_actionscheduler_claims` (
  `claim_id` bigint UNSIGNED NOT NULL,
  `date_created_gmt` datetime DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wp_actionscheduler_groups`
--

CREATE TABLE `wp_actionscheduler_groups` (
  `group_id` bigint UNSIGNED NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `wp_actionscheduler_groups`
--
