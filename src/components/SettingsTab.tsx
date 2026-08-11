import React, { useState } from 'react';
import { Settings, Trash2, Download, Upload, Users, Moon, Sun, ShieldAlert, Wifi, RefreshCw, KeyRound, CheckCircle2, XCircle, Palette, Check, Type } from 'lucide-react';
import { testFirebaseConnection, uploadAllLocalDataToFirebase } from '../lib/firebase';
import { AppTheme, AppFont } from '../types';

interface SettingsTabProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUsersModal: () => void;
  onResetAllData: () => void;
  isFirebaseConnected?: boolean;
  currentTheme?: AppTheme;
  currentFont?: AppFont;
  customBgColor?: string;
  onSelectTheme?: (theme: AppTheme) => void;
  onSelectFont?: (font: AppFont) => void;
  onSelectCustomColor?: (color: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onOpenUsersModal,
  onResetAllData,
  isFirebaseConnected = true,
  currentTheme = 'light',
  currentFont = 'ibm',
  customBgColor = '#090d16',
  onSelectTheme,
  onSelectFont,
  onSelectCustomColor,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; latencyMs: number; error?: string } | null>(null);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleRunConnectionTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testFirebaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ connected: false, latencyMs: 0, error: err?.message || 'فشل الاتصال' });
    } finally {
      setTesting(false);
    }
  };

  const [syncingCloud, setSyncingCloud] = useState(false);

  const handleSyncAllToCloud = async () => {
    setSyncingCloud(true);
    const res = await uploadAllLocalDataToFirebase();
    setSyncingCloud(false);
    if (res.success) {
      alert(`✅ تمت مزامنة ورفع كافة البيانات والسجلات للسحابة (Firebase) بنجاح!\nتستطيع الآن فتح التطبيق من أي جهاز آخر أو رابط معاينة وشاهد البيانات المحدثة.`);
    } else {
      alert('⚠️ حدث خطأ أثناء المزامنة بالسحابة، يرجى التأكد من الاتصال بالإنترنت وإعادة المحاولة.');
    }
  };

  const handleBackupExport = () => {
    const backupData: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('bmu10_')) {
        backupData[k] = localStorage.getItem(k);
      }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burj-almuataz10-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        let restoredKeysCount = 0;
        Object.keys(data).forEach((k) => {
          if (k.startsWith('bmu10_') && data[k] !== undefined && data[k] !== null) {
            const val = typeof data[k] === 'string' ? data[k] : JSON.stringify(data[k]);
            localStorage.setItem(k, val);
            restoredKeysCount++;
          }
        });

        // Sync restored local data to Firebase instantly
        await uploadAllLocalDataToFirebase();

        alert(`تمت استعادة ${restoredKeysCount} عنصر من النسخة الاحتياطية ومزامنتها بنجاح مع السحابة!`);
        window.location.reload();
      } catch (err) {
        alert('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية');
      }
    };
    reader.readAsText(file);
  };

  const isConnectedNow = testResult !== null ? testResult.connected : isFirebaseConnected;

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn pb-16 md:pb-6">
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg flex items-center gap-3">
        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-amber-400">إعدادات النظام وخادم البيانات</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            متابعة حالة خادم Firebase، فحص الاتصال، إدارة مدخلي البيانات والصلاحيات.
          </p>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4 divide-y divide-slate-800">
        {/* FIREBASE CONNECTION STATUS INDICATOR & TEST BUTTON */}
        <div className="pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-800 text-amber-400 rounded-xl border border-slate-700">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black text-slate-100 block">
                  حالة الاتصال بقاعدة بيانات Firebase
                </span>
                <p className="text-xs text-slate-400">تزامن فوري مباشر مع كافة المستخدمين</p>
              </div>
            </div>

            {/* Red / Green Status Indicator Dot */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full">
              <span
                className={`w-3 h-3 rounded-full ${
                  isConnectedNow ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-md shadow-rose-500/50'
                }`}
              />
              <span
                className={`text-xs font-black ${
                  isConnectedNow ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isConnectedNow ? 'متصل بـ Firebase' : 'غير متصل بـ Firebase'}
              </span>
            </div>
          </div>

          {/* Connection Test Button */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              {testResult ? (
                <div className="flex items-center gap-2 font-bold">
                  {testResult.connected ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>نجح الاختبار (زمن الاستجابة: {testResult.latencyMs}ms)</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      <span>{testResult.error || 'تعذر الاتصال بالخادم'}</span>
                    </span>
                  )}
                </div>
              ) : (
                <span>اضغط على الزر لاختبار استجابة وسرعة اتصال الخادم الآن</span>
              )}
            </div>

            <button
              onClick={handleRunConnectionTest}
              disabled={testing}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black px-3.5 py-2 rounded-xl text-xs shadow transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'جاري الفحص...' : 'فحص الاتصال بـ Firebase'}</span>
            </button>
          </div>

          {/* Sync All Local Data to Firebase Cloud Button */}
          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-amber-300 block">
                مزامنة ورفع جميع البيانات والشهور إلى السحابة (Firebase)
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                تأكيد رفع كافة المصروفات وسجلات المسددين والسكان من جهازك الحالي إلى خادم Firebase لتظهر فوراً على الأجهزة والأوضاع الأخرى.
              </p>
            </div>

            <button
              onClick={handleSyncAllToCloud}
              disabled={syncingCloud}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow transition active:scale-95 disabled:opacity-50 shrink-0 w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${syncingCloud ? 'animate-spin' : ''}`} />
              <span>{syncingCloud ? 'جاري المزامنة...' : 'مزامنة ورفع كافة البيانات للسحابة الآن'}</span>
            </button>
          </div>
        </div>

        {/* Primary Admin Hany Info */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black text-amber-400 block">
                المشرف الرئيسي وتعديل البيانات (هاني)
              </span>
              <p className="text-xs text-slate-400">
                أي تحديث يظهر للجميع فوراً ولا يمكن تعديله إلا بواسطة المشرف (هاني) بكلمة السر السرية.
              </p>
            </div>
          </div>
        </div>

        {/* Dark/Light Mode Switcher */}
        <div className="flex items-center justify-between py-4 border-b border-slate-800">
          <div>
            <span className="text-sm font-bold text-slate-200 block">☀️ / 🌙 نمط العرض السريع (نهار / ليل)</span>
            <span className="text-xs text-slate-400">التبديل الفوري بين الوضع النهاري ببطاقات ناصعة والوضع الداكن</span>
          </div>
          <button
            onClick={onToggleDarkMode}
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-xs transition shadow ${
              !isDarkMode
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                : 'bg-slate-800 text-amber-400 border border-slate-700 hover:border-amber-400'
            }`}
          >
            {!isDarkMode ? <Sun className="w-4 h-4 fill-slate-950" /> : <Moon className="w-4 h-4" />}
            <span>{!isDarkMode ? 'الوضع النهاري الفاتح (نشط)' : 'الوضع الداكن (نشط)'}</span>
          </button>
        </div>

        {/* Font Switcher (تغيير نوع الخط) */}
        <div className="py-4 space-y-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-sm font-bold text-slate-200 block">🔤 نوع الخط العربي للتطبيق بالكامل</span>
              <span className="text-xs text-slate-400">اختر الخط العربي المفضل لعرض كافة العناوين والجداول بالقراءة الأنسب</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
            {[
              { id: 'ibm', name: 'IBM Plex Arabic', label: 'الخط المعياري الرسمي', fontClass: 'font-ibm' },
              { id: 'cairo', name: 'Cairo', label: 'خط كايرو البارز', fontClass: 'font-cairo' },
              { id: 'tajawal', name: 'Tajawal', label: 'خط تجوال العصري', fontClass: 'font-tajawal' },
              { id: 'almarai', name: 'Almarai', label: 'خط المراعي المريح', fontClass: 'font-almarai' },
              { id: 'amiri', name: 'Amiri', label: 'خط أميري الكلاسيكي', fontClass: 'font-amiri' },
            ].map((f) => {
              const isSelected = currentFont === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFont && onSelectFont(f.id as AppFont)}
                  className={`p-3 rounded-xl border transition text-center flex flex-col items-center justify-between gap-1.5 ${f.fontClass} ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span className="text-sm font-bold block">{f.name}</span>
                  <span className="text-[10px] text-slate-400 block">{f.label}</span>
                  {isSelected && (
                    <span className="mt-1 p-0.5 bg-amber-400 text-slate-950 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Customizer (ثيمات فاتحة للنهار وثيمات داكنة) */}
        <div className="py-4 space-y-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-sm font-bold text-slate-200 block">🎨 الثيمات الكاملة (تغيير المظهر والخطوط والألوان)</span>
              <span className="text-xs text-slate-400">اختر من بين الثيمات النهارية المشرقة أو الثيمات الليلية الفاخرة</span>
            </div>
          </div>

          {/* Group 1: LIGHT Themes (☀️ ثيمات الوضع النهاري الفاتح) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>☀️ ثيمات فاتحة ناصعة (الوضع النهاري الممتاز):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {[
                { id: 'light', label: 'النهار الأبيض الناصع', bgGradient: 'from-slate-100 via-white to-slate-200 border-slate-300 text-slate-900' },
                { id: 'light-emerald', label: 'الزمردي الفاتح الناصع', bgGradient: 'from-emerald-100 via-emerald-50 to-teal-100 border-emerald-300 text-emerald-950' },
                { id: 'light-sapphire', label: 'الأزرق الملكي الفاتح', bgGradient: 'from-sky-100 via-blue-50 to-indigo-100 border-sky-300 text-slate-900' },
                { id: 'light-amber', label: 'الشمس الدافئة الذهبية', bgGradient: 'from-amber-100 via-amber-50 to-orange-100 border-amber-300 text-amber-950' },
                { id: 'light-lavender', label: 'البنفسجي الليلكي الفاتح', bgGradient: 'from-purple-100 via-purple-50 to-fuchsia-100 border-purple-300 text-purple-950' },
              ].map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme && onSelectTheme(t.id as AppTheme)}
                    className={`relative p-3 rounded-xl border transition text-right bg-gradient-to-br ${t.bgGradient} ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-lg scale-[1.02]'
                        : 'hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black">{t.label}</span>
                      {isSelected && (
                        <span className="p-1 bg-amber-500 text-slate-950 rounded-full shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: DARK Themes (🌙 ثيمات الوضع الداكن) */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-amber-400" />
              <span>🌙 ثيمات داكنة فاخرة (الوضع الليلكي):</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {[
                { id: 'slate', label: 'الكحلي الداكن الرسمي', bgGradient: 'from-slate-900 to-slate-950 border-slate-700 text-slate-100' },
                { id: 'midnight', label: 'الأسود الملكي الفاخر', bgGradient: 'from-zinc-950 to-black border-zinc-800 text-zinc-100' },
                { id: 'navy', label: 'الأزرق العميق الداكن', bgGradient: 'from-blue-950 to-slate-950 border-blue-800 text-blue-100' },
                { id: 'emerald', label: 'الزمردي الداكن الفاخر', bgGradient: 'from-emerald-950 to-slate-950 border-emerald-800 text-emerald-100' },
                { id: 'burgundy', label: 'العنابي الملكي الداكن', bgGradient: 'from-rose-950 to-slate-950 border-rose-800 text-rose-100' },
                { id: 'violet', label: 'البنفسجي الداكن', bgGradient: 'from-purple-950 to-slate-950 border-purple-800 text-purple-100' },
                { id: 'amber', label: 'البرونزي الدافئ', bgGradient: 'from-amber-950 to-stone-950 border-amber-800 text-amber-100' },
                { id: 'charcoal', label: 'الفحمي الداكن', bgGradient: 'from-zinc-900 to-zinc-950 border-zinc-700 text-zinc-100' },
              ].map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme && onSelectTheme(t.id as AppTheme)}
                    className={`relative p-3 rounded-xl border transition text-right bg-gradient-to-br ${t.bgGradient} ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-lg scale-[1.02]'
                        : 'hover:border-amber-400/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black">{t.label}</span>
                      {isSelected && (
                        <span className="p-1 bg-amber-400 text-slate-950 rounded-full shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Picker for Entire Application Background */}
          <div className="mt-3 p-3 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300">اختيار لون خلفية مخصص بالتحديد:</span>
              <input
                type="color"
                value={customBgColor}
                onChange={(e) => {
                  if (onSelectCustomColor) onSelectCustomColor(e.target.value);
                  if (onSelectTheme) onSelectTheme('custom');
                }}
                className="w-8 h-8 rounded border border-amber-400 cursor-pointer bg-transparent"
                title="اختر لون خلفية التطبيق المفضل"
              />
              <span className="text-[11px] font-mono text-slate-400 dir-ltr">{customBgColor}</span>
            </div>

            <button
              onClick={() => {
                if (onSelectTheme) onSelectTheme('custom');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                currentTheme === 'custom'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              تطبيق اللون المخصص
            </button>
          </div>
        </div>

        {/* Data Entry Users */}
        <div className="flex items-center justify-between py-4">
          <div>
            <span className="text-sm font-bold text-slate-200 block">👤 مدخلو البيانات</span>
            <span className="text-xs text-slate-400">إضافة وإدارة مدخلي البيانات (يتطلب كلمة المرور السرية للمشرف)</span>
          </div>
          <button
            onClick={onOpenUsersModal}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-lg text-xs shadow transition"
          >
            <Users className="w-4 h-4" />
            <span>إدارة مدخلي البيانات</span>
          </button>
        </div>

        {/* Backup Export/Import */}
        <div className="py-4 space-y-3">
          <span className="text-sm font-bold text-slate-200 block">💾 النسخ الاحتياطي للبيانات</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleBackupExport}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 rounded-lg text-xs transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>تصدير نسخة احتياطية (JSON)</span>
            </button>

            <label className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 rounded-lg text-xs transition cursor-pointer">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>استعادة نسخة (JSON)</span>
              <input type="file" accept=".json" onChange={handleBackupRestore} className="hidden" />
            </label>
          </div>
        </div>

        {/* Reset Application */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>بداية جديدة — مسح كافة البيانات</span>
          </div>
          <p className="text-xs text-slate-400">
            البدء من جديد ومسح جميع المديونيات، المصروفات، والسجلات السابقة مع الاحتفاظ بهيكلية شقق برج المعتز 10 (12 دور، 160 شقة).
          </p>
          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full bg-rose-900/40 hover:bg-rose-900/60 border border-rose-600/50 text-rose-200 font-black py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>تفريغ التطبيق بالكامل للبدء من جديد</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl space-y-2 animate-fadeIn">
              <p className="text-xs font-bold text-rose-300 text-center">
                ⚠️ هل أنت تأكد تماماً؟ سيتم مسح البيانات والبدء كشف حساب جديد!
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 rounded-lg text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    onResetAllData();
                  }}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black py-1.5 rounded-lg text-xs shadow"
                >
                  تأكيد المسح والبدء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 py-4 space-y-1">
        <p className="font-bold text-slate-400">برج المعتز 10 — نظام إدارة الحسابات الفوري</p>
        <p className="text-[11px] text-slate-600">متوافق مع قاعدة بيانات Firebase وقواعد صلاحيات المشرف هاني السرية</p>
      </div>
    </div>
  );
};

