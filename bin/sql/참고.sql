-- 데이터가 크고 테이블에 인덱스 걸려있을 경우 인덱스 해제 > 데이터 로딩 > 인덱스 설정 순으로 작업
ALTER TABLE `umma`.`country` DISABLE KEYS;
LOAD DATA local INFILE "filePath"
INTO TABLE `umma`.`country`
FIELDS TERMINATED BY ',';
ENCLOSED BY '\"'
LINES TERMINATED BY '\n'
(column1,column2,column3, ...);
ALTER TABLE `umma`.`country` ENABLE KEYS;
--
-- import csv
LOAD DATA INFILE "countrycode.csv"
INTO TABLE `umma`.`country`
FIELDS TERMINATED BY ','
ENCLOSED BY '\"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(ctr_cd, ctr_name, ctr_alpha3_cd, ctr_numeric_cd, ctr_phone_cd, ctr_continent, ctr_capital, ctr_timezone, ctr_currency, ctr_language_cd, ctr_languages);
--

-- json functions
-- https://mariadb.com/kb/en/library/json-functions/
select * from `product` where json_search(`images`, 'one', 'https://d3ea9molln0us0.cloudfront.net/img/productImg/20181101/9996fed6-3a9a-469b-afe9-d2e65761ecd7.JPG') like '"$[%]"';
select * from `product` where json_search(`images`, 'all', 'https://d3ea9molln0us0.cloudfront.net/img/productImg/20181101/9996fed6-3a9a-469b-afe9-d2e65761ecd7.JPG') like '"$[%]"';
select * from `product` where json_search(`valid_country`, 'all', 'KR') is not null;

update `product` set `images` = json_array_append(`images`, '$', 'TEST_IMAGE_URL') where `id`=0;

-- The primary difference between the two functions is that JSON_QUERY returns an object or an array, while JSON_VALUE returns a scalar.
SELECT JSON_ARRAY(56, 3.1416, 'My name is "Foo"', NULL);
SELECT JSON_ARRAY_APPEND('[1, 2, [3, 4]]', '$[0]', 5);
SELECT JSON_ARRAY_INSERT('[1, 2, [3, 4]]', '$[1]', 6, '$[2]', 7);
SELECT JSON_COMPACT(json_doc);
SELECT JSON_CONTAINS('{"A": 0, "B": {"C": 1}, "D": 2}', '{"C": 1}', '$.B');
SELECT JSON_CONTAINS_PATH('{"A": 1, "B": [2], "C": [3, 4]}', 'one', '$.A', '$.D');
SELECT JSON_CONTAINS_PATH('{"A": 1, "B": [2], "C": [3, 4]}', 'all', '$.A', '$.D');
SELECT JSON_DEPTH(`images`) from `product` where 1 limit 1;
SELECT JSON_DETAILED(`images`, 4) from `product` where 1 limit 1;
SELECT JSON_EXISTS('{"key1":"xxxx", "key2":[1, 2, 3]}', "$.key2");
SELECT JSON_EXTRACT(`images`, '$[0]') from `product` where 1 limit 1;
SELECT JSON_INSERT('{ "A": 0, "B": [1, 2]}', '$.C', '[3, 4]');
SELECT JSON_KEYS('{"A": 1, "B": {"C": 2}}');
SELECT JSON_LENGTH(json_doc[, path]);
SELECT JSON_LOOSE(json_doc);
SELECT JSON_MERGE('[1, 2]','[3, 4]');
SELECT JSON_OBJECT("id", 1, "name", "Monty");
SELECT JSON_QUERY('{"key1":{"a":1, "b":[1,2]}}', '$.key1');
SELECT JSON_QUOTE('A');
SELECT JSON_QUOTE("B");
SELECT JSON_QUOTE('"C"');
SELECT JSON_REMOVE('{"A": 1, "B": 2, "C": {"D": 3}}', '$.C');
SELECT JSON_REPLACE('{ "A": 1, "B": [2, 3]}', '$.B[1]', 4);
SELECT JSON_SET(json_doc, path, val[, path, val] ...);
SELECT JSON_TYPE('{"A": 1, "B": 2, "C": 3}');
SELECT JSON_UNQUOTE('"Monty"');
SELECT JSON_VALUE('{"key1":123}', '$.key1');
SELECT JSON_VALID('{"id": 1, "name": "Monty"}');

-- 복호화가 필요한 데이터 암호화
SELECT HEX(AES_ENCRYPT('value', SHA2('salt',512)));
SELECT AES_DECRYPT(UNHEX('B89E9624D38BCFEA2EBBF32FF1AAF273'), SHA2('salt',512));
-- 비밀번호 암호화
SELECT SHA2(CONCAT('salt','value'),512));


-- 상품 좋아요 트리거 테스트 쿼리
insert into `product_favorite` (`pf_mt_id`, `pf_m_id`, `pf_pr_id`) values (200,1,1);
delete from `product_favorite` where `pf_mt_id`=200 and `pf_m_id`=1 and `pf_pr_id`=1;
