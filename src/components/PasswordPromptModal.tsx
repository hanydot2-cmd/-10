import React, { useState } from 'react';
import { Lock, KeyRound, X, ShieldAlert } from 'lucide-react';
import { getUsers } from '../lib/storage';

interface PasswordPromptModalProps {
  title?: string;
  description?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  title = 'التحقق من صلاحية المشرف / مدخل البيانات',
  description = 'تحديث وتعديل البيانات المدخلة يتطلب كلمة المرور الخاصة بالمشرف أو مدخل البيانات المخول:',
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputPwd = password.trim();
    const registeredUsers = getUsers();
    const isValid = inputPwd === '552211' || registeredUsers.some((u) => u.password === inputPwd);

    if (isValid) {
      onSuccess();
    } else {
      setError('❌ كلمة المرور غير صحيحة! يرجى إدخال كلمة مرور معتمدة');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>كلمة المرور المشرف:</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="أدخل كلمة المرور السرية..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-bold text-amber-300 focus:outline-none shadow-inner"
              autoFocus
              required
            />
            {error && (
              <p className="text-xs font-bold text-rose-400 mt-2 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-md transition active:scale-95"
            >
              تأكيد وتفعيل الصلاحية
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
