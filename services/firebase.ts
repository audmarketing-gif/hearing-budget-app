import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyA9O1ZrWuqt7zwidgRsZnzJyuQlvQ5I2bg",
  authDomain: "hearing-bugdet-app.firebaseapp.com",
  projectId: "hearing-bugdet-app",
  storageBucket: "hearing-bugdet-app.firebasestorage.app",
  messagingSenderId: "176802415868",
  appId: "1:176802415868:web:f185c30aa701797b528379"
};

// Initialize Firebase
let app;
let db: any;
let auth: any;
let isConfigured = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { db, auth, isConfigured };
export { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  writeBatch
};