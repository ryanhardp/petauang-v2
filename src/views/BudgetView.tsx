"use client";

import { useState, useEffect } from "react";
import { Wallet, Pencil, CalendarCheck, ChevronRight, Settings, X, Percent, Banknote } from "lucide-react";
import { useStore } from "../store/useStore";

const THEME_STYLES = {
  dark: { bgCard: "bg-[#18181b] border-white/5", bgInput: "bg-white/5 border-white/10", textMain: "text-white", textMuted: "text-zinc-500", modalOverlay: "bg-black/80" },
  light: { bgCard: "bg-white border-slate-200 shadow-sm", bgInput: "bg-slate-100 border-slate-200", textMain: "text-slate-900", textMuted: "text-slate-500", modalOverlay: "bg-slate-900/40" }
};

const ACCENT_STYLES = {
  gold: { bg: "bg-amber-500", text: "text-amber-950", textCol: "text-amber-500", hover: "hover:bg-amber-400", lightBg: "bg-amber-500/10", border: "border-amber-500/20" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-950", textCol: "text-emerald-500", hover: "hover:bg-emerald-400", lightBg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  sapphire: { bg: "bg-blue-600", text: "text-white", textCol: "text-blue-500", hover: "hover:bg-blue-500", lightBg: "bg-blue-600/10", border: "border-blue-600/20" }
};

export default function BudgetView() {
  const [isMounted, setIsMounted] = useState(false);
  const [isBudgetSliderOpen, setIsBudgetSliderOpen] = useState(false);

  // --- STATE ESTIMASI PEMASUKAN ---
  const [estimasiPemasukan, setEstimasiPemasukan] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("estimasiPemasukanV2");
      if (saved) return Number(saved);
    }
    return 5000000;
  });
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState(estimasiPemasukan.toString());

  // --- STATE STRATEGI BUDGET ---
  const [budgetConfig, setBudgetConfig] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("budgetConfigV2");
      if (saved) return JSON.parse(saved);
    }
    return {
      type: "percentage", 
      percentage: { needs: 50, wants: 30, savings: 20 },
      nominal: { needs: 2500000, wants: 1500000, savings: 1000000 }
    };
  });

  const [configTemp, setConfigTemp] = useState(budgetConfig);

  // --- AMBIL DATA ASLI DARI STORE/DATABASE ---
  const themeMode = useStore((state) => state.theme || "dark");
  const accentMode = useStore((state) => state.accent || "gold");
  const transactions = useStore((state) => state.transactions);
  const categories = useStore((state: any) => state.categories || []);

  useEffect(() => { setIsMounted(true); }, []);
  
  useEffect(() => {
    if (isBudgetSliderOpen) setConfigTemp(budgetConfig);
  }, [isBudgetSliderOpen, budgetConfig]);

  if (!isMounted) return null;

  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  const A = ACCENT_STYLES[accentMode as keyof typeof ACCENT_STYLES];
  
  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);
  const parseRupiah = (val: string) => Number(val.replace(/\D/g, '')) || 0;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  // Transaksi pengeluaran bulan ini (DATA ASLI)
  const currentMonthExpenseTx = transactions.filter(tx => { 
    const d = new Date(tx.date); 
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && tx.type === 'expense'; 
  });

  const handleSaveIncome = () => {
    const val = parseRupiah(tempIncome);
    setEstimasiPemasukan(val);
    localStorage.setItem("estimasiPemasukanV2", val.toString());
    setIsEditingIncome(false);
  };

  const handleSaveBudgetStrategy = () => {
    setBudgetConfig(configTemp);
    localStorage.setItem("budgetConfigV2", JSON.stringify(configTemp));
    setIsBudgetSliderOpen(false);
  };

  const isPercentage = configTemp.type === "percentage";
  const totalPersen = configTemp.percentage.needs + configTemp.percentage.wants + configTemp.percentage.savings;
  const totalNominal = configTemp.nominal.needs + configTemp.nominal.wants + configTemp.nominal.savings;
  const sisaNominal = estimasiPemasukan - totalNominal;
  const isBudgetValid = isPercentage ? (totalPersen === 100) : (totalNominal === estimasiPemasukan);

  const getLimit = (key: 'needs' | 'wants' | 'savings') => {
    if (budgetConfig.type === 'percentage') {
      return (estimasiPemasukan * budgetConfig.percentage[key]) / 100;
    }
    return budgetConfig.nominal[key];
  };

  // --- LOGIKA CERDAS: NARIK DATA KATEGORI ASLI ---
  const generateDynamicItems = (groupName: string, limitKey: 'needs' | 'wants' | 'savings', colorClass: string) => {
    // 1. Ambil kategori yang masuk di grup ini
    const groupCategories = categories.filter((c: any) => c.group === groupName);
    const groupTotalLimit = getLimit(limitKey);
    
    // 2. Bagi rata limit grup ke masing-masing kategori
    const defaultLimitPerCat = groupCategories.length > 0 ? Math.floor(groupTotalLimit / groupCategories.length) : 0;

    // 3. Mapping data asli
    return groupCategories.map((cat: any) => {
      // Ngitung total uang yang terpakai di kategori ini bulan ini
      const terpakai = currentMonthExpenseTx
        .filter(tx => tx.category === cat.name)
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        icon: cat.emoji,
        name: cat.name,
        terpakai: terpakai,
        batas: defaultLimitPerCat,
        color: colorClass
      };
    });
  };

  // Data List Kategori yang sekarang 100% DINAMIS
  const budgetGroups = [
    { 
      id: "needs" as const, name: "Kebutuhan", limit: getLimit("needs"), color: "bg-indigo-500", textCol: "text-indigo-500",
      items: generateDynamicItems("Kebutuhan", "needs", "bg-indigo-400")
    },
    { 
      id: "wants" as const, name: "Keinginan", limit: getLimit("wants"), color: "bg-orange-500", textCol: "text-orange-500",
      items: generateDynamicItems("Keinginan", "wants", "bg-orange-400")
    },
    { 
      id: "savings" as const, name: "Tabungan", limit: getLimit("savings"), color: "bg-blue-500", textCol: "text-blue-500",
      items: generateDynamicItems("Tabungan", "savings", "bg-blue-400")
    }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-2xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h1 className={`text-3xl font-extrabold ${T.textMain} tracking-tight`}>Atur Budget</h1>
          <p className={`text-sm ${T.textMuted} mt-1`}>Kasih tugas buat setiap Rupiahmu.</p>
        </div>
        <button onClick={() => setIsBudgetSliderOpen(true)} className={`px-4 py-2.5 ${T.bgCard} border ${themeMode==='dark'?'border-white/10':'border-slate-300'} rounded-xl shadow-sm hover:scale-105 transition-transform flex items-center gap-2`}>
          <Settings size={16} className={T.textMuted}/> <span className="text-xs font-bold">Ubah Strategi</span>
        </button>
      </div>

      {/* KARTU PERKIRAAN PEMASUKAN */}
      <div className={`${T.bgCard} rounded-[32px] p-6 md:p-8 ${T.textMain} shadow-xl mb-8 relative overflow-hidden`}>
        <div className="flex justify-between items-start mb-3">
          <div className={`flex items-center gap-2 ${T.textMuted} text-[10px] md:text-xs font-bold tracking-widest uppercase`}>
            <Wallet size={16}/> Perkiraan Pemasukan 
            {!isEditingIncome && <Pencil size={14} className={`ml-1 hover:${T.textMain} cursor-pointer`} onClick={() => { setTempIncome(estimasiPemasukan.toString()); setIsEditingIncome(true); }}/>}
          </div>
        </div>
        
        {isEditingIncome ? (
          <div className="flex items-center gap-3 mb-5 mt-2">
            <div className={`flex items-center ${T.bgInput} rounded-2xl px-4 py-3 flex-1`}>
              <span className={`${T.textMuted} font-bold mr-2 text-xl`}>Rp</span>
              <input 
                type="text" autoFocus inputMode="numeric"
                value={formatRupiah(parseRupiah(tempIncome))} 
                onChange={(e) => setTempIncome(e.target.value)} 
                className={`bg-transparent w-full text-2xl md:text-4xl font-black ${A.textCol} outline-none`} 
              />
            </div>
            <button onClick={handleSaveIncome} className={`${A.bg} ${A.text} px-6 py-4 rounded-2xl font-black shadow-md hover:scale-105 transition-transform`}>
              Simpan
            </button>
          </div>
        ) : (
          <h2 onClick={() => { setTempIncome(estimasiPemasukan.toString()); setIsEditingIncome(true); }} className={`text-4xl md:text-5xl font-black ${A.textCol} tracking-tight mb-5 cursor-pointer hover:opacity-80 transition-opacity`}>
            Rp{formatRupiah(estimasiPemasukan)}
          </h2>
        )}

        <div className="flex gap-2 relative z-10">
          <span className={`bg-zinc-800 ${A.textCol} text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${A.border} shadow-inner`}>
            {budgetConfig.type === 'percentage' ? 'Berbasis Persentase' : 'Berbasis Nominal'}
          </span>
          <span className={`bg-zinc-800 text-zinc-300 text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-zinc-700`}>Bulanan</span>
        </div>

        <div className={`mt-8 border-t ${themeMode === 'dark' ? 'border-zinc-800' : 'border-slate-200'} pt-5 relative z-10`}>
          <div className={`flex items-center gap-2 ${T.textMuted} text-[10px] md:text-xs font-bold tracking-widest uppercase mb-2`}>
            <CalendarCheck size={16}/> Periode Aktif <ChevronRight size={16} className={`ml-auto cursor-pointer hover:${T.textMain}`}/>
          </div>
          <p className="text-lg md:text-xl font-bold">01 {monthNames[currentMonth]} - {daysInMonth} {monthNames[currentMonth]} {currentYear}</p>
        </div>
      </div>

      {/* LIST KATEGORI */}
      {budgetGroups.map((group, gIdx) => {
        const limit = group.limit;
        const terpakai = group.items.reduce((s: number, i: any) => s + i.terpakai, 0);
        return (
          <div key={gIdx} className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${group.color}`}></div>
                <h3 className={`text-sm md:text-base font-black uppercase tracking-widest ${T.textMain}`}>{group.name}</h3>
              </div>
            </div>
            <div className="flex justify-between text-[10px] md:text-xs font-bold tracking-widest text-zinc-400 mb-5 border-b border-zinc-300/20 pb-3">
              <span>TERPAKAI: RP{formatRupiah(terpakai)}</span>
              <span>BATAS GRUP: RP{formatRupiah(limit)}</span>
            </div>

            <div className="space-y-4">
              {group.items.length === 0 ? (
                 <p className={`text-xs ${T.textMuted} italic`}>Belum ada kategori di grup ini.</p>
              ) : (
                group.items.map((item: any, idx: number) => {
                  const progress = Math.min((item.terpakai / item.batas) * 100, 100) || 0;
                  return (
                    <div key={idx} className={`${T.bgCard} p-5 md:p-6 rounded-3xl flex items-center gap-4 md:gap-6 hover:scale-[1.01] transition-transform`}>
                      <div className={`text-2xl md:text-3xl ${T.bgInput} w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center`}>{item.icon}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-3">
                          <span className={`font-bold md:text-lg ${T.textMain}`}>{item.name}</span>
                          <span className={`font-black md:text-lg ${T.textMain}`}>Rp{formatRupiah(item.terpakai)}</span>
                        </div>
                        <div className={`h-2.5 md:h-3 w-full ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-slate-200'} rounded-full overflow-hidden`}>
                          <div className={`h-full ${item.color} rounded-full`} style={{width: `${progress}%`}}></div>
                        </div>
                        <p className={`text-right text-[10px] md:text-xs ${T.textMuted} mt-2 font-medium`}>Batas: Rp{formatRupiah(item.batas)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )
      })}

      {/* --- MODAL PENGATURAN STRATEGI BUDGET --- */}
      {isBudgetSliderOpen && (
        <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center animate-in fade-in duration-200 ${T.modalOverlay} backdrop-blur-sm`}>
          <div className={`w-full max-w-md rounded-t-[32px] md:rounded-[32px] p-6 md:p-8 relative shadow-2xl h-[85vh] md:h-auto flex flex-col slide-in-from-bottom-full md:slide-in-from-bottom-0 ${T.bgCard}`}>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-black tracking-tight ${T.textMain}`}>Ubah Strategi</h3>
              <button onClick={() => setIsBudgetSliderOpen(false)} className={`rounded-full p-2 transition ${T.bgInput} ${T.textMuted} hover:${T.textMain}`}><X size={20} /></button>
            </div>
            
            <div className={`flex p-1.5 rounded-2xl mb-8 ${T.bgInput}`}>
              <button 
                onClick={() => setConfigTemp({...configTemp, type: 'percentage'})}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all ${isPercentage ? `${A.bg} ${A.text} shadow-md` : T.textMuted}`}
              >
                <Percent size={16}/> Persentase
              </button>
              <button 
                onClick={() => setConfigTemp({...configTemp, type: 'nominal'})}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition-all ${!isPercentage ? `${A.bg} ${A.text} shadow-md` : T.textMuted}`}
              >
                <Banknote size={16}/> Nominal
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-10">
              {[
                { id: "needs" as const, name: "Kebutuhan", color: "bg-indigo-500", textCol: "text-indigo-500" },
                { id: "wants" as const, name: "Keinginan", color: "bg-orange-500", textCol: "text-orange-500" },
                { id: "savings" as const, name: "Tabungan", color: "bg-blue-500", textCol: "text-blue-500" }
              ].map((group, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${group.color}`}></div>
                      <span className={`text-sm font-bold uppercase tracking-widest ${T.textMain}`}>{group.name}</span>
                    </div>
                    {isPercentage && <span className={`text-sm font-bold ${A.textCol}`}>Rp{formatRupiah((estimasiPemasukan * configTemp.percentage[group.id]) / 100)}</span>}
                  </div>
                  
                  {isPercentage ? (
                    <>
                      <input 
                        type="range" min="0" max="100" 
                        value={configTemp.percentage[group.id]} 
                        onChange={(e) => setConfigTemp({...configTemp, percentage: {...configTemp.percentage, [group.id]: Number(e.target.value)}})} 
                        className={`w-full accent-${group.color.split('-')[1]}-500 cursor-pointer`} 
                      />
                      <div className={`text-right text-lg font-black mt-2 ${group.textCol}`}>{configTemp.percentage[group.id]}%</div>
                    </>
                  ) : (
                    <div className={`flex items-center ${T.bgInput} rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-white/20 transition-all`}>
                      <span className={`${T.textMuted} font-bold mr-3 text-lg`}>Rp</span>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        value={formatRupiah(configTemp.nominal[group.id])} 
                        onChange={(e) => {
                          const val = parseRupiah(e.target.value);
                          setConfigTemp({...configTemp, nominal: {...configTemp.nominal, [group.id]: val}});
                        }} 
                        className={`bg-transparent w-full text-2xl font-black ${T.textMain} outline-none`} 
                      />
                    </div>
                  )}
                </div>
              ))}

              {!isPercentage && sisaNominal !== 0 && (
                <div className={`p-4 rounded-xl text-center text-xs font-bold border ${sisaNominal > 0 ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {sisaNominal > 0 ? `Sisa Rp ${formatRupiah(sisaNominal)} belum dialokasikan` : `Overbudget Rp ${formatRupiah(Math.abs(sisaNominal))}`}
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-white/5 bg-gradient-to-t from-[#18181b] to-transparent">
              <div className={`p-4 rounded-2xl mb-4 text-center font-bold tracking-widest text-[10px] uppercase transition-colors ${isBudgetValid ? `${A.lightBg} ${A.textCol} border ${A.border}` : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                {isPercentage 
                  ? `Total: ${totalPersen}% / 100% ${totalPersen !== 100 ? "(Harus pas 100%)" : ""}` 
                  : `Total: Rp${formatRupiah(totalNominal)} / Rp${formatRupiah(estimasiPemasukan)}`
                }
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsBudgetSliderOpen(false)} className={`flex-1 ${T.bgInput} ${T.textMain} font-bold py-4 rounded-2xl transition hover:opacity-80`}>Batal</button>
                <button onClick={handleSaveBudgetStrategy} disabled={!isBudgetValid} className={`flex-1 font-black py-4 rounded-2xl shadow-lg transition ${isBudgetValid ? `${A.bg} ${A.text} ${A.hover}` : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
                  Simpan Strategi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}