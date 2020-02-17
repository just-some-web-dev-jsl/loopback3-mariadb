-- 카테고리 뷰 테이블2
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_category2`
AS SELECT
   `cat`.`id` AS `id`,
   `cat`.`code` AS `cat_code`,
   `cat`.`name` AS `cat_name`,
   `cat`.`depth` AS `cat_depth`,
   `c1`.`code` AS `cat_cd_1depth`,
   `c1`.`name` AS `cat_name_1depth`,
   `c2`.`code` AS `cat_cd_2depth`,
   `c2`.`name` AS `cat_name_2depth`,
   `c3`.`code` AS `cat_cd_3depth`,
   `c3`.`name` AS `cat_name_3depth`,
   `cat`.`sort` AS `cat_sort`,
   `cat`.`status` AS `cat_status`
FROM (((`category` `cat` left join `category` `c1` on(substr(`cat`.`code`,1,3) = `c1`.`code` and `c1`.`depth` = 1)) left join `category` `c2` on(substr(`cat`.`code`,1,6) = `c2`.`code` and `c2`.`depth` = 2)) left join `category` `c3` on(substr(`cat`.`code`,1,9) = `c3`.`code` and `c3`.`depth` = 3)) where 1 order by `cat`.`code`,`cat`.`sort`;


-- 바이어회원 뷰테이블
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_buyer_user`
AS SELECT
   `bc`.`biz_type` AS `bc_biz_type`,
   `bc`.`scale` AS `bc_scale`,
   `bc`.`logo` AS `bc_logo`,
   `bc`.`name` AS `bc_name`,
   `bc`.`ceo_first_name` AS `bc_ceo_first_name`,
   `bc`.`ceo_last_name` AS `bc_ceo_last_name`,
   `bc`.`biz_number` AS `bc_biz_number`,
   `bc`.`phone` AS `bc_phone`,
   `bc`.`biz_class` AS `bc_biz_class`,
   `bc`.`kb_scale` AS `bc_kb_scale`,
   `bc`.`fax` AS `bc_fax`,
   `bc`.`ct_id` AS `bc_ct_id`,
   `bc`.`cs_id` AS `bc_cs_id`,
   `bc`.`city` AS `bc_city`,
   `bc`.`address1` AS `bc_address1`,
   `bc`.`address2` AS `bc_address2`,
   `bc`.`zipcode` AS `bc_zipcode`,
   `bc`.`website` AS `bc_website`,
   `bc`.`attachments` AS `bc_attachments`,
   `bu`.`id` AS `id`,
   `bu`.`realm` AS `realm`,
   `bu`.`role_id` AS `role_id`,
   `bu`.`user_type` AS `user_type`,
   `bu`.`company_id` AS `company_id`,
   `bu`.`ct_id` AS `ct_id`,
   `bu`.`first_name` AS `first_name`,
   `bu`.`last_name` AS `last_name`,
   `bu`.`password` AS `password`,
   `bu`.`password_updated` AS `password_updated`,
   `bu`.`email` AS `email`,
   `bu`.`email_verified` AS `email_verified`,
   `bu`.`email_verified_updated` AS `email_verified_updated`,
   `bu`.`verification_token` AS `verification_token`,
   `bu`.`favorite_tags` AS `favorite_tags`,
   `bu`.`nick_name` AS `nick_name`,
   `bu`.`avatar` AS `avatar`,
   `bu`.`position` AS `position`,
   `bu`.`phone` AS `phone`,
   `bu`.`mobile` AS `mobile`,
   `bu`.`comments` AS `comments`,
   `bu`.`last_login` AS `last_login`,
   `bu`.`login_count` AS `login_count`,
   `bu`.`terms_agreed` AS `terms_agreed`,
   `bu`.`terms_agreed_updated` AS `terms_agreed_updated`,
   `bu`.`receive_info_agreed` AS `receive_info_agreed`,
   `bu`.`receive_info_agreed_updated` AS `receive_info_agreed_updated`,
   `bu`.`receive_info_method` AS `receive_info_method`,
   `bu`.`status` AS `status`,
   `bu`.`status_updated` AS `status_updated`,
   `bu`.`created` AS `created`,
   `bu`.`approved` AS `approved`,
   `bu`.`updated` AS `updated`,
   `bu`.`deleted` AS `deleted`,
   `bu`.`admin_user_id` AS `admin_user_id`,
   `ct`.`name` AS `ct_name`
