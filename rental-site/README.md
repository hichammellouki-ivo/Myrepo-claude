# Locations courte durée

Application web (Next.js + Prisma/SQLite) pour gérer des appartements en
location courte durée : annonces, disponibilités, synchronisation de
calendrier avec Airbnb/Booking.com, et check-in en ligne avec validation
admin.

## Fonctionnalités

1. **Annonces** — création et affichage simple des annonces (photos, prix,
   description, équipements) depuis l'espace admin.
2. **Disponibilités & tarifs** — calendrier de disponibilité par annonce,
   synchronisé avec Airbnb et Booking.com via import/export iCal (`.ics`).
3. **Check-in en ligne** — le voyageur transmet une pièce d'identité ; une
   notification est envoyée à l'admin ; après validation, un code d'accès et
   les instructions d'accès sont envoyés automatiquement au voyageur par
   e-mail.
4. **Deux espaces dédiés** — un onglet « Check-in » et un onglet
   « Annonces & réservation », accessibles depuis la page d'accueil.
5. **Filtres de recherche** — ville, dates, nombre de voyageurs, budget,
   nombre de chambres, équipements.

## Démarrage

```bash
npm install
cp .env.example .env   # puis ajustez les valeurs si besoin
npx prisma migrate deploy
npm run db:seed        # crée le compte admin + 4 annonces de démonstration
npm run dev
```

Le site est disponible sur http://localhost:3000. Le compte admin créé par
le seed utilise les identifiants définis dans `.env` (`ADMIN_EMAIL` /
`ADMIN_PASSWORD`), accessible sur `/admin/login`.

## Variables d'environnement

Voir `.env.example`. À configurer avant la mise en production :

- `SESSION_SECRET` — secret de signature des cookies de session admin.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — compte admin créé par le seed.
- `PUBLIC_BASE_URL` — URL publique du site (utilisée pour générer le lien
  d'export iCal donné à Airbnb/Booking.com).
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` —
  optionnel. Sans configuration SMTP, les e-mails (code d'accès, refus de
  check-in) sont simulés et journalisés (visibles dans les logs serveur),
  ce qui permet de tester le site sans fournisseur d'e-mail.

## Synchronisation des calendriers

Chaque annonce dispose, dans l'admin (`/admin/listings/[id]`), d'une section
« Synchronisation des calendriers » :

- **Import** : ajoutez le lien iCal (`.ics`) exporté par Airbnb ou
  Booking.com pour bloquer automatiquement les dates déjà réservées sur ces
  plateformes.
- **Export** : copiez le lien `/api/ical/[slug]` généré par le site dans les
  paramètres de synchronisation de calendrier d'Airbnb/Booking.com pour leur
  transmettre vos réservations internes.

La synchronisation peut être déclenchée manuellement (bouton « Synchroniser »)
ou automatisée via une tâche planifiée :

```bash
npm run db:sync-calendars
```

## Check-in

Le voyageur retrouve sa réservation avec sa référence (ex. `RES-7K9QF2`) et
son e-mail sur l'onglet « Check-in », puis transmet une pièce d'identité.
L'admin est notifié (`/admin` et `/admin/checkins`), valide ou refuse la
demande. En cas de validation, un code d'accès (généré automatiquement ou
saisi manuellement) et les instructions d'accès du logement sont envoyés au
voyageur par e-mail et restent consultables sur la page de check-in.

## Stack technique

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **Prisma 7** + SQLite (adapter `@prisma/adapter-better-sqlite3`)
- **Tailwind CSS 4**
- `node-ical` pour l'import de calendriers externes
- `nodemailer` pour l'envoi d'e-mails (optionnel, avec repli simulé)

## Notes de sécurité

- Les pièces d'identité sont stockées hors de `/public` (dossier `uploads/`
  à la racine, exclu de Git) et ne sont accessibles que via une route API
  protégée par l'authentification admin.
- Les photos d'annonces (non sensibles) sont stockées dans
  `public/uploads/`.
- Les mots de passe admin sont hashés avec bcrypt ; les sessions admin sont
  des cookies signés (HMAC) avec expiration.
