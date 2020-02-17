-- 카테고리
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '카테고리 아이디',
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '카테고리 코드',
  `parent_cd` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '부모 카테고리 코드',
  `depth` tinyint(3) unsigned NOT NULL DEFAULT 1 COMMENT '카테고리 depth',
  `sort` int(10) NOT NULL DEFAULT 0 COMMENT '카테고리 정렬번호',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '카테고리명',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '카테고리 설명',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Y' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `admin_role_id` int(10) UNSIGNED NOT NULL COMMENT '관리자 롤 아이디',
  `admin_user_id` int(10) UNSIGNED NOT NULL COMMENT '관리자 아이디',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_cat_code` (`code`),
  KEY `idx_cat_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='카테고리 정보';

-- 환율 로그
CREATE TABLE `umma`.`currency_rate` (
  `id` int(10) NOT NULL COMMENT '아이디',
  `admin_role_id` int(10) UNSIGNED NOT NULL COMMENT '관리자 롤 아이디',
  `admin_user_id` int(10) UNSIGNED NOT NULL COMMENT '관리자 아이디',
  `currency_rate` DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0.00 COMMENT '환율',
  `expiration_date` TIMESTAMP NULL COMMENT '만료일',
  `created` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '생성일시',
  `deleted` TIMESTAMP NULL DEFAULT NULL COMMENT '삭제일시\n',
  PRIMARY KEY (`id`));

-- 브랜드
DROP TABLE IF EXISTS `brand`;
CREATE TABLE `brand` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '브랜드 아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원 롤아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `pims_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PIMS 브랜드 아이디',
  `ct_id` char(2) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'KR' COMMENT 'ISO 3166-1 alpha-2',
  `sort` int(10) NOT NULL DEFAULT 0 COMMENT '브랜드 정렬번호',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '브랜드명',
  `logo` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '브랜드 로고URL',
  `website` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '브랜드 홈페이지',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '브랜드 설명',
  `product_count` int(10) NOT NULL DEFAULT 0 COMMENT '등록된 상품수',
  `associated` tinyint(1) DEFAULT NULL COMMENT '제휴/비제휴 구분',
  `is_partner_brand` tinyint(1) NOT NULL DEFAULT 0 COMMENT '메인페이지 진열 브랜드 ',
  `detail_used` tinyint(1) NOT NULL DEFAULT 0 COMMENT '브랜드상세정보 사용여부',
  `detail_banner_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '브랜드상세정보 배너이미지',
  `detail_media` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '브랜드상세정보 영상소스',
  `detail_html` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '브랜드상세정보 HTML',
  `detail_updated` timestamp NULL DEFAULT NULL COMMENT '브랜드상세정보 수정일시',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Y' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  KEY `idx_br_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='브랜드 정보';

-- ---------------------------------------------------
-- JSON (LONGTEXT) 데이터 타입 사용
-- (JSON 별칭은 MariaDB 10.2.7 부터 적용)
-- https://mariadb.com/kb/en/library/json-data-type/
-- (JSON Functions는 MariaDB 10.2.3 부터 적용)
-- https://mariadb.com/kb/en/library/json-functions/
-- ---------------------------------------------------

