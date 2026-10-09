# Sawgrass Story Builder

Builds on-brand 9:16 Instagram Stories for Sawgrass: Tradeshow, PR Hit, Holiday Closure and In Your Words. Everything renders in the browser and exports as 1080 × 1920 PNGs.

## Files

| File | What it does |
|---|---|
| `index.html` | Page layout and styles |
| `app.js` | Builders, rendering and export |
| `assets.js` | Brand assets (logos, VersiFlex gradient, ink splash, quote marks) embedded as data |
| `sync.js` | Cloud sync through Firebase Firestore (no sign-in) |
| `firebase-config.js` | Your Firebase project keys and the shared workspace ID |
| `firestore.rules` | Security rules: open read and save, no listing or deleting workspaces, size caps |

Without Firebase set up, the builder still works and saves settings in that browser only.

## 1. Set up Firebase (about 5 minutes)

1. Go to console.firebase.google.com and create a project (Google Analytics can stay off).
2. **Build → Firestore Database → Create database.** Pick a US location and start in production mode.
3. In Firestore, open the **Rules** tab, replace everything with the contents of `firestore.rules` and click **Publish**.
4. **Project settings (gear) → General → Your apps → Web (`</>`)**. Register an app (no Hosting needed) and copy the `firebaseConfig` values into `firebase-config.js`. Leave `workspaceId` as it is.

## 2. Deploy to GitHub Pages

1. Upload `index.html`, `app.js`, `assets.js`, `sync.js` and `firebase-config.js` to the repository root.
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / root → Save.**
3. The site goes live at `https://bbuhle.github.io/story_builder/` within a minute or two.

## How sync works

- There is no sign-in. Every device that opens the site reads and saves the same shared workspace.
- Settings, copy, slider positions and uploaded images (show logos, publication logos, splash, holiday photo) save to Firestore about a second after you stop editing. The home page shows when the last save happened.
- Images are stored as separate documents and compressed to stay under Firestore's 1 MB document limit.
- When a device opens the site and the cloud has newer settings, the page loads them and reloads once.
- Anyone who finds the site can change the shared settings. The rules stop them listing or deleting workspaces and cap the size of what they can save, and Firebase's free plan has hard limits, so there is no bill risk.
- Benton Sans font files are not synced. Load them per session, since the license may not allow storing them in the cloud.

## Updating

Edit the files and push to `main`. GitHub Pages redeploys automatically.
