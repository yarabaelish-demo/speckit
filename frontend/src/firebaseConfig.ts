import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAS8SssaU0ajy1cTk0kJGcMogwrk4xyd0Y",
  authDomain: "yara-speckit.firebaseapp.com",
  projectId: "yara-speckit",
  storageBucket: "yara-speckit.firebasestorage.app",
  messagingSenderId: "1054565466870",
  appId: "1:1054565466870:web:18da97ea32422bbafa22d7",
  measurementId: "G-60NCCYT18Q",
  projectNumber: "1054565466870", 
  version: "2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
