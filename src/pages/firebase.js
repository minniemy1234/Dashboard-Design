import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC4IkPcvSlAj0gRXyTns-_vU7BvFVCR960",
  authDomain: "ku-scr-dashboard.firebaseapp.com",
  projectId: "ku-scr-dashboard",
  storageBucket: "ku-scr-dashboard.firebasestorage.app",
  messagingSenderId: "305498501129",
  appId: "1:305498501129:web:49d7c561f5005a1eb548d8",
  measurementId: "G-C6F73SVTQ4"
};

const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);
export const storage = getStorage(app);
