set -e pipefail
set -o pipefail

ENV="production"
DOMAIN="api.umma.io"

git pull
pm2 restart all

# 잔디
curl -X POST https://wh.jandi.com/connect-api/webhook/11320800/801a4f4e0293d121daf40521bc15c242 \
-H "Accept: application/vnd.tosslab.jandi-v2+json" \
-H "Content-Type: application/json" \
--data-binary '{"body":"[SERVER RESTARTED] Environment ['${ENV}'] pulled and PM2 resetted for '${DOMAIN}'."}' &> /dev/null

echo 'Pull Complete'
