// Paste the config from Firebase console → Project settings → Your apps → Web app.
// These values are public by design. The site has no sign-in, so anyone with the link can use it.
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// The one shared workspace every device reads and writes. Random so the database can't be guessed into.
export const workspaceId = 'sg-rTtK9Bzvktn-vtKHZuqb-YG0';
