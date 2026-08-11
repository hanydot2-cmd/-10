import React, { useState } from 'react';
import { MonthData, ExtraMaintenance, Apartment } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { Receipt, Search, CheckCircle2, Lock, X, Calendar } from 'lucide-react';
import { AdvancePaymentModal } from './AdvancePaymentModal';

interface CollectionPanelViewProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
  onUpdateMonthData: (updated: MonthData) => void;
  onAdvancePayment?: (aptId: number, monthsCount: number, note: string) => void;
  onClose?: () => void;
}

export const CollectionPanelView: React.FC<CollectionPanelViewProps> = ({
  monthData,
  activeExtraMaint,
  onUpdateMonthData,
  onAdvancePayment,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [advanceApt, setAdvanceApt] = useState<Apartment | null>(null);

  const filteredApartments = monthData.apartments.filter((apt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      apt.name.toLowerCase().includes(term) ||
      apt.aptNumber.toString().includes(term) ||
      apt.phone.includes(term)
    );
  });

  // Handle marking payment from Collection Panel without duplication (عدم تضاعف المبلغ)
  const handleTogglePayment = (aptId: number, field: 'paid' | 'paidExtraMaint', isChecked: boolean) => {
    const targetApt = monthData.apartments.find((a) => a.id === aptId);
    if (!targetApt) return;

    // Prevent re-triggering if already in requested state
    if (targetApt[field] === isChecked) {
      return;
    }

    const updatedApts = monthData.apartments.map((a) => {
      if (a.id === aptId) {
        return { ...a, [field]: isChecked };
      }
      return a;
    });

    onUpdateMonthData({
      ...monthData,
      manualCollectedEdited: false,
      apartments: updatedApts,
    });
  };

  const totalPaidCount = monthData.apartments.filter((a) => a.paid).length;

  return (
    <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4 max-w-3xl mx-auto my-4 animate-scaleUp">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-emerald-400">
              لوحة التحصيل السريعة — {monthData.monthName} {monthData.year}
            </h3>
            <p className="text-[11px] text-slate-400">
              تسجيل السداد الفوري مع المزامنة المباشرة وعدم تضاعف المبلغ
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم الشقة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
        />
      </div>

      <div className="text-xs font-bold text-slate-400 flex justify-between">
        <span>إجمالي المكتمل: {totalPaidCount} / 160</span>
        <span className="text-emerald-400">أي تحصيل يسجل فوراً بالمجموع</span>
      </div>

      {/* Apartment Checklist Cards */}
      <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
        {filteredApartments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">لا توجد نتائج</div>
        ) : (
          filteredApartments.map((apt) => {
            const isLocked = apt.paid;
            return (
              <div
                key={apt.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  apt.paid
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="font-black text-amber-300 text-xs flex items-center gap-2">
                    <span>شقة {apt.aptNumber} (دور {apt.floor})</span>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-bold">
                        <Lock className="w-2.5 h-2.5" /> مسجل ومقفل
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">
                    {apt.name || 'بدون اسم'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    المبلغ: {formatCurrency(apt.skip ? 100 : (apt.amount || 0))} {apt.skip ? '(شقة مغلقة)' : ''}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!apt.paid && !apt.skip && onAdvancePayment && (
                    <button
                      type="button"
                      onClick={() => setAdvanceApt(apt)}
                      className="bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                      title="تسديد عدة شهور مقدماً"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>تسديد مقدماً</span>
                    </button>
                  )}

                  {apt.paid && apt.advanceUntilKey && (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-1 rounded-lg">
                      مقدماً حتى {apt.advanceUntilKey}
                    </span>
                  )}

                  {/* Monthly Checkbox */}
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <span className="text-[10px] font-bold text-slate-400">شهري</span>
                    <input
                      type="checkbox"
                      checked={apt.paid}
                      onChange={(e) => handleTogglePayment(apt.id, 'paid', e.target.checked)}
                      className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
                    />
                  </label>

                  {/* Extra Maintenance Checkbox if active */}
                  {activeExtraMaint && (
                    <label className="flex flex-col items-center gap-1 cursor-pointer border-r border-slate-700 pr-3">
                      <span className="text-[10px] font-bold text-purple-300">إضافية</span>
                      <input
                        type="checkbox"
                        checked={apt.paidExtraMaint || false}
                        onChange={(e) => handleTogglePayment(apt.id, 'paidExtraMaint', e.target.checked)}
                        className="w-5 h-5 accent-purple-500 cursor-pointer rounded"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {advanceApt && onAdvancePayment && (
        <AdvancePaymentModal
          isOpen={Boolean(advanceApt)}
          onClose={() => setAdvanceApt(null)}
          apartment={advanceApt}
          currentMonthKey={monthData.key}
          onConfirmAdvance={(aptId, count, note) => {
            onAdvancePayment(aptId, count, note);
            setAdvanceApt(null);
          }}
        />
      )}
    </div>
  );
};
