import React, { useState } from 'react';
import { Apartment, MonthData, ExtraMaintenance } from '../types';
import { formatCurrency, formatNumber } from '../lib/buildingConfig';
import { Search, Edit, CheckCircle, XCircle, Phone, MessageSquare, Save, X, Eye, EyeOff } from 'lucide-react';

interface ResidentsTabProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
  onUpdateMonthData: (updated: MonthData) => void;
  onUpdateMasterResidents: (apts: Apartment[]) => void;
}

export const ResidentsTab: React.FC<ResidentsTabProps> = ({
  monthData,
  activeExtraMaint,
  onUpdateMonthData,
  onUpdateMasterResidents,
}) => {
  const [searchTerm, setSearchName] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);

  // Form State for Resident Edit Modal
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPaid, setFormPaid] = useState<boolean>(true);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formSkip, setFormSkip] = useState<boolean>(false);

  // Filter apartments
  const filteredApartments = monthData.apartments.filter((apt) => {
    if (apt.skip && !showClosed) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const aptNumStr = apt.aptNumber.toString();
    const nameMatch = apt.name.toLowerCase().includes(term);
    const phoneMatch = apt.phone.includes(term);
    const numMatch = aptNumStr.includes(term) || `دور ${apt.floor}`.includes(term);
    return nameMatch || phoneMatch || numMatch;
  });

  // Calculate statistics
  const openCount = monthData.apartments.filter((a) => !a.skip).length;
  const closedCount = monthData.apartments.filter((a) => a.skip).length;
  const paidCount = monthData.apartments.filter((a) => a.paid).length;
  const totalOpenAmount = monthData.apartments
    .filter((a) => !a.skip)
    .reduce((s, a) => s + (a.amount || 0), 0);

  // Global Maintenance Fee state
  const [globalMaintenanceFee, setGlobalMaintenanceFee] = useState<number>(
    monthData.apartments[0]?.amount || 150
  );
  const [feeAppliedSuccess, setFeeAppliedSuccess] = useState(false);

  // Apply monthly maintenance fee to ALL apartments
  const handleApplyFeeToAll = () => {
    if (globalMaintenanceFee <= 0) return;

    const updatedApts = monthData.apartments.map((a) => ({
      ...a,
      amount: globalMaintenanceFee,
    }));

    // Recalculate auto collected amount if not manually locked
    let newCollected = monthData.collectedAmount;
    if (!monthData.manualCollectedEdited) {
      newCollected = updatedApts.reduce((acc, apt) => {
        let sum = 0;
        if (apt.paid) sum += apt.amount || 0;
        if (apt.paidExtraMaint && activeExtraMaint) sum += activeExtraMaint.amountPerApt || 0;
        return acc + sum;
      }, 0);
    }

    onUpdateMonthData({
      ...monthData,
      collectedAmount: newCollected,
      apartments: updatedApts,
    });

    onUpdateMasterResidents(
      updatedApts.map((a) => ({
        ...a,
        amount: globalMaintenanceFee,
      }))
    );

    setFeeAppliedSuccess(true);
    setTimeout(() => setFeeAppliedSuccess(false), 5000);
  };

  // Open Edit Modal with strict fields (Requirement #3)
  const handleOpenEdit = (apt: Apartment) => {
    setEditingApt(apt);
    setFormName(apt.name || '');
    setFormPhone(apt.phone || '');
    setFormPaid(apt.paid);
    setFormAmount(apt.amount || 0);
    setFormSkip(apt.skip);
  };

  const handleCloseEdit = () => {
    setEditingApt(null);
  };

  // Save Resident Edit Modal (Requirement #3 & #5)
  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApt) return;

    const wasPaidBefore = editingApt.paid;
    const isNowPaid = formPaid;

    const updatedApts = monthData.apartments.map((a) => {
      if (a.id === editingApt.id) {
        return {
          ...a,
          name: formName.trim(),
          phone: formPhone.trim(),
          paid: formPaid,
          amount: formAmount,
          skip: formSkip,
        };
      }
      return a;
    });

    let newCollected = monthData.collectedAmount;
    let colExtraManual = monthData.colExtraManual || 0;

    // Requirement #5: If manualCollectedEdited is active and status changed to paid, increment collected amount directly
    if (!wasPaidBefore && isNowPaid && monthData.manualCollectedEdited) {
      newCollected += formAmount;
    }

    const updatedMonthData: MonthData = {
      ...monthData,
      collectedAmount: newCollected,
      colExtraManual,
      apartments: updatedApts,
    };

    onUpdateMonthData(updatedMonthData);

    // Update master template
    onUpdateMasterResidents(
      updatedApts.map((a) => ({
        ...a,
        paid: false,
        paidExtraMaint: false,
      }))
    );

    setEditingApt(null);
  };

  // Toggle Paid status directly from table checkbox
  const handleTogglePaid = (aptId: number, newPaidState: boolean) => {
    const targetApt = monthData.apartments.find((a) => a.id === aptId);
    if (!targetApt) return;

    const updatedApts = monthData.apartments.map((a) => {
      if (a.id === aptId) {
        return { ...a, paid: newPaidState };
      }
      return a;
    });

    let newCollected = monthData.collectedAmount;
    if (newPaidState && monthData.manualCollectedEdited) {
      newCollected += targetApt.amount || 0;
    }

    onUpdateMonthData({
      ...monthData,
      collectedAmount: newCollected,
      apartments: updatedApts,
    });
  };

  // WhatsApp quick receipt link
  const handleSendWhatsApp = (apt: Apartment) => {
    if (!apt.phone) return;
    let cleanPhone = apt.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '2' + cleanPhone;

    const msg = `🏢 *برج المعتز 10*\nإيصال تحصيل شهري - ${monthData.monthName} ${monthData.year}\n\n🏠 الشقة: ${apt.aptNumber} (الدور ${apt.floor})\n👤 الساكن: ${apt.name || '—'}\n💰 المبلغ الشهري: ${formatCurrency(apt.amount)}\n📌 حالة السداد: ${apt.paid ? 'مسدد ✓' : 'لم يُسدد بعد ✗'}\n\nشكراً لتعاونكم 🙏`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* GLOBAL MONTHLY MAINTENANCE FEE INPUT PANEL */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-400">
                تحديد قيمة الصيانة الشهرية لجميع سكان البرج
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                يمكنك كتابة قيمة الصيانة هنا ثم الضغط على الزر لتطبيقها فوراً على كافة الشقق الـ 160.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="number"
                min="0"
                step="5"
                value={globalMaintenanceFee}
                onChange={(e) => setGlobalMaintenanceFee(parseFloat(e.target.value) || 0)}
                className="w-32 bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-center text-sm font-black text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
                placeholder="150"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                ج.م
              </span>
            </div>

            <button
              onClick={handleApplyFeeToAll}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <span>⚡ تطبيق المبلغ على الجميع</span>
            </button>
          </div>
        </div>

        {feeAppliedSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold p-2.5 rounded-xl text-center animate-fadeIn">
            ✅ تم تطبيق مبلغ الصيانة ({globalMaintenanceFee} ج.م) بنجاح على جميع شقق البرج (160 شقة)!
          </div>
        )}
      </div>

      {/* Top Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 font-semibold">🟢 شقق مفتوحة</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{openCount}</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 font-semibold">🔴 شقق مغلقة</div>
          <div className="text-xl font-black text-rose-400 mt-1">{closedCount}</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 font-semibold">✅ عدد المسددين</div>
          <div className="text-xl font-black text-amber-400 mt-1">{paidCount} / 160</div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[11px] text-slate-400 font-semibold">💰 مطلوب المفتوحة</div>
          <div className="text-sm font-black text-amber-300 mt-1 dir-ltr text-center">
            {formatCurrency(totalOpenAmount)}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="🔍 بحث بالاسم، رقم الموبايل، رقم الشقة أو الدور..."
            value={searchTerm}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg hover:border-slate-600">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
            className="w-4 h-4 accent-amber-500 cursor-pointer rounded"
          />
          <span>عرض الشقق المغلقة ({closedCount})</span>
        </label>
      </div>

      {/* Resident Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="p-3 bg-slate-800/80 border-b border-slate-800 text-xs text-slate-400 font-semibold">
          جدول إدخال ومعاينة السكان (160 شقة)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-800/90 text-amber-400 font-bold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center w-10">م</th>
                <th className="p-3">الشقة والدور</th>
                <th className="p-3">اسم الساكن</th>
                <th className="p-3">رقم الموبايل</th>
                <th className="p-3 text-center">المبلغ الشهري</th>
                <th className="p-3 text-center">حالة السداد</th>
                <th className="p-3 text-center">حالة الشقة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredApartments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    لا توجد شقق مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredApartments.map((apt, idx) => (
                  <tr
                    key={apt.id}
                    className={`transition ${
                      apt.skip
                        ? 'bg-rose-950/20 opacity-60'
                        : apt.paid
                        ? 'bg-emerald-950/20'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-3">
                      <div className="font-black text-amber-300">شقة {apt.aptNumber}</div>
                      <div className="text-[10px] text-slate-400">الدور {apt.floor}</div>
                    </td>
                    <td className="p-3 font-semibold">
                      {apt.name || <span className="text-slate-500 italic">بدون اسم</span>}
                    </td>
                    <td className="p-3 font-mono text-slate-300 dir-ltr text-right">
                      {apt.phone || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-3 text-center font-bold text-amber-400">
                      {formatCurrency(apt.amount)}
                    </td>
                    <td className="p-3 text-center">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={apt.paid}
                          disabled={apt.skip}
                          onChange={(e) => handleTogglePaid(apt.id, e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                        />
                        <span
                          className={`text-[11px] font-bold ${
                            apt.paid ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {apt.paid ? 'مسدد ✓' : 'غير مسدد'}
                        </span>
                      </label>
                    </td>
                    <td className="p-3 text-center">
                      {apt.skip ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-900/40 text-rose-300 border border-rose-700/50 px-2 py-0.5 rounded-full font-semibold">
                          <EyeOff className="w-3 h-3" /> مغلقة (لا يطبع)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full font-semibold">
                          <Eye className="w-3 h-3" /> مفتوحة (هيطبع)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {apt.phone && (
                          <button
                            onClick={() => handleSendWhatsApp(apt)}
                            className="p-1.5 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 rounded border border-emerald-700/50 transition"
                            title="إرسال واتساب"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(apt)}
                          className="flex items-center gap-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 border border-amber-500/40 text-[11px] font-bold px-2.5 py-1 rounded transition"
                        >
                          <Edit className="w-3 h-3" />
                          <span>تعديل</span>
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

      {/* Requirement #3: Strict Resident Info Edit Modal */}
      {editingApt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black text-amber-400">
                تعديل معلومات شقة {editingApt.aptNumber} (الدور {editingApt.floor})
              </h3>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="space-y-4">
              {/* Field 1: Resident Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم الساكن
                </label>
                <input
                  type="text"
                  placeholder="أدخل اسم الساكن هنا..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Field 2: Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الموبايل (للواتساب)
                </label>
                <input
                  type="tel"
                  placeholder="01012345678"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 dir-ltr text-right focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Field 3: Payment Status */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  حالة السداد
                </label>
                <select
                  value={formPaid ? '1' : '0'}
                  onChange={(e) => setFormPaid(e.target.value === '1')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="1">🟢 مسدد ✓</option>
                  <option value="0">🔴 غير مسدد</option>
                </select>
              </div>

              {/* Field 4: Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  المبلغ (جنيه مصري)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Field 5: Apartment Open/Closed (Maftouh or Maghlaq) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  حالة الشقة (الطباعة والربط)
                </label>
                <select
                  value={formSkip ? '1' : '0'}
                  onChange={(e) => setFormSkip(e.target.value === '1')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="0">🟢 مفتوحة — هيطبع في الإيصالات واللوحات</option>
                  <option value="1">🔴 مغلقة — لا يطبع في الإيصالات</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2 rounded-lg text-xs shadow transition flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
