import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ClassRequest, ClassRequestStatus } from '../types';
import { handleFirestoreError, OperationType } from '../utils/firebaseError';

const COLLECTION_NAME = 'class_requests';

export const createClassRequest = async (request: ClassRequest): Promise<void> => {
  try {
    await setDoc(doc(db, COLLECTION_NAME, request.id), request);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

export const getClassRequests = async (): Promise<ClassRequest[]> => {
  try {
    const q = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClassRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const getPendingRequests = async (): Promise<ClassRequest[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('status', '==', ClassRequestStatus.PENDING));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClassRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const getRequestsByUser = async (userId: string): Promise<ClassRequest[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ClassRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    return [];
  }
};

export const updateRequestStatus = async (id: string, status: ClassRequestStatus, resolvedBy?: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      status,
      resolved_at: new Date().toISOString(),
    };
    if (resolvedBy) {
      updateData.resolved_by = resolvedBy;
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, COLLECTION_NAME);
  }
};

export const deleteRequest = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, COLLECTION_NAME);
  }
};
