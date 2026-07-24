import { MonthData, DebtItem, ExtraMaintenance, DataEntryUser, Apartment } from '../types';
import { generateDefaultApartments, ARABIC_MONTHS } from './buildingConfig';

const STORAGE_KEYS = {
  CURRENT_MONTH_KEY: 'bmu10_current_month',
  MONTHS_DATA: 'bmu10_months_data_', // + monthKey
  DEBTS: 'bmu10_debts',
  EXTRA_MAINTENANCE: 'bmu10_extra_maintenance',
  USERS: 'bmu10_users',
  FIREBASE_URL: 'bmu10_fb_url',
  COLLECTION_PIN: 'bmu10_collection_pin',
  MASTER_RESIDENTS: 'bmu10_master_residents',
};

// Broadcast channel for instant multi-tab sync
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bmu10_sync_channel') : null;

export function broadcastSync(type: string, payload?: any) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
  }
}

export function getCurrentMonthKey(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_MONTH_KEY);
  if (saved) return saved;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const key = `${y}-${m}`;
  localStorage.setItem(STORAGE_KEYS.CURRENT_MONTH_KEY, key);
  return key;
}

export function setCurrentMonthKey(key: string) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_MONTH_KEY, key);
  broadcastSync('MONTH_CHANGED', key);
}

// Get or initialize Master Residents (Name, Phone, Default Monthly Amount, Skip Status)
export function getMasterResidents(): Apartment[] {
  const raw = localStorage.getItem(STORAGE_KEYS.MASTER_RESIDENTS);
  if (raw) {
    try {
      const parsed: Apartment[] = JSON.parse(raw);
      if (parsed.length === 160) return parsed;
    } catch (e) {}
  }
  const defaultApts = generateDefaultApartments();
  localStorage.setItem(STORAGE_KEYS.MASTER_RESIDENTS, JSON.stringify(defaultApts));
  return defaultApts;
}

export function saveMasterResidents(apts: Apartment[]) {
  localStorage.setItem(STORAGE_KEYS.MASTER_RESIDENTS, JSON.stringify(apts));
  broadcastSync('MASTER_RESIDENTS_UPDATED');
}

// Get or initialize Month Data
export function getMonthData(key: string): MonthData {
  const raw = localStorage.getItem(STORAGE_KEYS.MONTHS_DATA + key);
  if (raw) {
    try {
      const parsed: MonthData = JSON.parse(raw);
      // Ensure apartment array length is exactly 160 (12 floors, 1..11 with 14 apts, 12th with 6 apts)
      if (parsed.apartments && parsed.apartments.length === 160) {
        return parsed;
      }
    } catch (e) {}
  }

  // Create new month data cleanly
  const [yStr, mStr] = key.split('-');
  const year = parseInt(yStr) || new Date().getFullYear();
  const monthIdx = (parseInt(mStr) || 1) - 1;
  const monthName = ARABIC_MONTHS[monthIdx] || 'يناير';

  // Calculate previous balance from previous month
  const prevMonthKey = getPreviousMonthKey(key);
  const prevDataRaw = localStorage.getItem(STORAGE_KEYS.MONTHS_DATA + prevMonthKey);
  let autoPrevBalance = 0;
  if (prevDataRaw) {
    try {
      const prevData: MonthData = JSON.parse(prevDataRaw);
      const totalExp = prevData.expenses.reduce((s, e) => s + e.amount, 0);
      autoPrevBalance = Math.max(0, prevData.collectedAmount + prevData.prevBalance - totalExp);
    } catch (e) {}
  }

  // Inherit residents details from master or previous month
  let initialApts = getMasterResidents();
  if (prevDataRaw) {
    try {
      const prevData: MonthData = JSON.parse(prevDataRaw);
      if (prevData.apartments && prevData.apartments.length === 160) {
        initialApts = prevData.apartments.map(a => ({
          ...a,
          paid: false,
          paidExtraMaint: false
        }));
      }
    } catch (e) {}
  }

  const newMonth: MonthData = {
    key,
    monthName,
    year,
    prevBalance: autoPrevBalance,
    collectedAmount: 0,
    expenses: [],
    apartments: initialApts.map(a => ({ ...a, paid: false, paidExtraMaint: false }))
  };

  localStorage.setItem(STORAGE_KEYS.MONTHS_DATA + key, JSON.stringify(newMonth));
  return newMonth;
}

