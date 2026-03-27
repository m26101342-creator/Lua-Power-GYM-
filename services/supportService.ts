import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { SupportMessage, SupportMessageStatus, SupportMessageType } from '../types';

const COLLECTION_NAME = 'support_messages';

export const saveSupportMessage = async (message: SupportMessage): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, message.id);
    await setDoc(docRef, message);
  } catch (error) {
    console.error("Error saving support message:", error);
    throw error;
  }
};

export const getMessagesByUser = async (userId: string): Promise<SupportMessage[]> => {
  try {
    const q = query(
        collection(db, COLLECTION_NAME), 
        where("user_id", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const messages: SupportMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push(doc.data() as SupportMessage);
    });
    return messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error("Error fetching user messages:", error);
    return [];
  }
};

export const getAllMessages = async (): Promise<SupportMessage[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    const querySnapshot = await getDocs(q);
    const messages: SupportMessage[] = [];
    querySnapshot.forEach((doc) => {
      messages.push(doc.data() as SupportMessage);
    });
    return messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error("Error fetching all messages:", error);
    return [];
  }
};

export const updateMessageStatus = async (id: string, status: SupportMessageStatus): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error updating message status:", error);
    throw error;
  }
};

export const deleteMessage = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting message:", error);
    throw error;
  }
};
