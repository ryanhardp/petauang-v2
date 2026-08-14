"use client";

import { useState } from "react";
import { Plus, Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, Trash2, Edit2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { supabase } from "../lib/supabase";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", inputBg: "bg-[#09090b]", hover: "hover:bg-white/5" },
  light: { bgApp: "bg-[#F3F4F6]", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", inputBg: "bg-white", hover: "hover:bg-slate-50" }
};

export default function TransaksiView({ onAddTx, onEditTx }: { onAddTx: () => void, onEditTx: (id: string) => void }) {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  
  const transactions = useStore((state) => state.transactions) || [];
  const categories = useStore((state) => state.categories) || [];
  
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatRupiah = (val: number) => `Rp${new Intl.NumberFormat('id-ID').format(val)}`;

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus transaksi ini?")) {
      useStore.setState((state) => ({ transactions: state.transactions.filter(t => t.id !== id) }));
      await supabase.from('transactions').delete().eq('id', id);
    }
  };

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Filter & Urutkan secara ketat dari tanggal dan jam terbaru
  const filteredTransactions = transactions.filter(tx => {
    const d = new Date(tx.date);
    const matchesMonth = d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    const matchesSearch = tx.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.wallet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMonth && matchesSearch;
  }).sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());

  return (
    <div className={`animate-in fade-in duration-500 pb-32 ${T.bgApp}`}>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold ${T.textMain} tracking-tight`}>Transaksi</h1>
          <p className={`text-sm ${T.textMuted} font-medium mt-1`}>Riwayat pencatatan arus kas Anda secara detail.</p>
        </div>
        <button onClick={onAddTx} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105">
          <Plus size={18} /> Catat Transaksi
        </button>
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className={`flex-1 flex items-center px-4 py-3.5 rounded-2xl ${T.bgCard} border ${T.border} shadow-sm`}>
          <Search size={18} className={`${T.textMuted} mr-3`} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari transaksi berdasarkan kategori, dompet, atau catatan..." className={`w-full bg-transparent text-sm font-semibold ${T.textMain} outline-none placeholder:text-zinc-600`} />
        </div>

        <div className={`flex items-center justify-between px-5 py-3.5 rounded-2xl ${T.bgCard} border ${T.border} shadow-sm min-w-[240px]`}>
          <button onClick={handlePrevMonth} className={`p-1 rounded-lg ${T.hover} ${T.textMuted}`}><Calendar size={16}/></button>
          <span className={`text-sm font-bold ${T.textMain}`}>{currentMonthName}</span>
          <button onClick={handleNextMonth} className={`p-1 rounded-lg ${T.hover} ${T.textMuted}`}><Calendar size={16}/></button>
        </div>
      </div>

      {/* DAFTAR TRANSAKSI */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className={`${T.bgCard} border ${T.border} rounded-3xl p-12 text-center shadow-sm`}>
            <p className={`text-sm font-bold ${T.textMuted}`}>Tidak ada riwayat transaksi pada periode ini.</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            const catData = categories.find(c => c.name === tx.category);
            const displayEmoji = isTransfer ? <ArrowRightLeft size={18}/> : (catData ? catData.emoji : (isIncome ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>));
            const displayColor = isTransfer ? 'bg-blue-600 text-white' : (catData ? catData.color : 'bg-slate-500 text-white');

            return (
              <div key={tx.id} className={`${T.bgCard} border ${T.border} rounded-3xl p-5 flex items-center justify-between shadow-sm hover:border-blue-500/50 transition-all group`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${displayColor.split(' ')[0]}`}>
                    {typeof displayEmoji === 'string' ? <span className="text-xl">{displayEmoji}</span> : displayEmoji}
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${T.textMain}`}>{isTransfer ? 'Transfer Dana' : tx.category}</h4>
                    <p className={`text-xs font-semibold ${T.textMuted} mt-0.5`}>
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {tx.time || '00:00'} • <span className="text-blue-500">{isTransfer ? `${tx.wallet} ➔ ${tx.toWallet}` : tx.wallet}</span>
                    </p>
                    {tx.note && <p className={`text-xs ${T.textMuted} italic mt-1`}>&ldquo;{tx.note}&rdquo;</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-base font-black ${isTransfer ? T.textMain : (isIncome ? 'text-emerald-500' : 'text-rose-500')}`}>
                    {isTransfer ? '' : (isIncome ? '+' : '-')}{formatRupiah(tx.amount)}
                  </span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditTx(tx.id)} className={`p-2 rounded-xl ${T.hover} ${T.textMuted} hover:text-blue-500 transition-colors`}><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(tx.id)} className={`p-2 rounded-xl ${T.hover} ${T.textMuted} hover:text-rose-500 transition-colors`}><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  );
}