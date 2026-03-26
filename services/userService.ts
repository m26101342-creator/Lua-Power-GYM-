import { collection, doc, getDocs, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { User, UserRole } from '../types';

const COLLECTION_NAME = 'users';

export const getUsers = async (): Promise<User[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
};

export const getStudents = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("role", "==", UserRole.STUDENT));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error("Error getting students:", error);
    return [];
  }
};

export const getUserByPhone = async (partialPhone: string): Promise<User | undefined> => {
  try {
    const users = await getStudents();
    const cleanInput = partialPhone.replace(/\D/g, '');
    return users.find(c => c.phone && c.phone.replace(/\D/g, '').includes(cleanInput));
  } catch (error) {
    console.error("Error getting user by phone:", error);
    return undefined;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTION_NAME, user.id);
    await setDoc(userRef, user);
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return undefined;
  } catch (error) {
    console.error("Error getting user by id:", error);
    return undefined;
  }
};
