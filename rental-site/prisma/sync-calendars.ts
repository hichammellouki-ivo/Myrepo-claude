import "dotenv/config";
import { syncAllCalendarFeeds } from "../src/lib/ical";

// Script autonome pour synchroniser tous les calendriers externes (Airbnb / Booking.com).
// À lancer périodiquement via une tâche planifiée (cron), en plus du bouton "Synchroniser"
// disponible dans l'espace admin. Exemple de crontab (toutes les heures) :
//   0 * * * *  cd /chemin/vers/rental-site && npm run db:sync-calendars

syncAllCalendarFeeds()
  .then(() => {
    console.log("Synchronisation des calendriers terminée.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Échec de la synchronisation des calendriers :", error);
    process.exit(1);
  });