FROM ((`buyer` `bu` left join `buyer_company` `bc` on(`bc`.`id` = `bu`.`company_id`)) left join `country` `ct` on(`ct`.`id` = `bu`.`ct_id`));


-- 어드민회원 뷰테이블
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_admin_user`
AS SELECT
   `ac`.`biz_type` AS `ac_biz_type`,
   `ac`.`scale` AS `ac_scale`,
   `ac`.`logo` AS `ac_logo`,
   `ac`.`name` AS `ac_name`,
   `ac`.`ceo_first_name` AS `ac_ceo_first_name`,
   `ac`.`ceo_last_name` AS `ac_ceo_last_name`,
   `ac`.`biz_number` AS `ac_biz_number`,
   `ac`.`phone` AS `ac_phone`,
   `ac`.`fax` AS `ac_fax`,
   `ac`.`ct_id` AS `ac_ct_id`,
   `ac`.`cs_id` AS `ac_cs_id`,
   `ac`.`city` AS `ac_city`,
   `ac`.`address1` AS `ac_address1`,
   `ac`.`address2` AS `ac_address2`,
   `ac`.`zipcode` AS `ac_zipcode`,
   `ac`.`website` AS `ac_website`,
   `ac`.`attachments` AS `ac_attachments`,
   `au`.`id` AS `id`,
   `au`.`realm` AS `realm`,
   `au`.`role_id` AS `role_id`,
   `au`.`user_type` AS `user_type`,
   `au`.`company_id` AS `company_id`,
   `au`.`ct_id` AS `ct_id`,
   `au`.`first_name` AS `first_name`,
   `au`.`last_name` AS `last_name`,
   `au`.`password` AS `password`,
   `au`.`password_updated` AS `password_updated`,
   `au`.`email` AS `email`,
   `au`.`email_verified` AS `email_verified`,
   `au`.`email_verified_updated` AS `email_verified_updated`,
   `au`.`verification_token` AS `verification_token`,
   `au`.`nick_name` AS `nick_name`,
   `au`.`avatar` AS `avatar`,
   `au`.`position` AS `position`,
   `au`.`phone` AS `phone`,
   `au`.`mobile` AS `mobile`,
   `au`.`favorite_tags` AS `favorite_tags`,
   `au`.`comments` AS `comments`,
   `au`.`last_login` AS `last_login`,
   `au`.`login_count` AS `login_count`,
   `au`.`status` AS `status`,
   `au`.`status_updated` AS `status_updated`,
   `au`.`created` AS `created`,
   `au`.`approved` AS `approved`,
   `au`.`updated` AS `updated`,
   `au`.`deleted` AS `deleted`,
   `au`.`admin_user_id` AS `admin_user_id`,
   `ct`.`name` AS `ct_name`
FROM ((`admin` `au` left join `admin_company` `ac` on(`ac`.`id` = `au`.`company_id`)) left join `country` `ct` on(`ct`.`id` = `au`.`ct_id`));


-- 문의 뷰테이블
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_inquiry`
AS SELECT
   `bu`.`email` AS `register_email`,
   `bu`.`ct_id` AS `ct_id`,
   `bu`.`first_name` AS `register_first_name`,
   `bu`.`last_name` AS `register_last_name`,
   `bu`.`phone` AS `register_phone`,
   `iq`.`id` AS `id`,
   `iq`.`role_id` AS `inquiry_role_id`,
   `iq`.`user_id` AS `inquiry_user_id`,
   `iq`.`inquiry_type` AS `inquiry_type`,
   `iq`.`subject` AS `inquiry_subject`,
   `iq`.`contents` AS `inquiry_contents`,
   `iq`.`attachments` AS `inquiry_attachments`,
   `iq`.`status` AS `inquiry_status`,
   `iq`.`inquiry_delete` AS `inquiry_delete_status`,
   `iq`.`created` AS `inquiry_created`,
   `br`.`name` AS `pr_br_name`,
   `pr`.`id` AS `pr_id`,
   `pr`.`br_id` AS `pr_br_id`,
   `pr`.`name` AS `pr_name`,
   `pr`.`images` AS `pr_images`,
   `pr`.`moq` AS `pr_moq`,
   `pr`.`supply_price` AS `pr_supply_price`,
   `pr`.`retail_price` AS `pr_retail_price`,
   `pr`.`producer_ct_id` AS `pr_producer_ct_id`
