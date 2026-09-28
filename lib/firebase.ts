"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase } from "firebase/database";

/** Browser-only Firebase client. Only Realtime Database is initialized here. */
const firebaseConfig = {
  apiKey: "AIzaSyD863d5mqn8VrODUP0Nn7KWswrc50PxCA4",
  authDomain: "yonkooo-777.firebaseapp.com",
  projectId: "yonkooo-777",
  storageBucket: "yonkooo-777.firebasestorage.app",
  messagingSenderId: "146437885318",
  appId: "1:146437885318:web:81d6cfe1654220df137007",
  measurementId: "G-3536XY0RGE",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    "https://yonkooo-777-default-rtdb.firebaseio.com",
};

const firebaseApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const realtimeDatabase = getDatabase(firebaseApp);
