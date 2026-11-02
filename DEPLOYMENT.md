# Deploying to the server (Ubuntu/Debian + Nginx + Gunicorn + PostgreSQL)

Target: **https://koel.sadguruinfinity.com** (a subdomain, so it never touches your main
site or the other projects in `/home`). Project path on the server:
`/home/koel-control-engineering-dashboard---management-portal--ind.-marine-`

Architecture: Nginx serves the React build (`dist/`) and forwards `/api/` and `/admin/` to
Gunicorn (Django) over a unix socket, with PostgreSQL behind it. The socket means no port
clashes with your other apps.

## 0. DNS
Create an **A record**: `koel` -> your server's IP (at your domain registrar). Wait until
`ping koel.sadguruinfinity.com` resolves.

## 1. Install prerequisites (skip what you already have)
```bash
apt update
apt install -y nginx postgresql python3-venv python3-pip certbot python3-certbot-nginx
node -v    # needs Node 20+; if missing/old: https://github.com/nodesource/distributions
```

## 2. PostgreSQL database
```bash
sudo -u postgres psql <<'SQL'
CREATE USER koel_user WITH PASSWORD 'a-strong-password';
CREATE DATABASE koel_marine OWNER koel_user ENCODING 'UTF8';
SQL
```

## 3. Backend environment file
```bash
cd /home/koel-control-engineering-dashboard---management-portal--ind.-marine-
cp deploy/env.production.example backend/.env
python3 -c "import secrets;print(secrets.token_urlsafe(60))"   # paste output as DJANGO_SECRET_KEY
nano backend/.env      # set SECRET_KEY, DB_PASSWORD (same as step 2)
```
Keep `DJANGO_DEBUG=False` and `SEED_SAMPLE_DATA=False`.

## 4. First deploy (installs deps, migrates, builds the frontend)
```bash
sudo bash deploy/deploy.sh
```
(It will fail at the very end on `systemctl restart koel-gunicorn` until step 5 is done -
just re-run it afterwards.)

## 5. Gunicorn service
```bash
cp deploy/koel-gunicorn.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now koel-gunicorn
systemctl status koel-gunicorn        # should be "active (running)"
```

## 6. Nginx
```bash
cp deploy/nginx-koel.conf /etc/nginx/sites-available/koel
ln -s /etc/nginx/sites-available/koel /etc/nginx/sites-enabled/koel
nginx -t && systemctl reload nginx
```

## 7. HTTPS
```bash
certbot --nginx -d koel.sadguruinfinity.com
```
Certbot adds the 443 block + redirect and auto-renews.

## 8. Create the first admin (production starts with no users)
```bash
cd backend && .venv/bin/python manage.py createsuperuser
```
Sign in at https://koel.sadguruinfinity.com with that username/password. It is a portal
**admin** automatically; add engineers from Settings / Admin Panel.

## Updating later
Upload/pull the new code, then: `sudo bash deploy/deploy.sh`

## Troubleshooting
| Symptom | Check |
|---|---|
| 502 Bad Gateway | `systemctl status koel-gunicorn`, `journalctl -u koel-gunicorn -n 50` |
| 403 on files | `www-data` must be able to read the project dir (`namei -l /home/<project>/dist/index.html`) |
| "Could not load data" in portal | `curl -i https://koel.sadguruinfinity.com/api/auth/me` should return 401 JSON |
| Admin CSS missing | `collectstatic` ran? (`backend/staticfiles/` exists) |
| DB errors | `.env` DB_* values, `systemctl status postgresql` |
| Nginx errors | `nginx -t`, `tail /var/log/nginx/error.log` |

Backups: `pg_dump -U koel_user koel_marine > koel_$(date +%F).sql` (cron it daily).
