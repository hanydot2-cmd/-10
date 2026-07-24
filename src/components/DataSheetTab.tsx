import React, { useState } from 'react';
import { MonthData, ExtraMaintenance } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { FileSpreadsheet, CheckCircle2, XCircle, DollarSign, Printer, Search, RefreshCw, Radio } from 'lucide-react';

interface DataSheetTabProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
  isFirebaseConnected?: boolean;
}

export const DataSheetTab: React.FC<DataSheetTabProps> = ({
  monthData,
  activeExtraMaint,
  isFirebaseConnected = true,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'paid' | 'unpaid' | 'expenses'>('all');

  const totalExpenses = monthData.expenses.reduce((s, e) => s + e.amount, 0);

  // Filter valid resident apartments (ignoring empty unassigned slots)
  const validApartments = monthData.apartments.filter((a) => a.name && a.name.trim() !== '');

  const paidApartments = validApartments.filter((a) => a.paid);
  const unpaidApartments = validApartments.filter((a) => !a.paid);

  const totalPaidCollected = paidApartments.reduce((s, a) => s + a.amount, 0);
  const extraAmt = activeExtraMaint ? activeExtraMaint.amountPerApt : 0;

  const totalUnpaidDue = unpaidApartments.reduce((s, a) => {
    let due = a.amount;
    if (extraAmt > 0 && !a.paidExtraMaint) due += extraAmt;
    return s + due;
  }, 0);

  // Filtered search
  const matchesSearch = (apt: typeof validApartments[0]) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.trim().toLowerCase();
    return (
      apt.name.toLowerCase().includes(query) ||
      apt.aptNumber.toString().includes(query) ||
      apt.floor.toString().includes(query)
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-amber-400">
                كشف البيانات المرجعي (الشيت) — {monthData.monthName} {monthData.year}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isFirebaseConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <Radio className={`w-3 h-3 ${isFirebaseConnected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}`} />
                <span>{isFirebaseConnected ? 'تحديث فوري مباشر' : 'غير متصل بالخادم'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              شيت مرجعي شامل ومباشر لجميع المصروفات والسكان المسددين وغير المسددين لهذا الشهر.
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الشيت المرجعي</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Expenses Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>المصروفات الشهرية</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 stat-value-bold">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            إجمالي {monthData.expenses.length} بند مصروفات
          </p>
        </div>

        {/* Paid Residents Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>المسددين للصيانة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 stat-value-bold">
            {paidApartments.length} <span className="text-xs font-bold text-slate-400">ساكن</span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-1 font-semibold">
            إجمالي المحصل: {formatCurrency(totalPaidCollected)}
          </p>
        </div>

        {/* Unpaid Residents Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
            <span>غير المسددين للصيانة</span>
            <XCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 stat-value-bold">
            {unpaidApartments.length} <span className="text-xs font-bold text-slate-400">ساكن</span>
          </div>
          <p className="text-[11px] text-amber-400/80 mt-1 font-semibold">
            المستحق غير المحصل: {formatCurrency(totalUnpaidDue)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل ({validApartments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'paid'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            المسددون ({paidApartments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('unpaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'unpaid'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            غير المسددين ({unpaidApartments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSubTab === 'expenses'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            المصروفات ({monthData.expenses.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث باسم الساكن أو رقم الشقة..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs rounded-lg pr-9 pl-3 py-2 text-slate-200 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Data Sheet Tables */}
      {(activeSubTab === 'all' || activeSubTab === 'expenses') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">
              1️⃣ المصروفات الشهرية — {monthData.monthName} {monthData.year}
            </h3>
            <span className="text-xs font-bold text-rose-400">
              إجمالي: {formatCurrency(totalExpenses)}
            </span>
          </div>
          {monthData.expenses.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              لا توجد مصروفات مسجلة لهذا الشهر.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-bold">
                    <th className="p-3">#</th>
                    <th className="p-3">تاريخ المصروف</th>
                    <th className="p-3">بيان المصروف / السند</th>
                    <th className="p-3">المبلغ (ج.م)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {monthData.expenses.map((exp, index) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="p-3 text-slate-300">{exp.date}</td>
                      <td className="p-3 font-bold text-slate-100">{exp.name}</td>
                      <td className="p-3 font-black text-rose-400">{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(activeSubTab === 'all' || activeSubTab === 'paid') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="bg-emerald-950/40 border-b border-emerald-900/50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>2️⃣ كشف المسددين للصيانة ({paidApartments.length} ساكن)</span>
            </h3>
            <span className="text-xs font-bold text-emerald-300">
              إجمالي المحصل: {formatCurrency(totalPaidCollected)}
            </span>
          </div>
          {paidApartments.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              لم يقم أي ساكن بالسداد بعد لهذا الشهر.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3">رقم الشقة</th>
                    <th className="p-3">الدور</th>
                    <th className="p-3">اسم الساكن</th>
                    <th className="p-3">المبلغ المسدد</th>
                    <th className="p-3">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paidApartments.filter(matchesSearch).map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-black text-amber-400">شقة {apt.aptNumber}</td>
                      <td className="p-3 text-slate-300">الدور {apt.floor}</td>
                      <td className="p-3 font-bold text-slate-100">{apt.name}</td>
                      <td className="p-3 font-black text-emerald-400">{formatCurrency(apt.amount)}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>تم السداد</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(activeSubTab === 'all' || activeSubTab === 'unpaid') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="bg-amber-950/40 border-b border-amber-900/50 px-4 py-3 flex justify-between items-center">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="w-4 h-4 text-amber-400" />
              <span>3️⃣ كشف غير المسددين للصيانة ({unpaidApartments.length} ساكن)</span>
            </h3>
            <span className="text-xs font-bold text-amber-300">
              المبلغ المستحق: {formatCurrency(totalUnpaidDue)}
            </span>
          </div>
          {unpaidApartments.length === 0 ? (
            <div className="p-6 text-center text-emerald-400 text-xs font-bold">
              🎉 ممتاز! جميع السكان سددوا اشتراك الصيانة لهذا الشهر.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                  <tr>
                    <th className="p-3">رقم الشقة</th>
                    <th className="p-3">الدور</th>
                    <th className="p-3">اسم الساكن</th>
                    <th className="p-3">صيانة شهرية</th>
                    {extraAmt > 0 && <th className="p-3">صيانة إضافية</th>}
                    <th className="p-3">الإجمالي المستحق</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {unpaidApartments.filter(matchesSearch).map((apt) => {
                    const extraDue = extraAmt > 0 && !apt.paidExtraMaint ? extraAmt : 0;
                    const totalDue = apt.amount + extraDue;
                    return (
                      <tr key={apt.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 font-black text-amber-400">شقة {apt.aptNumber}</td>
                        <td className="p-3 text-slate-300">الدور {apt.floor}</td>
                        <td className="p-3 font-bold text-slate-100">{apt.name}</td>
                        <td className="p-3 text-slate-200">{formatCurrency(apt.amount)}</td>
                        {extraAmt > 0 && (
                          <td className="p-3 text-amber-400">
                            {extraDue > 0 ? formatCurrency(extraDue) : 'مسددة'}
                          </td>
                        )}
                        <td className="p-3 font-black text-amber-400">{formatCurrency(totalDue)}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            <XCircle className="w-3 h-3 text-amber-400" />
                            <span>غير مسدد</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
