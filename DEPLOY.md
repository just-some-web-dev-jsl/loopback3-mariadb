# Deploy

- AWS EC2에 서비스를 배포하는 스크립트
- 배포 권한이 없는 사용자는 사용 금지

## process.env 환경변수 설정

```bash
# staging
echo "
if [ -f ~/.bashrc ]; then
. ~/.bashrc
fi
# NODE_ENV
export NODE_ENV=staging
# ssm-parameter-user.umma
export AWS_SSM_UMMA_ACCESS_KEY_ID=키아이디
export AWS_SSM_UMMA_SECRET_ACCESS_KEY=시크릿키
export AWS_SSM_UMMA_REGION=리전명
" >> ~/.bash_profile
source ~/.bash_profile

# production
echo "
if [ -f ~/.bashrc ]; then
. ~/.bashrc
fi
# NODE_ENV
export NODE_ENV=production
# ssm-parameter-user.umma
export AWS_SSM_UMMA_ACCESS_KEY_ID=키아이디
export AWS_SSM_UMMA_SECRET_ACCESS_KEY=시크릿키
export AWS_SSM_UMMA_REGION=리전명
" >> ~/.bash_profile
source ~/.bash_profile
```

## npm ci 명령으로 node_modules 설치

- production과 staging 서버에 node_modules 설치시 반드시 아래 옵션으로 설치 (package-lock.json 파일 필요)
- node_modules 디렉토리가 이미 있으면 npm ci가 설치를 시작하기 전에 자동으로 제거한다.
- 따라서 npm ci는 한 번에 전체 패키지를 설치할 수 있지만, 개별 패키지는 추가 할 수 없다.
- package.json 파일과 package-lock.json 파일의 패키지 종속성이 일치하지 않으면 설치되지않고 오류를 발생시킨다.
- npm ci는 npm 5.7.0 버전부터 지원한다. (현재 npm 6.4.1 버전 기준으로 작성)

```bash
npm ci --only=production
```

- 설치 시 아래와 같은 경고 메세지가 발생하는데 원인 파악은 하지 못했고 경고 문구라 무시했다.

```bash
(node:75107) Warning: .then() only accepts functions but was passed: [object Object]
```

- 최초 설치 시에는 아래 스크립트를 사용한다.

```bash
npm run setup
```

## ssh 로 배포 스크립트 예시

- production

  ```bash
  ssh -i ~/.ssh/umma.pem ubuntu@ec2-52-78-166-146.ap-northeast-2.compute.amazonaws.com 'cd /home/ubuntu/webdev/umma-trade-admin-server && npm run deploy'
  ```

- staging

  ```bash
  ssh -i ~/.ssh/umma.pem ubuntu@ec2-13-124-178-243.ap-northeast-2.compute.amazonaws.com 'cd /home/ubuntu/webdev/umma-trade-admin-server && npm run deploy'
  ```

## ~/.ssh/config 설정 후 배포 스크립트 예시

- production

  ```bash
  ssh umma-production 'cd /home/ubuntu/webdev/umma-trade-admin-server && npm run deploy'
  ```

- staging

  ```bash
  ssh umma-staging 'cd /home/ubuntu/webdev/umma-trade-admin-server && npm run deploy'
  ```

## package-lock.json 충돌 문제 해결

해결 1) package.json 파일을 수동으로 수정하고 npm install --package-lock-only

해결 2) npm-merge-driver 설치하면 자동으로 수정해준다. npx npm-merge-driver install --global

## 서버 Node.js 버전 업데이트

```bash
# 캐시 강제 삭제
sudo npm cache clean -f
# n 모듈 설치
sudo npm install -g n
# NodeJS lts 버전 설치
sudo n lts
# NodeJS 특정 버전 설치
sudo n 10.15.3
# NodeJS 버전 확인
sudo node -v
# pm2 업데이트
pm2 updatePM2
```

## pm2 서비스 실행

```bash
cd /home/ubuntu/webdev/umma-trade-admin-server

# Start app
pm2 start ecosystem.config.js --env staging
pm2 start ecosystem.config.js --env production
# Switching environment
pm2 restart ecosystem.config.js --env staging
pm2 restart ecosystem.config.js --env production
```
