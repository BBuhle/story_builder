// Paste the config from Firebase console → Project settings → Your apps → Web app.
// These values are safe to publish; access is controlled by firestore.rules.
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Google accounts allowed to sign in. Leave empty to allow any account
// (each account still only sees its own settings).
export const allowedEmails = [];