-- 상품 테이블
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '상품 아이디',
  `pims_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PIMS 상품 아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원 롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `cat_cd` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '카테고리 코드',
  `cat_cd2` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '카테고리 코드',
  `cat_cd3` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '카테고리 코드',
  `br_id` int(10) unsigned NOT NULL COMMENT '브랜드 아이디',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '상품명',
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '상품 이미지들',
  `ref_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 참조 URL',
  `video_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 비디오 URL',
  `comments` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 설명',
  `contents` text COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 상세HTML',
  `option_used` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '옵션 사용여부',
  `option_type` enum('COLOR','VOLUME','SIZE','SKIN TYPE','FUNCTIONAL') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '옵션 타입 (색상,용량,사이즈 등 공통코드값)',
  `option_view_type` enum('SELECT','RADIO','BUTTON') COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '옵션 html view 타입 (radio,select,button 등 공통코드값)',
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SKU',
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GS1바코드',
  `asin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '아마존 표준 식별 번호',
  `best_seller` int(10) NOT NULL DEFAULT 0 COMMENT '베스트셀러',
  `new_product` int(10) NOT NULL DEFAULT 0 COMMENT '신상품',
  `recommended` int(10) NOT NULL DEFAULT 0 COMMENT '추천상품',
  `sort` int(10) NOT NULL DEFAULT 0 COMMENT '상품 정렬번호',
  `taxation` tinyint(1) DEFAULT NULL COMMENT '과세여부',
  `moq` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'MOQ',
  `retail_price` decimal(10,2) unsigned NOT NULL DEFAULT 0.00 COMMENT 'MSRP',
  `supply_price` decimal(10,2) GENERATED ALWAYS AS (`supply_rate` * `retail_price` / 100) VIRTUAL COMMENT '공급가',
  `supply_rate` decimal(10,4) unsigned NOT NULL COMMENT '공급률',
  `sale_price` decimal(10,2) unsigned NOT NULL DEFAULT 0.00 COMMENT '판매가',
  `pricing_table` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '판매가격테이블',
  `stock` int(10) NOT NULL DEFAULT 0 COMMENT '재고',
  `capacity` decimal(10,2) unsigned DEFAULT NULL COMMENT '사이즈/용량(ml)',
  `capacity_type` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '용량 타입',
  `inbox_quantity` int(10) unsigned DEFAULT NULL COMMENT '인박스내 상품수량(ea)',
  `total_weight` int(10) unsigned DEFAULT NULL COMMENT '상품총중량(g)',
  `volume` int(10) unsigned DEFAULT NULL COMMENT '상품체적(CBM,mm3)',
  `size_horizontal` int(10) unsigned DEFAULT NULL COMMENT '상품가로(mm)',
  `size_vertical` int(10) unsigned DEFAULT NULL COMMENT '상품세로(mm)',
  `size_height` int(10) unsigned DEFAULT NULL COMMENT '상품높이(mm)',
  `ingredient` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '전성분',
  `manufactured` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '제조업자',
  `distributor` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '제조판매업자',
  `producer_ct_id` char(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '생산국가코드',
  `producer_area` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '생산지역',
  `msds_id` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'MSDS타입(DG,NDG)',
  `msds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT 'MSDS 파일',
  `certificate` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '인증 및 허가',
  `supplied_channel` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '공급중인채널',
  `discontinued` tinyint(1) NOT NULL DEFAULT 0 COMMENT '단종여부',
  `discontinued_date` date DEFAULT NULL COMMENT '단종일',
  `discontinued_updated` timestamp NULL DEFAULT NULL COMMENT '단종여부 수정일시',
  `valid_country` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '판매가능국가',
  `invalid_country` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' COMMENT '판매불가능국가',
  `cart_count` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '장바구니 카운트',
  `favorite_count` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '좋아요 카운트',
  `inquiry_count` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '문의하기 카운트',
  `view_count` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '조회수',
  `display` tinyint(1) NOT NULL DEFAULT 0 COMMENT '상품노출여부',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'W' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `company_id` int(10) unsigned NOT NULL COMMENT '회사 아이디',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `approved` timestamp NULL DEFAULT NULL COMMENT '등록승인일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  -- `packing_piece` json NOT NULL DEFAULT '[]' COMMENT '패킹피스',
  -- `packing_unit` json NOT NULL DEFAULT '[]' COMMENT '패킹유닛',
  -- `packing_package` json NOT NULL DEFAULT '[]' COMMENT '패킹패키지',
  -- `packing_outbox` json NOT NULL DEFAULT '[]' COMMENT '패킹아웃박스',
  -- `creator_role_id`	int(10) NOT NULL COMMENT '등록자 회원롤 아이디',
  -- `creator_id` int(10) NOT NULL COMMENT '등록자 아이디',
  -- `updater_role_id`	int(10) NULL COMMENT '수정자 회원롤 아이디',
  -- `updater_id` int(10) NULL COMMENT '수정자 아이디',
  -- `deleter_role_id`	int(10) NULL COMMENT '삭제자 회원롤 아이디',
  -- `deleter_id` int(10) NULL COMMENT '삭제자 아이디',
  PRIMARY KEY (`id`),
  KEY `idx_pr_pims_id` (`pims_id`),
  KEY `idx_pr_cat_id` (`cat_cd`),
  KEY `idx_pr_br_id` (`br_id`),
  KEY `idx_pr_sku` (`sku`),
  KEY `idx_pr_barcode` (`barcode`),
  KEY `idx_pr_asin` (`asin`),
  KEY `idx_pr_sort` (`sort`),
  KEY `idx_pr_name` (`name`),
  KEY `idx_pr_display` (`display`),
  KEY `idx_pr_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 정보';
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pr_increment_brand_product_count`
  AFTER INSERT ON `product`
    FOR EACH ROW
    UPDATE `brand` SET `product_count` = `product_count`+1 WHERE `id` = `NEW`.`br_id`;
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pr_decrement_brand_product_count`
  AFTER DELETE ON `product`
    FOR EACH ROW
    UPDATE `brand` SET `product_count` = IF(`product_count` > 0, `product_count`-1, 0) WHERE `id` = `OLD`.`br_id`;


-- 상품 옵션
DROP TABLE IF EXISTS `product_option`;
CREATE TABLE `product_option` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '옵션 아이디',
  `pr_id` int(10) unsigned NOT NULL COMMENT '상품 아이디',
  `name` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '옵션명',
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SKU',
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GS1바코드',
  `sort` int(10) NOT NULL DEFAULT 0 COMMENT '옵션 정렬번호',
  `stock` int(10) NOT NULL DEFAULT 0 COMMENT '재고',
  `discontinued` tinyint(1) NOT NULL DEFAULT 0 COMMENT '단종여부',
  `discontinued_date` date DEFAULT NULL COMMENT '단종일',
  `discontinued_updated` timestamp NULL DEFAULT NULL COMMENT '단종여부 수정일시',
  `display` tinyint(1) NOT NULL DEFAULT 0 COMMENT '옵션노출여부',
  `status` char(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'W' COMMENT '상태값',
  `status_updated` timestamp NULL DEFAULT NULL COMMENT '상태값변경일시',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원 롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `approved` timestamp NULL DEFAULT NULL COMMENT '등록승인일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  -- creator_role_id	int(10) NOT NULL COMMENT '등록자 회원롤 아이디',
  -- creator_id int(10) NOT NULL COMMENT '등록자 아이디',
  -- updater_role_id	int(10) NULL COMMENT '수정자 회원롤 아이디',
  -- updater_id int(10) NULL COMMENT '수정자 아이디',
  -- deleter_role_id	int(10) NULL COMMENT '삭제자 회원롤 아이디',
  -- deleter_id int(10) NULL COMMENT '삭제자 아이디',
  PRIMARY KEY (`id`),
  KEY `idx_po_pr_id` (`pr_id`),
  KEY `idx_po_sku` (`sku`),
  KEY `idx_po_barcode` (`barcode`),
  KEY `idx_po_sort` (`sort`),
  KEY `idx_po_display` (`display`),
  KEY `idx_po_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 옵션';


-- 상품 좋아요
DROP TABLE IF EXISTS `product_favorite`;
CREATE TABLE `product_favorite` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `pr_id` int(10) unsigned NOT NULL COMMENT '상품 아이디',
  `po_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '상품 옵션 아이디',
  `po_name` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 옵션명',
  `cat_cd_1depth` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cat_cd_2depth` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cat_cd_3depth` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SKU',
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 바코드',
  `quantity` int(10) NOT NULL DEFAULT 1 COMMENT '수량',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '상태값',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_pf_ids` (`role_id`,`user_id`,`pr_id`,`po_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 좋아요'
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pf_increment_product_favorite_count`
  AFTER INSERT ON `product_favorite`
    FOR EACH ROW
    UPDATE `product` SET `favorite_count` = `favorite_count`+1 WHERE `id` = `NEW`.`pr_id`;
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pf_decrement_product_favorite_count`
  AFTER DELETE ON `product_favorite`
    FOR EACH ROW
    UPDATE `product` SET `favorite_count` = IF(`favorite_count` > 0, `favorite_count`-1, 0) WHERE `id` = `OLD`.`pr_id`;

-- 상품 카트
DROP TABLE IF EXISTS `product_cart`;
CREATE TABLE `product_cart` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `pr_id` int(10) unsigned NOT NULL COMMENT '상품 아이디',
  `po_id` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '상품 옵션 아이디',
  `po_name` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 옵션명',
  `cat_cd_1depth` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cat_cd_2depth` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cat_cd_3depth` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SKU',
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상품 바코드',
  `discount_id` int(10) unsigned DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '상태값',
  `total_price` decimal(10,2) GENERATED ALWAYS AS (`supply_price` * `quantity`) VIRTUAL,
  `supply_price` decimal(10,2) DEFAULT NULL COMMENT '공급가',
  `quantity` int(10) unsigned NOT NULL DEFAULT 1 COMMENT '상품 갯수',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_pc_ids` (`role_id`,`user_id`,`pr_id`,`po_id`),
  KEY `idx_pc_ids` (`role_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원 카트'
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pc_increment_product_cart_count`
  AFTER INSERT ON `product_cart`
    FOR EACH ROW
    UPDATE `product` SET `cart_count` = `cart_count`+1 WHERE `id` = `NEW`.`pr_id`;
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pc_decrement_product_cart_count`
  AFTER DELETE ON `product_cart`
    FOR EACH ROW
    UPDATE `product` SET `cart_count` = IF(`cart_count` > 0, `cart_count`-1, 0) WHERE `id` = `OLD`.`pr_id`;

-- 상품 뷰카운트
DROP TABLE IF EXISTS `product_view_count`;
CREATE TABLE `product_view_count` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL COMMENT '회원롤 아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `br_id` int(10) unsigned NOT NULL COMMENT '브랜드 아이디',
  `pr_id` int(10) unsigned NOT NULL COMMENT '상품 아이디',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  PRIMARY KEY (`id`),
  KEY `idx_pvc_ids` (`role_id`,`user_id`,`pr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='상품 조회 히스토리';
-- TRIGGER
CREATE OR REPLACE DEFINER=`umma`@`%` TRIGGER `pf_increment_product_view_count`
  AFTER INSERT ON `product_view_count`
    FOR EACH ROW
    UPDATE `product` SET `view_count` = `view_count`+1 WHERE `id` = `NEW`.`pr_id`;


-- 사용자정의 상품 검색조건
DROP TABLE IF EXISTS `product_search_condition`;
CREATE TABLE `product_search_condition` (
  `id` int(10) unsigned NOT NULL DEFAULT 2 COMMENT '아이디',
  `role_id` int(10) unsigned NOT NULL DEFAULT 2 COMMENT '회원 롤아이디',
  `user_id` int(10) unsigned NOT NULL COMMENT '회원 아이디',
  `created` timestamp NULL DEFAULT current_timestamp() COMMENT '생성일시',
  `updated` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp() COMMENT '수정일시',
  `deleted` timestamp NULL DEFAULT NULL COMMENT '삭제일시',
  `filter` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_psc_user` (`role_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자검색조건';
