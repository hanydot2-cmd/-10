import React, { useState } from 'react';
import { DebtItem, Apartment } from '../types';
import { formatCurrency, formatNumber, ARABIC_MONTHS } from '../lib/buildingConfig';
import { FileSpreadsheet, Plus, CheckCircle2, Trash2, Calculator, Search, Share2, Download, ArrowRightLeft, AlertCircle, Edit, X } from 'lucide-react';

interface DebtsTabProps {
  debts: DebtItem[];
  onAddDebt: (debt: DebtItem) => void;
  onPayDebt: (id: string) => void;
  onDeleteDebt: (id: string) => void;
  onEditDebt?: (debt: DebtItem) => void;
  onTransferUnpaidToDebts?: () => void;
  apartments?: Apartment[];
}

export const DebtsTab: React.FC<DebtsTabProps> = ({
  debts,
  onAddDebt,
  onPayDebt,
  onDeleteDebt,
  onEditDebt,
  onTransferUnpaidToDebts,
  apartments = [],
}) => {
  const [floor, setFloor] = useState<number>(1);
  const [aptNum, setAptNumber] = useState<number>(101);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [transferMsg, setTransferMsg] = useState(false);

  // Edit Debt State
  const [editingDebt, setEditingDebt] = useState<DebtItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editFloor, setEditFloor] = useState(1);
  const [editAptNumber, setEditAptNumber] = useState(101);

  // Calculator State
  const [fromMonth, setFromMonth] = useState('');
  const [monthlyRate, setMonthlyRate] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const newDebt: DebtItem = {
      id: `debt_${Date.now()}`,
      aptId: (floor - 1) * 14 + (aptNum % 100 - 1),
      floor,
      aptNumber: aptNum,
      name: name.trim() || `شقة ${aptNum}`,
      amount: amt,
      note: note.trim(),
      date: new Date().toLocaleDateString('ar-EG'),
      paid: false,
      isManual: true,
    };

    onAddDebt(newDebt);
    setName('');
    setAmount('');
    setNote('');
  };

  const handleOpenEditModal = (debt: DebtItem) => {
    setEditingDebt(debt);
    setEditName(debt.name);
    setEditAmount(debt.amount.toString());
    setEditNote(debt.note);
    setEditFloor(debt.floor || 1);
    setEditAptNumber(debt.aptNumber || 101);
  };

  const handleSaveEditDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt || !onEditDebt) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt < 0) return;

    const updated: DebtItem = {
      ...editingDebt,
      name: editName.trim() || `شقة ${editAptNumber}`,
      amount: amt,
      note: editNote.trim(),
      floor: editFloor,
      aptNumber: editAptNumber,
      isManual: true, // ترك المديونيات المسجلة بواسطة الإدخال تعديل
    };

    onEditDebt(updated);
    setEditingDebt(null);
  };

  // Debt calculation from last paid month
  const handleCalcDebt = () => {
    if (!fromMonth || !monthlyRate) return;
    const rate = parseFloat(monthlyRate);
    if (isNaN(rate) || rate <= 0) return;

    const [fromY, fromM] = fromMonth.split('-').map(Number);
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth() + 1;

    const diffMonths = (currentY - fromY) * 12 + (currentM - fromM);
    if (diffMonths <= 0) {
      setCalcResult('الشهر المحدد يجب أن يكون قبل الشهر الحالي');
      return;
    }

    const total = diffMonths * rate;
    setAmount(total.toString());
    setCalcResult(`عدد الشهور: ${diffMonths} شهر × ${formatCurrency(rate)} = ${formatCurrency(total)}`);
  };

  const filteredDebts = debts.filter((d) => {
    if (d.paid) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(term) ||
      d.aptNumber.toString().includes(term) ||
      d.note.toLowerCase().includes(term)
    );
  });

  const totalDebtAmount = debts.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-rose-400">سجل المديونيات المستحقة والمتأخرات</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة وتحصيل كافة المتأخرات والمديونيات المرحّلة تلقائياً للشهر الحالي/التالي أو المسجلة يدوياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onTransferUnpaidToDebts && (
            <button
              onClick={() => {
                onTransferUnpaidToDebts();
                setTransferMsg(true);
                setTimeout(() => setTransferMsg(false), 4000);
              }}
              className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>⚡ ترحيل متأخرات الشهر الحالي والصيانة الإضافية للمديونيات</span>
            </button>
          )}

          <div className="bg-rose-950/40 border border-rose-800/40 px-4 py-2 rounded-xl text-center">
            <span className="text-[11px] text-slate-400 font-semibold block">إجمالي المديونيات</span>
            <span className="text-lg font-black text-rose-400 dir-ltr block">
              {formatCurrency(totalDebtAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* System policy note: month 9 start and manual debts editing */}
      <div className="bg-blue-950/40 border border-blue-800/50 text-blue-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <span>📌 تنبيه إعدادات النظام: ترحيل المديونيات التلقائي يبدأ من </span>
          <span className="text-amber-300 font-bold">شهر 9 (سبتمبر)</span>
          <span> وما بعده. ويتم الاحتفاظ بجميع المديونيات المسجلة بواسطة الإدخال اليدوي مع إتاحة </span>
          <span className="text-emerald-400 font-bold">التعديل عليها</span>
          <span> في أي وقت.</span>
        </div>
      </div>

      {transferMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold p-3 rounded-xl text-center animate-fadeIn">
          ✅ تم ترحيل جميع المتأخرات غير المسددة لهذا الشهر والصيانة الإضافية تلقائياً إلى جدول المديونيات!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Debt Registration Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Plus className="w-4 h-4 text-amber-400" />
            <span>تسجيل مديونية جديدة</span>
          </h3>

          <form onSubmit={handleAddDebt} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  رقم الدور (1-12)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={floor}
                  onChange={(e) => {
                    const f = parseInt(e.target.value) || 1;
                    setFloor(f);
                    setAptNumber(f * 100 + 1);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  رقم الشقة
                </label>
                <input
                  type="number"
                  value={aptNum}
                  onChange={(e) => setAptNumber(parseInt(e.target.value) || 101)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">اسم الساكن</label>
              <input
                type="text"
                placeholder="أدخل الاسم..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                إجمالي المديونية (ج.م)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">ملاحظات</label>
              <input
                type="text"
                placeholder="ملاحظات تفصيلية..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black py-2 rounded-lg text-xs transition"
            >
              تسجيل المديونية ✓
            </button>
          </form>
        </div>

        {/* Debt Calculator based on Last Paid Month */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 pb-2 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>حاسبة المديونية من آخر شهر دفع</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                آخر شهر دفع فيه الساكن
              </label>
              <input
                type="month"
                value={fromMonth}
                onChange={(e) => setFromMonth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                المبلغ الشهري المتفق عليه (ج.م)
              </label>
              <input
                type="number"
                placeholder="مثال: 300"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              onClick={handleCalcDebt}
              className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-2 rounded-lg text-xs border border-amber-500/30 transition"
            >
              احسب إجمالي المتأخرات تلقائيًا
            </button>

            {calcResult && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-lg text-xs font-bold text-amber-300 text-center dir-ltr">
                {calcResult}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debts List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث في المديونيات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/90 text-rose-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 w-10 text-center">م</th>
                <th className="p-3">الساكن والشقة</th>
                <th className="p-3">السبب / الملاحظة</th>
                <th className="p-3 text-center">المبلغ المستحق</th>
                <th className="p-3 text-center">التاريخ</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    لا توجد مديونيات مسجلة
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt, idx) => (
                  <tr key={debt.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-100">{debt.name}</div>
                      <div className="text-[10px] text-amber-400">
                        شقة {debt.aptNumber} (دور {debt.floor})
                      </div>
                      <div className="mt-1">
                        {debt.isManual || (!debt.id.includes('_monthly') && !debt.id.includes('_extra')) ? (
                          <span className="inline-block text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                            ✍️ مسجلة بواسطة الإدخال (تعديل)
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-bold">
                            ⚡ ترحيل تلقائي (بدءاً من شهر 9)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">{debt.note || '—'}</td>
                    <td className="p-3 text-center font-black text-rose-400 dir-ltr">
                      {formatCurrency(debt.amount)}
                    </td>
                    <td className="p-3 text-center text-slate-400">{debt.date}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onPayDebt(debt.id)}
                          className="bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 text-[11px] font-bold px-2.5 py-1 rounded transition"
                        >
                          سدد ✓
                        </button>
                        {onEditDebt && (
                          <button
                            onClick={() => handleOpenEditModal(debt)}
                            className="bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 border border-amber-700/50 text-[11px] font-bold px-2 py-1 rounded transition flex items-center gap-1"
                            title="تعديل المديونية"
                          >
                            <Edit className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteDebt(debt.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 rounded transition"
                          title="حذف المديونية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Debt Modal */}
      {editingDebt && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <span>تعديل المديونية المسجلة</span>
              </h3>
              <button
                onClick={() => setEditingDebt(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">اسم الساكن</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">الدور</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={editFloor}
                    onChange={(e) => {
                      const f = parseInt(e.target.value) || 1;
                      setEditFloor(f);
                      setEditAptNumber(f * 100 + 1);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">رقم الشقة</label>
                  <input
                    type="number"
                    value={editAptNumber}
                    onChange={(e) => setEditAptNumber(parseInt(e.target.value) || 101)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">المبلغ المستحق (ج.م)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">ملاحظات / السبب</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition shadow-lg"
                >
                  حفظ التعديلات ✓
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDebt(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
