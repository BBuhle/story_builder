# Sawgrass Story Builder

Builds on-brand 9:16 Instagram Stories for Sawgrass: Tradeshow, PR Hit, Holiday Closure and In Your Words. Everything renders in the browser and exports as 1080 × 1920 PNGs.

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout and styles |
| `app.js` | Builders, rendering and export |
| `assets.js` | Brand assets (logos, VersiFlex gradient, ink splash, quote marks) embedded as data |
| `sync.js` | Google sign-in and Firebase sync |
| `firebase-config.js` | Your Firebase project keys and the allowed sign-in list |
| `firestore.rules` | Security rules: each account can only read and write its own data |

Without Firebase set up, the builder still works and saves settings in that browser only.

## 1. Set up Firebase (about 10 minutes)

1. Go to console.firebase.google.com and create a project (Google Analytics can stay off).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database.** Pick a US location and start in production mode.
4. In Firestore, open the **Rules** tab, replace everything with the contents of `firestore.rules` and click **Publish**.
5. **Project settings (gear) → General → Your apps → Web (`</>`)**. Register an app (no Hosting needed) and copy the `firebaseConfig` values into `firebase-config.js`.
6. Optional: add your Google email to `allowedEmails` in `firebase-config.js` so only you can sign in.

## 2. Deploy to GitHub Pages

1. Create a repository and upload these files to the root (keep `.nojekyll`).
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root → Save.**
3. The site goes live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.
4. Back in Firebase: **Authentication → Settings → Authorized domains → Add domain** and enter `<your-username>.github.io`. Sign-in will not work until this is added.

## How sync works

- Sign in with Google from the home page. Settings, copy, slider positions and uploaded images (show logos, publication logos, splash, holiday photo) sync to Firestore.
- Images are stored as separate documents and compressed to stay under Firestore's 1 MB document limit.
- When you open the site on another device and sign in, the newer settings win and the page reloads once with them.
- Benton Sans font files are not synced. Load them per session, since the license may not allow storing them in the cloud.

## Updating

Edit the files and push to `main`. GitHub Pages redeploys automatically.
