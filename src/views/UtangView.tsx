"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { Plus, CheckCircle2, Clock, X, ArrowDownRight, ArrowUpRight, Edit3, Trash2, CalendarDays, Wallet } from "lucide-react";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", hover: "hover:bg-white/5", inputBg: "bg-[#09090b]", overlay: "bg-black/60" },
  light: { bgApp: "bg-[#F3F4F6]", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", hover: "hover:bg-slate-50", inputBg: "bg-slate-50", overlay: "bg-slate-900/40" }
};

export default function UtangView() {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const debts = useStore((state) => state.debts) || [];
  const addDebt = useStore((state) => state.addDebt);
  const updateDebt = useStore((state) => state.updateDebt);
  const deleteDebt = useStore((state) => state.deleteDebt);
  
  // TARIK DATA DOMPET & TRANSAKSI
  const wallets = useStore((state) => state.wallets);
  const addTransaction = useStore((state) => state.addTransaction);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState<"utang" | "piutang">("utang");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newTenor, setNewTenor] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");

  const totalUtang = debts.filter(d => d.type === "utang").reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);
  const totalPiutang = debts.filter(d => d.type === "piutang").reduce((s, d) => s + (d.totalAmount - d.paidAmount), 0);

  const openAddModal = () => {
    setEditingId(null); setNewType("utang"); setNewName(""); setNewAmount(""); setNewTenor("12"); setNewDueDate("");
    setIsAddOpen(true);
  };

  const openEditModal = (debt: any) => {
    setEditingId(debt.id); setNewType(debt.type); setNewName(debt.name); setNewAmount(debt.totalAmount.toString());
    setNewTenor(debt.tenorMonths.toString()); setNewDueDate(debt.firstDueDate);
    setIsAddOpen(true);
  };

  const handleSaveDebt = () => {
    if(!newName || !newAmount || !newDueDate || !newTenor) return;
    const debtData = {
      name: newName, emoji: newType === 'utang' ? "💳" : "🤝", totalAmount: Number(newAmount), 
      tenorMonths: Number(newTenor), firstDueDate: newDueDate, 
      type: newType, color: newType === 'utang' ? "bg-rose-500" : "bg-emerald-500"
    };

    if (editingId) updateDebt(editingId, debtData);
    else addDebt({ id: Date.now().toString(), paidAmount: 0, ...debtData });
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    if(confirm("Apakah Anda yakin ingin menghapus catatan ini?")) deleteDebt(id);
  };

  // LOGIKA BARU: POTONG/NAMBAH SALDO DOMPET SAAT BAYAR CICILAN
  const handlePayDebt = () => {
    if(!selectedDebtId || !payAmount || !selectedWallet) return;
    const debtInfo = debts.find(d => d.id === selectedDebtId);
    
    if(debtInfo) {
      // 1. Catat bahwa utang sudah terbayar sebagian
      updateDebt(selectedDebtId, { paidAmount: debtInfo.paidAmount + Number(payAmount) });
      
      // 2. Buat transaksi otomatis agar saldo Dompet berubah
      addTransaction({
        id: Date.now().toString(),
        category: debtInfo.type === 'utang' ? "Bayar Utang" : "Terima Piutang",
        wallet: selectedWallet,
        amount: Number(payAmount),
        type: debtInfo.type === 'utang' ? "expense" : "income", // Utang ngurangin dompet, Piutang nambahin dompet
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5), // <--- DITAMBAHKAN DI SINI SUPAYA TIDAK ERROR TYPESCRIPT
        note: `Cicilan: ${debtInfo.name}`
      });
    }
    setIsPayOpen(false); setPayAmount(""); setSelectedDebtId(null); setSelectedWallet("");
  };

  const getDebtStatus = (debt: any) => {
    const isDone = debt.paidAmount >= debt.totalAmount;
    if (isDone) return { isDone: true, nextDue: null, statusText: "Lunas", color: "text-emerald-500", currentInstallment: debt.tenorMonths };

    const installmentPerMonth = debt.totalAmount / debt.tenorMonths;
    let paidMonths = Math.floor(debt.paidAmount / installmentPerMonth);
    if (paidMonths >= debt.tenorMonths) paidMonths = debt.tenorMonths - 1; 

    const nextDue = new Date(debt.firstDueDate);
    nextDue.setMonth(nextDue.getMonth() + paidMonths);

    const today = new Date(); today.setHours(0,0,0,0);
    const dueTime = new Date(nextDue); dueTime.setHours(0,0,0,0);
    const diffTime = dueTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let statusText = `Sisa ${diffDays} Hari`;
    let color = T.textMuted;

    if (diffDays < 0) { statusText = `Terlambat ${Math.abs(diffDays)} Hari`; color = "text-rose-500"; }
    else if (diffDays === 0) { statusText = "Jatuh Tempo Hari Ini"; color = "text-amber-500"; }

    return { isDone: false, nextDue, statusText, color, currentInstallment: paidMonths + 1 };
  };

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen ${T.bgApp} p-4 md:p-8 transition-colors pb-32`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold ${T.textMain} tracking-tight`}>Utang & Piutang</h1>
          <p className={`text-sm ${T.textMuted} font-medium mt-1`}>Pantau kewajiban cicilan dan hak finansial Anda.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-md">
          <Plus size={20} /><span>Catat Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-[32px] ${T.bgCard} border ${T.border} shadow-sm flex items-center gap-6`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-500`}><ArrowDownRight size={32} /></div>
          <div><p className={`text-sm font-bold ${T.textMuted} uppercase tracking-wider mb-1`}>Utang Berjalan</p><h2 className={`text-3xl font-black text-rose-500`}>Rp{formatRupiah(totalUtang)}</h2></div>
        </div>
        <div className={`p-6 rounded-[32px] ${T.bgCard} border ${T.border} shadow-sm flex items-center gap-6`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500`}><ArrowUpRight size={32} /></div>
          <div><p className={`text-sm font-bold ${T.textMuted} uppercase tracking-wider mb-1`}>Piutang Berjalan</p><h2 className={`text-3xl font-black text-emerald-500`}>Rp{formatRupiah(totalPiutang)}</h2></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.map((debt) => {
          const persen = Math.min(100, Math.round((debt.paidAmount / debt.totalAmount) * 100));
          const sisa = debt.totalAmount - debt.paidAmount;
          const status = getDebtStatus(debt);
          const installmentPerMonth = debt.totalAmount / debt.tenorMonths;

          return (
            <div key={debt.id} className={`${T.bgCard} border ${T.border} rounded-3xl p-6 relative group overflow-hidden transition-all hover:shadow-md hover:-translate-y-1`}>
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(debt)} className={`p-2 rounded-lg ${T.hover} ${T.textMuted}`}><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(debt.id)} className={`p-2 rounded-lg hover:bg-rose-500/10 text-rose-500`}><Trash2 size={16} /></button>
              </div>

              {status.isDone && <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Lunas</div>}

              <div className="flex items-center gap-4 mb-6 mt-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white ${debt.color} shadow-md`}>{debt.emoji}</div>
                <div className="pr-16">
                  <h4 className={`text-lg font-bold ${T.textMain} leading-tight mb-1`}>{debt.name}</h4>
                  <div className={`text-xs font-semibold flex items-center gap-1 mb-1 ${status.color}`}>
                     <Clock size={12} /> {status.isDone ? "Selesai" : `${status.statusText} (${status.nextDue?.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})})`}
                  </div>
                  <div className={`text-[10px] font-bold ${T.textMuted} flex items-center gap-1 uppercase tracking-wider`}>
                     <CalendarDays size={12} /> Cicilan ke-{status.currentInstallment} dari {debt.tenorMonths}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <div>
                     <p className={`text-[10px] font-bold ${T.textMuted} uppercase tracking-wider`}>Sisa Tanggungan</p>
                     <p className={`text-2xl font-black ${T.textMain}`}>Rp{formatRupiah(sisa)}</p>
                  </div>
                  <p className={`text-sm font-bold ${status.isDone ? 'text-emerald-500' : debt.color.replace('bg-', 'text-')}`}>{persen}%</p>
                </div>
                <div className={`w-full h-3 rounded-full ${T.inputBg} overflow-hidden`}>
                  <div className={`h-full rounded-full ${debt.color} transition-all duration-1000 ease-out`} style={{ width: `${persen}%` }}></div>
                </div>
              </div>
              
              {!status.isDone && (
                <button 
                  onClick={() => { 
                    setSelectedDebtId(debt.id); 
                    setPayAmount(installmentPerMonth.toString()); 
                    if(wallets.length > 0) setSelectedWallet(wallets[0].name);
                    setIsPayOpen(true); 
                  }} 
                  className={`w-full py-3 mt-2 rounded-xl text-sm font-bold border ${T.border} ${T.hover} ${T.textMain} transition-colors flex items-center justify-center gap-2`}
                >
                  Catat Pembayaran (Rp{formatRupiah(installmentPerMonth)})
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* MODAL CATAT BARU / EDIT */}
      {isAddOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.overlay} backdrop-blur-sm animate-in fade-in`}>
          <div className={`${T.bgCard} w-full max-w-md rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
              <h2 className={`text-xl font-extrabold ${T.textMain}`}>{editingId ? "Edit Catatan" : "Catatan Baru"}</h2>
              <button onClick={() => setIsAddOpen(false)} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className={`flex p-1 rounded-2xl ${T.inputBg} border ${T.border}`}>
                   <button onClick={() => setNewType("utang")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${newType === "utang" ? "bg-rose-500 text-white shadow-md" : T.textMuted}`}>Saya Berutang</button>
                   <button onClick={() => setNewType("piutang")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${newType === "piutang" ? "bg-emerald-500 text-white shadow-md" : T.textMuted}`}>Orang Berutang</button>
              </div>
              <div><label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Kepada / Dari Siapa?</label><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Bank, Teman..." className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} outline-none focus:border-blue-500 transition-colors`} /></div>
              
              <div className="grid grid-cols-2 gap-4">
                   <div><label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Total Utang (Rp)</label><input type="text" inputMode="numeric" value={newAmount === "" ? "" : new Intl.NumberFormat('id-ID').format(Number(newAmount))} onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} font-bold outline-none focus:border-blue-500 transition-colors`} /></div>
                   <div><label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Tenor (Bulan)</label><input type="number" value={newTenor} onChange={(e) => setNewTenor(e.target.value)} placeholder="Contoh: 12" className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} font-bold outline-none focus:border-blue-500 transition-colors`} /></div>
              </div>

              <div><label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Tanggal Jatuh Tempo Pertama</label><input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} outline-none [color-scheme:dark]`} /></div>
            </div>
            <div className={`p-6 border-t ${T.border} flex gap-4`}>
              <button onClick={() => setIsAddOpen(false)} className={`flex-1 py-3.5 rounded-xl font-bold text-sm ${T.textMain} ${T.bgCard} border ${T.border} ${T.hover}`}>Batal</button>
              <button onClick={handleSaveDebt} disabled={!newName || !newAmount || !newDueDate || !newTenor} className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md ${(!newName || !newAmount || !newDueDate || !newTenor) ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN + PILIH DOMPET */}
      {isPayOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.overlay} backdrop-blur-sm animate-in fade-in`}>
          <div className={`${T.bgCard} w-full max-w-sm rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
              <h2 className={`text-xl font-extrabold ${T.textMain}`}>Pembayaran Cicilan</h2>
              <button onClick={() => setIsPayOpen(false)} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Potong / Masuk Dompet Mana?</label>
                <div className={`flex items-center px-4 py-3 rounded-xl ${T.inputBg} border ${T.border}`}>
                  <Wallet size={16} className={`${T.textMuted} mr-3`} />
                  <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className={`w-full bg-transparent text-sm font-semibold ${T.textMain} outline-none`}>
                    {wallets.length === 0 && <option value="">(Belum ada dompet)</option>}
                    {wallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Nominal (Rp)</label>
                <input autoFocus type="text" inputMode="numeric" value={payAmount === "" ? "" : new Intl.NumberFormat('id-ID').format(Number(payAmount))} onChange={(e) => setPayAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full p-4 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-3xl font-black outline-none focus:border-blue-500 transition-colors`} />
              </div>
            </div>
            <div className={`p-6 border-t ${T.border} flex gap-4`}>
              <button onClick={handlePayDebt} disabled={!payAmount || !selectedWallet} className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-md ${(!payAmount || !selectedWallet) ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Konfirmasi Pembayaran</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}