import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ClassRequest, ClassRequestStatus } from '../types';

const COLLECTION_NAME = 'class_requests';

export const createClassRequest = async (request: ClassRequest): Promise<void> => {
  await setDoc(doc(db, COLLECTION_NAME, request.id), request);
};

export const getClassRequests = async (): Promise<ClassRequest[]> => {
  const q = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ClassRequest);
};

export const getPendingRequests = async (): Promise<ClassRequest[]> => {
  const q = query(collection(db, COLLECTION_NAME), where('status', '==', ClassRequestStatus.PENDING));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ClassRequest);
};

export const getRequestsByUser = async (userId: string): Promise<ClassRequest[]> => {
  const q = query(collection(db, COLLECTION_NAME), where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ClassRequest);
};

export const updateRequestStatus = async (id: string, status: ClassRequestStatus, resolvedBy?: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    status,
    resolved_at: new Date().toISOString(),
    resolved_by: resolvedBy
  });
};

export const deleteRequest = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, id));
};
