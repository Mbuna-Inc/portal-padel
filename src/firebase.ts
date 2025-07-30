import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import bcrypt from 'bcryptjs';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// System User Interface
export interface SystemUser {
  userId: string;
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Court {
  courtId: string;
  name: string;
  location: string;
  pricePerHour: number;
  status: 'available' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// Custom authentication for system users
export const authenticateSystemUser = async (email: string, password: string): Promise<SystemUser | null> => {
  try {
    const systemUsersRef = collection(db, 'system_users');
    const q = query(systemUsersRef, where('email', '==', email), where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found or inactive');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as SystemUser;
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = userData;
    return userWithoutPassword as SystemUser;
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
};

// Create a new system user (for admin use)
export const createSystemUser = async (userData: Omit<SystemUser, 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>): Promise<void> => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newUser: SystemUser = {
      ...userData,
      userId,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    const userRef = doc(db, 'system_users', userId);
    await setDoc(userRef, newUser);
  } catch (error) {
    console.error('Error creating system user:', error);
    throw error;
  }
};

// Save user profile to Firestore (legacy function - keeping for compatibility)
export const saveUserProfile = async (user: User, additionalData: { phone?: string; location?: string }) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    phone: additionalData.phone || '',
    location: additionalData.location || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Court management functions
export const createCourt = async (courtData: Omit<Court, 'courtId' | 'createdAt' | 'updatedAt'>) => {
  try {
    const courtId = `court_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCourt: Court = {
      ...courtData,
      courtId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const courtRef = doc(db, 'courts', courtId);
    await setDoc(courtRef, newCourt);
    return newCourt;
  } catch (error) {
    console.error('Error creating court:', error);
    throw error;
  }
};

export const getCourts = async (): Promise<Court[]> => {
  try {
    const courtsRef = collection(db, 'courts');
    const querySnapshot = await getDocs(courtsRef);
    return querySnapshot.docs.map(doc => doc.data() as Court);
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
};

export const updateCourt = async (courtId: string, updates: Partial<Omit<Court, 'courtId' | 'createdAt'>>) => {
  try {
    const courtRef = doc(db, 'courts', courtId);
    await updateDoc(courtRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating court:', error);
    throw error;
  }
};

export const deleteCourt = async (courtId: string) => {
  try {
    const courtRef = doc(db, 'courts', courtId);
    await deleteDoc(courtRef);
  } catch (error) {
    console.error('Error deleting court:', error);
    throw error;
  }
};