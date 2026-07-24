import React, { useRef, useState } from 'react';
import { Apartment, MonthData, ExtraMaintenance } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { Printer, X, CheckCircle2, Building, ShieldCheck, Download, Share2, Image, MessageSquare } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReceiptModalProps {
  apartment: Apartment;
  monthData: MonthData;
  activeExtraMaint: ExtraMaintenance | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  apartment,
  monthData,
  activeExtraMaint,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const extraAmount = activeExtraMaint && apartment.paidExtraMaint ? activeExtraMaint.amountPerApt : 0;
  const totalAmount = (apartment.amount || 0) + extraAmount;
  const issueDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  // Convert receipt DOM node to PNG Blob / Data URL
  const generateReceiptImage = async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    try {
      setIsGeneratingImage(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // high quality
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } catch (err) {
      console.error('Error generating image:', err);
      return null;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 1. Download image as PNG for WhatsApp
  const handleDownloadImage = async () => {
    const blob = await generateReceiptImage();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `إيصال_سداد_شقة_${apartment.aptNumber}_${monthData.key}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Share via WhatsApp with Image / Direct WhatsApp text + Auto Download Image
  const handleShareWhatsAppImage = async () => {
    const blob = await generateReceiptImage();
    if (!blob) return;

    const fileName = `إيصال_سداد_شقة_${apartment.aptNumber}_${monthData.key}.png`;
    const imageFile = new File([blob], fileName, { type: 'image/png' });

    // Text message
    const message = `تأكيد سداد إيصال صيانة برج المعتز 10 - اتحاد الملاك\n` +
      `اسم الساكن: ${apartment.name || 'غير محدد'}\n` +
      `رقم الشقة: ${apartment.aptNumber} (الدور ${apartment.floor})\n` +
      `عن شهر: ${monthData.monthName} ${monthData.year}\n` +
      `المبلغ الإجمالي المحصل: ${totalAmount} ج.م\n` +
      `تم إرفاق/تحميل صورة الإيصال المعتمد بالختم البيضاوي الرسمى.`;

    // Try Web Share API (Mobile WhatsApp photo share)
    if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
      try {
        await navigator.share({
          files: [imageFile],
          title: `إيصال شقة ${apartment.aptNumber}`,
          text: message,
        });
        return;
      } catch (e) {
        console.log('Native share cancelled or failed, falling back to download + web share');
      }
    }

    // Fallback: Download image and open WhatsApp link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Format phone
    let rawPhone = apartment.phone ? apartment.phone.replace(/\D/g, '') : '';
    if (rawPhone.startsWith('0')) {
      rawPhone = '2' + rawPhone;
    }

    const waUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Actions Bar (Hidden when printing) */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>معاينة إيصال السداد المعتمد</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShareWhatsAppImage}
              disabled={isGeneratingImage}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
              title="إرسال عبر واتساب كصورة"
            >
              <MessageSquare className="w-4 h-4 text-emerald-200" />
              <span>إرسال واتساب (صورة 📸)</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
              title="حفظ بصيغة صورة PNG"
            >
              <Image className="w-4 h-4" />
              <span>تحميل صورة 🖼️</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              <span>تحميل PDF / طباعة</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Captureable Receipt Body */}
        <div className="p-6 overflow-y-auto bg-slate-950 print:bg-white print:text-black print:p-8 print:w-full">
          <div
            ref={receiptRef}
            className="bg-white text-black border-2 border-amber-600 print:border-slate-800 rounded-2xl p-6 space-y-5 relative shadow-xl print:shadow-none font-sans"
          >
            {/* Watermark / Background stamp header */}
            <div className="flex justify-between items-start border-b-2 border-amber-600 print:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building className="w-6 h-6 text-slate-900" />
                  <h1 className="text-lg font-black text-slate-900 tracking-wide">
                    أبراج المعتز لله — برج 10
                  </h1>
                </div>
                <p className="text-xs text-slate-800 font-bold">
                  اتحاد الملاك — إدارة البرج والشؤون المالية
                </p>
                <p className="text-[11px] text-slate-600">
                  العنوان: برج المعتز 10 — 12 دور (160 شقة)
                </p>
              </div>

              <div className="text-left space-y-1">
                <div className="inline-block bg-slate-100 border border-slate-400 text-slate-900 font-mono font-bold text-xs px-3 py-1 rounded-lg">
                  رقم الإيصال: #{apartment.aptNumber}-{monthData.key.replace('-', '')}
                </div>
                <p className="text-[10px] text-slate-600 font-semibold dir-rtl">
                  التاريخ: {issueDate}
                </p>
              </div>
            </div>

            {/* Title Badge */}
            <div className="text-center my-2">
              <span className="inline-block bg-slate-100 border border-slate-400 text-slate-900 font-black text-sm px-6 py-1.5 rounded-full shadow-inner">
                إيصال تحصيل رسوم الصيانة — {monthData.monthName} {monthData.year}
              </span>
            </div>

            {/* Resident Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                <span className="text-[10px] text-slate-600 block mb-0.5 font-bold">اسم الساكن المحصل منه:</span>
                <span className="font-black text-sm text-slate-900">{apartment.name || 'غير محدد'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-300">
                <span className="text-[10px] text-slate-600 block mb-0.5 font-bold">رقم الشقة والدور:</span>
                <span className="font-black text-sm text-slate-900">
                  شقة {apartment.aptNumber} (الدور {apartment.floor})
                </span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-200 p-2.5 font-bold text-slate-900 grid grid-cols-3 text-center border-b border-slate-300">
                <span>بيان الرسوم المحصلة</span>
                <span>الحالة</span>
                <span>المبلغ</span>
              </div>

              <div className="divide-y divide-slate-300 bg-white text-slate-900">
                {/* Monthly Base Maintenance */}
                <div className="p-2.5 grid grid-cols-3 text-center items-center">
                  <span className="font-semibold text-right pr-2">اشتراك الصيانة الشهري الأساسي</span>
                  <span>
                    {apartment.paid ? (
                      <span className="text-emerald-800 font-black">مسدد بالكامل ✓</span>
                    ) : (
                      <span className="text-rose-800 font-black">غير مسدد ✗</span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-900 dir-ltr">
                    {formatCurrency(apartment.amount)}
                  </span>
                </div>

                {/* Extra Maintenance if present */}
                {activeExtraMaint && (
                  <div className="p-2.5 grid grid-cols-3 text-center items-center">
                    <span className="font-semibold text-right pr-2">
                      صيانة إضافية ({activeExtraMaint.title})
                    </span>
                    <span>
                      {apartment.paidExtraMaint ? (
                        <span className="text-emerald-800 font-black">مسدد ✓</span>
                      ) : (
                        <span className="text-amber-800 font-black">غير مسدد</span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-slate-900 dir-ltr">
                      {formatCurrency(extraAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Amount Row */}
              <div className="bg-slate-100 p-3 font-black text-sm flex justify-between items-center border-t border-slate-400">
                <span className="text-slate-900">المبلغ الإجمالي المحصل:</span>
                <span className="text-slate-900 text-base font-mono font-black dir-ltr">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Confirmation Note & Stamp / Signatures */}
            <div className="pt-2 grid grid-cols-2 gap-4 items-end border-t border-slate-300">
              {/* Right: Notes */}
              <div className="space-y-2 text-[11px] text-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>تم استلام المبلغ الموضح أعلاه ونشكركم على التزامكم.</span>
                </div>
                <p className="text-[10px] text-slate-600 font-semibold">
                  ملاحظة: هذا الإيصال إلكتروني ومعتمد رسمياً من اتحاد الملاك وإدارة أبراج المعتز لله برج 10.
                </p>
              </div>

              {/* Left: Signature & Official Oval Stamp */}
              <div className="flex flex-col items-center justify-end space-y-1 relative pr-4">
                <span className="text-xs font-bold text-slate-900">
                  الاعتماد والتوقيع:
                </span>
                <div className="h-8 flex items-center justify-center text-slate-900 font-black text-sm">
                  اتحاد الملاك
                </div>

                {/* Official Oval Stamp */}
                <div className="relative mt-1 inline-flex items-center justify-center select-none text-blue-900 border-4 border-double border-blue-900 rounded-[50%] p-2 rotate-[-7deg] bg-transparent shadow-sm w-36 h-24">
                  <div className="absolute inset-1 border border-dashed border-blue-800 rounded-[50%]" />
                  <div className="text-center leading-tight">
                    <div className="text-[10px] font-black tracking-tight text-blue-900">★ أبراج المعتز لله ★</div>
                    <div className="text-xs font-black my-0.5 text-blue-950 underline decoration-blue-800 decoration-1 underline-offset-2">
                      برج 10
                    </div>
                    <div className="text-[9px] font-bold text-blue-800">إيصال معتمد - الحسابات</div>
                    <div className="text-[8px] font-mono text-blue-800 mt-0.5">اتحاد الملاك</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

