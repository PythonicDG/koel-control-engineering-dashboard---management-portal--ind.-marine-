from django.core.management.base import BaseCommand

from portal import seed


class Command(BaseCommand):
    help = "Load the sample marine data into any empty tables (safe to run repeatedly)."

    def handle(self, *args, **options):
        created = seed.seed_all()
        if created:
            self.stdout.write(self.style.SUCCESS(f"Seeded: {', '.join(created)}"))
        else:
            self.stdout.write("Nothing to seed - tables already contain data.")
