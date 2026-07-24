import React, { useState } from 'react';
import { DataEntryUser } from '../types';
import { Users, UserPlus, Trash2, KeyRound, X, ShieldCheck, Lock, Eye, EyeOff, User } from 'lucide-react';

interface UsersManagementModalProps {
  users: DataEntryUser[];
  onAddUser: (user: DataEntryUser) => void;
  onDeleteUser: (username: string) => void;
  onClose: () => void;
}

export const UsersManagementModal: React.FC<UsersManagementModalProps> = ({
  users,
  onAddUser,
  onDeleteUser,
  onClose,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'entry'>('entry');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [visibleUserPasswords, setVisibleUserPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (username: string) => {
    setVisibleUserPasswords((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const handleStartAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const username = newUsername.trim();
    const password = newUserPassword.trim();

    if (!username) {
      alert('يرجى إدخال اسم مدخل البيانات!');
      return;
    }

    if (!password) {
      alert('يرجى إدخال كلمة المرور / الرقم السري لمدخل البيانات!');
      return;
    }

    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      alert('اسم المستخدم موجود بالفعل!');
      return;
    }

    setShowPasswordPrompt(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handleConfirmAddWithPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '552211') {
      const username = newUsername.trim();
      const password = newUserPassword.trim();
      onAddUser({ username, password, role: newRole });
      setNewUsername('');
      setNewUserPassword('');
      setNewRole('entry');
      setShowPasswordPrompt(false);
      setPasswordInput('');
    } else {
      setPasswordError('❌ كلمة المرور غير صحيحة! يرجى إدخال كلمة مرور المشرف الصحيحة.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-amber-400">إدارة مدخلي البيانات والمسؤولين</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          يتطلب إنشاء حساب مدخل بيانات تحديد اسم ورقم سري خاص به للتأكد من هوية المستخدم.
        </p>

        {/* Add User Form */}
        {!showPasswordPrompt ? (
          <form onSubmit={handleStartAdd} className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>إضافة مدخل بيانات جديد (الاسم والرقم السري)</span>
            </h4>

            <div className="space-y-2.5">
              {/* Username field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>اسم مدخل البيانات:</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: أحمد مصطفى / مدخل شفت أ"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>الرقم السري / كلمة المرور لمدخل البيانات:</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="أدخل الرقم السري لمدخل البيانات (مثال: 123456)..."
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Role selection & submit button */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'admin' | 'entry')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
                  >
                    <option value="entry">مدخل بيانات (عادي)</option>
                    <option value="admin">مدير نظام (كامل الصلاحيات)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs transition"
                >
                  متابعة وتأكيد الإضافة
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmAddWithPassword} className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
              <KeyRound className="w-4 h-4" />
              <span>تأكيد إضافة المستخدم: {newUsername}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              يرجى إدخال كلمة مرور المشرف الرئيسي (هاني) لإتمام إضافة حساب مدخل البيانات الجديد:
            </p>
            <input
              type="password"
              placeholder="أدخل كلمة المرور السرية للمشرف..."
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-center font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              autoFocus
              required
            />
            {passwordError && <p className="text-[11px] text-rose-400 font-bold">{passwordError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-1.5 rounded-lg text-xs transition"
              >
                تأكيد وإضافة الحساب
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordPrompt(false)}
                className="bg-slate-800 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}

        {/* Users List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {users.map((user) => {
            const isPasswordShown = !!visibleUserPasswords[user.username];
            return (
              <div
                key={user.username}
                className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={`w-4 h-4 ${user.role === 'admin' ? 'text-amber-400' : 'text-slate-400'}`}
                    />
                    <span className="text-xs font-bold text-slate-200">{user.username}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                      {user.role === 'admin' ? '👑 المشرف الرئيسي' : 'مدخل بيانات'}
                    </span>
                  </div>

                  {/* Display User Password */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mr-6">
                    <KeyRound className="w-3 h-3 text-amber-400/80" />
                    <span>الرقم السري:</span>
                    <span className="text-amber-300 font-bold">
                      {isPasswordShown ? user.password || 'غير محدد' : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(user.username)}
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition"
                      title={isPasswordShown ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                    >
                      {isPasswordShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {user.username !== 'Hany' && (
                  <button
                    onClick={() => onDeleteUser(user.username)}
                    className="text-rose-400 hover:text-rose-300 p-1.5 rounded hover:bg-rose-900/30 transition text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-800 text-left">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

