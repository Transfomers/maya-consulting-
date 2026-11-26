import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyB_7q5GxMPuYu31KqHpuKYHUla6D19yhAo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "3mservices-prod.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "3mservices-prod",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "3mservices-prod.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1079451092562",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1079451092562:web:e1ba8824bba49426cd018b",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-N9SHP4Q87Z"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export default app;