FROM (((`inquiry` `iq` left join `buyer` `bu` on(`bu`.`id` = `iq`.`user_id`)) left join `product` `pr` on(`pr`.`id` = `iq`.`pr_id`)) left join `brand` `br` on(`br`.`id` = `iq`.`pr_id`));


-- 상품 좋아요 뷰테이블
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_product_favorite`
AS SELECT
   `pf`.`id` AS `id`,
   `pf`.`role_id` AS `role_id`,
   `pf`.`user_id` AS `user_id`,
   `pf`.`pr_id` AS `pr_id`,
   `pf`.`po_id` AS `po_id`,
   `pf`.`po_name` AS `po_name`,
   `pf`.`status` AS `status`,
   `pf`.`quantity` AS `quantity`,
   `pf`.`created` AS `created`,
   `pf`.`updated` AS `updated`,
   `pf`.`deleted` AS `deleted`,
   `br`.`id` AS `br_id`,
   `br`.`name` AS `br_name`,
   `pr`.`name` AS `pr_name`,
   `pr`.`images` AS `pr_images`,
   `pr`.`moq` AS `pr_moq`,
   `pf`.`total_price` AS `total_price`,
   `pr`.`retail_price` AS `pr_retail_price`,
   `pr`.`supply_price` AS `pr_supply_price`,
   `pr`.`supply_rate` AS `pr_supply_rate`,
   `pr`.`capacity_type` AS `pr_capacity_type`,
   `pr`.`capacity` AS `pr_capacity`,
   `pr`.`favorite_count` AS `pr_favorite_count`,
   `pr`.`view_count` AS `pr_view_count`,
   `pr`.`created` AS `pr_created`
FROM ((`product_favorite` `pf` left join `product` `pr` on(`pf`.`pr_id` = `pr`.`id`)) left join `brand` `br` on(`br`.`id` = `pr`.`br_id`));


-- 관리자용 상품 뷰테이블2
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_product_admin2`
AS SELECT
    `pr`.`id` AS `id`,
    `pr`.`pims_id` AS `pims_id`,
    `pr`.`cat_cd` AS `cat_cd`,
    `pr`.`cat_cd2` AS `cat_cd2`,
    `pr`.`cat_cd3` AS `cat_cd3`,
    `pr`.`br_id` AS `br_id`,
    `cat1_1`.`code` AS `cat_cd_1depth`,
    `cat1_1`.`name` AS `cat_name_1depth`,
    `cat1_2`.`code` AS `cat_cd_2depth`,
    `cat1_2`.`name` AS `cat_name_2depth`,
    `cat1_3`.`code` AS `cat_cd_3depth`,
    `cat1_3`.`name` AS `cat_name_3depth`,
    `cat2_1`.`code` AS `cat2_cd_1depth`,
    `cat2_1`.`name` AS `cat2_name_1depth`,
    `cat2_2`.`code` AS `cat2_cd_2depth`,
    `cat2_2`.`name` AS `cat2_name_2depth`,
    `cat2_3`.`code` AS `cat2_cd_3depth`,
    `cat2_3`.`name` AS `cat2_name_3depth`,
    `cat3_1`.`code` AS `cat3_cd_1depth`,
    `cat3_1`.`name` AS `cat3_name_1depth`,
    `cat3_2`.`code` AS `cat3_cd_2depth`,
    `cat3_2`.`name` AS `cat3_name_2depth`,
    `cat3_3`.`code` AS `cat3_cd_3depth`,
    `cat3_3`.`name` AS `cat3_name_3depth`,
    `br`.`name` AS `br_name`,
    `br`.`logo` AS `br_logo`,
    `br`.`comments` AS `br_comments`,
    `br`.`product_count` AS `br_product_count`,
    `br`.`detail_used` AS `br_detail_used`,
    `br`.`detail_banner_url` AS `br_detail_banner_url`,
    `br`.`detail_media` AS `br_detail_media`,
    `br`.`detail_html` AS `br_detail_html`,
    `pr`.`name` AS `name`,
    `pr`.`images` AS `images`,
    `pr`.`ref_url` AS `ref_url`,
    `pr`.`video_url` AS `video_url`,
    `pr`.`comments` AS `comments`,
    `pr`.`contents` AS `contents`,
    `pr`.`option_used` AS `option_used`,
    `pr`.`option_type` AS `option_type`,
    `pr`.`option_view_type` AS `option_view_type`,
    `pr`.`sku` AS `sku`,
    `pr`.`barcode` AS `barcode`,
    `pr`.`asin` AS `asin`,
    `pr`.`best_seller` AS `best_seller`,
    `pr`.`new_product` AS `new_product`,
    `pr`.`recommended` AS `recommended`,
    `pr`.`on_sale` AS `on_sale`,
    `pr`.`sort` AS `sort`,
    `pr`.`taxation` AS `taxation`,
    `pr`.`moq` AS `moq`,
    `pr`.`supply_rate` AS `supply_rate`,
    `pr`.`retail_price` AS `retail_price`,
    `pr`.`supply_price` AS `supply_price`,
    `pr`.`sale_price` AS `sale_price`,
    `pr`.`pricing_table` AS `pricing_table`,
    `pr`.`stock` AS `stock`,
    `pr`.`capacity` AS `capacity`,
    `pr`.`capacity_type` AS `capacity_type`,
    `pr`.`inbox_quantity` AS `inbox_quantity`,
    `pr`.`total_weight` AS `total_weight`,
    `pr`.`volume` AS `volume`,
    `pr`.`size_horizontal` AS `size_horizontal`,
    `pr`.`size_vertical` AS `size_vertical`,
    `pr`.`size_height` AS `size_height`,
    `pr`.`ingredient` AS `ingredient`,
    `pr`.`manufactured` AS `manufactured`,
    `pr`.`distributor` AS `distributor`,
    `pr`.`producer_ct_id` AS `producer_ct_id`,
    `pr`.`producer_area` AS `producer_area`,
    `pr`.`msds_id` AS `msds_id`,
    `pr`.`msds` AS `msds`,
    `pr`.`certificate` AS `certificate`,
    `pr`.`supplied_channel` AS `supplied_channel`,
    `pr`.`discontinued` AS `discontinued`,
    `pr`.`discontinued_date` AS `discontinued_date`,
    `pr`.`discontinued_updated` AS `discontinued_updated`,
    `pr`.`valid_country` AS `valid_country`,
    `pr`.`invalid_country` AS `invalid_country`,
    `pr`.`cart_count` AS `cart_count`,
    `pr`.`favorite_count` AS `favorite_count`,
    `pr`.`inquiry_count` AS `inquiry_count`,
    `pr`.`view_count` AS `view_count`,
    `pr`.`display` AS `display`,
    `pr`.`status` AS `status`,
    `pr`.`status_updated` AS `status_updated`,
    `pr`.`admin_role_id` AS `role_id`,
    `pr`.`admin_user_id` AS `user_id`,
    `pr`.`company_id` AS `company_id`,
    `pr`.`created` AS `created`,
    `pr`.`approved` AS `approved`,
    `pr`.`updated` AS `updated`,
    `pr`.`deleted` AS `deleted`,
    coalesce(`ad`.`email`,
    `sl`.`email`) AS `register_email`,
    coalesce(`ad`.`first_name`,
    `sl`.`first_name`) AS `register_first_name`,
    coalesce(`ad`.`last_name`,
    `sl`.`last_name`) AS `register_last_name`,
    coalesce(`ac`.`name`,
    `sc`.`name`) AS `register_company_name`
