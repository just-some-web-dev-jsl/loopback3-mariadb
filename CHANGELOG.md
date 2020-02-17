# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.4] - 2019-07-29

### Added

- 로그인 정보에 토큰 만료 시간 정보 추가
- 공통 코드 클라이언트용 신규 라우터 추가

### Changed

- 공통 코드 추가 및 수동 설정 코드들 추가
- 커스텀 에러 코드 404를 400으로 변경
- 패키지 업데이트

### Fixed

- 카테고리 삭제시 상품 카운트 체크 버그 수정

## [1.2.3] - 2019-06-26

### Added

- 프로모션 관리 추가
- 프로모션 적립금 지급 및 차감 추가
- 관리자용 카테고리 라우터 추가
- 특정 에러 발생시 잔디 웹훅 추가
- 공통 코드 관리 추가

### Changed

- 브랜드 소개 영상 소스 iframe 변환
- 리팩토링 및 버그 수정
- loopback 관련 패키지 업데이트
- 기타 패키지 업데이트

## [1.2.2] - 2019-05-23

### Added

- 주문서 엑셀 다운로드 추가
- 송장 번호 등록 추가
- 가견적서 재생성 추가

### Changed

- 리팩토링 및 버그 수정
- 패키지 모듈 업데이트

## [1.2.1] - 2019-04-23

### Changed

- 주문 오류시 페이팔 결제 환불(취소) 처리 추가

## [1.2.0] - 2019-04-22

### Added

- 상품 옵션 추가
- 상품 카트 추가
- 바이어 회원 배송지 관리 추가
- Proforma 추가
- Order/Invoice 추가
- TT 결제 추가
- Paypal 결제 연동 추가
- 적립금 기능 추가
- 결제 내역 추가
- 주문 리마크 로그 추가
- 주문 환불 로그 추가
- 주문 배송 상태 로그 추가
- 관리자 등급 기능 추가

### Changed

- 카테고리 뷰 테이블 3단계 표현 구조 변경
- 상품 카테고리 최대 3개까지 확장
- 공통 코드에 status 컬럼 추가
- 브랜드, 카테고리 정보 메모리 로딩 제거
- loopback 관련 패키지 업데이트
- sharp 패키지 업데이트
- 기타 패키지 업데이트

## [1.0.1] - 2019-01-24

### Added

- eslint와 prettier를 이용한 코딩 컨벤션 적용
- 개발자용 Mocha 테스트 지원 및 chai 모듈 추가

### Changed

- ENV 환경 변수를 .env 파일 사용방식에서 AWS SSM 파라미터 스토어 사용방식으로 변경
- bunyan 로거에서 winston 로거로 변경 및 로그 문자열 포맷 변경

### Fixed

- token 권한 체크 버그 수정
- 상품 등록, 인쿼리 등록 등 트리거 이메일 발송시 상품이미지 및 첨부파일 URL에 적용된 JSON parse 버그 수정
- inquiry 첨부파일 public 버킷 업로드 버그 수정
- 기타 불필요한 파일 정리

## [1.0.0] - 2019-01-14

- 최초 정식 버전 릴리즈

<!-- Types of changes
### Added
- 새로운 기능
### Changed
- 기존 기능의 변경사항
### Deprecated
- 곧 지워질 기능
### Removed
- 지금 지워진 기능
### Fixed
- 버그 픽스
### Security
- 취약점이 있는 경우
-->

[unreleased]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.2.4...HEAD
[1.2.4]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.0.1...v1.2.0
[1.0.1]: https://github.com/B2Labs/umma-trade-admin-server/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/B2Labs/umma-trade-admin-server/compare/28daf7851b473d40ac6f76f99543c6dad8ba891e...v1.0.0
