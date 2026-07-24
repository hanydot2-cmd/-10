import React, { useState } from 'react';
import { DataEntryUser } from '../types';
import { Users, UserPlus, Trash2, KeyRound, X, ShieldCheck } from 'lucide-react';

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
  const [newRole, setNewRole] = useState<'admin' | 'entry'>('entry');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleStartAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const username = newUsername.trim();
    if (!username) return;

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
      onAddUser({ username, role: newRole });
      setNewUsername('');
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
          المشرف الرئيسي هاني هو من يسيطر على إضافة وإدارة مدخلي البيانات. يتطلب إضافة مستخدم كلمة السر السرية للمشرف.
        </p>

        {/* Add User Form */}
        {!showPasswordPrompt ? (
          <form onSubmit={handleStartAdd} className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>إضافة مدخل بيانات جديد</span>
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="اسم مدخل البيانات..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                required
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'entry')}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="entry">مدخل بيانات</option>
                <option value="admin">مدير نظام</option>
              </select>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs transition"
              >
                متابعة للإضافة
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleConfirmAddWithPassword} className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
              <KeyRound className="w-4 h-4" />
              <span>تأكيد إضافة المستخدم: {newUsername}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              يرجى إدخال كلمة مرور المشرف الرئيسي (هاني) لإتمام إضافة المستخدم:
            </p>
            <input
              type="password"
              placeholder="أدخل كلمة المرور السرية..."
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
                تأكيد وإضافة المستخدم
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
          {users.map((user) => (
            <div
              key={user.username}
              className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-800"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 ${user.role === 'admin' ? 'text-amber-400' : 'text-slate-400'}`}
                />
                <span className="text-xs font-bold text-slate-200">{user.username}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
                  {user.role === 'admin' ? '👑 المشرف الرئيسي' : 'مدخل بيانات'}
                </span>
              </div>

              {user.username !== 'Hany' && (
                <button
                  onClick={() => onDeleteUser(user.username)}
                  className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-900/30 transition text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              )}
            </div>
          ))}
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