from
    (((((((((((((((((`product` `pr`
left join `brand` `br` on
    (`br`.`id` = `pr`.`br_id`))
left join `category` `cat1` on
    (`cat1`.`code` = `pr`.`cat_cd`))
left join `category` `cat1_1` on
    (substr(`cat1`.`code`,
    1,
    3) = `cat1_1`.`code`
    and `cat1_1`.`depth` = 1))
left join `category` `cat1_2` on
    (substr(`cat1`.`code`,
    1,
    6) = `cat1_2`.`code`
    and `cat1_2`.`depth` = 2))
left join `category` `cat1_3` on
    (substr(`cat1`.`code`,
    1,
    9) = `cat1_3`.`code`
    and `cat1_3`.`depth` = 3))
left join `category` `cat2` on
    (`cat2`.`code` = `pr`.`cat_cd2`))
left join `category` `cat2_1` on
    (substr(`cat2`.`code`,
    1,
    3) = `cat2_1`.`code`
    and `cat2_1`.`depth` = 1))
left join `category` `cat2_2` on
    (substr(`cat2`.`code`,
    1,
    6) = `cat2_2`.`code`
    and `cat2_2`.`depth` = 2))
left join `category` `cat2_3` on
    (substr(`cat2`.`code`,
    1,
    9) = `cat2_3`.`code`
    and `cat2_3`.`depth` = 3))
left join `category` `cat3` on
    (`cat3`.`code` = `pr`.`cat_cd3`))
left join `category` `cat3_1` on
    (substr(`cat3`.`code`,
    1,
    3) = `cat3_1`.`code`
    and `cat3_1`.`depth` = 1))
left join `category` `cat3_2` on
    (substr(`cat3`.`code`,
    1,
    6) = `cat3_2`.`code`
    and `cat3_2`.`depth` = 2))
left join `category` `cat3_3` on
    (substr(`cat3`.`code`,
    1,
    9) = `cat3_3`.`code`
    and `cat3_3`.`depth` = 3))
left join `admin` `ad` on
    (`ad`.`id` = `pr`.`admin_user_id`
    and `ad`.`role_id` = `pr`.`admin_role_id`))
left join `seller` `sl` on
    (`sl`.`id` = `pr`.`admin_user_id`
    and `sl`.`role_id` = `pr`.`admin_role_id`))
left join `admin_company` `ac` on
    (`ac`.`id` = `pr`.`company_id`))
left join `seller_company` `sc` on
    (`sc`.`id` = `pr`.`company_id`));


