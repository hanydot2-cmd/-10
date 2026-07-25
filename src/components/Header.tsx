import React from 'react';
import { Building2, Calendar, LayoutDashboard, Receipt, Moon, Sun, Users, RefreshCw, LogOut, ShieldCheck, User } from 'lucide-react';
import { ARABIC_MONTHS } from '../lib/buildingConfig';
import { TabType } from '../types';
import { ActiveUser } from './LoginModal';

interface HeaderProps {
  currentMonthKey: string;
  onMonthChange: (newKey: string) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenCollectionPanel: () => void;
  onOpenUsersModal: () => void;
  currentUser: ActiveUser | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMonthKey,
  onMonthChange,
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenCollectionPanel,
  onOpenUsersModal,
  currentUser,
  onLogout,
}) => {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  const year = parseInt(yearStr) || new Date().getFullYear();
  const monthIdx = (parseInt(monthStr) || 1) - 1;

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIdx = parseInt(e.target.value);
    const mStr = String(selectedIdx + 1).padStart(2, '0');
    onMonthChange(`${year}-${mStr}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const y = parseInt(e.target.value) || new Date().getFullYear();
    const mStr = String(monthIdx + 1).padStart(2, '0');
    onMonthChange(`${y}-${mStr}`);
  };

  return (
    <header className="bg-slate-900 border-b border-amber-500/30 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Building Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-amber-400 leading-tight">
                برج المعتز 10
              </h1>
              <p className="text-xs text-slate-400">
                12 دور · 160 شقة (الدور 12 به 6 شقق)
              </p>
            </div>
          </div>

          {/* Controls: Month Selector, User Status, Collection Panel & Logout */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month & Year Selection */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 text-[11px] font-semibold">الشهر:</span>
              <select
                value={monthIdx}
                onChange={handleMonthSelect}
                className="bg-slate-900 text-amber-300 font-bold px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-amber-400 text-xs"
              >
                {ARABIC_MONTHS.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={handleYearChange}
                min="2020"
                max="2099"
                className="w-16 bg-slate-900 text-amber-300 font-bold px-1.5 py-1 rounded border border-slate-700 text-center focus:outline-none text-xs"
              />
            </div>

            {/* Quick Action: Collection Panel */}
            <button
              onClick={onOpenCollectionPanel}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95"
              title="فتح لوحة التحصيل السريعة"
            >
              <Receipt className="w-4 h-4 text-emerald-200" />
              <span>لوحة التحصيل</span>
            </button>

            {/* Admin Only: Users Management */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onOpenUsersModal}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-amber-400 text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
                title="إدارة مدخلي البيانات"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">مدخلو البيانات</span>
              </button>
            )}

            {/* Active User Badge */}
            {currentUser && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  currentUser.role === 'admin'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {currentUser.role === 'admin' ? 'المشرف: ' : 'المحصل: '}
                  {currentUser.name}
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition"
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            {currentUser && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
                title="تسجيل الخروج والتبديل"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">خروج</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

