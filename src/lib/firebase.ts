import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MonthData, DebtItem, ExtraMaintenance, DataEntryUser, Apartment } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Enable offline persistence if possible
try {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn('Firebase persistence warning:', err.code);
  });
} catch (e) {
  // Persistence already enabled or not supported in frame
}

// Connection State Tracking
let isConnected = true;
const connectionSubscribers = new Set<(connected: boolean) => void>();

export function subscribeFirebaseConnection(callback: (connected: boolean) => void) {
  connectionSubscribers.add(callback);
  callback(isConnected);
  return () => {
    connectionSubscribers.delete(callback);
  };
}

function setConnectionState(state: boolean) {
  if (isConnected !== state) {
    isConnected = state;
    connectionSubscribers.forEach((cb) => cb(isConnected));
  }
}

// Real-time listener for Firebase connection status via .info/connected or Firestore pings
export async function testFirebaseConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const testDocRef = doc(db, 'system', 'connection_test');
    
    // Timeout promise (6 seconds) to prevent infinite hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة الاتصال - يرجى فحص الشبكة')), 6000);
    });

    await Promise.race([
      setDoc(testDocRef, { lastPing: new Date().toISOString() }, { merge: true }),
      timeoutPromise,
    ]);

    const latencyMs = Date.now() - start;
    setConnectionState(true);
    return { connected: true, latencyMs };
  } catch (err: any) {
    // Fallback: Try reading master residents doc
    try {
      const ref = doc(db, 'appData', 'masterResidents');
      await getDoc(ref);
      const latencyMs = Date.now() - start;
      setConnectionState(true);
      return { connected: true, latencyMs };
    } catch (fallbackErr: any) {
      setConnectionState(false);
      return { connected: false, latencyMs: 0, error: err?.message || 'تعذر الاتصال بـ Firebase' };
    }
  }
}

// --- REAL-TIME FIRESTORE SYNC LISTENERS & SAVERS ---

// 1. Month Data Real-Time Listener
export function listenToMonthData(monthKey: string, onUpdate: (data: MonthData | null) => void) {
  const monthDocRef = doc(db, 'months', monthKey);
  return onSnapshot(
    monthDocRef,
    (snapshot) => {
      setConnectionState(true);
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as MonthData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Month data sync listener error:', error);
      setConnectionState(false);
    }
  );
}

export async function saveMonthDataFirebase(data: MonthData) {
  try {
    const monthDocRef = doc(db, 'months', data.key);
    await setDoc(monthDocRef, data, { merge: true });
    setConnectionState(true);
  } catch (err) {
    console.warn('Error saving month data to Firebase:', err);
    setConnectionState(false);
  }
}