-- 리스트용 상품 뷰테이블2
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_product_list2`
AS SELECT
    `pr`.`id` AS `id`,
    `pr`.`cat_cd` AS `cat_cd`,
    `pr`.`cat_cd2` AS `cat_cd2`,
    `pr`.`cat_cd3` AS `cat_cd3`,
    `pr`.`br_id` AS `br_id`,
    `cat1_1`.`code` AS `cat_cd_1depth`,
    `cat1_1`.`name` AS `cat_name_1depth`,
    `cat1_2`.`code` AS `cat_cd_2depth`,
    `cat1_2`.`name` AS `cat_name_2depth`,
    `cat1_3`.`code` AS `cat_cd_3depth`,
    `cat1_3`.`name` AS `cat_name_3depth`,
    `cat2_1`.`code` AS `cat2_cd_1depth`,
    `cat2_1`.`name` AS `cat2_name_1depth`,
    `cat2_2`.`code` AS `cat2_cd_2depth`,
    `cat2_2`.`name` AS `cat2_name_2depth`,
    `cat2_3`.`code` AS `cat2_cd_3depth`,
    `cat2_3`.`name` AS `cat2_name_3depth`,
    `cat3_1`.`code` AS `cat3_cd_1depth`,
    `cat3_1`.`name` AS `cat3_name_1depth`,
    `cat3_2`.`code` AS `cat3_cd_2depth`,
    `cat3_2`.`name` AS `cat3_name_2depth`,
    `cat3_3`.`code` AS `cat3_cd_3depth`,
    `cat3_3`.`name` AS `cat3_name_3depth`,
    `br`.`name` AS `br_name`,
    `br`.`logo` AS `br_logo`,
    `pr`.`name` AS `name`,
    `pr`.`images` AS `images`,
    `pr`.`sku` AS `sku`,
    `pr`.`best_seller` AS `best_seller`,
    `pr`.`new_product` AS `new_product`,
    `pr`.`on_sale` AS `on_sale`,
    `pr`.`recommended` AS `recommended`,
    `pr`.`option_used` AS `option_used`,
    `pr`.`option_type` AS `option_type`,
    `pr`.`option_view_type` AS `option_view_type`,
    `pr`.`sort` AS `sort`,
    `pr`.`moq` AS `moq`,
    `pr`.`supply_rate` AS `supply_rate`,
    `pr`.`retail_price` AS `retail_price`,
    `pr`.`supply_price` AS `supply_price`,
    `pr`.`sale_price` AS `sale_price`,
    `pr`.`stock` AS `stock`,
    `pr`.`manufactured` AS `manufactured`,
    `pr`.`distributor` AS `distributor`,
    `pr`.`discontinued` AS `discontinued`,
    `pr`.`comments` AS `comments`,
    `pr`.`cart_count` AS `cart_count`,
    `pr`.`favorite_count` AS `favorite_count`,
    `pr`.`inquiry_count` AS `inquiry_count`,
    `pr`.`view_count` AS `view_count`,
    `pr`.`display` AS `display`,
    `pr`.`status` AS `status`,
    `pr`.`created` AS `created`,
    `pr`.`updated` AS `updated`,
    `pr`.`deleted` AS `deleted`
from
    (((((((((((((`product` `pr`
left join `brand` `br` on
    (`br`.`id` = `pr`.`br_id`))
left join `category` `cat1` on
    (`cat1`.`code` = `pr`.`cat_cd`))
left join `category` `cat1_1` on
    (substr(`cat1`.`code`,
    1,
    3) = `cat1_1`.`code`
    and `cat1_1`.`depth` = 1))
left join `category` `cat1_2` on
    (substr(`cat1`.`code`,
    1,
    6) = `cat1_2`.`code`
    and `cat1_2`.`depth` = 2))
left join `category` `cat1_3` on
    (substr(`cat1`.`code`,
    1,
    9) = `cat1_3`.`code`
    and `cat1_3`.`depth` = 3))
left join `category` `cat2` on
    (`cat2`.`code` = `pr`.`cat_cd2`))
left join `category` `cat2_1` on
    (substr(`cat2`.`code`,
    1,
    3) = `cat2_1`.`code`
    and `cat2_1`.`depth` = 1))
left join `category` `cat2_2` on
    (substr(`cat2`.`code`,
    1,
    6) = `cat2_2`.`code`
    and `cat2_2`.`depth` = 2))
left join `category` `cat2_3` on
    (substr(`cat2`.`code`,
    1,
    9) = `cat2_3`.`code`
    and `cat2_3`.`depth` = 3))
left join `category` `cat3` on
    (`cat3`.`code` = `pr`.`cat_cd3`))
left join `category` `cat3_1` on
    (substr(`cat3`.`code`,
    1,
    3) = `cat3_1`.`code`
    and `cat3_1`.`depth` = 1))
left join `category` `cat3_2` on
    (substr(`cat3`.`code`,
    1,
    6) = `cat3_2`.`code`
    and `cat3_2`.`depth` = 2))
left join `category` `cat3_3` on
    (substr(`cat3`.`code`,
    1,
    9) = `cat3_3`.`code`
    and `cat3_3`.`depth` = 3));


-- 상세페이지용 상품 뷰테이블2
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_product_detail2`
AS SELECT
    `pr`.`id` AS `id`,
    `pr`.`pims_id` AS `pims_id`,
    `pr`.`cat_cd` AS `cat_cd`,
    `pr`.`cat_cd2` AS `cat_cd2`,
    `pr`.`cat_cd3` AS `cat_cd3`,
    `pr`.`br_id` AS `br_id`,
    `cat1_1`.`code` AS `cat_cd_1depth`,
    `cat1_1`.`name` AS `cat_name_1depth`,
    `cat1_2`.`code` AS `cat_cd_2depth`,
    `cat1_2`.`name` AS `cat_name_2depth`,
    `cat1_3`.`code` AS `cat_cd_3depth`,
    `cat1_3`.`name` AS `cat_name_3depth`,
    `cat2_1`.`code` AS `cat2_cd_1depth`,
    `cat2_1`.`name` AS `cat2_name_1depth`,
    `cat2_2`.`code` AS `cat2_cd_2depth`,
    `cat2_2`.`name` AS `cat2_name_2depth`,
    `cat2_3`.`code` AS `cat2_cd_3depth`,
    `cat2_3`.`name` AS `cat2_name_3depth`,
    `cat3_1`.`code` AS `cat3_cd_1depth`,
    `cat3_1`.`name` AS `cat3_name_1depth`,
    `cat3_2`.`code` AS `cat3_cd_2depth`,
    `cat3_2`.`name` AS `cat3_name_2depth`,
    `cat3_3`.`code` AS `cat3_cd_3depth`,
    `cat3_3`.`name` AS `cat3_name_3depth`,
    `br`.`name` AS `br_name`,
    `br`.`logo` AS `br_logo`,
    `br`.`comments` AS `br_comments`,
    `br`.`product_count` AS `br_product_count`,
    `br`.`detail_used` AS `br_detail_used`,
    `br`.`detail_banner_url` AS `br_detail_banner_url`,
    `br`.`detail_media` AS `br_detail_media`,
    `br`.`detail_html` AS `br_detail_html`,
    `pr`.`name` AS `name`,
    `pr`.`images` AS `images`,
    `pr`.`ref_url` AS `ref_url`,
    `pr`.`video_url` AS `video_url`,
    `pr`.`comments` AS `comments`,
    `pr`.`contents` AS `contents`,
    `pr`.`option_used` AS `option_used`,
    `pr`.`option_type` AS `option_type`,
    `pr`.`option_view_type` AS `option_view_type`,
    `pr`.`sku` AS `sku`,
    `pr`.`barcode` AS `barcode`,
    `pr`.`asin` AS `asin`,
    `pr`.`best_seller` AS `best_seller`,
    `pr`.`new_product` AS `new_product`,
    `pr`.`on_sale` AS `on_sale`,
    `pr`.`recommended` AS `recommended`,
    `pr`.`sort` AS `sort`,
    `pr`.`taxation` AS `taxation`,
    `pr`.`moq` AS `moq`,
    `pr`.`supply_rate` AS `supply_rate`,
    `pr`.`retail_price` AS `retail_price`,
    `pr`.`supply_price` AS `supply_price`,
    `pr`.`sale_price` AS `sale_price`,
    `pr`.`pricing_table` AS `pricing_table`,
    `pr`.`stock` AS `stock`,
    `pr`.`capacity` AS `capacity`,
    `pr`.`capacity_type` AS `capacity_type`,
    `pr`.`inbox_quantity` AS `inbox_quantity`,
    `pr`.`total_weight` AS `total_weight`,
    `pr`.`volume` AS `volume`,
    `pr`.`size_horizontal` AS `size_horizontal`,
    `pr`.`size_vertical` AS `size_vertical`,
    `pr`.`size_height` AS `size_height`,
    `pr`.`ingredient` AS `ingredient`,
    `pr`.`manufactured` AS `manufactured`,
    `pr`.`distributor` AS `distributor`,
    `pr`.`producer_ct_id` AS `producer_ct_id`,
    `pr`.`producer_area` AS `producer_area`,
    `pr`.`msds_id` AS `msds_id`,
    `pr`.`msds` AS `msds`,
    `pr`.`certificate` AS `certificate`,
    `pr`.`supplied_channel` AS `supplied_channel`,
    `pr`.`discontinued` AS `discontinued`,
    `pr`.`discontinued_date` AS `discontinued_date`,
    `pr`.`discontinued_updated` AS `discontinued_updated`,
    `pr`.`valid_country` AS `valid_country`,
    `pr`.`invalid_country` AS `invalid_country`,
    `pr`.`cart_count` AS `cart_count`,
    `pr`.`favorite_count` AS `favorite_count`,
    `pr`.`inquiry_count` AS `inquiry_count`,
    `pr`.`view_count` AS `view_count`,
    `pr`.`display` AS `display`,
    `pr`.`status` AS `status`,
    `pr`.`status_updated` AS `status_updated`,
    `pr`.`created` AS `created`,
    `pr`.`approved` AS `approved`,
    `pr`.`updated` AS `updated`,
    `pr`.`deleted` AS `deleted`
