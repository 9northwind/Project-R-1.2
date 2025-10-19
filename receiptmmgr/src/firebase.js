import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBkXmgJNuBTDhS-rvWfyJcj6IKDbFyXwIA",
  authDomain: "gwallet-180a9.firebaseapp.com",
  projectId: "gwallet-180a9",
  storageBucket: "gwallet-180a9.firebasestorage.app",
  messagingSenderId: "619645557243",
  appId: "1:619645557243:web:3c514ca685a0a62de1135e",
  measurementId: "G-EM0Z20M5MZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, serverTimestamp, collection, addDoc };