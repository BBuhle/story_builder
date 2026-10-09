// Firebase sync for the Sawgrass Story Builder.
// Signs in with Google, then keeps the builder's settings and uploaded images in Firestore
// so every device you sign in on opens with the same setup.
import { firebaseConfig, allowedEmails } from './firebase-config.js';

const ui = {
  btn: document.getElementById('syncBtn'),
  label: document.getElementById('syncLabel'),
};
const setLabel = (t) => { if (ui.label) ui.label.textContent = t; };

const configured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');
if (!configured) {
  setLabel('Sync is off: add your Firebase config');
  if (ui.btn) ui.btn.hidden = true;
} else {
  const V = '10.12.2';
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const a = auth.getAuth(app);
  const db = fs.getFirestore(app);

  // Image fields are stored as their own documents (Firestore caps a document near 1 MB).
  const IMAGE_PATHS = {
    tsLogo: ['logo'],
    splash: ['splash'],
    prLogo: ['pr', 'logo'],
    holImg: ['hol', 'img'],
  };
  const getPath = (o, p) => p.reduce((x, k) => (x == null ? x : x[k]), o);
  const setPath = (o, p, v) => { let x = o; for (const k of p.slice(0, -1)) { x[k] = x[k] || {}; x = x[k]; } x[p[p.length - 1]] = v; };
  const sig = (s) => (s ? `${s.length}:${s.slice(64, 128)}:${s.slice(-64)}` : '');
  const sent = {}; // image key -> signature last written

  async function shrink(dataUrl, maxBytes = 900_000) {
    if (!dataUrl || dataUrl.length <= maxBytes) return dataUrl;
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = dataUrl; });
    if (!img) return null;
    let w = Math.min(img.width, 2400), q = 0.9, out = dataUrl;
    for (let i = 0; i < 12 && out.length > maxBytes; i++) {
      const c = document.createElement('canvas');
      c.width = w; c.height = Math.round(img.height * (w / img.width));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      out = c.toDataURL('image/webp', q);
      if (q > 0.6) q -= 0.1; else w = Math.round(w * 0.85);
    }
    return out.length <= maxBytes ? out : null;
  }

  let user = null, timer = null, pending = null;

  async function push(state) {
    if (!user) return;
    const copy = structuredClone(state);
    for (const [key, path] of Object.entries(IMAGE_PATHS)) {
      const val = getPath(copy, path);
      setPath(copy, path, val ? { $img: key } : null);
      if (sig(val) !== sent[key]) {
        const ref = fs.doc(db, 'users', user.uid, 'images', key);
        if (val) {
          const small = await shrink(val);
          if (small) await fs.setDoc(ref, { data: small, updatedAt: Date.now() });
        } else {
          await fs.deleteDoc(ref).catch(() => {});
        }
        sent[key] = sig(val);
      }
    }
    const updatedAt = Date.now();
    await fs.setDoc(fs.doc(db, 'users', user.uid), { state: JSON.stringify(copy), updatedAt });
    localStorage.setItem('sg-updated', String(updatedAt));
    setLabel(`Synced · ${user.email}`);
  }

  async function pull() {
    const snap = await fs.getDoc(fs.doc(db, 'users', user.uid));
    if (!snap.exists()) return null;
    const { state, updatedAt } = snap.data();
    const s = JSON.parse(state);
    for (const [key, path] of Object.entries(IMAGE_PATHS)) {
      if (getPath(s, path)?.$img) {
        const im = await fs.getDoc(fs.doc(db, 'users', user.uid, 'images', key));
        const data = im.exists() ? im.data().data : null;
        setPath(s, path, data);
        sent[key] = sig(data);
      }
    }
    return { state: s, updatedAt };
  }

  // The builder fires this after every local save.
  window.addEventListener('sg:save', (e) => {
    pending = e.detail;
    clearTimeout(timer);
    if (user) setLabel('Saving…');
    timer = setTimeout(() => push(pending).catch((err) => { console.error(err); setLabel('Sync failed. Changes are kept on this device.'); }), 1500);
  });

  ui.btn?.addEventListener('click', async () => {
    if (user) { await auth.signOut(a); return; }
    try { await auth.signInWithPopup(a, new auth.GoogleAuthProvider()); }
    catch (err) { console.error(err); setLabel('Sign-in did not finish. Try again.'); }
  });

  auth.onAuthStateChanged(a, async (u) => {
    user = u;
    if (!u) { if (ui.btn) ui.btn.textContent = 'Sign in to sync'; setLabel('Settings are saved on this device only'); return; }
    if (allowedEmails?.length && !allowedEmails.includes(u.email)) {
      setLabel(`${u.email} is not on the allowed list`); await auth.signOut(a); return;
    }
    if (ui.btn) ui.btn.textContent = 'Sign out';
    setLabel(`Checking for saved settings…`);
    try {
      const remote = await pull();
      const localAt = Number(localStorage.getItem('sg-updated') || 0);
      if (remote && remote.updatedAt > localAt) {
        // Newer settings in the cloud: load them and restart the page once.
        localStorage.setItem(window.SG_KEY, JSON.stringify(remote.state));
        localStorage.setItem('sg-updated', String(remote.updatedAt));
        location.reload();
        return;
      }
      // This device is newer (or first sign-in): send it up.
      await push(window.SG_STATE());
    } catch (err) {
      console.error(err);
      setLabel('Could not reach Firebase. Changes are kept on this device.');
    }
  });
}