from
    (((((((((((((`product` `pr`
left join `brand` `br` on
    (`br`.`id` = `pr`.`br_id`))
left join `category` `cat1` on
    (`cat1`.`code` = `pr`.`cat_cd`))
left join `category` `cat1_1` on
    (substr(`cat1`.`code`,
    1,
    3) = `cat1_1`.`code`
    and `cat1_1`.`depth` = 1))
left join `category` `cat1_2` on
    (substr(`cat1`.`code`,
    1,
    6) = `cat1_2`.`code`
    and `cat1_2`.`depth` = 2))
left join `category` `cat1_3` on
    (substr(`cat1`.`code`,
    1,
    9) = `cat1_3`.`code`
    and `cat1_3`.`depth` = 3))
left join `category` `cat2` on
    (`cat2`.`code` = `pr`.`cat_cd2`))
left join `category` `cat2_1` on
    (substr(`cat2`.`code`,
    1,
    3) = `cat2_1`.`code`
    and `cat2_1`.`depth` = 1))
left join `category` `cat2_2` on
    (substr(`cat2`.`code`,
    1,
    6) = `cat2_2`.`code`
    and `cat2_2`.`depth` = 2))
left join `category` `cat2_3` on
    (substr(`cat2`.`code`,
    1,
    9) = `cat2_3`.`code`
    and `cat2_3`.`depth` = 3))
left join `category` `cat3` on
    (`cat3`.`code` = `pr`.`cat_cd3`))
left join `category` `cat3_1` on
    (substr(`cat3`.`code`,
    1,
    3) = `cat3_1`.`code`
    and `cat3_1`.`depth` = 1))
left join `category` `cat3_2` on
    (substr(`cat3`.`code`,
    1,
    6) = `cat3_2`.`code`
    and `cat3_2`.`depth` = 2))
left join `category` `cat3_3` on
    (substr(`cat3`.`code`,
    1,
    9) = `cat3_3`.`code`
    and `cat3_3`.`depth` = 3));

