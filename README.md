# Den Den Mushi SOS

Interactive Next.js prototype for a One Piece-inspired emergency coordination system.

## Run it

```powershell
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Routes

- `/` — scroll-led cinematic landing page
- `/request` — transmit an SOS
- `/dashboard` — priority queue and live chart
- `/team` — Chopper Medical Armada workflow

The demo keeps emergency state in local browser storage. For a production deployment, replace the state provider with Firebase Auth + Firestore listeners and validate all server-side transitions.
