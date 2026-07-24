import React, { useState } from 'react';
import { MonthData, ExtraMaintenance, Apartment } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { Receipt, Printer, MessageSquare, Search, FileText, CheckCircle2 } from 'lucide-react';

interface ReceiptsTabProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
}

export const ReceiptsTab: React.FC<ReceiptsTabProps> = ({ monthData, activeExtraMaint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApt, setSelectedApt] = useState<Apartment | null>(null);

  const openApartments = monthData.apartments.filter((apt) => !apt.skip);

  const filteredApartments = openApartments.filter((apt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      apt.name.toLowerCase().includes(term) ||
      apt.aptNumber.toString().includes(term) ||
      apt.phone.includes(term)
    );
  });

  // Batch Print
  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-amber-400">
              إيصالات التحصيل الشهري — {monthData.monthName} {monthData.year}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              طباعة ومعاينة وإرسال الإيصالات للشقق المفتوحة ({openApartments.length} إيصال)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الإيصالات (5 في الصفحة)</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="تصفية الإيصالات بالاسم أو رقم الشقة..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Printable Receipt Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-2">
        {filteredApartments.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-slate-500 text-sm bg-slate-900/50 rounded-xl">
            لا توجد إيصالات مطابقة
          </div>
        ) : (
          filteredApartments.map((apt) => {
            const extraAmount = activeExtraMaint && apt.paidExtraMaint ? activeExtraMaint.amountPerApt : 0;
            const totalRequired = (apt.amount || 0) + (activeExtraMaint ? activeExtraMaint.amountPerApt : 0);

            return (
              <div
                key={apt.id}
                className="bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-5 shadow-md space-y-3 relative overflow-hidden print:bg-white print:text-black print:border-black print:p-3 print:rounded-none"
              >
                {/* Header of Receipt */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 print:border-black">
                  <div>
                    <h3 className="font-black text-amber-400 text-sm print:text-black">🏢 برج المعتز 10</h3>
                    <p className="text-[10px] text-slate-400 print:text-gray-600">
                      إيصال تحصيل — {monthData.monthName} {monthData.year}
                    </p>
                  </div>
                  <div className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 rounded-lg print:border print:border-black">
                    شقة {apt.aptNumber}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-800/60 p-2 rounded print:bg-gray-100">
                    <span className="text-[10px] text-slate-400 block print:text-gray-600">الساكن:</span>
                    <span className="font-bold text-slate-100 print:text-black">{apt.name || '—'}</span>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded print:bg-gray-100">
                    <span className="text-[10px] text-slate-400 block print:text-gray-600">الدور:</span>
                    <span className="font-bold text-slate-100 print:text-black">الدور {apt.floor}</span>
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 print:text-gray-700">الصيانة الشهري الأساسي:</span>
                    <span className="font-bold text-slate-200 dir-ltr print:text-black">
                      {formatCurrency(apt.amount)}
                    </span>
                  </div>

                  {activeExtraMaint && (
                    <div className="flex justify-between text-purple-300 print:text-purple-900">
                      <span>صيانة إضافية ({activeExtraMaint.title}):</span>
                      <span className="font-bold dir-ltr">
                        {formatCurrency(activeExtraMaint.amountPerApt)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 print:border-gray-300 font-black text-sm">
                    <span className="text-amber-400 print:text-black">الإجمالي المطلوب:</span>
                    <span className="text-emerald-400 dir-ltr print:text-black">
                      {formatCurrency(totalRequired)}
                    </span>
                  </div>
                </div>

                {/* Status Stamp */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 print:border-gray-300">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      apt.paid
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 print:bg-green-100 print:text-green-800'
                        : 'bg-rose-900/60 text-rose-300 border border-rose-700/50 print:bg-red-100 print:text-red-800'
                    }`}
                  >
                    {apt.paid ? 'مسدد ✓' : 'غير مسدد ✗'}
                  </span>

                  <span className="text-[10px] text-slate-500 font-mono">
                    تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
