import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const logActivity = async (userProfile: any, action: string, details: string) => {
  if (!userProfile) return;
  try {
    await addDoc(collection(db, 'activity_logs'), {
      userName: userProfile.name || userProfile.displayName || 'Unknown Member',
      userEmail: userProfile.email || 'No Email',
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};