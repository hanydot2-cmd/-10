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

// Helper to dynamically calculate previous balance from previous month
export function getDynamicPrevBalance(monthKey: string, visitedKeys = new Set<string>()): number {
  if (visitedKeys.has(monthKey)) return 0;
  visitedKeys.add(monthKey);

  const prevMonthKey = getPreviousMonthKey(monthKey);
  const prevDataRaw = localStorage.getItem(STORAGE_KEYS.MONTHS_DATA + prevMonthKey);
  if (!prevDataRaw) return 0;

  try {
    const prevData: MonthData = JSON.parse(prevDataRaw);
    
    // Calculate previous month's collected amount
    const prevActiveExtra = getActiveExtraMaintenance(prevMonthKey);
    const prevCollected = calculateCollectedAmount(prevData, prevActiveExtra);
    
    // Previous month's prev balance (recursively compute if not manually edited)
    let prevBalance = prevData.prevBalance || 0;
    if (!prevData.manualPrevBalanceEdited) {
      prevBalance = getDynamicPrevBalance(prevMonthKey, visitedKeys);
    }

    // Previous month's total expenses
    const prevExpenses = (prevData.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);

    // Remaining balance at end of previous month
    return Math.max(0, prevCollected + prevBalance - prevExpenses);
  } catch (e) {
    return 0;
  }
}

// Helper to sanitize and synchronize month data state dynamically
export function syncAndSanitizeMonthData(data: MonthData): MonthData {
  if (!data) return data;

  if (!Array.isArray(data.expenses)) {
    data.expenses = [];
  }

  if (!Array.isArray(data.apartments) || data.apartments.length !== 160) {
    const master = getMasterResidents();
    if (Array.isArray(data.apartments) && data.apartments.length > 0) {
      data.apartments = master.map(m => {
        const found = data.apartments.find(a => a.id === m.id || a.aptNumber === m.aptNumber);
        return found ? { ...m, ...found } : { ...m, paid: false, paidExtraMaint: false };
      });
    } else {
      data.apartments = master.map(a => ({ ...a, paid: false, paidExtraMaint: false }));
    }
  }

  const activeExtra = getActiveExtraMaintenance(data.key);
  data.collectedAmount = calculateCollectedAmount(data, activeExtra);

  if (!data.manualPrevBalanceEdited) {
    data.prevBalance = getDynamicPrevBalance(data.key);
  }

  return data;
}

// Helper to safely merge local and remote month data without losing entries
export function mergeMonthData(local: MonthData | null, remote: MonthData | null): MonthData {
  if (!local && !remote) return getMonthData(getCurrentMonthKey());
  if (!local) return syncAndSanitizeMonthData(remote!);
  if (!remote) return syncAndSanitizeMonthData(local);

  // Merge expenses: union of unique expenses by ID or by (name + amount)
  const expenseMap = new Map<string, Expense>();
  (remote.expenses || []).forEach(e => {
    if (e && e.name) expenseMap.set(e.id || `${e.name}_${e.amount}`, e);
  });
  (local.expenses || []).forEach(e => {
    if (e && e.name) expenseMap.set(e.id || `${e.name}_${e.amount}`, e);
  });
  const mergedExpenses = Array.from(expenseMap.values());

  // Merge apartments: keep paid = true if paid in either local or remote
  const master = getMasterResidents();
  const mergedApartments = master.map(masterApt => {
    const localApt = (local.apartments || []).find(a => a.id === masterApt.id || a.aptNumber === masterApt.aptNumber);
    const remoteApt = (remote.apartments || []).find(a => a.id === masterApt.id || a.aptNumber === masterApt.aptNumber);

    const base = localApt || remoteApt || masterApt;
    const isPaid = Boolean(localApt?.paid || remoteApt?.paid);
    const isPaidExtra = Boolean(localApt?.paidExtraMaint || remoteApt?.paidExtraMaint);

    return {
      ...masterApt,
      ...base,
      name: (localApt?.name && localApt.name.trim()) ? localApt.name : ((remoteApt?.name && remoteApt.name.trim()) ? remoteApt.name : masterApt.name),
      phone: localApt?.phone || remoteApt?.phone || masterApt.phone,
      amount: localApt?.amount || remoteApt?.amount || masterApt.amount,
      paid: isPaid,
      paidExtraMaint: isPaidExtra,
      skip: localApt?.skip ?? remoteApt?.skip ?? masterApt.skip,
      note: localApt?.note || remoteApt?.note || masterApt.note,
    };
  });

  const merged: MonthData = {
    key: remote.key || local.key,
    monthName: remote.monthName || local.monthName,
    year: remote.year || local.year,
    prevBalance: remote.manualPrevBalanceEdited ? remote.prevBalance : (local.prevBalance ?? remote.prevBalance ?? 0),
    manualPrevBalanceEdited: local.manualPrevBalanceEdited || remote.manualPrevBalanceEdited,
    collectedAmount: Math.max(local.collectedAmount || 0, remote.collectedAmount || 0),
    manualCollectedEdited: local.manualCollectedEdited || remote.manualCollectedEdited,
    colExtraManual: Math.max(local.colExtraManual || 0, remote.colExtraManual || 0),
    expenses: mergedExpenses,
    apartments: mergedApartments,
    debtsTransferred: local.debtsTransferred || remote.debtsTransferred,
  };

  return syncAndSanitizeMonthData(merged);
}

