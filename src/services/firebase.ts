import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

function hasVisitedToday(): boolean {
  const lastVisit = localStorage.getItem("silksaver-last-visit");
  if (!lastVisit) return false;

  const lastVisitTime = new Date(lastVisit).getTime();
  const now = new Date().getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return (now - lastVisitTime) < oneDayMs;
}

function markVisitToday(): void {
  localStorage.setItem("silksaver-last-visit", new Date().toISOString());
}

export async function incrementVisits() {
  try {
    if (!hasVisitedToday()) {
      const docRef = doc(db, "analytics", "silksaver-info-analytics");
      await updateDoc(docRef, {
        visits: increment(1)
      });
      markVisitToday();
    }
  } catch (e) {
    console.error("Failed to increment visits", e);
  }
}

export async function incrementEdits() {
  try {
    const docRef = doc(db, "analytics", "silksaver-info-analytics");
    await updateDoc(docRef, {
      edits: increment(1)
    });
  } catch (e) {
    console.error("Failed to increment edits", e);
  }
}

export async function getStats() {
  try {
    const docRef = doc(db, "analytics", "silksaver-info-analytics");
    const snapshot = await getDoc(docRef);
    return snapshot.data();
  } catch (e) {
    console.error("Failed to get stats", e);
    return null;
  }
}