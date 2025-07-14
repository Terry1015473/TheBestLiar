// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0F9iaOkajioU6FkvR2eRET7lVwXr9Fyc",
  authDomain: "thebestliar.firebaseapp.com",
  projectId: "thebestliar",
  storageBucket: "thebestliar.firebasestorage.app",
  messagingSenderId: "1064613075443",
  appId: "1:1064613075443:web:c62bc00ab31a4b38045a86"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
