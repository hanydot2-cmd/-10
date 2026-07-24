import React, { useState, useEffect } from 'react';
import { TabType, MonthData, ExtraMaintenance, DebtItem, DataEntryUser, Apartment, AppTheme } from './types';
import {
  getCurrentMonthKey,
  setCurrentMonthKey,
  getMonthData,
  saveMonthData,
  getExtraMaintenances,
  saveExtraMaintenances,
  getActiveExtraMaintenance,
  getDebts,
  saveDebts,
  getUsers,
  saveUsers,
  transferUnpaidToDebts,
  resetAllDataToFresh,
  saveMasterResidents,
} from './lib/storage';

import {
  listenToMonthData,
  saveMonthDataFirebase,
  listenToMasterResidents,
  saveMasterResidentsFirebase,
  listenToDebts,
  saveDebtsFirebase,
  listenToExtraMaintenance,
  saveExtraMaintenanceFirebase,
  listenToUsers,
  saveUsersFirebase,
  subscribeFirebaseConnection,
} from './lib/firebase';

import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AccountsTab } from './components/AccountsTab';
import { ResidentsTab } from './components/ResidentsTab';
import { ExtraMaintenanceTab } from './components/ExtraMaintenanceTab';
import { DataSheetTab } from './components/DataSheetTab';
import { ReceiptsTab } from './components/ReceiptsTab';
import { DebtsTab } from './components/DebtsTab';
import { DataDashboardView } from './components/DataDashboardView';
import { SettingsTab } from './components/SettingsTab';
import { CollectionPanelView } from './components/CollectionPanelView';
import { UsersManagementModal } from './components/UsersManagementModal';
import { PasswordPromptModal } from './components/PasswordPromptModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [appTheme, setAppTheme] = useState<AppTheme>(
    () => (localStorage.getItem('bmu10_theme') as AppTheme) || 'slate'
  );
  const [customBgColor, setCustomBgColor] = useState<string>(
    () => localStorage.getItem('bmu10_custom_bg_color') || '#090d16'
  );
  const [currentMonthKey, setMonthKey] = useState<string>(getCurrentMonthKey());
  const [monthData, setMonthDataState] = useState<MonthData>(() => getMonthData(currentMonthKey));
  const [extraMaintenances, setExtraMaintenancesState] = useState<ExtraMaintenance[]>(() =>
    getExtraMaintenances()
  );
  const [debts, setDebtsState] = useState<DebtItem[]>(() => getDebts());
  const [users, setUsersState] = useState<DataEntryUser[]>(() => getUsers());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  const handleSelectTheme = (theme: AppTheme) => {
    setAppTheme(theme);
    localStorage.setItem('bmu10_theme', theme);
    if (theme === 'light') {
      setIsDarkMode(false);
    } else {
      setIsDarkMode(true);
    }
  };

  const handleSelectCustomColor = (color: string) => {
    setCustomBgColor(color);
    localStorage.setItem('bmu10_custom_bg_color', color);
  };

  // Modals & Hany Auth state
  const [isCollectionPanelOpen, setIsCollectionPanelOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingActionInfo, setPendingActionInfo] = useState<{ name: string; callback: () => void } | null>(null);

  // Subscribe to Firebase Connection Status
  useEffect(() => {
    const unsubscribe = subscribeFirebaseConnection((connected) => {
      setIsFirebaseConnected(connected);
    });
    return () => unsubscribe();
  }, []);

  // REALtime FIREBASE LISTENERS SYNC
  useEffect(() => {
    // 1. Month Data Listener
    const unsubMonth = listenToMonthData(currentMonthKey, (remoteData) => {
      if (remoteData) {
        setMonthDataState(remoteData);
        saveMonthData(remoteData);
      } else {
        // First initialization to Firebase
        const local = getMonthData(currentMonthKey);
        saveMonthDataFirebase(local);
      }
    });

    // 2. Master Residents Listener
    const unsubResidents = listenToMasterResidents((remoteApts) => {
      if (remoteApts) {
        saveMasterResidents(remoteApts);
      }
    });

    // 3. Debts Listener
    const unsubDebts = listenToDebts((remoteDebts) => {
      if (remoteDebts) {
        setDebtsState(remoteDebts);
        saveDebts(remoteDebts);
      }
    });

    // 4. Extra Maintenance Listener
    const unsubExtra = listenToExtraMaintenance((remoteItems) => {
      if (remoteItems) {
        setExtraMaintenancesState(remoteItems);
        saveExtraMaintenances(remoteItems);
      }
    });

    // 5. Users Listener
    const unsubUsers = listenToUsers((remoteUsers) => {
      if (remoteUsers) {
        setUsersState(remoteUsers);
        saveUsers(remoteUsers);
      }
    });

    return () => {
      unsubMonth();
      unsubResidents();
      unsubDebts();
      unsubExtra();
      unsubUsers();
    };
  }, [currentMonthKey]);

  // Handle Month Change
  const handleMonthChange = (newKey: string) => {
    if (newKey === currentMonthKey) return;
    transferUnpaidToDebts(currentMonthKey);
    setCurrentMonthKey(newKey);
    setMonthKey(newKey);
  };

  // Helper to trigger password modal for protected actions
  const requireHanyPassword = (actionName: string, onSuccess: () => void) => {
    setPendingActionInfo({ name: actionName, callback: onSuccess });
    setIsPasswordModalOpen(true);
  };

  // Month Data Update
  const handleUpdateMonthData = (updated: MonthData) => {
    setMonthDataState(updated);
    saveMonthData(updated);
    saveMonthDataFirebase(updated);
  };

  // Master Residents Update
  const handleUpdateMasterResidents = (apts: Apartment[]) => {
    saveMasterResidents(apts);
    saveMasterResidentsFirebase(apts);
  };

  // Debt Actions
  const handleAddDebt = (debt: DebtItem) => {
    const updated = [debt, ...debts];
    setDebtsState(updated);
    saveDebts(updated);
    saveDebtsFirebase(updated);
  };

  const handlePayDebt = (id: string) => {
    const target = debts.find((d) => d.id === id);
    if (!target) return;

    const updatedDebts = debts.filter((d) => d.id !== id);
    setDebtsState(updatedDebts);
    saveDebts(updatedDebts);
    saveDebtsFirebase(updatedDebts);

    const updatedMonth: MonthData = {
      ...monthData,
      collectedAmount: monthData.collectedAmount + target.amount,
    };
    handleUpdateMonthData(updatedMonth);
  };

  const handleDeleteDebt = (id: string) => {
    requireHanyPassword('حذف المديونية', () => {
      const updated = debts.filter((d) => d.id !== id);
      setDebtsState(updated);
      saveDebts(updated);
      saveDebtsFirebase(updated);
    });
  };

  // Extra Maintenance Actions
  const handleAddExtraMaintenance = (item: ExtraMaintenance) => {
    const updated = [item, ...extraMaintenances];
    setExtraMaintenancesState(updated);
    saveExtraMaintenances(updated);
    saveExtraMaintenanceFirebase(updated);
  };

  const handleToggleExtraMaintenanceActive = (id: string, active: boolean) => {
    const updated = extraMaintenances.map((item) =>
      item.id === id ? { ...item, active } : item
    );
    setExtraMaintenancesState(updated);
    saveExtraMaintenances(updated);
    saveExtraMaintenanceFirebase(updated);
  };

  // User Management Actions
  const handleAddUser = (user: DataEntryUser) => {
    const updated = [...users, user];
    setUsersState(updated);
    saveUsers(updated);
    saveUsersFirebase(updated);
  };

  const handleDeleteUser = (username: string) => {
    requireHanyPassword(`حذف المستخدم ${username}`, () => {
      const updated = users.filter((u) => u.username !== username);
      setUsersState(updated);
      saveUsers(updated);
      saveUsersFirebase(updated);
    });
  };

  // Manual trigger for rollover of unpaid to debts
  const handleTransferUnpaidToDebts = () => {
    transferUnpaidToDebts(currentMonthKey);
    const d = getDebts();
    setDebtsState(d);
    saveDebtsFirebase(d);
    alert('✅ تم ترحيل جميع الشقق غير المسددة لهذا الشهر إلى جدول المديونيات بنجاح!');
  };

  // App Reset
  const handleResetAllData = () => {
    requireHanyPassword('إعادة ضبط التطبيق ومسح كافة البيانات', () => {
      resetAllDataToFresh();
      const newKey = getCurrentMonthKey();
      setMonthKey(newKey);
      const freshData = getMonthData(newKey);
      setMonthDataState(freshData);
      saveMonthDataFirebase(freshData);
      alert('✅ تم إعادة ضبط التطبيق بالكامل وتزامن الخادم.');
    });
  };

  const activeExtraMaint = getActiveExtraMaintenance(currentMonthKey);

  // Dynamic Theme Background calculation for full app
  const getThemeBackgroundClass = () => {
    if (!isDarkMode || appTheme === 'light') return 'bg-slate-100 text-slate-900';
    switch (appTheme) {
      case 'midnight':
        return 'bg-black text-zinc-100';
      case 'navy':
        return 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-slate-950 text-slate-100';
      case 'emerald':
        return 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-slate-950 text-slate-100';
      case 'burgundy':
        return 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-950 via-slate-950 to-slate-950 text-slate-100';
      case 'violet':
        return 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-slate-950 to-slate-950 text-slate-100';
      case 'amber':
        return 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950 via-slate-950 to-slate-950 text-slate-100';
      case 'charcoal':
        return 'bg-zinc-950 text-zinc-100';
      case 'custom':
        return 'text-slate-100';
      case 'slate':
      default:
        return 'bg-slate-950 text-slate-100';
    }
  };

  const getCustomStyle = () => {
    if (appTheme === 'custom') {
      return { backgroundColor: customBgColor };
    }
    return {};
  };

  return (
    <div
      className={`min-h-screen ${getThemeBackgroundClass()} pb-16 md:pb-0 transition-colors duration-300`}
      style={getCustomStyle()}
      dir="rtl"
    >
      {/* App Header */}
      <Header
        currentMonthKey={currentMonthKey}
        onMonthChange={handleMonthChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenCollectionPanel={() => setIsCollectionPanelOpen(true)}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
      />

      {/* Main Desktop Tab Bar */}
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Primary Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* TAB 1: Accounts (الحسابات) */}
        {activeTab === 'accounts' && (
          <AccountsTab
            monthData={monthData}
            activeExtraMaint={activeExtraMaint}
            onUpdateMonthData={handleUpdateMonthData}
            onTransferUnpaidToDebts={handleTransferUnpaidToDebts}
          />
        )}

        {/* TAB 2: Residents (السكان) */}
        {activeTab === 'residents' && (
          <ResidentsTab
            monthData={monthData}
            activeExtraMaint={activeExtraMaint}
            onUpdateMonthData={handleUpdateMonthData}
            onUpdateMasterResidents={handleUpdateMasterResidents}
          />
        )}

        {/* TAB 3: Extra Maintenance (صيانة إضافية) */}
        {activeTab === 'extramaint' && (
          <ExtraMaintenanceTab
            monthData={monthData}
            extraMaintenances={extraMaintenances}
            onAddExtraMaintenance={handleAddExtraMaintenance}
            onToggleExtraMaintenanceActive={handleToggleExtraMaintenanceActive}
            onUpdateMonthData={handleUpdateMonthData}
          />
        )}

        {/* TAB 4: Data Sheet (كشف البيانات المرجعي / الشيت) */}
        {activeTab === 'datasheet' && (
          <DataSheetTab
            monthData={monthData}
            activeExtraMaint={activeExtraMaint}
            isFirebaseConnected={isFirebaseConnected}
          />
        )}

        {/* TAB 5: Receipts (الإيصالات) */}
        {activeTab === 'receipts' && (
          <ReceiptsTab monthData={monthData} activeExtraMaint={activeExtraMaint} />
        )}

        {/* TAB 6: Debts (المديونيات) */}
        {activeTab === 'debts' && (
          <DebtsTab
            debts={debts}
            onAddDebt={handleAddDebt}
            onPayDebt={handlePayDebt}
            onDeleteDebt={handleDeleteDebt}
            onTransferUnpaidToDebts={handleTransferUnpaidToDebts}
            apartments={monthData.apartments}
          />
        )}

        {/* TAB 7: Data Dashboard View (لوحة البيانات) */}
        {activeTab === 'dashboard' && (
          <DataDashboardView
            monthData={monthData}
            activeExtraMaint={activeExtraMaint}
            debts={debts}
          />
        )}

        {/* TAB 8: Settings (الإعدادات) */}
        {activeTab === 'settings' && (
          <SettingsTab
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onOpenUsersModal={() => setIsUsersModalOpen(true)}
            onResetAllData={handleResetAllData}
            isFirebaseConnected={isFirebaseConnected}
            currentTheme={appTheme}
            customBgColor={customBgColor}
            onSelectTheme={handleSelectTheme}
            onSelectCustomColor={handleSelectCustomColor}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Quick Collection Panel Modal */}
      {isCollectionPanelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <CollectionPanelView
              monthData={monthData}
              activeExtraMaint={activeExtraMaint}
              onUpdateMonthData={handleUpdateMonthData}
              onClose={() => setIsCollectionPanelOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Data Entry Users Modal */}
      {isUsersModalOpen && (
        <UsersManagementModal
          users={users}
          onAddUser={handleAddUser}
          onDeleteUser={handleDeleteUser}
          onClose={() => setIsUsersModalOpen(false)}
        />
      )}

      {/* Hany Password Verification Modal */}
      {isPasswordModalOpen && pendingActionInfo && (
        <PasswordPromptModal
          title={`التحقق من صلاحية المشرف (هاني)`}
          description={`لتنفيذ "${pendingActionInfo.name}"، يلزم تأكيد كلمة مرور المشرف الرئيسي هاني السرية:`}
          onSuccess={() => {
            const action = pendingActionInfo.callback;
            setIsPasswordModalOpen(false);
            setPendingActionInfo(null);
            action();
          }}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPendingActionInfo(null);
          }}
        />
      )}
    </div>
  );
}

