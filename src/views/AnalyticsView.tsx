"use client";

import { useState } from "react";
import { useStore } from "../store/useStore";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", hover: "hover:bg-white/5", bgInput: "bg-[#09090b]" },
  light: { bgApp: "bg-[#F3F4F6]", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", hover: "hover:bg-slate-50", bgInput: "bg-slate-50" }
};

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
const FULL_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function AnalyticsView() {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const globalCategories = useStore((state) => state.categories);
  const transactions = useStore((state) => state.transactions) || [];
  const debts = useStore((state) => state.debts) || []; // Data utang untuk analitik

  // STATE UNTUK TANGGAL & KALENDER POPOVER
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"Custom" | "Weeks" | "Months" | "Years">("Months");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  // STATE FILTER WAKTU (Global)
  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [filterLabel, setFilterLabel] = useState(`${FULL_MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`);

  // FUNGSI GANTI RANGE WAKTU
  const applyFilter = (start: Date, end: Date, label: string) => {
    setStartDate(start);
    setEndDate(end);
    setFilterLabel(label);
    setIsPickerOpen(false);
  };

  // FUNGSI GESER WAKTU CEPAT KIRI KANAN
  const handlePrev = () => {
    if(pickerTab === "Months") {
      const prev = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
      applyFilter(prev, new Date(prev.getFullYear(), prev.getMonth() + 1, 0), `${FULL_MONTHS[prev.getMonth()]} ${prev.getFullYear()}`);
    } else if (pickerTab === "Years") {
      const prevYear = startDate.getFullYear() - 1;
      applyFilter(new Date(prevYear, 0, 1), new Date(prevYear, 11, 31), `Tahun ${prevYear}`);
    }
  };
  
  const handleNext = () => {
    if(pickerTab === "Months") {
      const next = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      applyFilter(next, new Date(next.getFullYear(), next.getMonth() + 1, 0), `${FULL_MONTHS[next.getMonth()]} ${next.getFullYear()}`);
    } else if (pickerTab === "Years") {
      const nextYear = startDate.getFullYear() + 1;
      applyFilter(new Date(nextYear, 0, 1), new Date(nextYear, 11, 31), `Tahun ${nextYear}`);
    }
  };

  // HEADER UNTUK KOLOM BANDING (Bulan Lalu / Tahun Lalu)
  let headerLalu = "-";
  let pastStartDate = new Date(startDate);
  let pastEndDate = new Date(endDate);
  
  if (pickerTab === "Months") {
    pastStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
    pastEndDate = new Date(pastStartDate.getFullYear(), pastStartDate.getMonth() + 1, 0);
    headerLalu = `${FULL_MONTHS[pastStartDate.getMonth()]} ${pastStartDate.getFullYear()}`;
  } else if (pickerTab === "Years") {
    pastStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
    pastEndDate = new Date(startDate.getFullYear() - 1, 11, 31);
    headerLalu = `Tahun ${pastStartDate.getFullYear()}`;
  }

  // FILTER TRANSAKSI PERIODE INI
  const filteredTransactionsIni = transactions.filter(tx => {
    const d = new Date(tx.date); d.setHours(0,0,0,0);
    const start = new Date(startDate); start.setHours(0,0,0,0);
    const end = new Date(endDate); end.setHours(23,59,59,999);
    return d >= start && d <= end;
  });

  // FILTER TRANSAKSI PERIODE LALU
  const filteredTransactionsLalu = transactions.filter(tx => {
    const d = new Date(tx.date); d.setHours(0,0,0,0);
    const start = new Date(pastStartDate); start.setHours(0,0,0,0);
    const end = new Date(pastEndDate); end.setHours(23,59,59,999);
    return d >= start && d <= end;
  });

  // =========================================================
  // LOGIKA GROUPING KATEGORI
  // =========================================================
  const getGroupedData = (type: 'income' | 'expense') => {
    const typeCats = globalCategories.filter(c => c.type === type);
    const groupNames = Array.from(new Set(typeCats.map(c => c.group)));

    return groupNames.map(groupName => {
      const groupCategories = typeCats.filter(c => c.group === groupName);
      const catNames = groupCategories.map(c => c.name);

      const totalIni = filteredTransactionsIni
        .filter(tx => tx.type === type && catNames.includes(tx.category))
        .reduce((s, tx) => s + tx.amount, 0);

      const totalLalu = filteredTransactionsLalu
        .filter(tx => tx.type === type && catNames.includes(tx.category))
        .reduce((s, tx) => s + tx.amount, 0);

      const repCategory = groupCategories[0];

      return {
        groupName,
        emoji: repCategory?.emoji || '📁',
        bgColorClass: repCategory ? repCategory.color.split(' ')[0] : 'bg-slate-500',
        totalIni,
        totalLalu
      };
    }); 
  };

  const expenseData = getGroupedData('expense');
  const incomeData = getGroupedData('income');

  // HITUNG PEMBAYARAN UTANG & CICILAN BERDASARKAN PERIODE
  const getDebtExpense = (start: Date, end: Date) => {
    return debts.reduce((sum, d) => {
      const due = new Date(d.firstDueDate);
      due.setHours(0,0,0,0);
      const s = new Date(start); s.setHours(0,0,0,0);
      const e = new Date(end); e.setHours(23,59,59,999);
      if (due >= s && due <= e) {
        return sum + (d.paidAmount || 0);
      }
      return sum;
    }, 0);
  };

  const debtExpenseIni = getDebtExpense(startDate, endDate);
  const debtExpenseLalu = getDebtExpense(pastStartDate, pastEndDate);

  const totalExpenseIni = expenseData.reduce((s, g) => s + g.totalIni, 0) + debtExpenseIni;
  const totalExpenseLalu = expenseData.reduce((s, g) => s + g.totalLalu, 0) + debtExpenseLalu;

  const totalIncomeIni = incomeData.reduce((s, g) => s + g.totalIni, 0);
  const totalIncomeLalu = incomeData.reduce((s, g) => s + g.totalLalu, 0);

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen ${T.bgApp} p-4 md:p-8 transition-colors pb-32`}>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl md:text-4xl font-extrabold ${T.textMain} tracking-tight`}>Analytics</h1>
          <p className={`text-sm ${T.textMuted} font-medium mt-1`}>Laporan ringkas arus kas berdasarkan Grup Kategori.</p>
        </div>
        
        <div className="flex gap-2 items-center relative">
          {/* TOMBOL NAVIGASI WAKTU */}
          <div className={`flex items-center rounded-xl ${T.bgCard} ${T.border} border shadow-sm p-1 relative z-40`}>
            <button onClick={handlePrev} className={`p-2 rounded-lg ${T.hover} ${T.textMuted} transition-colors`}><ChevronLeft size={20} /></button>
            <button onClick={() => { setIsPickerOpen(!isPickerOpen); setViewYear(startDate.getFullYear()); }} className={`px-4 font-bold text-sm ${T.textMain} min-w-[150px] text-center hover:opacity-70 transition-opacity`}>
              {filterLabel}
            </button>
            <button onClick={handleNext} className={`p-2 rounded-lg ${T.hover} ${T.textMuted} transition-colors`}><ChevronRight size={20} /></button>
          </div>
          <button className={`p-3 rounded-xl ${T.bgCard} ${T.border} border ${T.textMain} ${T.hover} shadow-sm relative z-40`}><SlidersHorizontal size={20} /></button>

          {/* DATE PICKER POPOVER */}
          {isPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsPickerOpen(false)}></div>
              <div className={`absolute top-full mt-3 right-0 md:right-12 w-80 md:w-96 ${T.bgCard} border ${T.border} shadow-2xl rounded-2xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-right`}>
                <div className={`flex items-center text-[10px] md:text-xs font-bold border-b ${T.border} bg-black/5`}>
                  <button onClick={() => setPickerTab('Custom')} className={`flex-1 py-3 transition-colors ${pickerTab === 'Custom' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : T.textMuted}`}>Custom range</button>
                  <button onClick={() => setPickerTab('Weeks')} className={`flex-1 py-3 transition-colors ${pickerTab === 'Weeks' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : T.textMuted}`}>Weeks</button>
                  <button onClick={() => setPickerTab('Months')} className={`flex-1 py-3 transition-colors ${pickerTab === 'Months' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : T.textMuted}`}>Months</button>
                  <button onClick={() => setPickerTab('Years')} className={`flex-1 py-3 transition-colors ${pickerTab === 'Years' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : T.textMuted}`}>Years</button>
                </div>
                <div className="p-5">
                  {pickerTab === 'Custom' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1"><label className={`block text-xs font-bold ${T.textMuted} mb-1`}>Dari</label><input type="date" className={`w-full p-2 rounded-lg ${T.bgInput} border ${T.border} ${T.textMain} text-sm`} onChange={(e) => setStartDate(new Date(e.target.value))} /></div>
                        <div className="flex-1"><label className={`block text-xs font-bold ${T.textMuted} mb-1`}>Sampai</label><input type="date" className={`w-full p-2 rounded-lg ${T.bgInput} border ${T.border} ${T.textMain} text-sm`} onChange={(e) => setEndDate(new Date(e.target.value))} /></div>
                      </div>
                      <button onClick={() => applyFilter(startDate, endDate, "Custom Range")} className="w-full bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm">Terapkan</button>
                    </div>
                  )}
                  {pickerTab === 'Weeks' && (
                    <div className="space-y-2">
                       <button onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 7); applyFilter(start, end, "7 Hari Terakhir"); }} className={`w-full p-3 text-left rounded-xl text-sm font-bold ${T.hover} ${T.textMain}`}>7 Hari Terakhir</button>
                       <button onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 14); applyFilter(start, end, "14 Hari Terakhir"); }} className={`w-full p-3 text-left rounded-xl text-sm font-bold ${T.hover} ${T.textMain}`}>14 Hari Terakhir</button>
                       <button onClick={() => { const end = new Date(); const start = new Date(); start.setDate(start.getDate() - 30); applyFilter(start, end, "30 Hari Terakhir"); }} className={`w-full p-3 text-left rounded-xl text-sm font-bold ${T.hover} ${T.textMain}`}>30 Hari Terakhir</button>
                    </div>
                  )}
                  {pickerTab === 'Months' && (
                    <>
                      <div className="flex justify-between items-center mb-5 px-2">
                        <button onClick={() => setViewYear(viewYear - 1)} className={`p-1.5 rounded-lg ${T.hover} ${T.textMuted}`}><ChevronLeft size={18}/></button><span className={`font-black ${T.textMain}`}>{viewYear}</span><button onClick={() => setViewYear(viewYear + 1)} className={`p-1.5 rounded-lg ${T.hover} ${T.textMuted}`}><ChevronRight size={18}/></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {SHORT_MONTHS.map((m, i) => (
                          <button key={m} onClick={() => applyFilter(new Date(viewYear, i, 1), new Date(viewYear, i + 1, 0), `${FULL_MONTHS[i]} ${viewYear}`)} className={`py-3 text-xs font-bold rounded-xl transition-all ${startDate.getMonth() === i && startDate.getFullYear() === viewYear ? 'bg-emerald-500 text-white shadow-md' : `${T.textMain} ${T.hover}`}`}>{m}</button>
                        ))}
                      </div>
                    </>
                  )}
                  {pickerTab === 'Years' && (
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({length: 9}).map((_, i) => {
                        const y = viewYear - 4 + i;
                        return <button key={y} onClick={() => applyFilter(new Date(y, 0, 1), new Date(y, 11, 31), `Tahun ${y}`)} className={`py-3 text-sm font-bold rounded-xl transition-all ${startDate.getFullYear() === y && filterLabel.includes("Tahun") ? 'bg-emerald-500 text-white shadow-md' : `${T.textMain} ${T.hover}`}`}>{y}</button>
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`${T.bgCard} rounded-[32px] border ${T.border} shadow-sm overflow-hidden mb-8`}>
        {/* KOLOM NAMA WAKTU */}
        <div className={`flex items-center justify-between p-6 border-b ${T.border} bg-black/5`}>
          <div className="w-1/2 md:w-1/3"></div>
          <div className="w-1/4 md:w-1/3 text-right"><p className={`text-xs md:text-sm font-extrabold ${T.textMain}`}>{filterLabel}</p></div>
          <div className="w-1/4 md:w-1/3 text-right"><p className={`text-xs md:text-sm font-bold ${T.textMuted}`}>{headerLalu}</p></div>
        </div>

        {/* ======================= */}
        {/* SECTION TOTAL PEMASUKAN */}
        {/* ======================= */}
        <div className={`p-6 border-b ${T.border}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-1/2 md:w-1/3 text-sm md:text-base font-black ${T.textMain}`}>Total Pemasukan</div>
            <div className="w-1/4 md:w-1/3 text-right text-sm md:text-base font-black text-emerald-500">Rp{formatRupiah(totalIncomeIni)}</div>
            <div className={`w-1/4 md:w-1/3 text-right text-sm md:text-base font-bold ${T.textMuted}`}>Rp{formatRupiah(totalIncomeLalu)}</div>
          </div>
          
          <div className="space-y-1">
            {incomeData.map((group, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${T.hover} transition-colors cursor-pointer`}>
                <div className="w-1/2 md:w-1/3 flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm text-white ${group.bgColorClass}`}>
                    {group.emoji}
                  </span>
                  <span className={`text-xs md:text-sm font-bold ${T.textMain}`}>{group.groupName}</span>
                </div>
                <div className={`w-1/4 md:w-1/3 text-right text-xs md:text-sm font-bold ${group.totalIni > 0 ? 'text-emerald-500' : T.textMuted}`}>Rp{formatRupiah(group.totalIni)}</div>
                <div className={`w-1/4 md:w-1/3 text-right text-xs md:text-sm font-medium ${T.textMuted}`}>Rp{formatRupiah(group.totalLalu)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================= */}
        {/* SECTION TOTAL PENGELUARAN */}
        {/* ========================= */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-1/2 md:w-1/3 text-sm md:text-base font-black ${T.textMain}`}>Total Pengeluaran</div>
            <div className="w-1/4 md:w-1/3 text-right text-sm md:text-base font-black text-rose-500">-Rp{formatRupiah(totalExpenseIni)}</div>
            <div className={`w-1/4 md:w-1/3 text-right text-sm md:text-base font-bold ${T.textMuted}`}>-Rp{formatRupiah(totalExpenseLalu)}</div>
          </div>
          
          <div className="space-y-1">
            {expenseData.map((group, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-xl ${T.hover} transition-colors cursor-pointer`}>
                <div className="w-1/2 md:w-1/3 flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm text-white ${group.bgColorClass}`}>
                    {group.emoji}
                  </span>
                  <span className={`text-xs md:text-sm font-bold ${T.textMain}`}>{group.groupName}</span>
                </div>
                <div className={`w-1/4 md:w-1/3 text-right text-xs md:text-sm font-bold ${group.totalIni > 0 ? 'text-rose-500' : T.textMuted}`}>
                  {group.totalIni > 0 ? "-" : ""}Rp{formatRupiah(group.totalIni)}
                </div>
                <div className={`w-1/4 md:w-1/3 text-right text-xs md:text-sm font-medium ${T.textMuted}`}>
                  {group.totalLalu > 0 ? "-" : ""}Rp{formatRupiah(group.totalLalu)}
                </div>
              </div>
            ))}

            {/* BARIS TAMBAHAN: UTANG & CICILAN */}
            <div className={`flex items-center justify-between p-3 rounded-xl ${T.hover} transition-colors cursor-pointer`}>
              <div className="w-1/2 md:w-1/3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm text-white bg-orange-500">
                  💸
                </span>
                <span className={`text-xs md:text-sm font-bold ${T.textMain}`}>Debts</span>
              </div>
              <div className={`w-1/4 md:w-1/3 text-right text-xs md:text-sm font-bold ${debtExpenseIni > 0 ? 'text-rose-500' : T.textMuted}`}>
                {debtExpenseIni > 0 ? "-" : ""}Rp{formatRupiah(debtExpenseIni)}
              </div>
              <div className={`w-1/4 md:w-1/3 text-right text-xs md:text-sm font-medium ${T.textMuted}`}>
                {debtExpenseLalu > 0 ? "-" : ""}Rp{formatRupiah(debtExpenseLalu)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}