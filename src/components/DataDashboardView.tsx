import React, { useState } from 'react';
import { MonthData, ExtraMaintenance, DebtItem } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { LayoutDashboard, CheckCircle2, XCircle, Search, Wallet, TrendingUp, DollarSign, Printer, MessageSquare, Share2, Copy, Check } from 'lucide-react';

interface DataDashboardViewProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
  debts: DebtItem[];
}

export const DataDashboardView: React.FC<DataDashboardViewProps> = ({
  monthData,
  activeExtraMaint,
  debts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Filter apartments into TWO DISTINCT LISTS as explicitly requested in Requirement #2:
  // 1) Residents who PAID (سدد)
  // 2) Residents who HAVE NOT PAID (لم يسدد)

  const paidResidents = monthData.apartments.filter((apt) => {
    if (!apt.paid) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      apt.name.toLowerCase().includes(term) ||
      apt.aptNumber.toString().includes(term) ||
      apt.phone.includes(term)
    );
  });

  const unpaidResidents = monthData.apartments.filter((apt) => {
    if (apt.paid) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      apt.name.toLowerCase().includes(term) ||
      apt.aptNumber.toString().includes(term) ||
      apt.phone.includes(term)
    );
  });

  // Calculate totals
  const totalExpenses = monthData.expenses.reduce((s, e) => s + e.amount, 0);
  const autoResidentCol = monthData.apartments.reduce((acc, apt) => {
    let sum = 0;
    if (apt.paid) sum += apt.amount || 0;
    if (apt.paidExtraMaint && activeExtraMaint) sum += activeExtraMaint.amountPerApt || 0;
    return acc + sum;
  }, 0);
  const totalCollected = monthData.manualCollectedEdited
    ? monthData.collectedAmount
    : autoResidentCol + (monthData.colExtraManual || 0);

  const totalAvailable = (monthData.prevBalance || 0) + totalCollected;
  const remainingBalance = totalAvailable - totalExpenses;
  const totalDebtsVal = debts.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);

  // Generate WhatsApp report summary
  const handleShareToWhatsAppGroup = () => {
    const reportText = `🏢 *تقرير التقرير المالي الشفاف — برج المعتز 10* 🏢
📅 *شهر:* ${monthData.monthName} ${monthData.year}

💰 *الرصيد السابق:* ${formatCurrency(monthData.prevBalance || 0)}
📥 *المبلغ المحصل:* ${formatCurrency(totalCollected)}
📤 *إجمالي المصروفات:* ${formatCurrency(totalExpenses)}
💵 *الرصيد المتبقي بالخزينة:* ${formatCurrency(remainingBalance)}
🚨 *إجمالي المديونيات المستحقة:* ${formatCurrency(totalDebtsVal)}

📊 *نسبة التحصيل:*
✅ عدد الشقق المسددة: ${paidResidents.length} شقة
❌ عدد الشقق غير المسددة: ${unpaidResidents.length} شقة

_تم التحديث الآلي عبر نظام إدارة حسابات برج المعتز 10_`;

    navigator.clipboard.writeText(reportText);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 4000);

    const encoded = encodeURIComponent(reportText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title Banner */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-amber-400">
              لوحة البيانات الشفاف لجروب العمارة — {monthData.monthName} {monthData.year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              لوحة مستقلة ونقية لعرض الإيرادات، المصروفات، الرصيد المتبقي، وكشفين منفصلين للسكان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Share to WhatsApp Group */}
          <button
            onClick={handleShareToWhatsAppGroup}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow transition active:scale-95 flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>نشر التقرير المالي على جروب الواتساب</span>
          </button>

          {/* Print/PDF */}
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>طباعة</span>
          </button>

          {/* Search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في الكشفين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {copiedMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold p-3 rounded-xl text-center animate-fadeIn flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>تم نسخ التقرير المالي وفتح الواتساب للمشاركة في جروب الساكنين!</span>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-semibold block">الرصيد السابق</span>
          <span className="text-base font-black text-purple-300 mt-1 block dir-ltr">
            {formatCurrency(monthData.prevBalance || 0)}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-semibold block">المبلغ المحصل</span>
          <span className="text-base font-black text-emerald-400 mt-1 block dir-ltr">
            {formatCurrency(totalCollected)}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-semibold block">إجمالي المصروفات</span>
          <span className="text-base font-black text-rose-400 mt-1 block dir-ltr">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[11px] text-slate-400 font-semibold block">الرصيد المتبقي</span>
          <span className="text-base font-black text-amber-300 mt-1 block dir-ltr">
            {formatCurrency(remainingBalance)}
          </span>
        </div>
      </div>

      {/* Requirement #2: TWO SEPARATE STATEMENTS (كشفين منفصلين) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KASHF 1: Statement of Residents Who Paid (كشف المسددين) */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>كشف السكان الذين سددوا ({paidResidents.length})</span>
            </div>
            <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              مسدد
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/90 text-emerald-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5 text-center w-10">م</th>
                  <th className="p-2.5">الشقة والاسم</th>
                  <th className="p-2.5 text-center">المبلغ المدفوع</th>
                  <th className="p-2.5 text-center">صيانة إضافية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {paidResidents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500">
                      لا يوجد سكان سددوا حتى الآن
                    </td>
                  </tr>
                ) : (
                  paidResidents.map((apt, idx) => (
                    <tr key={apt.id} className="hover:bg-emerald-950/20 transition">
                      <td className="p-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-amber-300">
                          شقة {apt.aptNumber} <span className="text-slate-400 text-[10px]">(دور {apt.floor})</span>
                        </div>
                        <div className="text-slate-200 text-[11px]">
                          {apt.name || 'بدون اسم'}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-emerald-400 dir-ltr">
                        {formatCurrency(apt.amount)}
                      </td>
                      <td className="p-2.5 text-center">
                        {apt.paidExtraMaint ? (
                          <span className="text-[10px] text-purple-300 font-bold">مسددة ✓</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* KASHF 2: Statement of Residents Who Have NOT Paid (كشف غير المسددين) */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-rose-950/40 border-b border-rose-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>كشف السكان الذين لم يسددوا ({unpaidResidents.length})</span>
            </div>
            <span className="bg-rose-900/60 text-rose-300 border border-rose-700/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              غير مسدد
            </span>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/90 text-rose-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="p-2.5 text-center w-10">م</th>
                  <th className="p-2.5">الشقة والاسم</th>
                  <th className="p-2.5 text-center">المبلغ المستحق</th>
                  <th className="p-2.5 text-center">الموبايل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {unpaidResidents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-emerald-400 font-bold">
                      🎉 جميع السكان سددوا هذا الشهر!
                    </td>
                  </tr>
                ) : (
                  unpaidResidents.map((apt, idx) => (
                    <tr key={apt.id} className="hover:bg-rose-950/20 transition">
                      <td className="p-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                      <td className="p-2.5">
                        <div className="font-bold text-amber-300">
                          شقة {apt.aptNumber} <span className="text-slate-400 text-[10px]">(دور {apt.floor})</span>
                        </div>
                        <div className="text-slate-200 text-[11px]">
                          {apt.name || 'بدون اسم'} {apt.skip && <span className="text-rose-400 text-[10px]">(مغلقة)</span>}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-rose-400 dir-ltr">
                        {formatCurrency(apt.amount)}
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-300 dir-ltr text-right">
                        {apt.phone || <span className="text-slate-600">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
