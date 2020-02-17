/* 장바구니 중복 상품 통합 후 상품 테이블 cart_count 업데이트 */

# 프로시저 실행 쿼리
# call sp_product_cart_merge_dupe(@result, @dupeCount, @count1, @count2, @msg);
# select @result, @dupeCount, @count1, @count2, @msg;

CREATE DEFINER=`umma`@`%` PROCEDURE `umma`.`sp_product_cart_merge_dupe`(
	OUT `result` INT,
	OUT `dupeCount` INT,
	OUT `count1` INT,
	OUT `count2` INT,
	OUT `msg` TEXT
)
    COMMENT '카트 중복 상품 통합'
BEGIN
	DECLARE EXIT HANDLER FOR SQLEXCEPTION
	BEGIN
		-- ERROR
		SET result = -1;
		ROLLBACK;

		GET DIAGNOSTICS CONDITION 1
			@errorCode = RETURNED_SQLSTATE, @errorMessage = MESSAGE_TEXT;
		SET msg = CONCAT('error = ', @errorCode, ', message = ', @errorMessage);
	END;

	DECLARE EXIT HANDLER FOR SQLWARNING
	BEGIN
		-- WARNING
		SET result = -2;
		ROLLBACK;
	END;

	#트랜잭션 시작
	START TRANSACTION;

	SET result = 0;
	SET count1 = 0;
	SET count2 = 0;
	SET dupeCount = 0;

	block1: BEGIN
		-- 카트 중복 상품을 조회한다.
		DECLARE done1 INT DEFAULT 0;

		DECLARE vCnt INT;
		DECLARE vRoleId INT;
		DECLARE vUserId INT;
		DECLARE vPrId INT;
		DECLARE vPoId INT;

		DECLARE v2Id INT;
		DECLARE v2PoName VARCHAR(200);
		DECLARE v2CatCd1depth VARCHAR(10);
		DECLARE v2CatCd2depth VARCHAR(10);
		DECLARE v2CatCd3depth VARCHAR(10);
		DECLARE v2Sku VARCHAR(100);
		DECLARE v2Barcode VARCHAR(100);
		-- DECLARE v2TotalPrice DECIMAL(10,2); -- Generate column
		DECLARE v2SupplyPrice DECIMAL(10,2);
		DECLARE v2Quantity INT;
		DECLARE v2Status INT;
		DECLARE v2Created DATETIME;
		DECLARE v2Updated DATETIME DEFAULT NULL;
		DECLARE v2Deleted DATETIME DEFAULT NULL;

		DECLARE v2SumQuantity INT DEFAULT 0;
		DECLARE v3SumQuantity INT DEFAULT 0;

		-- select
		DECLARE cursor1 CURSOR FOR
		SELECT count(*) cnt, role_id, user_id, pr_id, po_id
		FROM product_cart
		GROUP BY role_id, user_id, pr_id, po_id
		HAVING cnt > 1
		ORDER BY role_id, user_id, pr_id, po_id
		;

		#커서 종료조건: 더이상 없다면 1 설정
		DECLARE CONTINUE HANDLER FOR NOT FOUND SET done1 = 1;

		OPEN cursor1;
		SELECT FOUND_ROWS() INTO dupeCount;
		readLoop1: LOOP
			FETCH cursor1 INTO vCnt, vRoleId, vUserId, vPrId, vPoId;
			#커서 종료 조건
			IF done1 = 1 THEN
				CLOSE cursor1;
				LEAVE readLoop1;
			END IF;

			SET count1 = count1 + 1;

			block2: BEGIN
				DECLARE done2 INT DEFAULT 0;

				-- select
				DECLARE cursor2 CURSOR FOR
				SELECT id, po_name, cat_cd_1depth, cat_cd_2depth, cat_cd_3depth, sku, barcode, quantity, supply_price, status, created, updated, deleted
				FROM product_cart
				WHERE role_id = vRoleId AND user_id = vUserId AND pr_id = vPrId AND po_id = vPoId
				;

				#커서 종료조건: 더이상 없다면 1 설정
				DECLARE CONTINUE HANDLER FOR NOT FOUND SET done2 = 1;

				SET v2SumQuantity = 0;
				SET v3SumQuantity = 0;

				OPEN cursor2;
				readLoop2: LOOP
					FETCH cursor2 INTO v2Id, v2PoName, v2CatCd1depth, v2CatCd2depth, v2CatCd3depth, v2Sku, v2Barcode, v2Quantity, v2SupplyPrice, v2Status, v2Created, v2Updated, v2Deleted;
					#커서 종료 조건
					IF done2 = 1 THEN
						CLOSE cursor2;
						LEAVE readLoop2;
					END IF;

					SET count2 = count2 + 1;

					-- 사용중인 상품들 수량 합계
					IF v2Status = 1 THEN
						SET v2SumQuantity = v2SumQuantity + v2Quantity;
					-- 삭제된 상품들 수량 합계
					ELSE
						SET v3SumQuantity = v3SumQuantity + v2Quantity;
					END IF;
				END LOOP readLoop2;
			END block2;

			-- 삭제된 상품만 존재할 경우
			IF (v2SumQuantity > 0 AND v3SumQuantity = 0) THEN
				-- 카트 상품 삭제
				DELETE FROM product_cart WHERE role_id = vRoleId AND user_id = vUserId AND pr_id = vPrId AND po_id = vPoId;
				-- 카트 상품 등록
				INSERT INTO product_cart (
					role_id,
					user_id,
					pr_id,
					po_id,
					po_name,
					cat_cd_1depth,
					cat_cd_2depth,
					cat_cd_3depth,
					sku,
					barcode,
					status,
					supply_price,
					quantity,
					created,
					updated,
					deleted
				) VALUES (
					vRoleId,
					vUserId,
					vPrId,
					vPoId,
					v2PoName,
					v2CatCd1depth,
					v2CatCd2depth,
					v2CatCd3depth,
					v2Sku,
					v2Barcode,
					0,
					v2SupplyPrice,
					v3SumQuantity,
					v2Created,
					v2Updated,
					v2Deleted
				);
			-- 사용중인 상품만 존재할 경우
			ELSEIF (v2SumQuantity = 0 AND v3SumQuantity > 0) THEN
				-- 카트 상품 삭제
				DELETE FROM product_cart WHERE role_id = vRoleId AND user_id = vUserId AND pr_id = vPrId AND po_id = vPoId;
				-- 카트 상품 등록
				INSERT INTO product_cart (
					role_id,
					user_id,
					pr_id,
					po_id,
					po_name,
					cat_cd_1depth,
					cat_cd_2depth,
					cat_cd_3depth,
					sku,
					barcode,
					status,
					supply_price,
					quantity,
					created,
					updated,
					deleted
				) VALUES (
					vRoleId,
					vUserId,
					vPrId,
					vPoId,
					v2PoName,
					v2CatCd1depth,
					v2CatCd2depth,
					v2CatCd3depth,
					v2Sku,
					v2Barcode,
					1,
					v2SupplyPrice,
					v2SumQuantity,
					v2Created,
					v2Updated,
					v2Deleted
				);
			-- 둘다 존재할 경우
			ELSEIF (v2SumQuantity > 0 AND v3SumQuantity > 0) THEN
				-- 카트 상품 삭제
				DELETE FROM product_cart WHERE role_id = vRoleId AND user_id = vUserId AND pr_id = vPrId AND po_id = vPoId;
				-- 카트 상품 등록
				INSERT INTO product_cart (
					role_id,
					user_id,
					pr_id,
					po_id,
					po_name,
					cat_cd_1depth,
					cat_cd_2depth,
					cat_cd_3depth,
					sku,
					barcode,
					status,
					supply_price,
					quantity,
					created,
					updated,
					deleted
				) VALUES (
					vRoleId,
					vUserId,
					vPrId,
					vPoId,
					v2PoName,
					v2CatCd1depth,
					v2CatCd2depth,
					v2CatCd3depth,
					v2Sku,
					v2Barcode,
					1,
					v2SupplyPrice,
					v2SumQuantity,
					v2Created,
					v2Updated,
					v2Deleted
				);
			ELSE
				-- 예상치 못한 값이 들어있을 경우
				SET msg = CONCAT('unknown case: v2SumQuantity = ', v2SumQuantity, ', v3SumQuantity = ', v3SumQuantity);
			END IF;

			SET result = result + 1;

		END LOOP readLoop1;

	END block1;

	IF result > 0 THEN
		-- 상품 테이블 cart_count 업데이트
		UPDATE product p SET cart_count = (SELECT COUNT(*) FROM product_cart pc WHERE pc.pr_id = p.id AND pc.status = 1) WHERE 1 = 1;
		#커밋
		COMMIT;
		SET msg = 'success';
	ELSE
		#롤백
		ROLLBACK;
	END IF;
END
