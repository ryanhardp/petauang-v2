"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Clock } from "lucide-react";
import { useStore } from "../store/useStore";

const THEME_STYLES = {
  dark: { bgOverlay: "bg-black/60", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", inputBg: "bg-[#09090b]", hover: "hover:bg-white/5" },
  light: { bgOverlay: "bg-slate-900/40", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", inputBg: "bg-slate-50", hover: "hover:bg-slate-100" }
};

export default function ModalTransaksi({ isOpen, onClose, editingId }: { isOpen: boolean, onClose: () => void, editingId?: string | null }) {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  
  const categories = useStore((state) => state.categories);
  const wallets = useStore((state) => state.wallets);
  const transactions = useStore((state) => state.transactions);
  const addTransaction = useStore((state) => state.addTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);

  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [wallet, setWallet] = useState("");
  const [toWallet, setToWallet] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5)); // Jam default saat ini
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingId) {
        const tx = transactions.find(t => t.id === editingId);
        if (tx) {
          setType(tx.type);
          setAmount(tx.amount.toString());
          setCategory(tx.category);
          setWallet(tx.wallet);
          setToWallet(tx.toWallet || "");
          setDate(tx.date);
          setTime(tx.time || "00:00");
          setNote(tx.note || "");
        }
      } else {
        setType("expense");
        setAmount("");
        setCategory(categories[0]?.name || "");
        setWallet(wallets[0]?.name || "");
        setToWallet(wallets[1]?.name || "");
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().slice(0, 5));
        setNote("");
      }
    }
  }, [isOpen, editingId, transactions, categories, wallets]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!amount || !wallet) return;

    const txData = {
      id: editingId || Date.now().toString(),
      category: type === 'transfer' ? 'Transfer' : (category || categories[0]?.name || 'Lainnya'),
      wallet,
      toWallet: type === 'transfer' ? toWallet : undefined,
      amount: Number(amount),
      type,
      date,
      time: time || '00:00',
      note
    };

    if (editingId) {
      updateTransaction(editingId, txData);
    } else {
      addTransaction(txData);
    }

    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.bgOverlay} backdrop-blur-sm transition-opacity animate-in fade-in duration-200`}>
      <div className={`${T.bgCard} w-full max-w-lg rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col max-h-[90vh]`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
          <h2 className={`text-xl font-extrabold ${T.textMain}`}>{editingId ? "Edit Transaksi" : "Catat Transaksi Baru"}</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          
          {/* TIPE TRANSAKSI */}
          <div className={`flex p-1 rounded-2xl ${T.inputBg} border ${T.border}`}>
            <button onClick={() => setType("expense")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${type === "expense" ? "bg-rose-500 text-white shadow-md" : T.textMuted}`}>
              <ArrowDownRight size={16}/> Pengeluaran
            </button>
            <button onClick={() => setType("income")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${type === "income" ? "bg-emerald-500 text-white shadow-md" : T.textMuted}`}>
              <ArrowUpRight size={16}/> Pemasukan
            </button>
            <button onClick={() => setType("transfer")} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${type === "transfer" ? "bg-blue-600 text-white shadow-md" : T.textMuted}`}>
              <ArrowRightLeft size={16}/> Transfer
            </button>
          </div>

          {/* NOMINAL */}
          <div>
            <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Nominal (Rp)</label>
            <div className={`flex items-center px-4 py-3.5 rounded-xl ${T.inputBg} border ${T.border} focus-within:border-blue-500`}>
              <span className={`text-lg font-bold ${T.textMuted} mr-2`}>Rp</span>
              <input type="text" inputMode="numeric" value={amount ? new Intl.NumberFormat('id-ID').format(Number(amount)) : ""} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full bg-transparent text-2xl font-black ${T.textMain} outline-none`} />
            </div>
          </div>

          {/* KATEGORI (Hanya jika bukan transfer) */}
          {type !== 'transfer' && (
            <div>
              <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`}>
                {filteredCategories.map(cat => (
                  <option key={cat.id} value={cat.name} className="bg-[#18181b] text-white">{cat.emoji} {cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* SUMBER / TUJUAN DOMPET */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>{type === 'transfer' ? 'Dari Dompet' : 'Dompet'}</label>
              <select value={wallet} onChange={(e) => setWallet(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`}>
                {wallets.map(w => (
                  <option key={w.id} value={w.name} className="bg-[#18181b] text-white">{w.name}</option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Ke Dompet</label>
                <select value={toWallet} onChange={(e) => setToWallet(e.target.value)} className={`w-full px-4 py-3.5 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`}>
                  {wallets.filter(w => w.name !== wallet).map(w => (
                    <option key={w.id} value={w.name} className="bg-[#18181b] text-white">{w.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Tanggal</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`} />
              </div>
            )}
          </div>

          {/* JIKA TRANSFER, TANGGAL & JAM DISINI */}
          {type === 'transfer' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Tanggal</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`} />
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2 flex items-center gap-1`}><Clock size={12}/> Jam</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`} />
              </div>
            </div>
          )}

          {type !== 'transfer' && (
            <div>
              <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2 flex items-center gap-1`}><Clock size={12}/> Jam</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`} />
            </div>
          )}

          {/* CATATAN */}
          <div>
            <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Catatan (Opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Bensin motor, makan siang..." className={`w-full px-4 py-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold outline-none`} />
          </div>

        </div>

        <div className={`p-6 border-t ${T.border} flex gap-4`}>
          <button onClick={onClose} className={`flex-1 py-3.5 rounded-xl font-bold text-sm ${T.textMain} ${T.bgOverlay} ${T.hover}`}>Batal</button>
          <button onClick={handleSave} disabled={!amount || !wallet} className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg ${!amount || !wallet ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Simpan Transaksi</button>
        </div>

      </div>
    </div>
  );
}