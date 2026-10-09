// Firebase sync for the Sawgrass Story Builder (no sign-in).
// Every device reads and writes one shared workspace, so settings and uploads follow you anywhere.
import { firebaseConfig, workspaceId } from './firebase-config.js';

const label = document.getElementById('syncLabel');
const setLabel = (t) => { if (label) label.textContent = t; };

const configured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');
if (!configured) {
  setLabel('Cloud sync is off: add your Firebase config');
} else {
  const V = '10.12.2';
  const [{ initializeApp }, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const db = fs.getFirestore(initializeApp(firebaseConfig));
  const wsRef = fs.doc(db, 'workspaces', workspaceId);
  const imgRef = (key) => fs.doc(db, 'workspaces', workspaceId, 'images', key);

  // Images are stored as their own documents (Firestore caps a document near 1 MB).
  const IMAGE_PATHS = { tsLogo: ['logo'], splash: ['splash'], prLogo: ['pr', 'logo'], holImg: ['hol', 'img'] };
  const getPath = (o, p) => p.reduce((x, k) => (x == null ? x : x[k]), o);
  const setPath = (o, p, v) => { let x = o; for (const k of p.slice(0, -1)) { x[k] = x[k] || {}; x = x[k]; } x[p[p.length - 1]] = v; };
  const sig = (s) => (s ? `${s.length}:${s.slice(64, 128)}:${s.slice(-64)}` : '');
  const sent = {};

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

  let ready = false, timer = null, pending = null;
  const stamp = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  async function push(state) {
    const copy = structuredClone(state);
    for (const [key, path] of Object.entries(IMAGE_PATHS)) {
      const val = getPath(copy, path);
      setPath(copy, path, val ? { $img: key } : null);
      if (sig(val) !== sent[key]) {
        if (val) { const small = await shrink(val); if (small) await fs.setDoc(imgRef(key), { data: small, updatedAt: Date.now() }); }
        else await fs.deleteDoc(imgRef(key)).catch(() => {});
        sent[key] = sig(val);
      }
    }
    const updatedAt = Date.now();
    await fs.setDoc(wsRef, { state: JSON.stringify(copy), updatedAt });
    localStorage.setItem('sg-updated', String(updatedAt));
    setLabel(`Saved to the cloud at ${stamp()}`);
  }

  async function pull() {
    const snap = await fs.getDoc(wsRef);
    if (!snap.exists()) return null;
    const { state, updatedAt } = snap.data();
    const s = JSON.parse(state);
    for (const [key, path] of Object.entries(IMAGE_PATHS)) {
      if (getPath(s, path)?.$img) {
        const im = await fs.getDoc(imgRef(key));
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
    if (!ready) return;
    clearTimeout(timer);
    setLabel('Saving…');
    timer = setTimeout(() => push(pending).catch((err) => { console.error(err); setLabel('Cloud save failed. Changes are kept on this device.'); }), 1500);
  });

  setLabel('Checking the cloud for saved settings…');
  try {
    const remote = await pull();
    const localAt = Number(localStorage.getItem('sg-updated') || 0);
    if (remote && remote.updatedAt > localAt) {
      // Newer settings in the cloud: load them and restart the page once.
      localStorage.setItem(window.SG_KEY, JSON.stringify(remote.state));
      localStorage.setItem('sg-updated', String(remote.updatedAt));
      location.reload();
    } else {
      ready = true;
      if (!remote || localAt > remote.updatedAt) await push(window.SG_STATE());
      else setLabel('Up to date with the cloud');
    }
  } catch (err) {
    console.error(err);
    ready = true;
    setLabel('Could not reach Firebase. Changes are kept on this device.');
  }
}
