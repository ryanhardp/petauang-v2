"use client";

import React, { useState, useEffect } from "react";
import { X, Palette, LogOut, Crown, Users, UserPlus, CheckCircle2, Moon, Sun, User as UserIcon, AlertCircle, Loader2, Download } from "lucide-react";
import { useStore } from "../store/useStore";
import { supabase } from "../lib/supabase";

const THEME_STYLES = {
  dark: { bgOverlay: "bg-black/60", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", inputBg: "bg-[#09090b]", hover: "hover:bg-white/5" },
  light: { bgOverlay: "bg-slate-900/40", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", inputBg: "bg-slate-50", hover: "hover:bg-slate-100" }
};

export default function ModalPengaturan({ isOpen, onClose, session }: { isOpen: boolean, onClose: () => void, session?: any }) {
  const { theme, setTheme, accent, setAccent, userName, setUserName } = useStore();
  const T = THEME_STYLES[theme as keyof typeof THEME_STYLES];
  
  const rawEmail = session?.user?.email || "";
  const loginId = rawEmail.split('@')[0];
  const isAdmin = loginId.toLowerCase() === "admin_ryan";

  const [activeTab, setActiveTab] = useState<"tampilan" | "admin">("tampilan");
  const [tempName, setTempName] = useState(userName);

  const [newClientId, setNewClientId] = useState("");
  const [newClientPass, setNewClientPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // State untuk nyimpen daftar user asli dari database
  const [clientList, setClientList] = useState<any[]>([]);

  // State PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Tarik data user saat modal dibuka
  useEffect(() => {
    if (isOpen && isAdmin) {
      fetch('/api/create-user')
        .then(res => res.json())
        .then(data => {
          if (data.users) setClientList(data.users);
        })
        .catch(err => console.error("Gagal memuat list user", err));
    }

    // Listener buat PWA
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, [isOpen, isAdmin, isSuccess]);

  if (!isOpen) return null;

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      alert("Untuk iOS: Klik tombol Share di browser, lalu pilih 'Add to Home Screen'.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newClientId || !newClientPass) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    setIsSuccess(false);

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newClientId, password: newClientPass })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal membuat akun klien.");

      setIsSuccess(true);
      setNewClientId("");
      setNewClientPass("");
      
      // Refresh list user setelah nambah
      const updatedRes = await fetch('/api/create-user');
      const updatedData = await updatedRes.json();
      if (updatedData.users) setClientList(updatedData.users);

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = () => {
    if(tempName.trim()) {
      setUserName(tempName.trim());
      alert("Nama panggilan berhasil diperbarui!");
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.bgOverlay} backdrop-blur-sm transition-opacity animate-in fade-in duration-200`}>
      <div className={`${T.bgCard} w-full max-w-lg rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col max-h-[90vh]`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
          <h2 className={`text-xl font-extrabold ${T.textMain}`}>Pengaturan Sistem</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
          <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r ${T.border} p-4 space-y-2 flex md:flex-col overflow-x-auto no-scrollbar`}>
            <button onClick={() => setActiveTab("tampilan")} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === "tampilan" ? "bg-blue-600 text-white shadow-md" : `${T.textMuted} ${T.hover}`}`}>
              <Palette size={18} /> Preferensi
            </button>
            
            {isAdmin && (
              <button onClick={() => setActiveTab("admin")} className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === "admin" ? "bg-amber-500 text-white shadow-md" : `${T.textMuted} ${T.hover}`}`}>
                <Crown size={18} /> Panel Admin
              </button>
            )}
          </div>

          <div className="w-full md:w-2/3 p-6 overflow-y-auto no-scrollbar">
            
            {activeTab === "tampilan" && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* TOMBOL PWA INSTALL */}
                <div>
                   <button onClick={handleInstallPWA} className={`w-full flex items-center justify-between p-4 rounded-2xl bg-blue-600/10 border border-blue-600/20 hover:bg-blue-600/20 transition-all`}>
                      <div className="text-left">
                        <h4 className={`text-sm font-bold text-blue-500`}>Install Aplikasi</h4>
                        <p className={`text-xs ${T.textMuted}`}>Add to Home Screen</p>
                      </div>
                      <Download size={20} className="text-blue-500" />
                   </button>
                </div>

                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${T.textMuted} mb-3 flex items-center gap-2`}><UserIcon size={14}/> Nama Panggilan</h3>
                  <div className="flex gap-2">
                     <input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} placeholder="Nama Panggilan Anda" className={`flex-1 px-4 py-2.5 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold focus:border-blue-500 outline-none`} />
                     <button onClick={handleSaveName} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors">Simpan</button>
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${T.textMuted} mb-3`}>Mode Gelap / Terang</h3>
                  <div className={`flex p-1 rounded-2xl ${T.inputBg} border ${T.border}`}>
                     <button onClick={() => setTheme("light")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${theme === "light" ? "bg-white text-slate-900 shadow-sm" : T.textMuted}`}>
                       <Sun size={16}/> Terang
                     </button>
                     <button onClick={() => setTheme("dark")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${theme === "dark" ? "bg-[#18181b] text-white shadow-sm border border-white/10" : T.textMuted}`}>
                       <Moon size={16}/> Gelap
                     </button>
                  </div>
                </div>

                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${T.textMuted} mb-3`}>Warna Aksen Aplikasi</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setAccent("sapphire")} className={`py-3 rounded-xl font-bold text-xs text-white bg-blue-600 transition-transform ${accent === "sapphire" ? "ring-2 ring-offset-2 ring-blue-600 scale-105" : ""}`}>Sapphire</button>
                    <button onClick={() => setAccent("emerald")} className={`py-3 rounded-xl font-bold text-xs text-white bg-emerald-500 transition-transform ${accent === "emerald" ? "ring-2 ring-offset-2 ring-emerald-500 scale-105" : ""}`}>Emerald</button>
                    <button onClick={() => setAccent("gold")} className={`py-3 rounded-xl font-bold text-xs text-white bg-amber-500 transition-transform ${accent === "gold" ? "ring-2 ring-offset-2 ring-amber-500 scale-105" : ""}`}>Gold</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "admin" && isAdmin && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md"><Users size={24}/></div>
                   <div>
                      <p className={`text-xs font-bold text-amber-600 uppercase tracking-wider`}>Total Klien Terdaftar</p>
                      <h4 className={`text-2xl font-black text-amber-500 mt-0.5`}>{clientList.length} Akun</h4>
                   </div>
                </div>

                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${T.textMuted} mb-3 flex items-center gap-2`}><UserPlus size={14}/> Buat Akun Klien Baru</h3>
                  
                  {errorMessage && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                      <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-bold text-rose-500">{errorMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleCreateClient} className="space-y-3">
                    <input type="text" required value={newClientId} onChange={(e) => setNewClientId(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="ID Klien (Cth: klien02)" className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold focus:border-amber-500 outline-none`} />
                    <input type="password" required value={newClientPass} onChange={(e) => setNewClientPass(e.target.value)} placeholder="Kata Sandi Klien" className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold focus:border-amber-500 outline-none`} />
                    
                    <button type="submit" disabled={isLoading || !newClientId || !newClientPass} className={`w-full py-3 mt-2 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 ${isLoading || !newClientId || !newClientPass ? 'bg-amber-500/50 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'}`}>
                      {isLoading ? <><Loader2 size={16} className="animate-spin" /> Mendaftarkan...</> : "Daftarkan Klien"}
                    </button>
                  </form>

                  {isSuccess && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-in slide-in-from-top-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-500">Akun klien berhasil masuk ke Supabase!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        <div className={`p-6 border-t ${T.border}`}>
          <button onClick={handleLogout} className={`w-full py-3.5 rounded-xl font-bold text-sm text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center justify-center gap-2`}>
            <LogOut size={18} /> Keluar dari Sistem
          </button>
        </div>

      </div>
    </div>
  );
}