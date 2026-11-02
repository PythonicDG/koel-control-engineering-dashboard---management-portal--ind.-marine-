import psycopg
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from psycopg import sql


class Command(BaseCommand):
    help = "Create the PostgreSQL database named in backend/.env if it does not exist yet."

    def handle(self, *args, **options):
        db = settings.DATABASES["default"]
        try:
            conn = psycopg.connect(
                dbname="postgres",
                user=db["USER"],
                password=db["PASSWORD"],
                host=db["HOST"],
                port=db["PORT"],
                autocommit=True,
                connect_timeout=5,
            )
        except psycopg.OperationalError as exc:
            raise CommandError(
                "Cannot connect to PostgreSQL with the credentials in backend/.env "
                f"(DB_HOST={db['HOST']} DB_PORT={db['PORT']} DB_USER={db['USER']}).\n"
                f"Check DB_USER / DB_PASSWORD and that the PostgreSQL service is running.\n{exc}"
            )
        with conn:
            exists = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db["NAME"],)).fetchone()
            if exists:
                self.stdout.write(f"Database '{db['NAME']}' already exists.")
                return
            conn.execute(sql.SQL("CREATE DATABASE {} ENCODING 'UTF8'").format(sql.Identifier(db["NAME"])))
            self.stdout.write(self.style.SUCCESS(f"Created database '{db['NAME']}'."))
