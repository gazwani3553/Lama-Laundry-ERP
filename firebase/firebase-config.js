// ===========================================
// Lama Laundry ERP
// Firebase Configuration
// ===========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAq5wWqbn60TsxgoYi_jrY4HZSHEzzDw1w",
  authDomain: "lamalaundry-73f2e.firebaseapp.com",
  projectId: "lamalaundry-73f2e",
  storageBucket: "lamalaundry-73f2e.firebasestorage.app",
  messagingSenderId: "731642870065",
  appId: "1:731642870065:web:6b4b9097e98735f2045810"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

export {
  app,
  db,
  auth,
  serverTimestamp
};