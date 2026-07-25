import React, { useState } from 'react';
import { MonthData, ExtraMaintenance, Apartment } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { Receipt, Printer, Search, ShieldCheck, DoorClosed, DoorOpen, CheckCircle2, XCircle, Layers } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface ReceiptsTabProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
}

export type ReceiptFilterType = 'paid' | 'open' | 'closed' | 'unpaid' | 'all';

// Helper to chunk array into groups of N
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ monthData, activeExtraMaint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ReceiptFilterType>('paid');
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);

  // Group apartments by category
  const allApartments = monthData.apartments || [];
  const openApartments = allApartments.filter((apt) => !apt.skip);
  const closedApartments = allApartments.filter((apt) => apt.skip);
  const paidApartments = openApartments.filter((apt) => apt.paid);
  const unpaidApartments = openApartments.filter((apt) => !apt.paid);

  // Filter apartments based on active filterType and search term
  const filteredApartments = allApartments.filter((apt) => {
    // Filter Type matching
    if (filterType === 'paid' && (apt.skip || !apt.paid)) return false;
    if (filterType === 'open' && apt.skip) return false;
    if (filterType === 'closed' && !apt.skip) return false;
    if (filterType === 'unpaid' && (apt.skip || apt.paid)) return false;

    // Search term filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (apt.name && apt.name.toLowerCase().includes(term)) ||
      apt.aptNumber.toString().includes(term) ||
      (apt.phone && apt.phone.includes(term))
    );
  });

  // Batch Print Handler
  const handlePrintCategory = (type: ReceiptFilterType) => {
    setFilterType(type);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Chunk filtered apartments into pages of 5 items
  const apartmentChunks = chunkArray(filteredApartments, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Individual Printable Receipt Modal */}
      {selectedApt && (
        <ReceiptModal
          apartment={selectedApt}
          monthData={monthData}
          activeExtraMaint={activeExtraMaint}
          onClose={() => setSelectedApt(null)}
        />
      )}

      {/* Top Action Bar (Screen Only) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-amber-400">
              إيصالات التحصيل الشهري المعتمدة — {monthData.monthName} {monthData.year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              طباعة إيصالات مجمعة معتمدة بالختم البيضاوي (5 إيصالات بالصفحة) مع خيارات التصفية
            </p>
          </div>
        </div>

        {/* Quick Print Category Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePrintCategory('paid')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition active:scale-95"
            title="طباعة إيصالات المسددين فقط"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة المسددين ({paidApartments.length}) 📄</span>
          </button>

          <button
            onClick={() => handlePrintCategory('closed')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-amber-500/30 transition active:scale-95"
            title="طباعة إيصالات الشقق المغلقة (100 ج.م)"
          >
            <DoorClosed className="w-4 h-4 text-amber-400" />
            <span>طباعة المغلقة ({closedApartments.length}) 🚪</span>
          </button>

          <button
            onClick={() => handlePrintCategory('open')}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition active:scale-95"
            title="طباعة إيصالات الشقق المفتوحة"
          >
            <DoorOpen className="w-4 h-4" />
            <span>طباعة المفتوحة ({openApartments.length}) 🏢</span>
          </button>

          <button
            onClick={() => handlePrintCategory('all')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs border border-slate-700 transition"
            title="طباعة كافة الشقق الـ 160"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>طباعة الكل ({allApartments.length})</span>
          </button>
        </div>
      </div>

      {/* Interactive Filter Tabs & Search Bar (Screen Only) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 print:hidden">
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterType('paid')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              filterType === 'paid'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>المسددين فقط ({paidApartments.length})</span>
          </button>

          <button
            onClick={() => setFilterType('open')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              filterType === 'open'
                ? 'bg-blue-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>الشقق المفتوحة ({openApartments.length})</span>
          </button>

          <button
            onClick={() => setFilterType('closed')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              filterType === 'closed'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>الشقق المغلقة ({closedApartments.length})</span>
          </button>

          <button
            onClick={() => setFilterType('unpaid')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              filterType === 'unpaid'
                ? 'bg-rose-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>غير المسددين ({unpaidApartments.length})</span>
          </button>

          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-slate-700 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل ({allApartments.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم أو رقم الشقة أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* SCREEN UI: On-screen preview grid of receipts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        {filteredApartments.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-sm bg-slate-900/50 rounded-xl border border-slate-800">
            لا توجد إيصالات مطابقة للتصفية الحالية
          </div>
        ) : (
          filteredApartments.map((apt) => {
            const extraAmount = activeExtraMaint && apt.paidExtraMaint ? activeExtraMaint.amountPerApt : 0;
            const baseAmount = apt.skip ? 100 : (apt.amount || 0);
            const totalRequired = baseAmount + (activeExtraMaint ? activeExtraMaint.amountPerApt : 0);

            return (
              <div
                key={apt.id}
                className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden transition"
              >
                {/* Receipt Card Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="font-black text-amber-400 text-sm">🏢 أبراج المعتز لله — برج 10</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">
                      إيصال تحصيل رسوم صيانة — {monthData.monthName} {monthData.year}
                    </p>
                  </div>
                  <div className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-lg">
                    شقة {apt.aptNumber} {apt.skip ? '(مغلقة)' : ''}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-bold">الساكن:</span>
                    <span className="font-bold text-slate-100">{apt.name || '—'}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-bold">الدور:</span>
                    <span className="font-bold text-slate-100">الدور {apt.floor}</span>
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">الصيانة الشهري الأساسي:</span>
                    <span className="font-bold text-slate-200 dir-ltr">
                      {formatCurrency(baseAmount)}
                    </span>
                  </div>

                  {activeExtraMaint && (
                    <div className="flex justify-between text-purple-300">
                      <span>صيانة إضافية ({activeExtraMaint.title}):</span>
                      <span className="font-bold dir-ltr">
                        {formatCurrency(activeExtraMaint.amountPerApt)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-black text-sm">
                    <span className="text-amber-400">الإجمالي:</span>
                    <span className="text-emerald-400 dir-ltr font-mono">
                      {formatCurrency(totalRequired)}
                    </span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      apt.paid
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                        : 'bg-rose-900/60 text-rose-300 border border-rose-700/50'
                    }`}
                  >
                    {apt.paid ? 'تم السداد بالكامل ✓' : 'غير مسدد ✗'}
                  </span>

                  <button
                    onClick={() => setSelectedApt(apt)}
                    className="bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold px-3 py-1 rounded-lg text-xs border border-amber-500/40 transition flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>إيصال معتمد منفصل 📄</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PRINT-ONLY AREA: Exactly 5 Receipts Per Page formatted for A4 */}
      <div className="hidden print:block print-bulk-area">
        {apartmentChunks.length === 0 ? (
          <div className="text-center p-8 text-black font-bold">لا توجد إيصالات للطباعة</div>
        ) : (
          apartmentChunks.map((pageChunk: Apartment[], pageIndex: number) => (
            <div key={pageIndex} className="print-page-5-container">
              {pageChunk.map((apt: Apartment) => {
                const extraAmount = activeExtraMaint && apt.paidExtraMaint ? activeExtraMaint.amountPerApt : 0;
                const baseAmount = apt.skip ? 100 : (apt.amount || 0);
                const totalAmount = baseAmount + extraAmount;

                return (
                  <div key={apt.id} className="bulk-receipt-card-5">
                    {/* Top Row Header */}
                    <div className="flex justify-between items-center pb-1 border-b border-slate-900">
                      <div>
                        <h3 className="font-black text-xs text-black leading-none">
                          أبراج المعتز لله — برج 10 (إيصال تحصيل رسوم صيانة)
                        </h3>
                        <p className="text-[9px] text-slate-700 font-bold mt-0.5">
                          اتحاد الملاك — شهر {monthData.monthName} {monthData.year}
                        </p>
                      </div>
                      <div className="border-2 border-slate-900 text-black font-mono font-black text-xs px-2 py-0.5 rounded-md bg-slate-100">
                        شقة {apt.aptNumber} (الدور {apt.floor}) {apt.skip ? '[شقة مغلقة]' : ''}
                      </div>
                    </div>

                    {/* Resident & Financial Breakdown */}
                    <div className="grid grid-cols-12 gap-1.5 my-1 text-[10px] items-center">
                      <div className="col-span-5 bg-slate-50 p-1 rounded border border-slate-300">
                        <span className="text-[8px] text-slate-600 block font-bold">اسم الساكن:</span>
                        <span className="font-bold text-black truncate block">{apt.name || 'غير محدد'}</span>
                      </div>

                      <div className="col-span-7 bg-slate-50 p-1 rounded border border-slate-300 grid grid-cols-3 text-center items-center gap-0.5">
                        <div>
                          <span className="text-[8px] text-slate-600 block font-semibold">الصيانة:</span>
                          <span className="font-mono font-bold text-black dir-ltr">{formatCurrency(baseAmount)}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-600 block font-semibold">إضافية:</span>
                          <span className="font-mono font-bold text-black dir-ltr">{formatCurrency(extraAmount)}</span>
                        </div>
                        <div className="border-r border-slate-300 pr-0.5">
                          <span className="text-[8px] text-black font-black block">الإجمالي:</span>
                          <span className="font-mono font-black text-black dir-ltr">{formatCurrency(totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Status & Official Oval Stamp */}
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black px-2.5 py-0.5 rounded border ${
                            apt.paid
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                              : 'bg-rose-100 text-rose-950 border-rose-600'
                          }`}
                        >
                          {apt.paid ? 'تم السداد بالكامل ✓' : 'غير مسدد ✗'}
                        </span>
                        <span className="text-[8px] text-slate-600 font-semibold">
                          تحرير: {new Date().toLocaleDateString('ar-EG')}
                        </span>
                      </div>

                      {/* Official Oval Stamp (الختم البيضاوي المعتمد) */}
                      <div className="relative inline-flex items-center justify-center select-none text-blue-900 border-2 border-double border-blue-900 rounded-[50%] px-2 py-0.5 rotate-[-4deg] bg-transparent w-28 h-10">
                        <div className="text-center leading-tight">
                          <div className="text-[7px] font-black text-blue-900">★ أبراج المعتز لله ★</div>
                          <div className="text-[8px] font-black text-blue-950">برج 10</div>
                          <div className="text-[6px] font-bold text-blue-800">إيصال معتمد - الحسابات</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
