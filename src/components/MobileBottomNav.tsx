import React from 'react';
import { Wallet, Users, Wrench, FileText, FileSpreadsheet, Settings } from 'lucide-react';
import { TabType } from '../types';

interface MobileBottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'accounts', label: 'الحسابات', icon: <Wallet className="w-5 h-5" /> },
    { id: 'residents', label: 'السكان', icon: <Users className="w-5 h-5" /> },
    { id: 'reports', label: 'التقارير', icon: <FileText className="w-5 h-5" /> },
    { id: 'extramaint', label: 'إضافية', icon: <Wrench className="w-5 h-5" /> },
    { id: 'datasheet', label: 'الشيت', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-md shadow-2xl md:hidden">
      <div className="grid grid-cols-6 items-center px-1 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition ${
                isActive
                  ? 'text-amber-400 font-black scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-semibold'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition ${
                  isActive ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span className="text-[10px] mt-0.5 leading-none tracking-tight truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
