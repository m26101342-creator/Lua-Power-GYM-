import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { GymClass } from '../types';

const COLLECTION_NAME = 'classes';

export const getClasses = async (): Promise<GymClass[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GymClass));
  } catch (error) {
    console.error("Error getting classes:", error);
    return [];
  }
};

export const saveClass = async (gymClass: GymClass): Promise<void> => {
  try {
    const classRef = doc(db, COLLECTION_NAME, gymClass.id);
    await setDoc(classRef, gymClass);
  } catch (error) {
    console.error("Error saving class:", error);
    throw error;
  }
};

export const deleteClass = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting class:", error);
    throw error;
  }
};

export const getClassById = async (id: string): Promise<GymClass | undefined> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as GymClass;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting class by id:", error);
    return undefined;
  }
};
