-- SET foreign_key_checks = 0;

-- loopback custom model
CREATE TABLE `custom_access_token` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ttl` int(10) DEFAULT NULL,
  `scopes` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created` datetime DEFAULT current_timestamp(),
  `user_id` int(10) unsigned DEFAULT NULL,
  `principal_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- loopback custom model
CREATE TABLE `custom_acl` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `model` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `property` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_type` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permission` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `principal_type` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `principal_id` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- loopback custom model
CREATE TABLE `custom_role` (
  `id` int(10) unsigned NOT NULL,
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created` timestamp NULL DEFAULT current_timestamp(),
  `modified` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 회원가입시 맵핑될 롤을 미리 등록한다.
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (1, 'Admin', '관리자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (2, 'Buyer', '구매자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (3, 'Seller', '판매자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (11, 'Admin', '슈퍼 관리자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (12, 'Admin', '일반 관리자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (13, 'Admin', '운영 관리자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (14, 'Admin', '물류 관리자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (15, 'Admin', '벤더 관리자');
INSERT INTO `umma`.`custom_role` (`id`, `name`, `description`) VALUES (16, 'Admin', '재무 관리자');


-- loopback custom model
CREATE TABLE `custom_role_mapping` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `principal_type` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `principal_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role_id` int(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_principal_id` (`principal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 관리자회원회사정보
DROP TABLE IF EXISTS `admin_company`;
CREATE TABLE `admin_company` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '롤 아이디',
  `biz_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사사업형태',
  `scale` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사규모(직원수)',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사명',
  `logo` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사로고',
  `ceo_first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표자명 이름',
  `ceo_last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표자명 성',
  `biz_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '사업자등록번호',
  `duns_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'D-U-N-S Number',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사전화번호',
  `fax` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사팩스번호',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사국가코드',
  `cs_id` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주코드',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사도시명',
  `address1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주소1',
  `address2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주소2',
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사우편번호',
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사웹사이트',
  `attachments` longtext COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]' COMMENT '회사첨부파일',
  `establishment_date` date DEFAULT NULL COMMENT '회사설립일',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사설명',
  `duns_verified` tinyint(1) DEFAULT NULL COMMENT '관리자 duns 인증 여부',
  `duns_verified_updated` timestamp NULL DEFAULT NULL COMMENT '관리자 duns 인증 수정일시',
  `cert_verified` tinyint(1) DEFAULT NULL COMMENT '관리자 증명서 인증 여부',
  `cert_verified_updated` timestamp NULL DEFAULT NULL COMMENT '관리자 증명서 인증 수정일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='어드민회원회사정보';


-- 관리자 회원 (base from loopback)
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `realm` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'loopback',
  `role_id` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '관리자롤 아이디',
  `user_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회원타입(슈퍼관리자,일반관리자)',
  `company_id` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '회원회사 고유코드',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사국가코드',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이름',
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '성',
  `password` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호',
  `password_updated` timestamp NULL DEFAULT NULL COMMENT '비밀번호변경일시',
  `email` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이메일주소',
  `email_verified` tinyint(1) DEFAULT NULL COMMENT '이메일인증여부',
  `email_verified_updated` timestamp NULL DEFAULT NULL COMMENT '이메일인증일시',
  `verification_token` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '인증토큰',
  `nick_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '닉네임',
  `avatar` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로필사진',
  `position` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '직책',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '전화번호',
  `mobile` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '모바일번호',
  `favorite_tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '좋아하는 태그번호 배열',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회원설명',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '최종로그인일시',
  `login_count` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '로그인회수',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT 'W' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `approved` timestamp NULL DEFAULT NULL COMMENT '가입승인일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `admin_user_id` int(10) unsigned DEFAULT NULL,
  `user_ip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-Agent',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_admin_email` (`email`),
  KEY `idx_admin_status` (`status`),
  KEY `idx_admin_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='관리자회원정보';


-- 바이어 회사
DROP TABLE IF EXISTS `buyer_company`;
CREATE TABLE `buyer_company` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL DEFAULT 2 COMMENT '롤 아이디',
  `biz_class` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '리테일 혹은 홀세일',
  `biz_type` longtext COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]' COMMENT '회사사업형태',
  `scale` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사규모(직원수)',
  `kb_scale` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'K beauty 규모',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사명',
  `logo` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사로고',
  `ceo_first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표자명 이름',
  `ceo_last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대표자명 성',
  `biz_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '사업자등록번호',
  `duns_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'D-U-N-S Number',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사전화번호',
  `fax` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사팩스번호',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사국가코드',
  `cs_id` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주코드',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사도시명',
  `address1` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주소1',
  `address2` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주소2',
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사우편번호',
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사웹사이트',
  `attachments` longtext COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]' COMMENT '회사첨부파일',
  `establishment_date` date DEFAULT NULL COMMENT '회사설립일',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사설명',
  `duns_verified` tinyint(1) DEFAULT NULL COMMENT '관리자 duns 인증 여부',
  `duns_verified_updated` timestamp NULL DEFAULT NULL COMMENT '관리자 duns 인증 수정일시',
  `cert_verified` tinyint(1) DEFAULT NULL COMMENT '관리자 증명서 인증 여부',
  `cert_verified_updated` timestamp NULL DEFAULT NULL COMMENT '관리자 증명서 인증 수정일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='바이어회원회사정보';


-- 바이어 회원 (base from loopback)
DROP TABLE IF EXISTS `buyer`;
CREATE TABLE `buyer` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `realm` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'loopback',
  `role_id` int(10) unsigned NOT NULL DEFAULT 2 COMMENT '롤 아이디',
  `user_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '바이어회원타입',
  `company_id` int(10) unsigned NOT NULL COMMENT '회원회사 고유코드',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가코드',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이름',
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '성',
  `password` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호',
  `password_updated` timestamp NULL DEFAULT NULL COMMENT '비밀번호변경일시',
  `email` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이메일주소',
  `email_verified` tinyint(1) DEFAULT NULL COMMENT '이메일인증여부',
  `email_verified_updated` timestamp NULL DEFAULT NULL COMMENT '이메일인증일시',
  `verification_token` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '인증토큰',
  `favorite_tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '좋아하는태그들',
  `nick_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '닉네임',
  `avatar` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로필사진',
  `position` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '직책',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '전화번호',
  `mobile` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '모바일번호',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회원설명',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '최종로그인일시',
  `login_count` int(10) unsigned DEFAULT 0 COMMENT '로그인횟수',
  `terms_agreed` tinyint(1) DEFAULT NULL COMMENT '이용약관,개인정보취급방침동의여부',
  `terms_agreed_updated` timestamp NULL DEFAULT NULL COMMENT '약관동의수정일시',
  `receive_info_agreed` tinyint(1) DEFAULT NULL COMMENT '정보수신동의여부',
  `receive_info_agreed_updated` timestamp NULL DEFAULT NULL COMMENT '정보수신동의수정일시',
  `receive_info_method` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '정보수신방법선택 (sms/email/phone/fax)',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT 'W' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `approved` timestamp NULL DEFAULT NULL COMMENT '가입승인일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `admin_user_id` int(10) unsigned DEFAULT NULL COMMENT '관리자회원 아이디(관리자가 직접 아이디를 생성한경우 생성한관리자의 아이디가 입력된다)',
  `adv_type` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_ip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-Agent',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_buyer_email` (`email`),
  KEY `idx_buyer_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='바이어회원정보';


--회원 배송지
DROP TABLE IF EXISTS `buyer_shipping`;
CREATE TABLE `buyer_shipping` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL DEFAULT 2 COMMENT '롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `recipient_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '수신자 이름 ',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 전화번호',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '배송지국가코드',
  `cs_id` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주코드',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 도시',
  `address1` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 주소 1',
  `address2` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 주소 2',
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 우편번호',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 이름',
  `comments` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송지 설명',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '상테값',
  `incoterms` char(3) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '인코텀스 ',
  `shipment_service_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '배송 서비스 아이디',
  `default_address` tinyint(1) NOT NULL DEFAULT 0 COMMENT '기본 배송지',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성날짜',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제날짜',
  PRIMARY KEY (`id`),
  KEY `idx_buyer_shipping_status` (`status`),
  KEY `idx_buyer_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 셀러 회사
DROP TABLE IF EXISTS `seller_company`;
CREATE TABLE `seller_company` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL DEFAULT 3 COMMENT '롤 아이디',
  `biz_type` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사사업형태',
  `scale` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사규모(직원수)',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사명',
  `logo` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사로고',
  `ceo_first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '대표자명 이름',
  `ceo_last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '대표자명 성',
  `biz_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '사업자등록번호',
  `duns_number` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'D-U-N-S Number',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사전화번호',
  `fax` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사팩스번호',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사국가코드',
  `cs_id` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주코드',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사도시명',
  `address1` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주소1',
  `address2` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사주소2',
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사우편번호',
  `website` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사웹사이트',
  `establishment_date` date DEFAULT NULL COMMENT '회사설립일',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회사설명',
  `attachments` longtext COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '[]' COMMENT '회사첨부파일',
  `duns_verified` tinyint(1) DEFAULT NULL COMMENT '관리자 duns 인증 여부',
  `duns_verified_updated` timestamp NULL DEFAULT NULL COMMENT '관리자 duns 인증 수정일시',
  `cert_verified` tinyint(1) DEFAULT NULL COMMENT '관리자 증명서 인증 여부',
  `cert_verified_updated` timestamp NULL DEFAULT NULL COMMENT '관리자 증명서 인증 수정일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='셀러회원회사정보';


-- 셀러 회원 (base from loopback)
DROP TABLE IF EXISTS `seller`;
CREATE TABLE `seller` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `realm` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'loopback',
  `role_id` int(10) unsigned NOT NULL DEFAULT 3 COMMENT '롤 아이디',
  `user_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회원타입',
  `company_id` int(10) unsigned NOT NULL COMMENT '회원회사 고유코드',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가코드',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이름',
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '성',
  `password` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호',
  `password_updated` timestamp NULL DEFAULT NULL COMMENT '비밀번호변경일시',
  `email` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이메일주소',
  `email_verified` tinyint(1) DEFAULT NULL COMMENT '이메일인증여부',
  `email_verified_updated` timestamp NULL DEFAULT NULL COMMENT '이메일인증일시',
  `verification_token` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '인증토큰',
  `favorite_tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '좋아하는태그들',
  `nick_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '닉네임',
  `avatar` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로필사진',
  `position` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '직책',
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '전화번호',
  `mobile` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '모바일번호',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '회원설명',
  `last_login` timestamp NULL DEFAULT NULL COMMENT '최종로그인일시',
  `login_count` int(10) unsigned DEFAULT 0 COMMENT '로그인횟수',
  `terms_agreed` tinyint(1) DEFAULT NULL COMMENT '이용약관,개인정보취급방침동의여부',
  `terms_agreed_updated` timestamp NULL DEFAULT NULL COMMENT '약관동의수정일시',
  `receive_info_agreed` tinyint(1) DEFAULT NULL COMMENT '정보수신동의여부',
  `receive_info_agreed_updated` timestamp NULL DEFAULT NULL COMMENT '정보수신동의수정일시',
  `receive_info_method` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '정보수신방법선택 (sms/email/phone/fax)',
  `status` char(1) COLLATE utf8mb4_unicode_ci DEFAULT 'W' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `approved` timestamp NULL DEFAULT NULL COMMENT '가입승인일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `admin_user_id` int(10) unsigned DEFAULT NULL,
  `user_ip` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User IP',
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User-Agent',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_seller_email` (`email`),
  KEY `idx_seller_status` (`status`),
  KEY `idx_seller_user_type` (`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='셀러회원정보';


-- 오래된 토큰 삭제 스케쥴러
-- select now();
-- show variables like 'event%';
SET GLOBAL event_scheduler = ON;
CREATE EVENT IF NOT EXISTS `umma`.`delete_older_access_token`
	ON SCHEDULE
  EVERY 1 HOUR
  STARTS TIMESTAMP(CURRENT_DATE)
  COMMENT 'delete_older_access_token'
  DO
  DELETE FROM custom_access_token
	WHERE scopes is NULL AND ttl < TIME_TO_SEC(now()) - TIME_TO_SEC(created);

-- SET foreign_key_checks = 1;