export function restoreMonthDataFromBackup(monthKey: string): MonthData | null {
  const keysToTry = [
    'bmu10_backup_' + STORAGE_KEYS.MONTHS_DATA + monthKey,
    'bmu10_snapshot_' + monthKey,
    'bmu_months_data_' + monthKey,
  ];

  for (const k of keysToTry) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const parsed: MonthData = JSON.parse(raw);
        if (parsed && parsed.apartments) {
          const sanitized = syncAndSanitizeMonthData(parsed);
          saveMonthData(sanitized);
          return sanitized;
        }
      } catch (e) {}
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes(monthKey)) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.apartments && Array.isArray(parsed.apartments)) {
            const sanitized = syncAndSanitizeMonthData(parsed as MonthData);
            saveMonthData(sanitized);
            return sanitized;
          }
        } catch (e) {}
      }
    }
  }

  return null;
}

// Helper to accurately calculate total collected amount for a month
export function calculateCollectedAmount(monthData: MonthData, activeExtraMaint?: ExtraMaintenance | null): number {
  if (!monthData || !monthData.apartments) return 0;

  const autoSum = monthData.apartments.reduce((acc, apt) => {
    let sum = 0;
    if (apt.paid) {
      sum += apt.skip ? 100 : (apt.amount || 0);
    }
    if (apt.paidExtraMaint && activeExtraMaint) {
      sum += activeExtraMaint.amountPerApt || 0;
    }
    return acc + sum;
  }, 0);

  // If no apartments are marked as paid, collected amount MUST reset to 0 (+ manual extra addition if any)
  if (autoSum === 0) {
    return monthData.colExtraManual || 0;
  }

  if (monthData.manualCollectedEdited && typeof monthData.collectedAmount === 'number') {
    return monthData.collectedAmount;
  }

  return autoSum + (monthData.colExtraManual || 0);
}

// Get or initialize Month Data
export function getMonthData(key: string): MonthData {
  const raw = localStorage.getItem(STORAGE_KEYS.MONTHS_DATA + key);
  if (raw) {
    try {
      const parsed: MonthData = JSON.parse(raw);
      if (parsed.apartments && parsed.apartments.length === 160) {
        return syncAndSanitizeMonthData(parsed);
      }
    } catch (e) {}
  }

  // Create new month data cleanly
  const [yStr, mStr] = key.split('-');
  const year = parseInt(yStr) || new Date().getFullYear();
  const monthIdx = (parseInt(mStr) || 1) - 1;
  const monthName = ARABIC_MONTHS[monthIdx] || 'يناير';

  const prevMonthKey = getPreviousMonthKey(key);
  const prevDataRaw = localStorage.getItem(STORAGE_KEYS.MONTHS_DATA + prevMonthKey);

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
    prevBalance: getDynamicPrevBalance(key),
    collectedAmount: 0,
    expenses: [],
    apartments: initialApts.map(a => ({ ...a, paid: false, paidExtraMaint: false }))
  };

  const sanitized = syncAndSanitizeMonthData(newMonth);
  localStorage.setItem(STORAGE_KEYS.MONTHS_DATA + key, JSON.stringify(sanitized));
  return sanitized;
}

