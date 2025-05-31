// src/firebase.config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDLzb9tHMddo9b5sVwMWFfeeIMhxZ0k6fk",
  authDomain: "marsosv7.firebaseapp.com",
  projectId: "marsosv7",
  storageBucket: "marsosv7.firebasestorage.app",
  messagingSenderId: "981717697036",
  appId: "1:981717697036:web:cfcebc2a9cd398ffc52429",
  measurementId: "G-RZH7VK2P51",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize each Firebase service separately
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

// Export individual services as needed
export { app, auth, db, functions, storage };

// // DEV ONLY: expose for debugging
// window._auth = auth;
