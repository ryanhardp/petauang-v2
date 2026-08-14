"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { Plus, CheckCircle2, TrendingUp, Clock, X, Info, Edit3, Trash2, Wallet, Tag, ShoppingBag } from "lucide-react";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", hover: "hover:bg-white/5", inputBg: "bg-[#09090b]", overlay: "bg-black/60" },
  light: { bgApp: "bg-[#F3F4F6]", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", hover: "hover:bg-slate-50", inputBg: "bg-slate-50", overlay: "bg-slate-900/40" }
};

export default function TargetView() {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const targets = useStore((state) => state.targets);
  const addTarget = useStore((state) => state.addTarget);
  const updateTarget = useStore((state) => state.updateTarget);
  const deleteTarget = useStore((state) => state.deleteTarget);
  
  const wallets = useStore((state) => state.wallets);
  const categories = useStore((state) => state.categories);
  const addTransaction = useStore((state) => state.addTransaction);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTargetAmount, setNewTargetAmount] = useState("");
  const [durationMonths, setDurationMonths] = useState("");
  const [newColor, setNewColor] = useState("bg-blue-500");

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [addedAmount, setAddedAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");

  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [buyCategory, setBuyCategory] = useState("");
  const [buyAmount, setBuyAmount] = useState("");

  const activeTargets = targets.filter(t => !t.isBought);
  const totalTarget = activeTargets.reduce((sum, t) => sum + t.targetAmount, 0);
  const totalTerkumpul = activeTargets.reduce((sum, t) => sum + t.currentAmount, 0);
  const totalPersen = totalTarget > 0 ? Math.round((totalTerkumpul / totalTarget) * 100) : 0;

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const groupedCategories = expenseCategories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = []; acc[cat.group].push(cat); return acc;
  }, {} as Record<string, typeof categories>);

  const openAddModal = () => {
    setEditingId(null); setNewName(""); setNewTargetAmount(""); setDurationMonths(""); setNewColor("bg-blue-500");
    setIsAddOpen(true);
  };

  const openEditModal = (target: any) => {
    setEditingId(target.id); setNewName(target.name); setNewTargetAmount(target.targetAmount.toString());
    setDurationMonths(target.durationMonths.toString()); setNewColor(target.color);
    setIsAddOpen(true);
  };

  const handleSaveTarget = () => {
    if(!newName || !newTargetAmount || !durationMonths) return;

    const deadlineDate = new Date();
    deadlineDate.setMonth(deadlineDate.getMonth() + Number(durationMonths));
    const deadlineStr = deadlineDate.toISOString().split('T')[0];

    const targetData = {
      name: newName, emoji: "🎯", targetAmount: Number(newTargetAmount), durationMonths: Number(durationMonths),
      deadlineDate: deadlineStr, color: newColor
    };

    if (editingId) updateTarget(editingId, targetData);
    else addTarget({ id: Date.now().toString(), currentAmount: 0, isBought: false, ...targetData });
    
    setIsAddOpen(false);
  };

  const handleDelete = (id: string) => {
    if(confirm("Apakah Anda yakin ingin menghapus target ini?")) deleteTarget(id);
  };

  // LOGIKA 1: NABUNG TARGET (UANG PINDAH DARI BCA KE TARGET, TOTAL KEKAYAAN AMAN)
  const handleUpdateSaldo = () => {
    if(!selectedTargetId || !addedAmount || !selectedWallet) return;
    
    const targetInfo = targets.find(t => t.id === selectedTargetId);
    if(targetInfo) {
      updateTarget(selectedTargetId, { currentAmount: targetInfo.currentAmount + Number(addedAmount) });
      
      // Dicatat sebagai TRANSFER, bukan expense. Biar dompet asli BCA ngurang, tapi nggak masuk laporan pengeluaran.
      addTransaction({
        id: Date.now().toString(),
        category: "Transfer",
        wallet: selectedWallet,
        toWallet: `Target: ${targetInfo.name}`,
        amount: Number(addedAmount),
        type: "transfer",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5), // <--- DITAMBAHKAN DI SINI SUPAYA TIDAK ERROR TYPESCRIPT
        note: `Alokasi dana ke Target`
      });
    }
    setIsUpdateOpen(false); setAddedAmount(""); setSelectedTargetId(null); setSelectedWallet("");
  };

  const openBuyModal = (target: any) => {
    setSelectedTargetId(target.id);
    setBuyAmount(target.targetAmount.toString()); // Default: Sesuai harga target
    const defaultCat = categories.find(c => c.type === 'expense');
    if(defaultCat) setBuyCategory(defaultCat.name);
    setIsBuyOpen(true);
  };

  // LOGIKA 2: BELI BARANG (UANG HANGUS, TOTAL KEKAYAAN BERKURANG)
  const handleBuyTarget = () => {
    if(!selectedTargetId || !buyCategory || !buyAmount) return;
    const targetInfo = targets.find(t => t.id === selectedTargetId);
    
    if(targetInfo) {
      // Uangnya bersumber dari Target itu sendiri, jadi kita catat sebagai Pengeluaran Nyata
      addTransaction({
        id: Date.now().toString(),
        category: buyCategory,
        wallet: `Target: ${targetInfo.name}`, 
        amount: Number(buyAmount),
        type: "expense",
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5), // <--- DITAMBAHKAN JUGA DI SINI
        note: `Pembelian Target Final`
      });
      // Tandai target sudah dibeli. Di DompetView, uangnya nggak akan dihitung lagi = Total Kekayaan Drop!
      updateTarget(selectedTargetId, { isBought: true });
    }
    setIsBuyOpen(false); setSelectedTargetId(null); setBuyCategory(""); setBuyAmount("");
  };

  const getMonthlySuggestion = (targetAmount: number, currentAmount: number, deadlineDateStr: string) => {
    const remainingAmount = targetAmount - currentAmount;
    if (remainingAmount <= 0) return 0;
    
    const deadline = new Date(deadlineDateStr);
    const now = new Date();
    let remainingMonths = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    
    if (remainingMonths <= 0) remainingMonths = 1;
    return Math.ceil(remainingAmount / remainingMonths);
  };

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen ${T.bgApp} p-4 md:p-8 transition-colors pb-32`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold ${T.textMain} tracking-tight`}>Target Finansial</h1>
          <p className={`text-sm ${T.textMuted} font-medium mt-1`}>Rencanakan dan wujudkan tujuan finansial Anda.</p>
        </div>
        <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-md">
          <Plus size={20} /><span>Buat Target Baru</span>
        </button>
      </div>

      <div className={`mb-8 p-6 md:p-8 rounded-[32px] ${T.bgCard} border ${T.border} shadow-sm flex flex-col md:flex-row items-center gap-8`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-8 border-blue-500/20 relative`}>
           <span className="text-xl font-black text-blue-500">{totalPersen}%</span>
           <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
             <path strokeDasharray={`${totalPersen}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4" />
           </svg>
        </div>
        <div className="flex-1 w-full">
          <div className="flex justify-between items-end mb-2">
            <p className={`text-sm font-bold ${T.textMuted} uppercase tracking-wider`}>Total Target Keseluruhan</p>
            <p className={`text-sm font-bold ${T.textMain}`}>Rp{formatRupiah(totalTarget)}</p>
          </div>
          <h2 className={`text-3xl md:text-4xl font-black ${T.textMain}`}>Rp{formatRupiah(totalTerkumpul)} <span className={`text-lg font-medium ${T.textMuted}`}>Terkumpul (Virtual)</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets.map((target) => {
          const persen = Math.min(100, Math.round((target.currentAmount / target.targetAmount) * 100));
          const isDone = persen === 100;
          const monthlySuggestion = getMonthlySuggestion(target.targetAmount, target.currentAmount, target.deadlineDate);

          return (
            <div key={target.id} className={`${T.bgCard} border ${T.border} rounded-3xl p-6 relative group overflow-hidden transition-all hover:shadow-md hover:-translate-y-1`}>
              
              {!target.isBought && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(target)} className={`p-2 rounded-lg ${T.hover} ${T.textMuted}`}><Edit3 size={16} /></button>
                  <button onClick={() => handleDelete(target.id)} className={`p-2 rounded-lg hover:bg-rose-500/10 text-rose-500`}><Trash2 size={16} /></button>
                </div>
              )}

              {target.isBought ? (
                <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Telah Dibeli</div>
              ) : isDone ? (
                <div className="absolute top-4 right-4 bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Target Tercapai</div>
              ) : null}

              <div className="flex items-center gap-4 mb-6 mt-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white ${target.isBought ? 'bg-emerald-500' : target.color} shadow-md`}>{target.emoji}</div>
                <div className="pr-16">
                  <h4 className={`text-lg font-bold ${T.textMain} leading-tight`}>{target.name}</h4>
                  <p className={`text-xs font-semibold ${T.textMuted} flex items-center gap-1 mt-1`}><Clock size={12} /> {target.durationMonths} Bulan ({new Date(target.deadlineDate).toLocaleDateString('id-ID', {month: 'short', year:'numeric'})})</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <p className={`text-2xl font-black ${T.textMain}`}>Rp{formatRupiah(target.currentAmount)}</p>
                  <p className={`text-sm font-bold ${target.isBought ? 'text-emerald-500' : (isDone ? 'text-blue-500' : target.color.replace('bg-', 'text-'))}`}>{persen}%</p>
                </div>
                <div className={`w-full h-3 rounded-full ${T.inputBg} overflow-hidden`}>
                  <div className={`h-full rounded-full ${target.isBought ? 'bg-emerald-500' : target.color} transition-all duration-1000 ease-out`} style={{ width: `${persen}%` }}></div>
                </div>
                <p className={`text-xs font-bold ${T.textMuted} text-right mt-2`}>dari Rp{formatRupiah(target.targetAmount)}</p>
              </div>
              
              {!isDone && !target.isBought && (
                <div className={`mt-4 mb-4 p-3 rounded-xl bg-blue-500/10 flex items-start gap-3`}>
                   <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                   <div>
                     <p className={`text-[10px] font-bold text-blue-500 uppercase tracking-wider`}>Saran Alokasi Bulanan</p>
                     <p className={`text-sm font-semibold ${T.textMain}`}>Rp{formatRupiah(monthlySuggestion)} / bln</p>
                   </div>
                </div>
              )}
              
              {/* TOMBOL AKSI */}
              {target.isBought ? (
                <button disabled className={`w-full py-3 mt-2 rounded-xl text-sm font-bold border border-emerald-500 text-emerald-500 bg-emerald-500/10 flex items-center justify-center gap-2`}>
                   <CheckCircle2 size={16} /> Pembelian Selesai
                </button>
              ) : isDone ? (
                <button onClick={() => openBuyModal(target)} className={`w-full py-3 mt-2 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-md`}>
                   <ShoppingBag size={16} /> Beli Target Ini
                </button>
              ) : (
                <button 
                  onClick={() => { 
                    setSelectedTargetId(target.id); 
                    if(wallets.length > 0) setSelectedWallet(wallets[0].name);
                    setIsUpdateOpen(true); 
                  }} 
                  className={`w-full py-3 mt-2 rounded-xl text-sm font-bold border ${T.border} ${T.hover} ${T.textMain} transition-colors flex items-center justify-center gap-2`}
                >
                   <TrendingUp size={16} /> Perbarui Saldo
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* MODAL BUAT/EDIT TARGET */}
      {isAddOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.overlay} backdrop-blur-sm animate-in fade-in`}>
          <div className={`${T.bgCard} w-full max-w-md rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
              <h2 className={`text-xl font-extrabold ${T.textMain}`}>{editingId ? "Edit Target" : "Target Baru"}</h2>
              <button onClick={() => setIsAddOpen(false)} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Nama Target</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Dana Darurat, Beli PS5..." className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} focus:border-blue-500 outline-none transition-colors`} />
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Total Dana yang Dibutuhkan (Rp)</label>
                <input type="text" inputMode="numeric" value={newTargetAmount === "" ? "" : new Intl.NumberFormat('id-ID').format(Number(newTargetAmount))} onChange={(e) => setNewTargetAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} font-black text-xl focus:border-blue-500 outline-none transition-colors`} />
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Target Tercapai Dalam (Bulan)</label>
                <div className={`flex items-center p-3 rounded-xl ${T.inputBg} border ${T.border} focus-within:border-blue-500 transition-colors`}>
                  <input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} placeholder="Contoh: 10" className={`w-full bg-transparent ${T.textMain} font-bold outline-none`} />
                  <span className={`text-sm font-bold ${T.textMuted}`}>Bulan</span>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Tema Warna</label>
                <div className="flex gap-3">
                  {['bg-emerald-500', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'].map(c => <button key={c} onClick={() => setNewColor(c)} className={`w-8 h-8 rounded-full ${c} transition-all ${newColor === c ? 'ring-4 ring-blue-500/30 scale-110' : ''}`}></button>)}
                </div>
              </div>
            </div>
            <div className={`p-6 border-t ${T.border} flex gap-4`}>
              <button onClick={() => setIsAddOpen(false)} className={`flex-1 py-3.5 rounded-xl font-bold text-sm ${T.textMain} ${T.bgCard} border ${T.border} ${T.hover}`}>Batal</button>
              <button onClick={handleSaveTarget} disabled={!newName || !newTargetAmount || !durationMonths} className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all shadow-md ${(!newName || !newTargetAmount || !durationMonths) ? "bg-blue-600/50 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALOKASI VIRTUAL DARI DOMPET KE TARGET */}
      {isUpdateOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.overlay} backdrop-blur-sm animate-in fade-in`}>
          <div className={`${T.bgCard} w-full max-w-sm rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
              <h2 className={`text-xl font-extrabold ${T.textMain}`}>Alokasi Dana Target</h2>
              <button onClick={() => setIsUpdateOpen(false)} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Ambil Uang Dari Dompet?</label>
                <div className={`flex items-center px-4 py-3 rounded-xl ${T.inputBg} border ${T.border}`}>
                  <Wallet size={16} className={`${T.textMuted} mr-3`} />
                  <select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)} className={`w-full bg-transparent text-sm font-semibold ${T.textMain} outline-none cursor-pointer`}>
                    {wallets.length === 0 && <option value="">(Belum ada dompet)</option>}
                    {wallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Nominal Ditambahkan (Rp)</label>
                <input autoFocus type="text" inputMode="numeric" value={addedAmount === "" ? "" : new Intl.NumberFormat('id-ID').format(Number(addedAmount))} onChange={(e) => setAddedAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full p-4 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-3xl font-black outline-none focus:border-blue-500 transition-colors`} />
              </div>
            </div>
            <div className={`p-6 border-t ${T.border} flex gap-4`}>
              <button onClick={handleUpdateSaldo} disabled={!addedAmount || !selectedWallet} className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-md ${(!addedAmount || !selectedWallet) ? "bg-emerald-600/50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}>Simpan Progres</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBELIAN (MENGURANGI TOTAL KEKAYAAN) */}
      {isBuyOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.overlay} backdrop-blur-sm animate-in fade-in`}>
          <div className={`${T.bgCard} w-full max-w-md rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col`}>
            <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
              <h2 className={`text-xl font-extrabold ${T.textMain}`}>Selesaikan & Beli Barang</h2>
              <button onClick={() => setIsBuyOpen(false)} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Kategori Pengeluaran Akhir</label>
                <div className={`flex items-center px-4 py-3 rounded-xl ${T.inputBg} border ${T.border}`}>
                  <Tag size={16} className={`${T.textMuted} mr-3`} />
                  <select value={buyCategory} onChange={(e) => setBuyCategory(e.target.value)} className={`w-full bg-transparent text-sm font-semibold ${T.textMain} focus:outline-none cursor-pointer`}>
                    {Object.keys(groupedCategories).map(group => (
                      <optgroup key={group} label={group}>
                        {groupedCategories[group].map(c => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold ${T.textMuted} mb-2 uppercase tracking-wider`}>Nominal Barang (Rp)</label>
                <input type="text" inputMode="numeric" value={buyAmount === "" ? "" : new Intl.NumberFormat('id-ID').format(Number(buyAmount))} onChange={(e) => setBuyAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full p-4 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-2xl font-black outline-none focus:border-blue-500 transition-colors`} />
              </div>
            </div>
            <div className={`p-6 border-t ${T.border} flex gap-4`}>
              <button onClick={handleBuyTarget} disabled={!buyAmount || !buyCategory} className={`w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-md ${(!buyAmount || !buyCategory) ? "bg-emerald-600/50 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}>Konfirmasi Pembelian</button>
            </div>
          </div>
      </div>
    )}

  </div>
  );
}