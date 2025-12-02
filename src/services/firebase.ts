import { initializeApp } from "firebase/app";
import { getDatabase, ref, increment, get, update } from "firebase/database";


// who reads this is gay
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export async function incrementVisits() {
  try {
    await update(ref(db, "silksaver-info-analytics"), {
      visits: increment(1)
    });
  } catch (e) {
    console.error("Failed to increment visits", e);
  }
}

export async function incrementEdits() {
  try {
    await update(ref(db, "silksaver-info-analytics"), {
      edits: increment(1)
    });
  } catch (e) {
    console.error("Failed to increment edits", e);
  }
}

export async function getStats() {
  try {
    const snapshot = await get(ref(db, "silksaver-info-analytics"));
    return snapshot.val();
  } catch (e) {
    console.error("Failed to get stats", e);
    return null;
  }
}