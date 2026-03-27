import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { SupportMessage, SupportMessageStatus, SupportMessageType } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

const COLLECTION_NAME = 'support_messages';

export const saveSupportMessage = async (message: SupportMessage): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, message.id);
    await setDoc(docRef, message);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
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
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
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
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const updateMessageStatus = async (id: string, status: SupportMessageStatus): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
  }
};

export const deleteMessage = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
  }
};
