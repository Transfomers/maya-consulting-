import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCw5Ciiv-BuxorvxslQsP8pNktXlmadA4w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "mservices-d973f.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "mservices-d973f",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "mservices-d973f.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "661470797754",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:661470797754:web:9b3866768efc1fb530c783"
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
