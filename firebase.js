// ============================================================
//  BADGE QUEST 2026 — Firebase initialisation
// ============================================================
import { initializeApp }             from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore }              from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey:            "AIzaSyAU375IKaI-DF71pEWqmPfx11BPPFMP7uU",
  authDomain:        "badge-quest.firebaseapp.com",
  projectId:         "badge-quest",
  storageBucket:     "badge-quest.firebasestorage.app",
  messagingSenderId: "451705792372",
  appId:             "1:451705792372:web:3dc93006be09e91bebee21"
};

export const app            = initializeApp(firebaseConfig);
export const auth           = getAuth(app);
export const db             = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