-- 상품 장바구니(카트) 뷰테이블
CREATE OR REPLACE ALGORITHM=MERGE DEFINER=`umma`@`%` SQL SECURITY DEFINER VIEW `view_product_cart`
AS SELECT
   `pc`.`id` AS `id`,
   `pc`.`role_id` AS `role_id`,
   `pc`.`user_id` AS `user_id`,
   `pc`.`pr_id` AS `pr_id`,
   `pc`.`po_id` AS `po_id`,
   `pc`.`po_name` AS `po_name`,
   `pc`.`status` AS `pc_status`,
   `pc`.`created` AS `pc_created`,
   `pc`.`updated` AS `pc_updated`,
   `pc`.`deleted` AS `pc_deleted`,
   `pc`.`total_price` AS `pc_total_price`,
   `pc`.`quantity` AS `pc_quantity`,
   `pc`.`discount_id` AS `pc_discount_id`,
   `br`.`name` AS `br_name`,
   `pr`.`br_id` AS `br_id`,
   `pr`.`name` AS `pr_name`,
   `pr`.`images` AS `pr_images`,
   `pr`.`sku` AS `pr_sku`,
   `pr`.`barcode` AS `pr_barcode`,
   `pr`.`moq` AS `pr_moq`,
   `pr`.`retail_price` AS `pr_retail_price`,
   `pr`.`supply_price` AS `pr_supply_price`,
   `pr`.`supply_rate` AS `pr_supply_rate`,
   `pr`.`capacity_type` AS `pr_capacity_type`,
   `pr`.`capacity` AS `pr_capacity`,
   `pr`.`cart_count` AS `pr_cart_count`,
   `pr`.`view_count` AS `pr_view_count`,
   `pr`.`created` AS `pr_created`
FROM ((`product_cart` `pc` left join `product` `pr` on(`pc`.`pr_id` = `pr`.`id`)) left join `brand` `br` on(`br`.`id` = `pr`.`br_id`));