export function saveMonthData(data: MonthData) {
  const sanitized = syncAndSanitizeMonthData(data);
  localStorage.setItem(STORAGE_KEYS.MONTHS_DATA + sanitized.key, JSON.stringify(sanitized));

  // Save backup snapshot if data has expenses or paid status
  const hasExpenses = sanitized.expenses && sanitized.expenses.length > 0;
  const hasPaid = sanitized.apartments && sanitized.apartments.some(a => a.paid);
  if (hasExpenses || hasPaid) {
    localStorage.setItem('bmu10_backup_' + STORAGE_KEYS.MONTHS_DATA + sanitized.key, JSON.stringify(sanitized));
  }

  // Cascade previous balance update to subsequent month if it exists in storage
  const nextMonthKey = getNextMonthKey(sanitized.key);
  const nextDataRaw = localStorage.getItem(STORAGE_KEYS.MONTHS_DATA + nextMonthKey);
  if (nextDataRaw) {
    try {
      const nextData: MonthData = JSON.parse(nextDataRaw);
      if (!nextData.manualPrevBalanceEdited) {
        const totalExp = (sanitized.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
        const newNextPrevBalance = Math.max(0, sanitized.collectedAmount + (sanitized.prevBalance || 0) - totalExp);
        if (nextData.prevBalance !== newNextPrevBalance) {
          nextData.prevBalance = newNextPrevBalance;
          saveMonthData(nextData);
        }
      }
    } catch (e) {}
  }

  broadcastSync('MONTH_DATA_UPDATED', sanitized.key);
}

export function getPreviousMonthKey(currentKey: string): string {
  const [yStr, mStr] = currentKey.split('-');
  let y = parseInt(yStr) || new Date().getFullYear();
  let m = parseInt(mStr) || 1;
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function getNextMonthKey(currentKey: string): string {
  const [yStr, mStr] = currentKey.split('-');
  let y = parseInt(yStr) || new Date().getFullYear();
  let m = parseInt(mStr) || 1;
  m += 1;
  if (m === 13) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

// Transfer unpaid items to Debts at end of month or month switch
export function transferUnpaidToDebts(monthKey: string) {
  // Requirement: المديونيات تبدأ من شهر 9 (سبتمبر) وما بعده
  // لا يتم ترحيل متأخرات الشهور السابقة لشهر 9 تلقائياً إلى المديونيات
  const [, mStr] = monthKey.split('-');
  const monthNum = parseInt(mStr) || 1;
  if (monthNum < 9) {
    return;
  }

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
        paid: false,
        isManual: false
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
        paid: false,
        isManual: false
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

const BEFORE_SEPTEMBER_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس',
  'شهر 1', 'شهر 2', 'شهر 3', 'شهر 4', 'شهر 5', 'شهر 6', 'شهر 7', 'شهر 8',
  '-01-', '-02-', '-03-', '-04-', '-05-', '-06-', '-07-', '-08-',
  '/01/', '/02/', '/03/', '/04/', '/05/', '/06/', '/07/', '/08/',
  ' 1 ', ' 2 ', ' 3 ', ' 4 ', ' 5 ', ' 6 ', ' 7 ', ' 8 '
];

export function isManualDebt(debt: DebtItem): boolean {
  if (debt.isManual !== undefined) return debt.isManual;
  return !debt.id.includes('_monthly') && !debt.id.includes('_extra');
}

export function filterValidDebts(debts: DebtItem[]): DebtItem[] {
  if (!Array.isArray(debts)) return [];
  const VALID_AUTO_MONTHS = [
    'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    '-09', '-10', '-11', '-12',
    '/09', '/10', '/11', '/12',
    'شهر 9', 'شهر 10', 'شهر 11', 'شهر 12'
  ];
  return debts.filter(d => {
    if (isManualDebt(d)) return true; // ترك المديونيات المسجلة بواسطة الإدخال يدوياً (تعديل)
    
    // أي مديونيات تلقائية في شهر 8 أو ما قبله تساوي صفر ولا يتم احتسابها
    const isBeforeSept = BEFORE_SEPTEMBER_MONTHS.some(m =>
      (d.note && d.note.includes(m)) ||
      (d.id && d.id.includes(m))
    );
    if (isBeforeSept) return false;

    // التأكد الإضافي: المديونيات التلقائية يجب أن تنتمي لشهر 9 (سبتمبر) أو ما بعده
    const isSeptOrLater = VALID_AUTO_MONTHS.some(m =>
      (d.note && d.note.includes(m)) ||
      (d.id && d.id.includes(m))
    );
    return isSeptOrLater;
  });
}

// Debts Storage
export function getDebts(): DebtItem[] {
  const raw = localStorage.getItem(STORAGE_KEYS.DEBTS);
  if (raw) {
    try {
      const parsed: DebtItem[] = JSON.parse(raw);
      return filterValidDebts(parsed);
    } catch (e) {}
  }
  return [];
}

export function saveDebts(debts: DebtItem[]) {
  const valid = filterValidDebts(debts);
  localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(valid));
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
    { username: 'Hany', password: '552211', role: 'admin' },
    { username: 'مدخل 1', password: '123', role: 'entry' }
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
