"use client";

import { useState } from "react";
import { Wallet, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useStore } from "../store/useStore";

export default function LoginView() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themeMode = useStore((state) => state.theme || "dark");
  const isDark = themeMode === "dark";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Trik Rahasia: Ubah Username jadi Email Supabase di balik layar
    const formattedEmail = `${username.trim().toLowerCase()}@petauang.app`;

    const { error } = await supabase.auth.signInWithPassword({
      email: formattedEmail,
      password: password,
    });

    if (error) {
      setError("Kredensial tidak valid. Silakan periksa kembali ID Pengguna dan Kata Sandi Anda.");
      setLoading(false);
    }
    // Jika sukses, Supabase akan otomatis mengubah state autentikasi
    // dan halaman akan otomatis dialihkan oleh page.tsx
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-[#09090b]' : 'bg-[#F3F4F6]'}`}>
      <div className={`w-full max-w-md p-8 md:p-10 rounded-[32px] shadow-2xl border ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-slate-200'} animate-in zoom-in-95 duration-500`}>
        
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-600/20 mb-4 shadow-inner">
            <Wallet size={32} strokeWidth={2.5} />
          </div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PetaUang</h1>
          <p className={`text-sm mt-2 font-medium text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Sistem Manajemen Finansial Pribadi</p>
        </div>

        {/* PESAN ERROR */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 animate-in shake">
            <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-rose-500 leading-relaxed">{error}</p>
          </div>
        )}

        {/* FORM LOGIN */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>ID Pengguna</label>
            <div className={`flex items-center px-4 py-3.5 rounded-xl border focus-within:border-blue-500 transition-colors ${isDark ? 'bg-[#09090b] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <User size={18} className={`${isDark ? 'text-zinc-500' : 'text-slate-400'} mr-3 shrink-0`} />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan ID Anda" 
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-medium" 
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Kata Sandi</label>
            <div className={`flex items-center px-4 py-3.5 rounded-xl border focus-within:border-blue-500 transition-colors ${isDark ? 'bg-[#09090b] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
              <Lock size={18} className={`${isDark ? 'text-zinc-500' : 'text-slate-400'} mr-3 shrink-0`} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-transparent text-sm font-semibold outline-none placeholder:font-medium" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !username || !password}
            className={`w-full py-4 mt-2 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${loading || !username || !password ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}`}
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Memproses...</> : "Masuk ke Sistem"}
          </button>
        </form>

        <p className={`text-[10px] font-semibold text-center mt-8 uppercase tracking-widest ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
          &copy; {new Date().getFullYear()} PetaUang App
        </p>

      </div>
    </div>
  );
}