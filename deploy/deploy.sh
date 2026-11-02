#!/usr/bin/env bash
# Run on the server from anywhere:  sudo bash deploy/deploy.sh
# Safe to re-run: use it for the first deploy and for every update.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

[ -f backend/.env ] || { echo "backend/.env is missing - copy deploy/env.production.example first"; exit 1; }

echo "==> Backend: virtualenv + dependencies"
[ -d backend/.venv ] || python3 -m venv backend/.venv
backend/.venv/bin/pip install --quiet --upgrade pip
backend/.venv/bin/pip install --quiet -r backend/requirements.txt

echo "==> Backend: database + static files"
(cd backend && .venv/bin/python manage.py migrate --noinput && .venv/bin/python manage.py collectstatic --noinput)

echo "==> Frontend: build"
npm install --no-audit --no-fund
npm run build

echo "==> Permissions"
chown -R root:www-data backend/.env && chmod 640 backend/.env
chmod -R o+rX dist backend/staticfiles

echo "==> Restart services"
systemctl restart koel-gunicorn
nginx -t && systemctl reload nginx

echo "Done."
