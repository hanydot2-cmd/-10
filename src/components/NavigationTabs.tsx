import React from 'react';
import { Wallet, Users, Wrench, FileText, FileSpreadsheet, Receipt, LayoutDashboard, Settings } from 'lucide-react';
import { TabType } from '../types';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; isNew?: boolean }[] = [
    { id: 'accounts', label: 'الحسابات', icon: <Wallet className="w-4 h-4" /> },
    { id: 'residents', label: 'السكان', icon: <Users className="w-4 h-4" /> },
    { id: 'extramaint', label: 'صيانة إضافية', icon: <Wrench className="w-4 h-4" /> },
    { id: 'reports', label: 'كتاب التقارير', icon: <FileText className="w-4 h-4" />, isNew: true },
    { id: 'datasheet', label: 'كشف البيانات (الشيت)', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'receipts', label: 'الإيصالات', icon: <Receipt className="w-4 h-4" /> },
    { id: 'debts', label: 'المديونيات', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'dashboard', label: 'لوحة البيانات', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-slate-900/90 border-b border-slate-800 backdrop-blur sticky top-[61px] z-20 shadow-sm hidden md:block">
      <div className="max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1 py-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap relative ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.isNew && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

