-- 국가
DROP TABLE IF EXISTS `country`;
CREATE TABLE `country` (
  `id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ISO 3166-1 alpha-2',
  `iso_alpha3` char(3) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ISO 3166-1 alpha-3',
  `iso_numeric` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ISO 3166-1 numeric',
  `dial` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가전화번호',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가명',
  `capital` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '수도명',
  `continent_cd` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대륙코드',
  `region` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '지역명',
  `subregion` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '하위지역명',
  `currency_cd` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '통화코드',
  `currency` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '통화명',
  `languages` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '언어코드',
  `timezone` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '타임존',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Y' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  KEY `idx_ct_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='국가코드';


-- 국가 STATE
DROP TABLE IF EXISTS `country_state`;
CREATE TABLE `country_state` (
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가코드',
  `id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'state코드',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'state명',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Y' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`ct_id`,`id`),
  KEY `idx_cs_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='state코드';


-- 국가 도시
DROP TABLE IF EXISTS `country_city`;
CREATE TABLE `country_city` (
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가코드',
  `id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '도시코드',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '도시명',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Y' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`ct_id`,`id`),
  KEY `idx_cc_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='도시코드';


-- 사이트 정보
DROP TABLE IF EXISTS `common_site`;
CREATE TABLE `common_site` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '정보명',
  `contents` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '내용',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사이트정보';


-- 공통 코드 테이블
DROP TABLE IF EXISTS `common_code`;
CREATE TABLE `common_code` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `parent_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '부모 아이디',
  `depth` tinyint(3) NOT NULL DEFAULT 0 COMMENT '코드 depth',
  `code` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '코드',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '코드명',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '설명',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '상태값',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_cc_code` (`parent_id`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공통 코드 테이블';


-- faq 자주묻는 질문
DROP TABLE IF EXISTS `faq`;
CREATE TABLE `faq` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'FAQ 아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원 롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `email` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회원이메일',
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회원이름 - 이름',
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회원이름 - 성',
  `faq_category` char(5) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FAQ 카테고리',
  `subject` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FAQ 제목',
  `contents` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FAQ내용',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Y' COMMENT '상태값(D:삭제,Y:사용,N:미사용)',
  `view_count` int(10) unsigned DEFAULT 0 COMMENT '조회수',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '삭제일시',
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '상품 이미지들',
  PRIMARY KEY (`id`),
  KEY `idx_faq_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='faq 자주묻는 질문';


-- 배송 회사
CREATE TABLE `shipping_company` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `service_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송사 이름',
  `company_code` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '기업코드',
  `comments` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '설명',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '상태값',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성날짜',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제날짜',
  PRIMARY KEY (`id`),
  KEY `idx_shipping_company_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배송 회사';


-- 배송 서비스
CREATE TABLE `shipment_service` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `service_name` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송 서비스 이름 ',
  `co_id` int(10) unsigned NOT NULL COMMENT '배송사 아이디',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '국가코드',
  `cost` decimal(10,2) DEFAULT NULL COMMENT '비용',
  `shipping_rate` decimal(10,2) DEFAULT NULL COMMENT '',
  `group_option` enum('GROUND','FREE','ONE DAY','EXPRESS','PRIORITY') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '배송 그룹 옵션',
  `capacity_limit` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '중량 한도',
  `delivery_estimate` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '배송 예상 날짜',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '상태값',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성날짜',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제날짜',
  PRIMARY KEY (`id`),
  KEY `idx_shipment_service_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배송 서비스';


-- 배너 정보
CREATE TABLE `banner` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `admin_role_id` int(10) UNSIGNED NOT NULL COMMENT '관리자 롤 아이디',
  `admin_user_id` int(10) UNSIGNED NOT NULL COMMENT '관리자 아이디',
  `banner_type` enum('BRAND', 'PRODUCT', 'INTERNAL', 'EXTERNAL') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '배너 종류',
  `title` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '타이틀',
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이미지 URL',
  `image_mobile_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '모바일 이미지 URL',
  `link_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '링크 URL',
  `sort` int(10) NOT NULL DEFAULT 0 COMMENT '정렬번호',
  `display` tinyint(1) NOT NULL DEFAULT 0 COMMENT '노출여부',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성날짜',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제날짜',
  PRIMARY KEY (`id`),
  KEY `idx_banner_type` (`banner_type`),
  KEY `idx_banner_sort` (`sort`),
  KEY `idx_banner_date` (`start_date`,`end_date`),
  KEY `idx_banner_display` (`display`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='배너 정보';


-- 프로모션
CREATE TABLE `promotion` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `admin_role_id` int(10) unsigned NOT NULL COMMENT '관리자 롤아이디',
  `admin_user_id` int(10) unsigned NOT NULL COMMENT '관리자 아이디',
  `title` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '제목',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '설명',
  `credit` decimal(10,2) DEFAULT 0.00 COMMENT '크레딧',
  `start_date` timestamp NOT NULL COMMENT '시작일시',
  `end_date` timestamp NOT NULL COMMENT '종료일시',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '상태값',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  KEY `idx_promotion_date` (`start_date`,`end_date`),
  KEY `idx_promotion_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로모션'


-- 프로모션 적용 바이어 회원
CREATE TABLE `buyer_promotion` (
  `promotion_id` int(10) unsigned NOT NULL COMMENT '프로모션 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '바이어 회원 아이디',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값 수정일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  PRIMARY KEY (`promotion_id`, `user_id`),
  KEY `idx_bp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프로모션 적용 바이어 회원'