// 2. Master Residents Real-Time Listener
export function listenToMasterResidents(onUpdate: (apts: Apartment[] | null) => void) {
  const ref = doc(db, 'appData', 'masterResidents');
  return onSnapshot(
    ref,
    (snapshot) => {
      setConnectionState(true);
      if (snapshot.exists() && snapshot.data()?.apartments) {
        onUpdate(snapshot.data().apartments as Apartment[]);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Master residents sync error:', error);
      setConnectionState(false);
    }
  );
}

export async function saveMasterResidentsFirebase(apts: Apartment[]) {
  try {
    const ref = doc(db, 'appData', 'masterResidents');
    await setDoc(ref, { apartments: apts, updatedAt: new Date().toISOString() }, { merge: true });
    setConnectionState(true);
  } catch (err) {
    console.warn('Error saving master residents to Firebase:', err);
    setConnectionState(false);
  }
}

// 3. Debts Real-Time Listener
export function listenToDebts(onUpdate: (debts: DebtItem[] | null) => void) {
  const ref = doc(db, 'appData', 'debts');
  return onSnapshot(
    ref,
    (snapshot) => {
      setConnectionState(true);
      if (snapshot.exists() && Array.isArray(snapshot.data()?.items)) {
        onUpdate(snapshot.data().items as DebtItem[]);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Debts sync error:', error);
      setConnectionState(false);
    }
  );
}

export async function saveDebtsFirebase(debts: DebtItem[]) {
  try {
    const ref = doc(db, 'appData', 'debts');
    await setDoc(ref, { items: debts, updatedAt: new Date().toISOString() }, { merge: true });
    setConnectionState(true);
  } catch (err) {
    console.warn('Error saving debts to Firebase:', err);
    setConnectionState(false);
  }
}

// 4. Extra Maintenance Real-Time Listener
export function listenToExtraMaintenance(onUpdate: (items: ExtraMaintenance[] | null) => void) {
  const ref = doc(db, 'appData', 'extraMaintenance');
  return onSnapshot(
    ref,
    (snapshot) => {
      setConnectionState(true);
      if (snapshot.exists() && Array.isArray(snapshot.data()?.items)) {
        onUpdate(snapshot.data().items as ExtraMaintenance[]);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Extra maintenance sync error:', error);
      setConnectionState(false);
    }
  );
}

export async function saveExtraMaintenanceFirebase(items: ExtraMaintenance[]) {
  try {
    const ref = doc(db, 'appData', 'extraMaintenance');
    await setDoc(ref, { items, updatedAt: new Date().toISOString() }, { merge: true });
    setConnectionState(true);
  } catch (err) {
    console.warn('Error saving extra maintenance to Firebase:', err);
    setConnectionState(false);
  }
}

// 5. Users Real-Time Listener
export function listenToUsers(onUpdate: (users: DataEntryUser[] | null) => void) {
  const ref = doc(db, 'appData', 'users');
  return onSnapshot(
    ref,
    (snapshot) => {
      setConnectionState(true);
      if (snapshot.exists() && Array.isArray(snapshot.data()?.items)) {
        onUpdate(snapshot.data().items as DataEntryUser[]);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Users sync error:', error);
      setConnectionState(false);
    }
  );
}

export async function saveUsersFirebase(users: DataEntryUser[]) {
  try {
    const ref = doc(db, 'appData', 'users');
    await setDoc(ref, { items: users, updatedAt: new Date().toISOString() }, { merge: true });
    setConnectionState(true);
  } catch (err) {
    console.warn('Error saving users to Firebase:', err);
    setConnectionState(false);
  }
}

// Bulk Sync: Upload all local data (months, residents, debts, extra, users) to Firebase
export async function uploadAllLocalDataToFirebase(): Promise<{ count: number; success: boolean }> {
  let uploadedMonthsCount = 0;
  try {
    // 1. Upload Master Residents
    const rawResidents = localStorage.getItem('bmu10_master_residents');
    if (rawResidents) {
      try {
        const apts = JSON.parse(rawResidents);
        if (Array.isArray(apts) && apts.length > 0) {
          await saveMasterResidentsFirebase(apts);
        }
      } catch (e) {}
    }

    // 2. Upload Debts
    const rawDebts = localStorage.getItem('bmu10_debts');
    if (rawDebts) {
      try {
        const debts = JSON.parse(rawDebts);
        if (Array.isArray(debts)) {
          await saveDebtsFirebase(debts);
        }
      } catch (e) {}
    }

    // 3. Upload Extra Maintenance
    const rawExtra = localStorage.getItem('bmu10_extra_maint');
    if (rawExtra) {
      try {
        const extra = JSON.parse(rawExtra);
        if (Array.isArray(extra)) {
          await saveExtraMaintenanceFirebase(extra);
        }
      } catch (e) {}
    }

    // 4. Upload Users
    const rawUsers = localStorage.getItem('bmu10_users');
    if (rawUsers) {
      try {
        const users = JSON.parse(rawUsers);
        if (Array.isArray(users)) {
          await saveUsersFirebase(users);
        }
      } catch (e) {}
    }

    // 5. Upload All Month Data from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('bmu10_months_data_') || key.startsWith('bmu10_backup_bmu10_months_data_'))) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data: MonthData = JSON.parse(raw);
            if (data && data.key) {
              const hasContent =
                (data.expenses && data.expenses.length > 0) ||
                (data.apartments && data.apartments.some((a) => a.paid || a.paidExtraMaint)) ||
                data.manualPrevBalanceEdited ||
                (data.collectedAmount && data.collectedAmount > 0);

              if (hasContent) {
                await saveMonthDataFirebase(data);
                uploadedMonthsCount++;
              }
            }
          } catch (e) {}
        }
      }
    }

    return { count: uploadedMonthsCount, success: true };
  } catch (err) {
    console.warn('Error in uploadAllLocalDataToFirebase:', err);
    return { count: uploadedMonthsCount, success: false };
  }
}

