# DEXTER — The Experience

A cinematic Dexter universe: all four series (Dexter, New Blood, Original Sin, Resurrection), every season and episode, characters, villains as case files, a 3D slide box of every kill, a 3D Kill Room with full Photo Mode, games, a map, a timeline, and a complete Admin Panel that controls everything.

**Stack:** Vite · React 18 · TypeScript · Firebase Auth + Firestore · three.js (react-three-fiber) · Framer Motion · Leaflet. Hosted on GitHub Pages.

## One-time setup

1. **Firestore rules** — Firebase Console → Firestore Database → Rules → paste [`firestore.rules`](firestore.rules) → Publish.
2. **Authorized domain** — Firebase Console → Authentication → Settings → Authorized domains → add `omergilboapc.github.io`.
3. **Sign-in methods** — Email/Password and Google enabled.
4. **GitHub Pages** — Repository → Settings → Pages → Source: **GitHub Actions**. Every push deploys automatically (`.github/workflows/deploy.yml`).
5. **Cloudflare R2** — enable public access on the bucket. For `.glb` models and fonts, add a CORS rule allowing `GET` from `https://omergilboapc.github.io`.

The admin account is `omergilboapc@gmail.com` (set in `src/firebase.ts` and `firestore.rules`).

## Editing content

- **Admin Panel** (`/#/admin`, visible only to the admin): every collection (series, seasons & episodes, characters, villains, victims, quotes, timeline, map, code, trivia, quiz, cases, achievements, easter eggs), site settings (logo, fonts, colors, hero, trailer, music, avatars, 3D models, navigation, home sections, feature toggles), a page builder, media library, texts, users, gallery moderation, and full change history with restore.
- **Inline editing** — press **Edit** in the top bar and click any outlined text on the site; ✎ buttons swap images and videos.
- **Drafts** — save a draft, preview it as admin, then publish.
- All built-in content lives in `src/data/`. Firestore documents override it by id, so the site works before anything is seeded.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run build
```

`http://localhost:5173/?devauth=1` simulates a signed-in admin locally (development builds only) so pages can be tested without Firebase.
