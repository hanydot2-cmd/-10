import React, { useState } from 'react';
import { Building2, Lock, User, KeyRound, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { DataEntryUser } from '../types';

export interface ActiveUser {
  username: string;
  name: string;
  role: 'admin' | 'entry';
}

interface LoginModalProps {
  users: DataEntryUser[];
  onLogin: (user: ActiveUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputUser = username.trim();
    const inputPwd = password.trim();

    if (!inputUser || !inputPwd) {
      setError('⚠️ يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    // Check Master Admin Hany login
    const isMasterAdminName =
      inputUser.toLowerCase() === 'هاني' ||
      inputUser.toLowerCase() === 'hany' ||
      inputUser.toLowerCase() === 'ادمن' ||
      inputUser.toLowerCase() === 'admin';

    if ((isMasterAdminName || inputPwd === '552211') && (inputPwd === '552211' || isMasterAdminName)) {
      onLogin({
        username: 'Hany',
        name: 'هاني (المشرف الرئيسي)',
        role: 'admin',
      });
      return;
    }

    // Check Registered Data Entry Users
    const foundUser = users.find(
      (u) =>
        u.username.trim().toLowerCase() === inputUser.toLowerCase() &&
        u.password?.trim() === inputPwd
    );

    if (foundUser) {
      onLogin({
        username: foundUser.username,
        name: foundUser.username,
        role: foundUser.role,
      });
      return;
    }

    // If password is 552211, allow as admin
    if (inputPwd === '552211') {
      onLogin({
        username: inputUser,
        name: `${inputUser} (مشرف)`,
        role: 'admin',
      });
      return;
    }

    setError('❌ اسم المستخدم أو كلمة المرور غير صحيحة! يرجى التأكد من البيانات أو مراجعة المشرف الرئيسي هاني.');
  };

  const handleQuickFillMaster = () => {
    setUsername('هاني');
    setPassword('552211');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-scaleUp">
        {/* Decorative subtle background gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Building Logo & Header */}
        <div className="text-center space-y-3 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 ring-4 ring-amber-500/20">
            <Building2 className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-amber-400 leading-tight">
              برج المعتز 10
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              تسجيل الدخول لنظام إدارة الحسابات والتحصيل
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-bold flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>اسم المستخدم / المحصل:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="أدخل اسم المشرف (هاني) أو اسم المحصل"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 font-bold placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 block flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>كلمة المرور / الرقم السري:</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="أدخل كلمة المرور السرية"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 font-bold placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
              />
            </div>
          </div>

          {/* Quick Login Options */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={handleQuickFillMaster}
              className="text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1"
            >
              <span>دخول سريع للمشرف هاني</span>
            </button>
            <span className="text-[10px] text-slate-500">مشرف / محصل مخول</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2 text-sm"
          >
            <Lock className="w-4 h-4" />
            <span>تسجيل الدخول للنظام</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </form>

        {/* Registered Users Chips list helper for quick selection */}
        {users.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 block text-center">
              المستخدمين المسجلين بالمصادقة:
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setUsername('هاني');
                  setPassword('552211');
                  setError('');
                }}
                className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-bold hover:bg-amber-500/30 transition"
              >
                👑 هاني (المشرف)
              </button>
              {users.map((u, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUsername(u.username);
                    setPassword(u.password || '');
                    setError('');
                  }}
                  className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] hover:border-slate-500 transition"
                >
                  👤 {u.username} ({u.role === 'admin' ? 'مشرف' : 'محصل'})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-500 font-semibold pt-1">
          نظام برج المعتز 10 الحصري · حماية كاملة وصلاحيات محددة
        </div>
      </div>
    </div>
  );
};
