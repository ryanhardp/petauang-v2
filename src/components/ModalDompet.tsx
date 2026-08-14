"use client";

import React, { useState, useEffect } from "react";
import { X, Wallet as WalletIcon, Landmark, Banknote, PiggyBank } from "lucide-react";
import { useStore } from "../store/useStore";

const THEME_STYLES = {
  dark: { bgOverlay: "bg-black/60", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", inputBg: "bg-[#09090b]", hover: "hover:bg-white/5" },
  light: { bgOverlay: "bg-slate-900/40", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", inputBg: "bg-slate-50", hover: "hover:bg-slate-100" }
};

export default function ModalDompet({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  
  const addWallet = useStore((state) => state.addWallet);

  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<"cash"|"ewallet"|"bank"|"savings">("bank");
  const [initialBalance, setInitialBalance] = useState("");

  useEffect(() => {
    if (isOpen) {
      setWalletName("");
      setWalletType("bank");
      setInitialBalance("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if(!walletName || !initialBalance) return;
    
    // Warnain random biar estetik
    const colors = [
      {color: "text-emerald-500", bg: "bg-emerald-500/10"},
      {color: "text-blue-500", bg: "bg-blue-500/10"},
      {color: "text-indigo-500", bg: "bg-indigo-500/10"},
      {color: "text-amber-500", bg: "bg-amber-500/10"}
    ];
    const randColor = colors[Math.floor(Math.random() * colors.length)];

    addWallet({
      id: Date.now().toString(),
      name: walletName,
      type: walletType,
      initialBalance: Number(initialBalance),
      color: randColor.color,
      bg: randColor.bg
    });
    
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.bgOverlay} backdrop-blur-sm transition-opacity animate-in fade-in duration-200`}>
      <div className={`${T.bgCard} w-full max-w-md rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
          <h2 className={`text-xl font-extrabold ${T.textMain}`}>Tambah Dompet Baru</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${T.hover} ${T.textMuted} transition-colors`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Nama Dompet / Rekening</label>
            <input type="text" value={walletName} onChange={(e) => setWalletName(e.target.value)} placeholder="Contoh: BCA Pribadi, OVO, Celengan..." className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} focus:outline-none focus:border-blue-500 transition-colors`} />
          </div>

          <div>
            <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Jenis Dompet</label>
            <div className={`flex p-1 rounded-2xl ${T.inputBg} border ${T.border} overflow-x-auto no-scrollbar`}>
              <button onClick={() => setWalletType("cash")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold transition-all ${walletType === "cash" ? "bg-blue-500 text-white shadow-md" : T.textMuted}`}><Banknote size={14} /> Tunai</button>
              <button onClick={() => setWalletType("ewallet")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold transition-all ${walletType === "ewallet" ? "bg-blue-500 text-white shadow-md" : T.textMuted}`}><WalletIcon size={14} /> E-Wallet</button>
              <button onClick={() => setWalletType("bank")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold transition-all ${walletType === "bank" ? "bg-blue-500 text-white shadow-md" : T.textMuted}`}><Landmark size={14} /> Bank</button>
              <button onClick={() => setWalletType("savings")} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold transition-all ${walletType === "savings" ? "bg-blue-500 text-white shadow-md" : T.textMuted}`}><PiggyBank size={14} /> Tabungan</button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Saldo Awal (Rp)</label>
            <div className={`flex items-center px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} focus-within:border-blue-500 transition-colors`}>
              <span className={`text-lg font-bold ${T.textMuted} mr-2`}>Rp</span>
              <input type="text" inputMode="numeric" value={initialBalance === "" ? "" : new Intl.NumberFormat('id-ID').format(Number(initialBalance))} onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full bg-transparent text-xl font-black ${T.textMain} focus:outline-none placeholder:text-zinc-600`} />
            </div>
          </div>
        </div>

        <div className={`p-6 border-t ${T.border} flex gap-4`}>
          <button onClick={onClose} className={`flex-1 py-3.5 rounded-xl font-bold text-sm ${T.textMain} ${T.bgOverlay} ${T.hover} transition-colors`}>Batal</button>
          <button onClick={handleSave} disabled={!walletName || !initialBalance} className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${!walletName || !initialBalance ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Simpan Dompet</button>
        </div>

      </div>
    </div>
  );
}