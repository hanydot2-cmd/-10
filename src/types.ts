export interface Apartment {
  id: number; // 0 to 159
  floor: number; // 1 to 12
  aptNumber: number; // e.g. 101, 102... 1201..1206
  aptPos: number; // position on floor
  name: string;
  phone: string;
  amount: number;
  paid: boolean;
  skip: boolean; // true = closed (مغلقة - لا يطبع), false = open (مفتوحة - هيطبع)
  note?: string;
  paidExtraMaint?: boolean; // paid status for extra maintenance in this month
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export interface DebtItem {
  id: string;
  aptId: number;
  floor: number;
  aptNumber: number;
  name: string;
  amount: number;
  note: string;
  date: string;
  paid: boolean;
}

export interface ExtraMaintenance {
  id: string;
  title: string;
  amountPerApt: number;
  recurring: boolean; // recurring every month or one-off
  createdMonthKey: string; // e.g., "2026-07"
  note?: string;
  active: boolean;
}

export interface MonthData {
  key: string; // e.g. "2026-07"
  monthName: string;
  year: number;
  prevBalance: number;
  manualPrevBalanceEdited?: boolean;
  collectedAmount: number; // total collected
  manualCollectedEdited?: boolean; // if user edited collected total manually
  colExtraManual?: number; // additional manual override offset
  expenses: Expense[];
  apartments: Apartment[];
  debtsTransferred?: boolean;
}

export interface DataEntryUser {
  username: string;
  password?: string;
  role: 'admin' | 'entry';
  createdAt?: string;
}

export interface ContactItem {
  id: string;
  title: string;
  name?: string;
  phone: string;
  role: string;
  category: 'management' | 'emergency' | 'services';
}

export type TabType = 
  | 'accounts' 
  | 'residents' 
  | 'extramaint' 
  | 'reports'
  | 'datasheet' 
  | 'receipts' 
  | 'debts' 
  | 'dashboard' 
  | 'settings';

export type AppTheme = 
  | 'light' 
  | 'light-emerald' 
  | 'light-sapphire' 
  | 'light-amber' 
  | 'light-lavender' 
  | 'slate' 
  | 'midnight' 
  | 'navy' 
  | 'emerald' 
  | 'burgundy' 
  | 'violet' 
  | 'amber' 
  | 'charcoal' 
  | 'custom';

export type AppFont = 
  | 'ibm' 
  | 'cairo' 
  | 'tajawal' 
  | 'almarai' 
  | 'amiri';
