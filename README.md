# KOEL Control Engineering Dashboard & Management Portal (Ind. Marine)

React + TypeScript frontend (Vite, Tailwind) with a **Django REST + PostgreSQL** backend.

```
.
├── start.py            # one command that sets up and runs backend + frontend
├── src/                # React app (src/api/client.ts talks to the backend)
├── vite.config.ts      # proxies /api -> Django, so the browser uses one origin
└── backend/
    ├── .env            # database credentials & settings (git-ignored)
    ├── .env.example    # template for .env
    ├── requirements.txt
    ├── config/         # Django settings / urls
    └── portal/         # models, serializers, views, seed data, tests
```

## Quick start

Prerequisites: **Python 3.10+**, **Node.js 20+**, a running **PostgreSQL** server.

1. Edit `backend/.env` and set your PostgreSQL credentials:

   ```
   DB_NAME=koel_marine
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

   (If `backend/.env` does not exist, the first `python start.py` creates it from
   `.env.example` with a fresh `DJANGO_SECRET_KEY` and then stops so you can fill it in.)

2. Run everything:

   ```
   python start.py
   ```

   On the first run this creates `backend/.venv`, installs the Python and npm
   dependencies, **creates the database if it does not exist**, applies migrations and
   loads the sample data. Later runs just start the servers. `Ctrl+C` stops both.

| What      | URL                                  |
|-----------|--------------------------------------|
| Portal    | http://localhost:3000                |
| API       | http://127.0.0.1:8001/api/           |
| DB admin  | http://127.0.0.1:8001/admin/         |

Ports are set by `BACKEND_PORT` / `FRONTEND_PORT` in `backend/.env`. `start.py` refuses
to start if one of them is already taken (it is easy to clash with another local Django app on 8000).

`python start.py --skip-setup` skips the dependency/database checks for a faster restart.

### Sample accounts (loaded into an empty database)

| User       | Password   | Role     |
|------------|------------|----------|
| `admin`    | `admin123` | admin    |
| `engineer` | `user123`  | engineer |
| `pdeshmukh`| `pooja123` | engineer |

**Change these (Admin Panel -> users) before using the portal for anything real**, or set
`SEED_SAMPLE_DATA=False` in `backend/.env` to start with an empty database and create the first
admin with `backend/.venv/Scripts/python backend/manage.py createsuperuser` (then set its `role` to `admin` in `/admin/`).

## How it works

- **Auth**: `POST /api/auth/login` returns a token (stored in the browser, sent as
  `Authorization: Token ...`). Passwords are hashed (PBKDF2) and never returned by the API.
  Unknown user and wrong password give the same error; login is rate limited.
- **Roles**: engineers can read everything and create/edit project data; only admins can delete
  records, manage users and change the form-field configuration.
- **Business rules enforced on the server**
  - *Rule 1*: logging an ECN/ECR against a `CLOSED` project re-opens it (`POST /api/ecns`).
  - *Rule 2*: a project can only be set to `CLOSED` when all sub-projects are "Released in PLM".
- **Data**: projects keep the 53-point design inputs and the sub-project tree (SOTR, tasks) as
  JSON documents; ECNs, site visits, alternators, authorities, trials, drawings, users and form
  fields are regular tables. JSON is camelCase on the wire, matching `src/types`.

### API

All under `/api/`, token required except login.

| Resource | Endpoint |
|----------|----------|
| Auth | `POST auth/login`, `POST auth/logout`, `GET auth/me` |
| Users | `users` (admin writes) |
| Projects | `projects` (delete: admin) |
| ECN / ECR | `ecns` (`POST` returns `{ecn, project, didReopen}`) |
| Site visits / Alternators / Authorities | `site-visits`, `alternators`, `authorities` |
| Trials / Drawings | `trials`, `drawings` |
| Form fields | `form-fields` (admin writes) |
| Reset demo data | `POST admin/reset-sample-data` (admin) |

## Development

```
backend/.venv/Scripts/python backend/manage.py test portal   # backend tests (needs the DB credentials in .env)
node node_modules/typescript/bin/tsc --noEmit                # frontend type check
```

> The `.bin` shims in `node_modules` break when the project folder path contains `&`
> (as this one does), so `start.py` launches Vite through `node` directly. If you rename the
> folder to something without `&`, `npm run dev` / `npx tsc` work normally.

Frontend only (against an already running backend): `npm run dev`.
