import { Apartment } from '../types';

export const TOTAL_FLOORS = 12;

export function getApartmentsForFloor(floor: number): number {
  if (floor === 12) return 6; // Requirement: Floor 12 has 6 apartments only
  return 14; // Floors 1 to 11 have 14 apartments each
}

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function generateDefaultApartments(): Apartment[] {
  const apts: Apartment[] = [];
  let currentId = 0;

  for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
    const count = getApartmentsForFloor(floor);
    for (let pos = 1; pos <= count; pos++) {
      const aptNumber = floor * 100 + pos;
      apts.push({
        id: currentId++,
        floor,
        aptNumber,
        aptPos: pos,
        name: '',
        phone: '',
        amount: 0,
        paid: false,
        skip: false, // false = open (مفتوحة - هيطبع), true = closed (مغلقة - لا يطبع)
        note: '',
        paidExtraMaint: false
      });
    }
  }

  return apts;
}

export function formatCurrency(val: number): string {
  return Number(val || 0).toLocaleString('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ج.م';
}

export function formatNumber(val: number): string {
  return Number(val || 0).toLocaleString('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}
