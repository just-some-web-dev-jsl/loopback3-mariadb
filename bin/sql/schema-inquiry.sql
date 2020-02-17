-- 문의 (상품/일반)
DROP TABLE IF EXISTS `inquiry`;
CREATE TABLE `inquiry` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL DEFAULT 2 COMMENT '회원롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원롤 아이디',
  `inquiry_type` char(1) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '문의타입',
  `subject` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '문의제목',
  `contents` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '문의내용',
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '문의첨부파일',
  `pr_id` int(10) unsigned DEFAULT NULL COMMENT '상품아이디',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '문의상태',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '읽음여부',
  `closed` timestamp NULL DEFAULT NULL COMMENT '문의종료일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `inquiry_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '삭제여부',
  `user_ip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-Agent',
  PRIMARY KEY (`id`),
  KEY `idx_inq_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='문의';
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pi_increment_inquiry_count`
  AFTER INSERT ON `inquiry`
    FOR EACH ROW
    UPDATE `product` SET `inquiry_count` = `inquiry_count`+1 WHERE `id` = `NEW`.`pr_id` AND `NEW`.`inquiry_type` = 'P';

-- 문의답변
DROP TABLE IF EXISTS `inquiry_reply`;
CREATE TABLE `inquiry_reply` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '답변 아이디',
  `inquiry_id` int(10) unsigned NOT NULL COMMENT '문의 아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원롤 아이디',
  `contents` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '답변내용',
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '답변첨부파일',
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '읽음여부',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `reply_delete` tinyint(1) NOT NULL DEFAULT 0 COMMENT '삭제여부',
  `user_ip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-Agent',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='일반문의답변';
