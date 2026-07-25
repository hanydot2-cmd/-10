import React from 'react';
import { Wallet, Users, Wrench, FileText, FileSpreadsheet, Receipt, LayoutDashboard, Settings, AlertCircle } from 'lucide-react';
import { TabType } from '../types';

interface MobileBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userRole?: 'admin' | 'entry';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange, userRole = 'admin' }) => {
  const allTabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'accounts', label: 'التحصيل', icon: <Wallet className="w-5 h-5" /> },
    { id: 'receipts', label: 'الإيصالات', icon: <Receipt className="w-5 h-5" /> },
    { id: 'residents', label: 'السكان', icon: <Users className="w-5 h-5" /> },
    { id: 'debts', label: 'المديونيات', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'reports', label: 'التقارير', icon: <FileText className="w-5 h-5" /> },
    { id: 'extramaint', label: 'إضافية', icon: <Wrench className="w-5 h-5" /> },
    { id: 'datasheet', label: 'الشيت المرجعي', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'dashboard', label: 'لوحة البيانات', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" /> },
  ];

  const tabs = userRole === 'entry'
    ? allTabs.filter(t => t.id === 'accounts' || t.id === 'receipts')
    : allTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/90 backdrop-blur-md shadow-2xl md:hidden print:hidden">
      <div className="flex items-center overflow-x-auto no-scrollbar py-1.5 px-2 gap-1.5 scroll-smooth">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition shrink-0 min-w-[62px] ${
                isActive
                  ? 'text-amber-400 font-black bg-amber-500/10 border border-amber-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 font-semibold hover:bg-slate-800/40'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[10px] mt-0.5 leading-none tracking-tight whitespace-nowrap text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
