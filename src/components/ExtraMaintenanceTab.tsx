import React, { useState } from 'react';
import { ExtraMaintenance, MonthData } from '../types';
import { formatCurrency, formatNumber } from '../lib/buildingConfig';
import { Wrench, Plus, CheckCircle2, XCircle, RefreshCw, Layers, ShieldAlert, Sparkles } from 'lucide-react';

interface ExtraMaintenanceTabProps {
  monthData: MonthData;
  extraMaintenances: ExtraMaintenance[];
  onAddExtraMaintenance: (item: ExtraMaintenance) => void;
  onToggleExtraMaintenanceActive: (id: string, active: boolean) => void;
  onUpdateMonthData: (updated: MonthData) => void;
}

export const ExtraMaintenanceTab: React.FC<ExtraMaintenanceTabProps> = ({
  monthData,
  extraMaintenances,
  onAddExtraMaintenance,
  onToggleExtraMaintenanceActive,
  onUpdateMonthData,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(false);

  const activeItem = extraMaintenances.find(
    (item) => item.active && (item.recurring || item.createdMonthKey === monthData.key)
  );

  // Calculate total extra maintenance collected this month
  const totalExtraCollected = monthData.apartments.reduce((sum, apt) => {
    if (apt.paidExtraMaint && activeItem) {
      return sum + activeItem.amountPerApt;
    }
    return sum;
  }, 0);

  const handleCreateExtra = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    const a = parseFloat(amount);
    if (!t || isNaN(a) || a <= 0) return;

    const newItem: ExtraMaintenance = {
      id: `extra_${Date.now()}`,
      title: t,
      amountPerApt: a,
      recurring,
      createdMonthKey: monthData.key,
      active: true,
    };

    onAddExtraMaintenance(newItem);
    setTitle('');
    setAmount('');
    setRecurring(false);
  };

  // Toggle resident extra maintenance paid status
  const handleToggleResidentExtraPaid = (aptId: number, isPaid: boolean) => {
    const updatedApts = monthData.apartments.map((a) => {
      if (a.id === aptId) {
        return { ...a, paidExtraMaint: isPaid };
      }
      return a;
    });

    onUpdateMonthData({
      ...monthData,
      apartments: updatedApts,
    });
  };

  // Quick action: Mark all open residents as paid for extra maintenance
  const handleMarkAllExtraPaid = () => {
    const updatedApts = monthData.apartments.map((a) => ({
      ...a,
      paidExtraMaint: a.skip ? false : true,
    }));
    onUpdateMonthData({
      ...monthData,
      apartments: updatedApts,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-purple-300 flex items-center gap-2">
              <span>تاب الصيانة الإضافية</span>
              <span className="bg-purple-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                جديد
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إضافة مبلغ صيانة شهري أو لمرة واحدة يطبق تلقائياً على جميع السكان، ويظهر في الإيصالات واللوحات ويضاف مجمّعه للمحصل.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Extra Maintenance Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md">
          <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Plus className="w-4 h-4 text-purple-400" />
            <span>إضافة صيانة إضافية جديدة</span>
          </h3>

          <form onSubmit={handleCreateExtra} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                سبب الصيانة / البيان
              </label>
              <input
                type="text"
                placeholder="مثال: صيانة المصعد الكبرى، مضخة المياه، طلاء المدخل..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                المبلغ المطلـوب من كل شقة (جنيه مصري)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="مثال: 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-purple-300 placeholder-slate-500 focus:outline-none focus:border-purple-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                طبيعة التكرار
              </label>
              <select
                value={recurring ? '1' : '0'}
                onChange={(e) => setRecurring(e.target.value === '1')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 focus:outline-none focus:border-purple-400"
              >
                <option value="0">لمرة واحدة فقط (لهذا الشهر)</option>
                <option value="1">صيانة شهرية متكررة (كل شهر)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>تطبيق الصيانة الإضافية على جميع السكان (160 شقة)</span>
            </button>
          </form>
        </div>

        {/* Active Campaign Status & Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>حالة الصيانة الإضافية الحالية</span>
            </h3>

            {activeItem ? (
              <div className="mt-4 p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">البيان:</span>
                  <span className="text-sm font-black text-purple-200">{activeItem.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">المبلغ لكل شقة:</span>
                  <span className="text-sm font-black text-amber-400 dir-ltr">
                    {formatCurrency(activeItem.amountPerApt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">التكرار:</span>
                  <span className="text-xs font-bold text-purple-300">
                    {activeItem.recurring ? 'متكرر شهرياً' : 'شهر واحد فقط'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-purple-800/40">
                  <span className="text-xs text-slate-400">مجموع المحصل حالياً:</span>
                  <span className="text-base font-black text-emerald-400 dir-ltr">
                    {formatCurrency(totalExtraCollected)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-6 text-center py-8 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-500 text-xs">
                لا توجد صيانة إضافية نشطة لهذا الشهر
              </div>
            )}
          </div>

          {activeItem && (
            <button
              onClick={handleMarkAllExtraPaid}
              className="w-full bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-600/50 text-emerald-300 font-bold py-2 rounded-lg text-xs transition"
            >
              تسجيل تحصيل الصيانة الإضافية لجميع الشقق المفتوحة ✓
            </button>
          )}
        </div>
      </div>

      {/* Resident Extra Maintenance Checklist Table */}
      {activeItem && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-3 bg-slate-800/80 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-purple-300">
              كشف سداد الصيانة الإضافية ({activeItem.title} - {formatCurrency(activeItem.amountPerApt)})
            </span>
            <span className="text-emerald-400 font-bold">
              المحصل: {formatCurrency(totalExtraCollected)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/90 text-purple-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3 w-12 text-center">م</th>
                  <th className="p-3">الشقة والساكن</th>
                  <th className="p-3 text-center">المبلغ المطلوب</th>
                  <th className="p-3 text-center">حالة سداد الصيانة الإضافية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {monthData.apartments.map((apt, idx) => (
                  <tr
                    key={apt.id}
                    className={`hover:bg-slate-800/50 transition ${
                      apt.skip ? 'opacity-50 bg-slate-950/40' : ''
                    }`}
                  >
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <span className="font-bold text-amber-300">شقة {apt.aptNumber}</span>{' '}
                      <span className="text-slate-400 text-[11px]">(دور {apt.floor})</span> —{' '}
                      <span className="font-medium text-slate-200">{apt.name || '—'}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-purple-300 dir-ltr">
                      {formatCurrency(activeItem.amountPerApt)}
                    </td>
                    <td className="p-3 text-center">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={apt.paidExtraMaint || false}
                          disabled={apt.skip}
                          onChange={(e) => handleToggleResidentExtraPaid(apt.id, e.target.checked)}
                          className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                        />
                        <span
                          className={`text-xs font-bold ${
                            apt.paidExtraMaint ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {apt.paidExtraMaint ? 'مسددة ✓' : 'غير مسددة'}
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
