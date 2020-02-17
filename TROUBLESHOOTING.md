# Troubleshooting

## Development 환경

### MariaDB Server

- 개발환경 데이터베이스 또는 테이블에 문제 발생시 서버를 재시작 한다.
  - ssh 222.239.10.123 서버 접속
  ```bash
  # 도커 컨테이너 재시작
  docker restart mariadb-102_mariadb_1
  ```

## Staging 및 Production 환경

- node 버전 확인: v10.x ~ v12.x 버전 지원
  - sharp 모듈이 노드 버전에 맞춰 설치되므로 버전 변경시 재설치 필수 "rm -rf node_modules/sharp && npm i"
- node_modules 확인: node 버전에 맞는 패키지가 설치되어야함으로 필요시 npm i 명령으로 재설치
- 로드밸런서 확인: 상태 검사 조건 및 인스턴스 InService 상태 확인
- PM2: 자주 사용하는 명령어들
  - pm2 l 또는 pm2 list
  - pm2 logs server
  - pm2 monit
- 재배포
  - 서버 ssh 접속
  - cd ~/webdev/umma-trade-admin-server
  - git pull && npm i && npm start (패키지 변경사항이 있을때)
  - git pull && npm start (패키지 변경사항이 없을때)
