-- umma-trade sample data

-- 공통 코드 등록
INSERT INTO `common_code` (`id`, `parent_id`, `depth`, `code`, `name`, `comments`, `status`)
VALUES
  (1, 0, 1, 'DATA_STATUS', 'DATA_STATUS', '상태값', 1),
	(2, 1, 2, 'D', 'DELETED', '삭제', 1),
	(3, 1, 2, 'Y', 'USE', '사용', 1),
  (4, 0, 1, 'USER_STATUS', 'USER_STATUS', '회원 상태값', 1),
	(5, 4, 2, 'O', 'OUT', '탈퇴', 1),
	(6, 4, 2, 'D', 'DELETED', '삭제', 1),
	(7, 4, 2, 'W', 'WAITING', '대기', 1),
	(8, 4, 2, 'A', 'APPROVAL', '승인', 1),
	(9, 4, 2, 'R', 'REFUSED', '거절', 1);

-- 카테고리 등록
INSERT INTO `category` (`id`, `code`, `name`)
VALUES
  (1, '001', 'Skin Care');

-- 브랜드 등록
INSERT INTO `brand` (`id`, `name`)
VALUES
  (1, 'Skin1004');

-- 상품 등록
INSERT INTO `product` (`id`, `br_id`, `cat_cd`, `name`, `status`)
VALUES
  (1, 1, 1, 'Zombie Pack'),
  (2, 1, '001', 'Madagascar Centella Asiatica Cream', 'A');