export function saveMonthData(data: MonthData) {
  localStorage.setItem(STORAGE_KEYS.MONTHS_DATA + data.key, JSON.stringify(data));
  broadcastSync('MONTH_DATA_UPDATED', data.key);
}

export function getPreviousMonthKey(currentKey: string): string {
  const [yStr, mStr] = currentKey.split('-');
  let y = parseInt(yStr);
  let m = parseInt(mStr);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Transfer unpaid items to Debts at end of month or month switch
export function transferUnpaidToDebts(monthKey: string) {
  const monthData = getMonthData(monthKey);
  if (monthData.debtsTransferred) return;

  const debts = getDebts();
  let addedCount = 0;
  const activeExtra = getActiveExtraMaintenance(monthKey);
  const extraAmt = activeExtra ? activeExtra.amountPerApt : 0;

  monthData.apartments.forEach(apt => {
    if (!apt.name) return; // ignore empty residents

    const todayStr = new Date().toLocaleDateString('ar-EG');

    // Unpaid monthly fee
    if (!apt.paid && apt.amount > 0) {
      debts.push({
        id: `debt_${Date.now()}_${apt.id}_monthly`,
        aptId: apt.id,
        floor: apt.floor,
        aptNumber: apt.aptNumber,
        name: apt.name,
        amount: apt.amount,
        note: `صيانة شهرية ${monthData.monthName} ${monthData.year} غير مسددة${apt.skip ? ' (شقة مغلقة)' : ''}`,
        date: todayStr,
        paid: false
      });
      addedCount++;
    }

    // Unpaid extra maintenance fee
    if (extraAmt > 0 && !apt.paidExtraMaint) {
      debts.push({
        id: `debt_${Date.now()}_${apt.id}_extra`,
        aptId: apt.id,
        floor: apt.floor,
        aptNumber: apt.aptNumber,
        name: apt.name,
        amount: extraAmt,
        note: `صيانة إضافية (${activeExtra?.title || ''}) ${monthData.monthName} ${monthData.year} غير مسددة`,
        date: todayStr,
        paid: false
      });
      addedCount++;
    }
  });

  if (addedCount > 0) {
    saveDebts(debts);
  }

  monthData.debtsTransferred = true;
  saveMonthData(monthData);
}

// Debts Storage
export function getDebts(): DebtItem[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {}
  }
  return [];
}

export function saveDebts(debts: DebtItem[]) {
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  broadcastSync('DEBTS_UPDATED');
}

// Extra Maintenance Storage
export function getExtraMaintenances(): ExtraMaintenance[] {
  const raw = localStorage.getItem(STORAGE_KEYS.EXTRA_MAINTENANCE);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {}
  }
  return [];
}

export function saveExtraMaintenances(items: ExtraMaintenance[]) {
  localStorage.setItem(STORAGE_KEYS.EXTRA_MAINTENANCE, JSON.stringify(items));
  broadcastSync('EXTRA_MAINTENANCE_UPDATED');
}

export function getActiveExtraMaintenance(monthKey: string): ExtraMaintenance | null {
  const all = getExtraMaintenances();
  // Find active extra maintenance for this month key or recurring active ones
  return all.find(item => item.active && (item.recurring || item.createdMonthKey === monthKey)) || null;
}

// Data Entry Users Storage (Requirement: secret pin 552211 is completely removed/hidden)
export function getUsers(): DataEntryUser[] {
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {}
  }
  // Default primary admin user
  const defaultUsers: DataEntryUser[] = [
    { username: 'Hany', role: 'admin' },
    { username: 'مدخل 1', role: 'entry' }
  ];
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  return defaultUsers;
}

export function saveUsers(users: DataEntryUser[]) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  broadcastSync('USERS_UPDATED');
}

// Clear all data to start fresh (Requirement #9)
export function resetAllDataToFresh() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('bmu10_') || k.startsWith('bmu_'))) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // Initialize clean building with 160 apartments
  const defaultApts = generateDefaultApartments();
  localStorage.setItem(STORAGE_KEYS.MASTER_RESIDENTS, JSON.stringify(defaultApts));

  const nowKey = getCurrentMonthKey();
  getMonthData(nowKey);

  broadcastSync('APP_RESET');
}
