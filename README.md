## MongoDB setup

To use MongoDB for events storage and personalization, set the following environment variables in your development environment (e.g. `.env.local`):

MONGODB_URI=mongodb+srv://<user>:<pw>@cluster0.mongodb.net
MONGODB_DB_NAME=pickfit

After setting these, you can run the migration script to import existing `.data/events.json`:

pnpm ts-node scripts/migrate-events-to-mongo.ts

Notes:

- If `MONGODB_URI` is not set, the app will fallback to writing events to `.data/events.json`.
