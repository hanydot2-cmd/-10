import React, { useRef, useState, useEffect } from 'react';
import { Apartment, MonthData, ExtraMaintenance } from '../types';
import { formatCurrency } from '../lib/buildingConfig';
import { Printer, X, CheckCircle2, Building, ShieldCheck, Download, Share2, Image, MessageSquare } from 'lucide-react';
import { toBlob } from 'html-to-image';

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

  useEffect(() => {
    document.body.classList.add('printing-single-receipt');
    return () => {
      document.body.classList.remove('printing-single-receipt');
    };
  }, []);

  const extraAmount = activeExtraMaint && apartment.paidExtraMaint ? activeExtraMaint.amountPerApt : 0;
  const baseAmount = apartment.skip ? 100 : (apartment.amount || 0);
  const totalAmount = baseAmount + extraAmount;
  const issueDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  // Convert receipt DOM node to PNG Blob safely without freezing
  const generateReceiptImage = async (): Promise<Blob | null> => {
    if (!receiptRef.current) return null;
    setIsGeneratingImage(true);

    try {
      const blobPromise = toBlob(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('Image generation timed out');
          resolve(null);
        }, 5000);
      });

      const blob = await Promise.race([blobPromise, timeoutPromise]);
      return blob;
    } catch (err) {
      console.error('Error generating receipt image:', err);
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
        <div className="p-6 overflow-y-auto bg-slate-950 print:bg-white print:text-black print:p-8 print:w-full flex justify-center">
          <div
            ref={receiptRef}
            className="single-receipt-card-printable w-full max-w-[170mm] bg-white text-black border-2 border-slate-900 rounded-xl p-4 shadow-xl print:shadow-none font-sans space-y-3"
          >
            {/* Top Row Header */}
            <div className="flex justify-between items-center pb-2 border-b-2 border-slate-900">
              <div>
                <h3 className="font-black text-sm text-black leading-tight">
                  أبراج المعتز لله — برج 10 (إيصال تحصيل رسوم صيانة)
                </h3>
                <p className="text-xs text-slate-700 font-bold mt-0.5">
                  اتحاد الملاك — شهر {monthData.monthName} {monthData.year}
                </p>
              </div>
              <div className="border-2 border-slate-900 text-black font-mono font-black text-xs px-3 py-1 rounded-lg bg-slate-100 shadow-xs">
                شقة {apartment.aptNumber} (الدور {apartment.floor}) {apartment.skip ? '[شقة مغلقة]' : ''}
              </div>
            </div>

            {/* Resident & Financial Breakdown */}
            <div className="grid grid-cols-12 gap-2 my-2 text-xs items-center">
              <div className="col-span-5 bg-slate-50 p-2.5 rounded-lg border border-slate-300 shadow-xs">
                <span className="text-[10px] text-slate-600 block font-bold mb-0.5">اسم الساكن:</span>
                <span className="font-bold text-black text-xs block break-words whitespace-normal leading-snug min-h-[1.5rem]">
                  {apartment.name || 'غير محدد'}
                </span>
              </div>

              <div className="col-span-7 bg-slate-50 p-2.5 rounded-lg border border-slate-300 grid grid-cols-3 text-center items-center gap-1 shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-600 block font-semibold">الصيانة:</span>
                  <span className="font-mono font-bold text-black dir-ltr text-xs">
                    {formatCurrency(apartment.skip ? 100 : (apartment.amount || 0))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-600 block font-semibold">إضافية:</span>
                  <span className="font-mono font-bold text-black dir-ltr text-xs">
                    {formatCurrency(extraAmount)}
                  </span>
                </div>
                <div className="border-r-2 border-slate-300 pr-1">
                  <span className="text-[10px] text-black font-black block">الإجمالي:</span>
                  <span className="font-mono font-black text-black dir-ltr text-xs text-emerald-800">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Status & Official Oval Stamp */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-md border ${
                    apartment.paid
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-600'
                      : 'bg-rose-100 text-rose-950 border-rose-600'
                  }`}
                >
                  {apartment.paid ? 'تم السداد بالكامل ✓' : 'غير مسدد ✗'}
                </span>
                <span className="text-[10px] text-slate-600 font-semibold">
                  تحرير: {issueDate}
                </span>
              </div>

              {/* Official Oval Stamp (الختم البيضاوي المعتمد) */}
              <div className="relative inline-flex items-center justify-center select-none text-blue-900 border-2 border-double border-blue-900 rounded-[50%] px-3 py-1 rotate-[-4deg] bg-transparent w-32 h-12 shadow-xs">
                <div className="text-center leading-tight">
                  <div className="text-[8px] font-black text-blue-900">★ أبراج المعتز لله ★</div>
                  <div className="text-[9px] font-black text-blue-950">برج 10</div>
                  <div className="text-[7px] font-bold text-blue-800">إيصال معتمد - الحسابات</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

