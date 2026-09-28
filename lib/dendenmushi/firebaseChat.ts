"use client";

import { ref, push, set, onValue, query, limitToLast, remove, type DataSnapshot } from "firebase/database";
import { realtimeDatabase } from "@/lib/firebase";
import { ChatMessage } from "./mushi";
import { Emergency, Severity } from "@/lib/types";

const CHAT_PATH = "denden_chat/messages";
const DISPATCHES_PATH = "dispatches";

/**
 * Subscribes to real-time 3D Den Den Mushi chat messages from Firebase Realtime Database.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeFirebaseChat(callback: (messages: ChatMessage[]) => void): () => void {
  try {
    const chatRef = ref(realtimeDatabase, CHAT_PATH);
    const chatQuery = query(chatRef, limitToLast(100));

    const unsubscribe = onValue(
      chatQuery,
      (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const data = snapshot.val();
        if (!data || typeof data !== "object") {
          callback([]);
          return;
        }

        const parsedMessages: ChatMessage[] = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          sender: val.sender || "user",
          text: val.text || "",
          timestamp: val.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          expression: val.expression,
          sosAlert: val.sosAlert,
          mushiName: val.mushiName,
          createdAt: typeof val.createdAt === "number" ? val.createdAt : Date.now()
        }));

        // Sort chronologically by createdAt timestamp
        parsedMessages.sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0));

        callback(parsedMessages);
      },
      (error) => {
        console.error("Firebase 3D Chat listener error:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("Failed to initialize Firebase 3D Chat listener:", err);
    return () => {};
  }
}

/**
 * Pushes a new message (user, Den Den Mushi, operator, or system) to Firebase Realtime Database.
 */
export async function sendFirebaseChatMessage(message: Omit<ChatMessage, "id">): Promise<string> {
  try {
    const chatRef = ref(realtimeDatabase, CHAT_PATH);
    const newMsgRef = push(chatRef);
    const id = newMsgRef.key || `MSG-${Date.now()}`;

    const payload = {
      ...message,
      createdAt: (message as any).createdAt || Date.now(),
      id
    };

    await set(newMsgRef, payload);
    return id;
  } catch (error) {
    console.error("Error sending message to Firebase 3D Chat:", error);
    throw error;
  }
}

/**
 * Clears the 3D Den Den Mushi chat history in Firebase.
 */
export async function clearFirebaseChat(): Promise<void> {
  try {
    const chatRef = ref(realtimeDatabase, CHAT_PATH);
    await remove(chatRef);
  } catch (error) {
    console.error("Error clearing Firebase 3D Chat history:", error);
    throw error;
  }
}

/**
 * Pushes a distress call initiated from the 3D Transponder Snail directly into Firebase `dispatches`.
 * This makes it immediately visible on the Dashboard, Map, and HQ Radar.
 */
export async function createFirebaseDistressCall(input: {
  id?: string;
  type: string;
  island: string;
  sector: string;
  severity: Severity;
  description: string;
  callerName: string;
  denDenFrequency?: string;
}): Promise<Emergency> {
  try {
    const dispatchesRef = ref(realtimeDatabase, DISPATCHES_PATH);
    const newRef = push(dispatchesRef);
    const firebaseKey = newRef.key || undefined;
    const now = Date.now();
    const id = input.id || `SOS-${Math.floor(1000 + Math.random() * 9000)}`;

    const emergency: Emergency = {
      id,
      firebaseKey,
      type: input.type,
      island: input.island,
      sector: input.sector,
      severity: input.severity,
      description: input.description,
      status: "queued",
      createdAt: now,
      callerName: input.callerName,
      denDenFrequency: input.denDenFrequency || "108.4 MHz"
    };

    await set(newRef, emergency);
    return emergency;
  } catch (error) {
    console.error("Failed to create distress call in Firebase:", error);
    throw error;
  }
}

/**
 * Subscribes in real-time to active emergencies in Firebase `dispatches` for the HQ Radar view.
 */
export function subscribeFirebaseDispatches(callback: (dispatches: Emergency[]) => void): () => void {
  try {
    const dispatchesRef = ref(realtimeDatabase, DISPATCHES_PATH);
    const unsubscribe = onValue(
      dispatchesRef,
      (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const data = snapshot.val();
        if (!data || typeof data !== "object") {
          callback([]);
          return;
        }

        const parsed: Emergency[] = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: val.id || `SOS-${key.slice(-4).toUpperCase()}`,
          firebaseKey: key,
          type: val.type || "General Emergency",
          island: val.island || "Unknown Island",
          sector: val.sector || "Uncharted Sector",
          severity: (val.severity || "medium") as Severity,
          description: val.description || "",
          status: val.status || "queued",
          createdAt: typeof val.createdAt === "number" ? val.createdAt : Date.now(),
          callerName: val.callerName,
          denDenFrequency: val.denDenFrequency || "108.4 MHz",
          team: val.team
        }));

        parsed.sort((a, b) => b.createdAt - a.createdAt);
        callback(parsed);
      },
      (error) => {
        console.error("Firebase Dispatches listener error in 3D terminal:", error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("Failed to subscribe to Firebase dispatches:", err);
    return () => {};
  }
}
