import React, { useState } from 'react';
import { MonthData, ExtraMaintenance, Expense } from '../types';
import { formatCurrency, formatNumber } from '../lib/buildingConfig';
import { calculateCollectedAmount } from '../lib/storage';
import { Plus, Trash2, Edit2, CheckCircle2, ArrowRightLeft, DollarSign, Wallet, CreditCard, TrendingUp, RefreshCw, RotateCcw, ShieldCheck } from 'lucide-react';
import { restoreMonthDataFromBackup } from '../lib/storage';

interface AccountsTabProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
  onUpdateMonthData: (updated: MonthData) => void;
  onTransferUnpaidToDebts: () => void;
}

export const AccountsTab: React.FC<AccountsTabProps> = ({
  monthData,
  activeExtraMaint,
  onUpdateMonthData,
  onTransferUnpaidToDebts,
}) => {
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isEditingPrev, setIsEditingPrev] = useState(false);
  const [tempPrev, setTempPrev] = useState('');
  const [isEditingCol, setIsEditingCol] = useState(false);
  const [tempCol, setTempCol] = useState('');

  // Accurately calculated collected total
  const totalCollected = calculateCollectedAmount(monthData, activeExtraMaint);

  const totalExpenses = monthData.expenses.reduce((s, e) => s + e.amount, 0);
  const totalAvailable = (monthData.prevBalance || 0) + totalCollected;
  const remainingBalance = totalAvailable - totalExpenses;
  const spentPct = totalAvailable > 0 ? Math.min(100, (totalExpenses / totalAvailable) * 100) : 0;

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const name = expenseName.trim();
    const amt = parseFloat(expenseAmount);
    if (!name || isNaN(amt) || amt <= 0) return;

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      name,
      amount: amt,
      date: new Date().toLocaleDateString('ar-EG'),
    };

    const updated = {
      ...monthData,
      expenses: [newExpense, ...monthData.expenses],
    };
    onUpdateMonthData(updated);
    setExpenseName('');
    setExpenseAmount('');
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    const updated = {
      ...monthData,
      expenses: monthData.expenses.filter((e) => e.id !== id),
    };
    onUpdateMonthData(updated);
  };

  // Edit Previous Balance
  const handleSavePrevBalance = () => {
    const val = parseFloat(tempPrev);
    if (!isNaN(val) && val >= 0) {
      onUpdateMonthData({
        ...monthData,
        prevBalance: val,
        manualPrevBalanceEdited: true,
      });
    }
    setIsEditingPrev(false);
  };

  // Edit Collected Amount Manually (Requirement #5)
  const handleSaveCollectedAmount = () => {
    const val = parseFloat(tempCol);
    if (!isNaN(val) && val >= 0) {
      onUpdateMonthData({
        ...monthData,
        collectedAmount: val,
        manualCollectedEdited: true,
      });
    }
    setIsEditingCol(false);
  };

  // Quick Restore from local backup snapshot
  const handleQuickRestore = () => {
    const restored = restoreMonthDataFromBackup(monthData.key);
    if (restored) {
      onUpdateMonthData(restored);
      alert(`✅ تمت استعادة بيانات شهر (${monthData.monthName} ${monthData.year}) بنجاح!\nتم استرجاع المصروفات وسجل المسددين.`);
    } else {
      alert(`⚠️ لم يتم العثور على نسخة احتياطية سابقة مسجلة لشهر (${monthData.monthName} ${monthData.year}).\nيمكنك إضافة المصروفات وتحديد المسددين وسيحفظ التطبيق نسخة احتياطية فورية تلقائياً.`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Recovery Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-amber-300">
                مركز حماية واستعادة البيانات ({monthData.monthName} {monthData.year})
              </span>
              <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full">
                حفظ احتياطي فوري
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              تتم حماية وتزامن بيانات المصروفات والمسددين تلقائياً. في حال عدم ظهور البيانات، اضغط الزر لاستعادتها فوراً من النسخة الاحتياطية.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickRestore}
          className="shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition active:scale-95 w-full md:w-auto"
        >
          <RotateCcw className="w-4 h-4 stroke-[3]" />
          <span>استعادة بيانات {monthData.monthName} الآن</span>
        </button>
      </div>
      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Previous Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">الرصيد السابق</span>
            <Wallet className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-black text-purple-300 dir-ltr text-right">
            {formatCurrency(monthData.prevBalance || 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthData.manualPrevBalanceEdited
              ? 'تم تعديله يدويًا'
              : 'منقول تلقائيًا من الشهر السابق'}
          </p>
        </div>

        {/* Card 2: Collected Amount (Requirement #5) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">المبلغ المحصل هذا الشهر</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-400 dir-ltr text-right">
            {formatCurrency(totalCollected)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthData.manualCollectedEdited
              ? 'مجمع معدّل يدويًا + مدفوعات جديدة'
              : 'تجميع تلقائي من السكان'}
          </p>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">إجمالي المصروفات</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-xl font-black text-rose-400 dir-ltr text-right">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{monthData.expenses.length} بنود مصروفات</p>
        </div>

        {/* Card 4: Remaining Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden shadow-md">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">الرصيد المتبقي</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-black text-amber-300 dir-ltr text-right">
            {formatCurrency(remainingBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            المتاح: {formatCurrency(totalAvailable)}
          </p>
        </div>
      </div>

      {/* Expense Usage Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
          <span>نسبة المصروفات من الإجمالي المتاح</span>
          <span className={spentPct > 85 ? 'text-rose-400' : 'text-emerald-400'}>
            {spentPct.toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              spentPct > 85
                ? 'bg-rose-500'
                : spentPct > 65
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
      </div>

      {/* Control Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expenses Input Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>إضافة مصروف جديد</span>
          </h2>
          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                اسم المصروف / البيان
              </label>
              <input
                type="text"
                placeholder="مثال: صيانة مصعد، كهرباء، نظافة..."
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                المبلغ (جنيه مصري)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-lg text-sm shadow transition active:scale-95"
            >
              إضافة المصروف
            </button>
          </form>
        </div>

        {/* Funds & Manual Edit Controls */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>إدارة الرصيد والتحصيل</span>
          </h2>

          {/* Previous Balance Manual Override */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
            <label className="block text-xs text-slate-400 font-semibold mb-1">
              الرصيد السابق (ج.م)
            </label>
            {isEditingPrev ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  step="0.01"
                  value={tempPrev}
                  onChange={(e) => setTempPrev(e.target.value)}
                  className="flex-1 bg-slate-900 border border-amber-400 text-amber-300 font-bold px-3 py-1.5 rounded text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSavePrevBalance}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-xs"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsEditingPrev(false)}
                  className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-amber-300 font-bold text-sm">
                  {formatCurrency(monthData.prevBalance || 0)}
                </span>
                <button
                  onClick={() => {
                    setTempPrev((monthData.prevBalance || 0).toString());
                    setIsEditingPrev(true);
                  }}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:underline font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
              </div>
            )}
          </div>

          {/* Collected Amount Edit (Requirement #5: "الغاء زر اضافه ... مع اضافه زر تعديل") */}
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
            <label className="block text-xs text-slate-400 font-semibold mb-1">
              المبلغ المحصل هذا الشهر (ج.م)
            </label>
            {isEditingCol ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  step="0.01"
                  value={tempCol}
                  onChange={(e) => setTempCol(e.target.value)}
                  className="flex-1 bg-slate-900 border border-amber-400 text-emerald-400 font-bold px-3 py-1.5 rounded text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveCollectedAmount}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded text-xs"
                >
                  حفظ
                </button>
                <button
                  onClick={() => setIsEditingCol(false)}
                  className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <span className="text-emerald-400 font-bold text-sm">
                  {formatCurrency(totalCollected)}
                </span>
                <button
                  onClick={() => {
                    setTempCol(totalCollected.toString());
                    setIsEditingCol(true);
                  }}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:underline font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل المبلغ المحصل</span>
                </button>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1">
              * عند تعديل المبلغ واعتتماد أي ساكن كـ "مسدد" لاحقًا، يضاف مبلغه مباشرة إلى هذا المبلغ المحصل.
            </p>
          </div>

          {/* Auto Rollover Action Button */}
          <div className="pt-2">
            <button
              onClick={onTransferUnpaidToDebts}
              className="w-full flex items-center justify-center gap-2 bg-rose-900/30 hover:bg-rose-900/50 border border-rose-600/40 text-rose-300 font-bold py-2.5 rounded-lg text-xs transition"
            >
              <ArrowRightLeft className="w-4 h-4 text-rose-400" />
              <span>📋 ترحيل غير المسددين لهذا الشهر → جدول المديونيات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 bg-slate-800/80 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <span>سجل المصروفات لهذا الشهر</span>
          </h2>
          <span className="text-xs font-bold text-slate-400">
            {monthData.expenses.length} بند
          </span>
        </div>

        {monthData.expenses.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            📂 لا توجد مصروفات مسجلة لهذا الشهر بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/90 text-amber-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">بيان المصروف</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3 text-left">المبلغ</th>
                  <th className="p-3 w-16 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {monthData.expenses.map((exp, idx) => (
                  <tr key={exp.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-100">{exp.name}</td>
                    <td className="p-3 text-slate-400">{exp.date}</td>
                    <td className="p-3 text-left font-black text-rose-400 dir-ltr">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-900/30 transition"
                        title="حذف المصروف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
