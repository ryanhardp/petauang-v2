"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { Eye, EyeOff, Wallet as WalletIcon, Landmark, Banknote, PiggyBank, ArrowDownRight, ArrowUpRight, ArrowRightLeft, TrendingUp, TrendingDown, Settings2, Check } from "lucide-react";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", hover: "hover:bg-white/5" },
  light: { bgApp: "bg-[#F3F4F6]", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", hover: "hover:bg-slate-50" }
};

const ICONS = { cash: Banknote, ewallet: WalletIcon, bank: Landmark, savings: PiggyBank };

// PALET WARNA NEON KHUSUS GRAFIK BIAR KONTRAS & GA NUMPUK
const CHART_COLORS = [
  '#f43f5e', // Rose / Merah
  '#3b82f6', // Blue / Biru
  '#fbbf24', // Amber / Kuning
  '#10b981', // Emerald / Hijau
  '#a855f7', // Purple / Ungu
  '#06b6d4', // Cyan / Biru Muda
  '#ec4899', // Pink
  '#f97316'  // Orange
];

const COLOR_MAP: Record<string, string> = {
  'rose-500': '#f43f5e', 'sky-500': '#0ea5e9', 'orange-400': '#fb923c', 'slate-500': '#64748b',
  'purple-500': '#a855f7', 'lime-500': '#84cc16', 'teal-600': '#0d9488', 'amber-400': '#fbbf24',
  'amber-500': '#f59e0b', 'emerald-500': '#10b981', 'blue-500': '#3b82f6', 'gray-500': '#6b7280'
};

const getHexColor = (twClass: string) => {
   for (const key in COLOR_MAP) { if (twClass.includes(key)) return COLOR_MAP[key]; }
   return '#94a3b8';
};

