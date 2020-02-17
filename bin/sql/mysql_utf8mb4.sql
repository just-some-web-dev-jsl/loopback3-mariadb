show engines;

-- 필요한 설정만 찾아서 정리해야함

SET names utf8mb4 COLLATE utf8mb4_unicode_ci;


SET character_set_client = utf8;
SET character_set_results = utf8;
SET character_set_server = utf8;


SET character_set_connection = utf8;
SET character_set_database = utf8;

SET CHARSET utf8mb4;


SET session character_set_client = utf8mb4;
SET session character_set_results = utf8mb4;
SET character_set_server = utf8mb4;
SET character_set_connection = utf8mb4;
SET character_set_database = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;
SET collation_database = utf8mb4_unicode_ci;
SET collation_server = utf8mb4_unicode_ci;

SHOW VARIABLES WHERE Variable_name LIKE 'character\_set\_%' OR Variable_name LIKE 'collation%';


-- 이모티콘 입력 테스트
CREATE TABLE `test` (
  `idx` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '고유번호',
  `msg` TEXT NOT NULL COMMENT '메세지',
  `dt` DATETIME COMMENT '생성일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='테스트';

INSERT INTO `test` (`msg`, `dt`) VALUES ('😄😄😄', now());

SELECT * FROM `test`;
