import React, { useState, useEffect } from 'react';
import { Apartment } from '../types';
import { formatCurrency, ARABIC_MONTHS } from '../lib/buildingConfig';
import { getAdvanceMonthKeys } from '../lib/storage';
import { Calendar, CheckCircle2, X, Clock, ShieldCheck, DollarSign } from 'lucide-react';

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  apartment: Apartment | null;
  currentMonthKey: string;
  onConfirmAdvance: (aptId: number, monthsCount: number, note: string) => void;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  apartment,
  currentMonthKey,
  onConfirmAdvance,
}) => {
  const [monthsCount, setMonthsCount] = useState<number>(3);
  const [customNote, setCustomNote] = useState<string>('');

  // Helper to format end month string
  const getEndMonthDisplay = (key: string, count: number) => {
    const keys = getAdvanceMonthKeys(key, count);
    const endKey = keys[keys.length - 1];
    const [yStr, mStr] = endKey.split('-');
    const year = parseInt(yStr) || new Date().getFullYear();
    const monthNum = parseInt(mStr) || 1;
    const monthName = ARABIC_MONTHS[monthNum - 1] || `شهر ${monthNum}`;
    return { endKey, monthName, year, text: `${monthName} ${year}` };
  };

  const endInfo = getEndMonthDisplay(currentMonthKey, monthsCount);

  useEffect(() => {
    if (apartment) {
      setCustomNote(`مسدد مقدماً (${monthsCount} شهور حتى ${endInfo.text})`);
    }
  }, [apartment, monthsCount, currentMonthKey]);

  if (!isOpen || !apartment) return null;

  const monthlyAmount = apartment.skip ? 100 : (apartment.amount || 0);
  const totalAmount = monthlyAmount * monthsCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (monthsCount <= 0) return;
    onConfirmAdvance(apartment.id, monthsCount, customNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 text-right relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-emerald-400">
              تسديد مقدماً — شقة {apartment.aptNumber} ({apartment.name || 'بدون اسم'})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              الدور {apartment.floor} • القيمة الشهرية: {formatCurrency(monthlyAmount)}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اختر عدد شهور التسديد مقدماً:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 6, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMonthsCount(num)}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition border ${
                    monthsCount === num
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {num} {num === 12 ? 'شهر (سنة)' : 'شهور'}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Months Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              أو أدخل عدد الشهور يدوياً:
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={monthsCount}
              onChange={(e) => setMonthsCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Calculation Summary Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">عدد الشهور المدفوعة:</span>
              <span className="font-bold text-slate-200">{monthsCount} شهر</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">الإجمالي التراكمي المطلوب:</span>
              <span className="font-black text-amber-300 text-sm dir-ltr">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700">
              <span className="text-slate-400">تغطية السداد مقدماً حتى:</span>
              <span className="font-black text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-lg">
                حتى نهاية {endInfo.text}
              </span>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              ملاحظة التوثيق / الإيصال:
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Policy Information Box */}
          <div className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 p-3 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">سياسة التسديد مقدماً: </span>
              لن يظهر هذا الساكن في قائمة غير المسددين أو قائمة المديونيات حتى بداية شهر{' '}
              <span className="text-amber-300 font-bold">
                {getEndMonthDisplay(currentMonthKey, monthsCount + 1).text}
              </span>
              .
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>تأكيد التسديد مقدماً ({monthsCount} شهور)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
