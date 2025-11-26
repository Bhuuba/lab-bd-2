import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoFGrewbgL8rV-fNmoMiYF0mgtufqBf7g",
  authDomain: "bd-2-lab.firebaseapp.com",
  projectId: "bd-2-lab",
  storageBucket: "bd-2-lab.firebasestorage.app",
  messagingSenderId: "87795164754",
  appId: "1:87795164754:web:d7838ba9bd9b6f06d8218b",
  measurementId: "G-9C1S9BD94E"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const analyticsPromise = isSupported()
  .then(supported => (supported ? getAnalytics(app) : null))
  .catch(() => null);
