set -e pipefail
set -o pipefail

ENV="development"
DOMAIN="localhost:4000"

git pull
pm2 restart all

echo 'Pull Complete'
