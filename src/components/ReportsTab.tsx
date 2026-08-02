import React, { useState, useRef } from 'react';
import { MonthData, ExtraMaintenance, Apartment, Expense } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { calculateCollectedAmount } from '../lib/storage';
import { toBlob } from 'html-to-image';
import {
  FileText,
  Printer,
  FileCheck,
  Building,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Search,
  Filter,
  Receipt,
  Download,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Image,
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';

interface ReportsTabProps {
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ monthData, activeExtraMaint }) => {
  const [activeSubReport, setActiveSubReport] = useState<'financial' | 'paid' | 'unpaid' | 'extraMaint'>('financial');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAptForReceipt, setSelectedAptForReceipt] = useState<Apartment | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter open apartments (skip = false)
  const openApartments = monthData.apartments.filter((apt) => !apt.skip);

  // Unpaid apartments for base monthly maintenance
  const unpaidApartments = openApartments.filter((apt) => !apt.paid);
  const paidApartments = openApartments.filter((apt) => apt.paid);

  // Unpaid/Paid for Extra Maintenance
  const extraMaintPaidApts = openApartments.filter((apt) => apt.paidExtraMaint);
  const extraMaintUnpaidApts = openApartments.filter((apt) => !apt.paidExtraMaint);

  // Calculate Financials
  const extraCollected = activeExtraMaint
    ? extraMaintPaidApts.length * activeExtraMaint.amountPerApt
    : 0;
  const totalCollectedActual = calculateCollectedAmount(monthData, activeExtraMaint);

  const totalExpenses = monthData.expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const netBalance = monthData.prevBalance + totalCollectedActual - totalExpenses;

  // Unpaid/Paid Totals
  const totalUnpaidAmount = unpaidApartments.reduce((acc, apt) => acc + (apt.amount || 0), 0);
  const totalPaidAmount = paidApartments.reduce((acc, apt) => acc + (apt.amount || 0), 0);
  const extraMaintUnpaidTotal = activeExtraMaint
    ? extraMaintUnpaidApts.length * activeExtraMaint.amountPerApt
    : 0;

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadReportImage = async () => {
    if (!reportRef.current) return;
    setIsGeneratingImage(true);
    try {
      const blob = await toBlob(reportRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0f172a',
        cacheBust: true,
      });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `كشف_${activeSubReport}_${monthData.key}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating report image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Receipt Modal Popup */}
      {selectedAptForReceipt && (
        <ReceiptModal
          apartment={selectedAptForReceipt}
          monthData={monthData}
          activeExtraMaint={activeExtraMaint}
          onClose={() => setSelectedAptForReceipt(null)}
        />
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-amber-400 flex items-center gap-2">
              <span>كتاب التقارير المالية والإحصائية الرسمية</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                {monthData.monthName} {monthData.year}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              استخراج طباعة كافة التقارير وكشوف السداد وغير المسددين مستخرجة كنص نظام رسمي مطبوع مع الختم البيضاوي المعتمد
            </p>
          </div>
        </div>

        {/* Global Print Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>تصدير PDF / طباعة التقرير المطبوع 📄</span>
          </button>

          <button
            onClick={handleDownloadReportImage}
            disabled={isGeneratingImage}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-4 py-2 rounded-xl text-xs shadow transition active:scale-95 disabled:opacity-50"
          >
            <Image className="w-4 h-4" />
            <span>{isGeneratingImage ? 'جاري تجهيز الصورة...' : 'حفظ الكشف كصورة (PNG 🖼️)'}</span>
          </button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-900/70 p-1.5 rounded-xl border border-slate-800 print:hidden">
        <button
          onClick={() => setActiveSubReport('financial')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
            activeSubReport === 'financial'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>1. تقرير حسابات العمارة الشامل</span>
        </button>

        <button
          onClick={() => setActiveSubReport('paid')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition relative ${
            activeSubReport === 'paid'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>2. كشف المسددين للصيانة ({paidApartments.length})</span>
        </button>

        <button
          onClick={() => setActiveSubReport('unpaid')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition relative ${
            activeSubReport === 'unpaid'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>3. كشف غير المسددين للصيانة ({unpaidApartments.length})</span>
          {unpaidApartments.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveSubReport('extraMaint')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
            activeSubReport === 'extraMaint'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4 text-purple-400" />
          <span>4. تقرير الصيانة الإضافية</span>
        </button>
      </div>

      {/* Printable / Downloadable Report Container */}
      <div ref={reportRef} className="space-y-6 print:space-y-4 bg-slate-950 print:bg-white p-4 print:p-0 rounded-2xl border border-slate-900 print:border-none">
        {/* ======================================================== */}
        {/* SUB REPORT 1: FULL FINANCIALS (تقرير حسابات العمارة كلها) */}
        {/* ======================================================== */}
      {activeSubReport === 'financial' && (
        <div className="space-y-6 print:space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">الرصيد السابق المنقول</span>
              <span className="text-base font-black text-amber-400 font-mono dir-ltr block">
                {formatCurrency(monthData.prevBalance)}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">المبلغ المحصل والإيرادات</span>
              <span className="text-base font-black text-emerald-400 font-mono dir-ltr block">
                {formatCurrency(totalCollectedActual)}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">المصروفات والنفقات</span>
              <span className="text-base font-black text-rose-400 font-mono dir-ltr block">
                {formatCurrency(totalExpenses)}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">الرصيد المتبقي والصافي</span>
              <span className="text-base font-black text-blue-400 font-mono dir-ltr block">
                {formatCurrency(netBalance)}
              </span>
            </div>
          </div>

          {/* Printable Report Document Card */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl print:bg-white print:text-black print:border-black print:p-6 print:shadow-none space-y-6">
            {/* Formal Print Header Block (Visible strictly on print / PDF export) */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-center">
              <h2 className="text-sm font-bold text-slate-800">جمهورية مصر العربية — اتحاد الملاك بالمحافظة</h2>
              <h1 className="text-xl font-black text-black mt-0.5">إدارة أبراج المعتز لله — برج 10</h1>
              <p className="text-xs font-bold text-slate-700 mt-0.5">كشف التقرير المالي والإحصائي الرسمي والختاميات المالية</p>
              <div className="flex justify-between items-center text-[10px] text-slate-800 font-mono mt-2 pt-2 border-t border-slate-400">
                <span>رقم مرجع التقرير: #BMU10-FIN-{monthData.key.replace('-', '')}</span>
                <span>شهر: {monthData.monthName} {monthData.year}</span>
                <span>تاريخ التصدير والطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            {/* Header Document Section (Screen View) */}
            <div className="flex justify-between items-start border-b border-slate-800 print:border-black pb-4">
              <div>
                <h3 className="font-black text-amber-400 print:text-black text-lg flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-400 print:text-black" />
                  <span>تقرير حسابات العمارة المعتمد — برج المعتز 10</span>
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
                  كشف حساب شهري شامل لكافة المدفوعات والمصروفات والأرصدة — لشهر {monthData.monthName} {monthData.year}
                </p>
              </div>

              <div className="text-left font-mono text-xs">
                <span className="bg-slate-800 text-slate-300 print:bg-slate-100 print:text-black px-3 py-1 rounded-lg border border-slate-700 print:border-black block font-bold">
                  تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}
                </span>
              </div>
            </div>

            {/* Financial Summary Table */}
            <div>
              <h4 className="font-bold text-amber-300 print:text-black text-xs mb-2">أولاً: ملخص حركة الميزانية والرصيد:</h4>
              <table className="w-full text-xs text-right border border-slate-800 print:border-black">
                <thead className="bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-bold">
                  <tr>
                    <th className="p-2.5 border border-slate-700 print:border-black">البند / البيان</th>
                    <th className="p-2.5 border border-slate-700 print:border-black text-center">المبلغ (ج.م)</th>
                    <th className="p-2.5 border border-slate-700 print:border-black">ملاحظات والتفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-black">
                  <tr>
                    <td className="p-2.5 font-bold border border-slate-800 print:border-black">الرصيد المنقول من الشهر السابق</td>
                    <td className="p-2.5 font-mono font-bold text-amber-400 print:text-black text-center dir-ltr">
                      {formatCurrency(monthData.prevBalance)}
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-gray-700">رصيد بداية الشهر المرحل تلقائياً</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border border-slate-800 print:border-black">إجمالي التحصيلات (صيانة أساسية + إضافية)</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-400 print:text-black text-center dir-ltr">
                      {formatCurrency(totalCollectedActual)}
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-gray-700">
                      محصل من {paidApartments.length} شقة مسددة
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border border-slate-800 print:border-black">إجمالي المصروفات والنفقات التشغيلية</td>
                    <td className="p-2.5 font-mono font-bold text-rose-400 print:text-black text-center dir-ltr">
                      {formatCurrency(totalExpenses)}
                    </td>
                    <td className="p-2.5 text-slate-400 print:text-gray-700">
                      إجمالي {monthData.expenses.length} بند مصروفات منفذة
                    </td>
                  </tr>
                  <tr className="bg-amber-500/10 print:bg-slate-200 font-black text-sm">
                    <td className="p-3 border border-slate-800 print:border-black text-amber-400 print:text-black">
                      صافي الرصيد المتبقي بعهدة إدارة البرج
                    </td>
                    <td className="p-3 border border-slate-800 print:border-black text-emerald-400 print:text-black text-center font-mono dir-ltr">
                      {formatCurrency(netBalance)}
                    </td>
                    <td className="p-3 border border-slate-800 print:border-black text-amber-300 print:text-black">
                      الرصيد الفعلي الحالي المتاح
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Expenses Breakdown Table */}
            <div>
              <h4 className="font-bold text-rose-300 print:text-black text-xs mb-2">ثانياً: بيان تفصيلي ببنود المصروفات المسجلة:</h4>
              {monthData.expenses.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">
                  لا توجد مصروفات مسجلة لهذا الشهر حتى الآن.
                </div>
              ) : (
                <table className="w-full text-xs text-right border border-slate-800 print:border-black">
                  <thead className="bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-bold">
                    <tr>
                      <th className="p-2 border border-slate-700 print:border-black text-center">#</th>
                      <th className="p-2 border border-slate-700 print:border-black">بند المصروف / الخدمة</th>
                      <th className="p-2 border border-slate-700 print:border-black text-center">التاريخ</th>
                      <th className="p-2 border border-slate-700 print:border-black text-center">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-black">
                    {monthData.expenses.map((exp, idx) => (
                      <tr key={exp.id || idx}>
                        <td className="p-2 text-center font-mono text-slate-400 print:text-black">{idx + 1}</td>
                        <td className="p-2 font-bold text-slate-200 print:text-black">{exp.name}</td>
                        <td className="p-2 text-center text-slate-400 print:text-black font-mono">{exp.date}</td>
                        <td className="p-2 text-center font-mono font-bold text-rose-300 print:text-black dir-ltr">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-800/80 print:bg-slate-100 font-bold">
                      <td colSpan={3} className="p-2 text-left pl-4 text-slate-300 print:text-black">
                        مجموع المصروفات:
                      </td>
                      <td className="p-2 text-center font-mono font-black text-rose-400 print:text-black dir-ltr">
                        {formatCurrency(totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Official Stamp & Signatures */}
            <div className="pt-4 grid grid-cols-2 gap-4 items-end border-t border-slate-800 print:border-black">
              <div className="text-xs text-slate-400 print:text-black space-y-1">
                <p className="font-bold">جهة الاعتماد والحسابات:</p>
                <p className="font-black text-amber-400 print:text-black text-sm">اتحاد الملاك (إدارة برج المعتز 10)</p>
                <p className="text-[10px] text-slate-500 print:text-gray-600">تم مراجعة الكشف واعتماده رسمياً.</p>
              </div>

              {/* Official Stamp */}
              <div className="flex justify-end">
                <div className="relative inline-flex items-center justify-center select-none text-blue-800 print:text-blue-900 border-4 border-double border-blue-800 print:border-blue-900 rounded-[50%] p-2.5 rotate-[-6deg] bg-blue-500/5 print:bg-transparent shadow-sm w-36 h-24">
                  <div className="absolute inset-1 border border-dashed border-blue-700/60 rounded-[50%]" />
                  <div className="text-center leading-tight">
                    <div className="text-[10px] font-black tracking-tight text-blue-900">★ أبراج المعتز لله ★</div>
                    <div className="text-xs font-black my-0.5 text-blue-950 underline underline-offset-2">برج 10</div>
                    <div className="text-[9px] font-bold text-blue-800">تقرير إداري معتمد</div>
                    <div className="text-[8px] font-mono text-blue-700 mt-0.5">اتحاد الملاك</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB REPORT 2: PAID MONTHLY MAINTENANCE (كشف المسددين للصيانة) */}
      {/* ======================================================== */}
      {activeSubReport === 'paid' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">عدد الشقق المسددة للصيانة</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {paidApartments.length} شقة من أصل {openApartments.length}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">إجمالي المحصل فعلياً</span>
                <span className="text-lg font-black text-amber-400 font-mono dir-ltr">
                  {formatCurrency(totalPaidAmount)}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">نسبة التحصيل والالتزام</span>
                <span className="text-lg font-black text-blue-400 font-mono">
                  {Math.round((paidApartments.length / (openApartments.length || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 print:bg-white print:text-black print:border-none print:p-0">
            {/* Header for Print/Image */}
            <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900">اتحاد ملاك برج المعتز 10</h2>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    كشف المسددين لاشتراكات الصيانة الشهرية
                  </p>
                </div>
                <div className="text-left font-mono text-xs text-slate-700">
                  <div>الشهر: {monthData.monthName} {monthData.year}</div>
                  <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-slate-800 print:border-black pb-3">
              <div>
                <h3 className="font-black text-emerald-400 print:text-black text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 print:text-black" />
                  <span>كشف حصري بالسكان المسددين لقيمة الصيانة الشهرية</span>
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                  برج المعتز 10 — شهر {monthData.monthName} {monthData.year}
                </p>
              </div>

              <span className="text-xs bg-emerald-500/20 text-emerald-300 print:bg-slate-200 print:text-black border border-emerald-500/30 print:border-black px-3 py-1 rounded-lg font-bold">
                إجمالي المحصل: {formatCurrency(totalPaidAmount)}
              </span>
            </div>

            {/* Paid Table */}
            {paidApartments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm bg-slate-950/50 rounded-xl border border-slate-800">
                لم يتم تسجيل أي سداد لاشتراكات الصيانة لهذا الشهر بعد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border border-slate-800 print:border-black">
                  <thead className="bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-bold">
                    <tr>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">شقة</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">الدور</th>
                      <th className="p-2.5 border border-slate-700 print:border-black">اسم الساكن</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">الهاتف</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">المبلغ المسدد</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">حالة السداد</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center print:hidden">إيصال السداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-black">
                    {paidApartments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-800/50 print:hover:bg-transparent">
                        <td className="p-2.5 text-center font-black text-amber-400 print:text-black text-sm border border-slate-800 print:border-black">
                          {apt.aptNumber}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-300 print:text-black border border-slate-800 print:border-black">
                          الدور {apt.floor}
                        </td>
                        <td className="p-2.5 font-bold text-slate-100 print:text-black border border-slate-800 print:border-black">
                          <div>{apt.name || 'غير محدد'}</div>
                          {apt.note && (
                            <div className="text-[10px] text-amber-400/90 font-normal mt-0.5">
                              📝 {apt.note}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-400 print:text-black border border-slate-800 print:border-black dir-ltr">
                          {apt.phone || '—'}
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-emerald-300 print:text-black border border-slate-800 print:border-black dir-ltr">
                          {formatCurrency(apt.amount)}
                        </td>
                        <td className="p-2.5 text-center border border-slate-800 print:border-black">
                          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-900 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            <span>✅</span>
                            <span>مسدد</span>
                          </span>
                        </td>
                        <td className="p-2 text-center print:hidden">
                          <button
                            onClick={() => setSelectedAptForReceipt(apt)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2.5 py-1 rounded text-[11px] border border-amber-500/30 transition flex items-center gap-1 mx-auto"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>عرض الإيصال</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Stamp */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-800 print:border-black">
              <span className="text-[11px] text-slate-400 print:text-black">
                يعتمد هذا الكشف كبيان رسمي للمسددين لاشتراك الصيانة عن الشهر المذكور.
              </span>

              <div className="hidden print:block text-left">
                <div className="border-2 border-blue-900 text-blue-950 rounded-full px-4 py-1.5 text-center inline-block transform -rotate-3 bg-blue-50/50">
                  <div className="text-xs font-black my-0.5 text-blue-950 underline underline-offset-2">برج 10</div>
                  <div className="text-[9px] font-bold text-blue-800">تقرير إداري معتمد</div>
                  <div className="text-[8px] font-mono text-blue-700 mt-0.5">اتحاد الملاك</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB REPORT 3: UNPAID MONTHLY MAINTENANCE (غير المسددين) */}
      {/* ======================================================== */}
      {activeSubReport === 'unpaid' && (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">عدد الشقق غير المسددين</span>
                <span className="text-lg font-black text-rose-400 font-mono">
                  {unpaidApartments.length} شقة من أصل {openApartments.length}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">إجمالي المبالغ المتأخرة</span>
                <span className="text-lg font-black text-amber-400 font-mono dir-ltr">
                  {formatCurrency(totalUnpaidAmount)}
                </span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">نسبة الالتزام بالسداد</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {Math.round((paidApartments.length / (openApartments.length || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Unpaid List Document */}
          <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-xl print:bg-white print:text-black print:border-black print:p-6 space-y-4">
            {/* Formal Print Header Block (Visible strictly on print / PDF export) */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4 text-center">
              <h2 className="text-sm font-bold text-slate-800">جمهورية مصر العربية — اتحاد الملاك بالمحافظة</h2>
              <h1 className="text-xl font-black text-black mt-0.5">إدارة أبراج المعتز لله — برج 10</h1>
              <p className="text-xs font-bold text-slate-700 mt-0.5">كشف رسمي حصري بالمشتركين غير المسددين لقيمة الصيانة الشهري</p>
              <div className="flex justify-between items-center text-[10px] text-slate-800 font-mono mt-2 pt-2 border-t border-slate-400">
                <span>رقم مرجع الكشف: #BMU10-UNPAID-{monthData.key.replace('-', '')}</span>
                <span>شهر: {monthData.monthName} {monthData.year}</span>
                <span>تاريخ التصدير والطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <div className="flex justify-between items-start border-b border-slate-800 print:border-black pb-3">
              <div>
                <h3 className="font-black text-rose-400 print:text-black text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 print:text-black" />
                  <span>كشف حصري بالسكان المتبقي عليهم قيمة الصيانة الشهري</span>
                </h3>
                <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                  برج المعتز 10 — شهر {monthData.monthName} {monthData.year}
                </p>
              </div>

              <span className="text-xs bg-rose-500/20 text-rose-300 print:bg-slate-200 print:text-black border border-rose-500/30 print:border-black px-3 py-1 rounded-lg font-bold">
                إجمالي المتبقي: {formatCurrency(totalUnpaidAmount)}
              </span>
            </div>

            {/* Unpaid Table */}
            {unpaidApartments.length === 0 ? (
              <div className="py-12 text-center text-emerald-400 font-bold text-sm bg-slate-950/50 rounded-xl border border-emerald-500/30">
                🎉 رائع جداً! تم تسديد جميع اشتراكات الصيانة بالكامل لهذا الشهر!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border border-slate-800 print:border-black">
                  <thead className="bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-bold">
                    <tr>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">شقة</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">الدور</th>
                      <th className="p-2.5 border border-slate-700 print:border-black">اسم الساكن</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">الهاتف</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center">القيمة المطلوب سدادها</th>
                      <th className="p-2.5 border border-slate-700 print:border-black text-center print:hidden">إجراءات الإيصال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-black">
                    {unpaidApartments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-800/50 print:hover:bg-transparent">
                        <td className="p-2.5 text-center font-black text-amber-400 print:text-black text-sm border border-slate-800 print:border-black">
                          {apt.aptNumber}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-300 print:text-black border border-slate-800 print:border-black">
                          الدور {apt.floor}
                        </td>
                        <td className="p-2.5 font-bold text-slate-100 print:text-black border border-slate-800 print:border-black">
                          {apt.name || 'غير محدد'}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-400 print:text-black border border-slate-800 print:border-black dir-ltr">
                          {apt.phone || '—'}
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-rose-300 print:text-black border border-slate-800 print:border-black dir-ltr">
                          {formatCurrency(apt.amount)}
                        </td>
                        <td className="p-2 text-center print:hidden">
                          <button
                            onClick={() => setSelectedAptForReceipt(apt)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-2.5 py-1 rounded text-[11px] border border-amber-500/30 transition flex items-center gap-1 mx-auto"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>معاينة إيصال</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Stamp */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-800 print:border-black">
              <span className="text-[11px] text-slate-400 print:text-black">
                يرجى من السادة المحترمين سرعة السداد بعهدة الإدارة.
              </span>

              <div className="relative inline-flex items-center justify-center select-none text-blue-800 print:text-blue-900 border-4 border-double border-blue-800 print:border-blue-900 rounded-[50%] p-2 rotate-[-5deg] w-32 h-20">
                <div className="text-center leading-tight">
                  <div className="text-[9px] font-black text-blue-900">أبراج المعتز لله — 10</div>
                  <div className="text-[8px] font-bold text-blue-800">كشف مطالبات معتمد</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB REPORT 3: EXTRA MAINTENANCE REPORT (الصيانة الإضافية) */}
      {/* ======================================================== */}
      {activeSubReport === 'extraMaint' && (
        <div className="space-y-6">
          {!activeExtraMaint ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
              <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">لا توجد صيانة إضافية نشطة حالياً لهذا الشهر</h3>
              <p className="text-xs text-slate-500">
                يمكنك إضافة بند صيانة إضافية جديدة (مثل إصلاح أسانسير، عزل سطح...) من تاب "صيانة إضافية".
              </p>
            </div>
          ) : (
            <>
              {/* Extra Maint Header Details */}
              <div className="bg-slate-900 border border-purple-500/40 p-5 rounded-2xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold">
                    بند الصيانة الإضافية المقررة: {activeExtraMaint.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    القيمة لكل شقة: {formatCurrency(activeExtraMaint.amountPerApt)}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">المسددون للإضافية:</span>
                    <span className="font-bold text-emerald-400 text-sm">{extraMaintPaidApts.length} شقة</span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">المحصّل الفعلي منها:</span>
                    <span className="font-bold text-amber-300 font-mono text-sm dir-ltr">
                      {formatCurrency(extraCollected)}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[10px]">المتبقي غير المسدد:</span>
                    <span className="font-bold text-rose-400 font-mono text-sm dir-ltr">
                      {formatCurrency(extraMaintUnpaidTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid with Two Tables: Paid vs Unpaid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table 1: Paid Extra Maintenance */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 print:bg-white print:text-black">
                  <h4 className="font-black text-emerald-400 print:text-black text-xs flex items-center gap-2 pb-2 border-b border-slate-800 print:border-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>قائمة المسددين للصيانة الإضافية ({extraMaintPaidApts.length})</span>
                  </h4>

                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs text-right border border-slate-800 print:border-black">
                      <thead className="bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-bold">
                        <tr>
                          <th className="p-2 text-center border border-slate-700 print:border-black">شقة</th>
                          <th className="p-2 border border-slate-700 print:border-black">الساكن</th>
                          <th className="p-2 text-center border border-slate-700 print:border-black">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 print:divide-black">
                        {extraMaintPaidApts.map((apt) => (
                          <tr key={apt.id}>
                            <td className="p-2 text-center font-bold text-amber-400 print:text-black border border-slate-800 print:border-black">
                              {apt.aptNumber}
                            </td>
                            <td className="p-2 text-slate-200 print:text-black font-semibold border border-slate-800 print:border-black">
                              {apt.name || '—'}
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-emerald-300 print:text-black border border-slate-800 print:border-black dir-ltr">
                              {formatCurrency(activeExtraMaint.amountPerApt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: Unpaid Extra Maintenance */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 print:bg-white print:text-black">
                  <h4 className="font-black text-rose-400 print:text-black text-xs flex items-center gap-2 pb-2 border-b border-slate-800 print:border-black">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>قائمة غير المسددين للصيانة الإضافية ({extraMaintUnpaidApts.length})</span>
                  </h4>

                  <div className="max-h-80 overflow-y-auto">
                    <table className="w-full text-xs text-right border border-slate-800 print:border-black">
                      <thead className="bg-slate-800 print:bg-slate-200 text-slate-200 print:text-black font-bold">
                        <tr>
                          <th className="p-2 text-center border border-slate-700 print:border-black">شقة</th>
                          <th className="p-2 border border-slate-700 print:border-black">الساكن</th>
                          <th className="p-2 text-center border border-slate-700 print:border-black">المبلغ المتبقي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 print:divide-black">
                        {extraMaintUnpaidApts.map((apt) => (
                          <tr key={apt.id}>
                            <td className="p-2 text-center font-bold text-amber-400 print:text-black border border-slate-800 print:border-black">
                              {apt.aptNumber}
                            </td>
                            <td className="p-2 text-slate-200 print:text-black font-semibold border border-slate-800 print:border-black">
                              {apt.name || '—'}
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-rose-300 print:text-black border border-slate-800 print:border-black dir-ltr">
                              {formatCurrency(activeExtraMaint.amountPerApt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

