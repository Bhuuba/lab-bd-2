import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query
} from "firebase/firestore";
import { db } from "./firebase"; // передбачається, що ініціалізація Firebase описана окремо

type ActivityLog = {
  actionType: "view" | "search" | "favorite";
  tourId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
};

export async function addActivityLog(userId: string, log: ActivityLog) {
  await addDoc(collection(db, `users/${userId}/activityLogs`), {
    ...log,
    createdAt: log.createdAt ?? new Date()
  });
}

export async function getLastActivityLogs(userId: string, size = 50) {
  const q = query(
    collection(db, `users/${userId}/activityLogs`),
    orderBy("createdAt", "desc"),
    limit(size)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

type Message = {
  sender: "user" | "manager";
  body: string;
  sentAt?: Date;
};

export async function addChatMessage(chatId: string, message: Message) {
  await addDoc(collection(db, `chats/${chatId}/messages`), {
    ...message,
    sentAt: message.sentAt ?? new Date()
  });
}

export async function getLastChatMessages(chatId: string, size = 50) {
  const q = query(
    collection(db, `chats/${chatId}/messages`),
    orderBy("sentAt", "desc"),
    limit(size)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