export default function DashboardView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  const userName = useStore((state) => state.userName);
  const [hideSaldo, setHideSaldo] = useState(false);

  // FITUR TAMBAHAN: EDIT DASHBOARD
  const [isEditing, setIsEditing] = useState(false);
  const dashboardWidgets = useStore((state) => state.dashboardWidgets);
  const toggleWidget = useStore((state) => state.toggleWidget);

  const wallets = useStore((state) => state.wallets) || [];
  const transactions = useStore((state) => state.transactions) || [];
  const categories = useStore((state) => state.categories) || [];

  // FORMAT RUPIAH YANG JELAS ADA "Rp"-NYA
  const formatRupiah = (val: number) => hideSaldo ? "Rp ********" : `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;

  const calculateRealBalance = (walletName: string, initialBalance: number) => {
    let balance = initialBalance;
    transactions.forEach(tx => {
       if (tx.type === 'income' && tx.wallet === walletName) balance += tx.amount;
       if (tx.type === 'expense' && tx.wallet === walletName) balance -= tx.amount;
       if (tx.type === 'transfer' && tx.wallet === walletName) balance -= tx.amount;
       if (tx.type === 'transfer' && tx.toWallet === walletName) balance += tx.amount;
    });
    return balance;
  };

  const displayWallets = wallets.slice(0, 3).map(w => ({
      ...w,
      realBalance: calculateRealBalance(w.name, w.initialBalance)
  }));

  // HITUNG PEMASUKAN & PENGELUARAN BULAN INI
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthTransactions = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncomeMonth = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenseMonth = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // STRUKTUR PENGELUARAN DENGAN PALET WARNA NEON BARU
  const currentMonthExpenses = monthTransactions.filter(tx => tx.type === 'expense');
  const expenseByCategory = currentMonthExpenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount; return acc;
  }, {} as Record<string, number>);

  const totalExpenseThisMonth = Object.values(expenseByCategory).reduce((a,b) => a+b, 0);
  
  const topExpenses = Object.entries(expenseByCategory)
      .sort((a, b) => b[1] - a[1]) // Urutkan pengeluaran dari terbesar dulu
      .slice(0, 4) // Ambil 4 terbesar
      .map(([name, amount], index) => {
          // Suntik warna berurutan dari palet CHART_COLORS
          return { name, amount, colorHex: CHART_COLORS[index % CHART_COLORS.length] };
      });
      
  let currentConicPercentage = 0;
  const conicGradientString = topExpenses.length > 0 ? topExpenses.map(d => {
      const percentage = (d.amount / totalExpenseThisMonth) * 100;
      const str = `${d.colorHex} ${currentConicPercentage}% ${currentConicPercentage + percentage}%`;
      currentConicPercentage += percentage;
      return str;
  }).join(', ') : '#e5e7eb 0% 100%';

  const recentTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${T.bgApp} transition-colors pb-32`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold ${T.textMain} tracking-tight`}>Dashboard</h1>
          <p className={`text-sm ${T.textMuted} font-medium mt-1`}>Selamat datang kembali, {userName} 👋</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-2 text-sm font-bold ${isEditing ? 'text-emerald-500' : T.textMuted} hover:${T.textMain} transition-colors`}>
            {isEditing ? <Check size={18}/> : <Settings2 size={18}/>} {isEditing ? "Selesai Edit" : "Edit Dashboard"}
          </button>
          <button onClick={() => setHideSaldo(!hideSaldo)} className={`flex items-center gap-2 text-sm font-bold ${T.textMuted} hover:${T.textMain} transition-colors`}>
            {hideSaldo ? <Eye size={18}/> : <EyeOff size={18}/>} Sembunyikan Saldo
          </button>
        </div>
      </div>

      {/* PANEL EDIT DASHBOARD */}
      {isEditing && (
        <div className={`mb-6 p-4 rounded-2xl ${T.bgCard} border border-blue-500/30 flex gap-4 overflow-x-auto`}>
          {['wallets', 'summary', 'chart', 'transactions'].map(w => (
            <button key={w} onClick={() => toggleWidget(w)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${dashboardWidgets.includes(w) ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
              {dashboardWidgets.includes(w) ? "Tampil" : "Sembunyi"}: {w.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* KARTU DOMPET */}
      {dashboardWidgets.includes('wallets') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {displayWallets.map(w => {
              const Icon = ICONS[w.type as keyof typeof ICONS] || WalletIcon;
              return (
                <div key={w.id} onClick={() => setActiveTab("Dompet")} className={`${T.bgCard} border ${T.border} rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition-all shadow-sm group`}>
                  <div className="flex justify-between items-start mb-4">
                    <p className={`text-xs font-bold ${T.textMuted} uppercase tracking-wider`}>{w.name}</p>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${w.bg} ${w.color} group-hover:scale-110 transition-transform`}><Icon size={20}/></div>
                  </div>
                  <h3 className={`text-2xl font-black ${T.textMain}`}>{formatRupiah(w.realBalance)}</h3>
                </div>
              )
          })}
        </div>
      )}

      {/* RINGKASAN & CHART */}
      {(dashboardWidgets.includes('summary') || dashboardWidgets.includes('chart')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {dashboardWidgets.includes('summary') && (
            <div className={`lg:col-span-2 ${T.bgCard} border ${T.border} rounded-3xl p-6 shadow-sm flex flex-col justify-between`}>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`font-bold ${T.textMain}`}>Ringkasan Bulan Ini</h3>
                  <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full">Periode Aktif</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className={`p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4`}>
                          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md"><TrendingUp size={24}/></div>
                          <div>
                            <p className={`text-xs font-bold text-emerald-600 uppercase tracking-wider`}>Total Pemasukan</p>
                            <h4 className={`text-xl font-black text-emerald-500 mt-0.5`}>{formatRupiah(totalIncomeMonth)}</h4>
                          </div>
                    </div>
                    <div className={`p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4`}>
                          <div className="w-12 h-12 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md"><TrendingDown size={24}/></div>
                          <div>
                            <p className={`text-xs font-bold text-rose-600 uppercase tracking-wider`}>Total Pengeluaran</p>
                            <h4 className={`text-xl font-black text-rose-500 mt-0.5`}>{formatRupiah(totalExpenseMonth)}</h4>
                          </div>
                    </div>
                </div>
              </div>
              <p className={`text-xs ${T.textMuted} font-medium text-center md:text-left`}>
                💡 Data di atas terhitung otomatis dari seluruh transaksi yang tercatat pada bulan ini.
              </p>
            </div>
          )}

          {dashboardWidgets.includes('chart') && (
            <div className={`${T.bgCard} border ${T.border} rounded-3xl p-6 shadow-sm flex flex-col`}>
              <h3 className={`font-bold ${T.textMain} mb-6`}>Struktur Pengeluaran</h3>
              {totalExpenseThisMonth === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-sm font-bold text-zinc-500">Belum ada pengeluaran di bulan ini.</div>
              ) : (
                  <>
                    <div className="flex-1 flex justify-center items-center mb-6 mt-2">
                      <div className="w-32 h-32 rounded-full relative shadow-inner" style={{ background: `conic-gradient(${conicGradientString})` }}>
                          <div className={`absolute inset-3 rounded-full ${T.bgCard}`}></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {topExpenses.map(exp => (
                        <div key={exp.name} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full`} style={{backgroundColor: exp.colorHex}}></div><span className={`font-semibold ${T.textMain}`}>{exp.name}</span></div>
                          <span className={`font-bold ${T.textMuted}`}>{formatRupiah(exp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TRANSAKSI TERBARU */}
      {dashboardWidgets.includes('transactions') && (
        <div className={`${T.bgCard} border ${T.border} rounded-3xl p-6 shadow-sm`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className={`font-bold ${T.textMain}`}>Transaksi Terbaru</h3>
            <button onClick={() => setActiveTab("Transaksi")} className="text-xs font-bold text-blue-500 hover:text-blue-600">Lihat Semua</button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className={`text-sm ${T.textMuted} text-center py-4`}>Belum ada riwayat transaksi yang dicatat.</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';
                const catData = categories.find(c => c.name === tx.category);
                const displayEmoji = isTransfer ? <ArrowRightLeft size={16}/> : (catData ? catData.emoji : (isIncome ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>));
                const displayColor = isTransfer ? 'bg-blue-500' : (catData ? catData.color.split(' ')[0] : 'bg-slate-500');
                
                return (
                  <div key={tx.id} className="flex justify-between items-center group cursor-pointer" onClick={() => setActiveTab("Transaksi")}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${displayColor}`}>
                        {typeof displayEmoji === 'string' ? <span className="text-lg">{displayEmoji}</span> : displayEmoji}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${T.textMain} group-hover:text-blue-500 transition-colors`}>{isTransfer ? 'Transfer Dana' : tx.category}</p>
                        <p className={`text-[10px] font-semibold ${T.textMuted} mt-0.5 uppercase tracking-wider`}>{new Date(tx.date).toLocaleDateString('id-ID')} • {isTransfer ? `${tx.wallet} ➔ ${tx.toWallet}` : tx.wallet}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black ${isTransfer ? T.textMain : (isIncome ? 'text-emerald-500' : 'text-rose-500')}`}>
                        {isTransfer ? '' : (isIncome ? '+' : '-')}{formatRupiah(tx.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}