"use client";

import { useState, useEffect } from "react";
import { Settings, Wallet, Plus, LayoutGrid, Target, ArrowRightLeft, PieChart, HandCoins, Loader2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { supabase } from "../lib/supabase";

import ModalTransaksi from "../components/ModalTransaksi";
import ModalPengaturan from "../components/ModalPengaturan";

import DashboardView from "../views/DashboardView";
import AnalyticsView from "../views/AnalyticsView";
import TransaksiView from '../views/TransaksiView';
import DompetView from "../views/DompetView";
import TargetView from "../views/TargetView";
import UtangView from "../views/UtangView";
import LoginView from "../views/LoginView";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgSidebar: "bg-[#09090b] border-white/5", textMain: "text-white", textMuted: "text-zinc-500", navHover: "hover:bg-white/5" },
  light: { bgApp: "bg-[#F3F4F6]", bgSidebar: "bg-white border-slate-200", textMain: "text-slate-900", textMuted: "text-slate-500", navHover: "hover:bg-slate-100" }
};

const ACCENT_STYLES = {
  gold: { bg: "bg-amber-500", text: "text-amber-950", textCol: "text-amber-500", lightBg: "bg-amber-500/10", border: "border-amber-500/20" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-950", textCol: "text-emerald-500", lightBg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  sapphire: { bg: "bg-blue-600", text: "text-white", textCol: "text-blue-600", lightBg: "bg-blue-600/10", border: "border-blue-600/20" }
};

const NAV_TABS = [
  { id: "Dashboard", icon: LayoutGrid, label: "Dashboard" },
  { id: "Transaksi", icon: ArrowRightLeft, label: "Transaksi" },
  { id: "Dompet", icon: Wallet, label: "Dompet" },
  { id: "Analytics", icon: PieChart, label: "Analytics" }, 
  { id: "Target", icon: Target, label: "Target" },
  { id: "Utang", icon: HandCoins, label: "Utang" },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  // STATE BARU: Tahan Layar Loading Sampai Data Benar-Benar Selesai Ditarik!
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false); 

  const [activeTab, setActiveTab] = useState("Dashboard");

  const themeMode = useStore((state) => state.theme || "dark"); 
  const accentMode = useStore((state) => state.accent || "gold");
  const userName = useStore((state) => state.userName);
  
  const fetchInitialData = useStore((state) => state.fetchInitialData);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // TUNGGU DATA SELESAI DITARIK DARI INTERNET
        await fetchInitialData(session.user.id);
        setIsDataLoaded(true);
      }
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setIsDataLoaded(false);
        await fetchInitialData(session.user.id);
        setIsDataLoaded(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchInitialData]);

  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  const A = ACCENT_STYLES[accentMode as keyof typeof ACCENT_STYLES];

  const handleAddTxClick = () => { setEditingTxId(null); setIsTxModalOpen(true); };
  const handleEditTxClick = (id: string) => { setEditingTxId(id); setIsTxModalOpen(true); };

  if (!isMounted) return null;

  // JIKA SEDANG CEK LOGIN ATAU SEDANG NARIK DATA, TAHAN LAYAR LOADING!
  // Biar layarnya nggak kosong melompong dulu sebelum datanya muncul.
  if (isLoadingAuth || (session && !isDataLoaded)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${T.bgApp}`}>
        <Loader2 size={32} className={`animate-spin ${A.textCol}`} />
      </div>
    );
  }

  if (!session) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "Dashboard": return <DashboardView setActiveTab={setActiveTab} />;
      case "Analytics": return <AnalyticsView />;
      case "Transaksi": return <TransaksiView onAddTx={handleAddTxClick} onEditTx={handleEditTxClick} />;
      case "Dompet": return <DompetView onAddTx={handleAddTxClick} />;
      case "Target": return <TargetView />;
      case "Utang": return <UtangView />;
      default: return null;
    }
  };

  const rawEmail = session.user.email || "";
  const extractedUsername = rawEmail.split('@')[0];
  const isAdmin = extractedUsername.toLowerCase() === "admin_ryan";
  
  // LOGIKA NAMA: Jika userName sudah diganti di Pengaturan, pakai itu. 
  // Jika belum, pakai extractedUsername untuk Admin, atau tulisan "Klien" untuk user biasa.
  const displaySessionName = userName !== "Klien" ? userName : (isAdmin ? extractedUsername : "Klien");

  return (
    <div className={`flex h-screen ${T.bgApp} ${T.textMain} font-sans overflow-hidden transition-colors duration-300`}>
      <aside className={`hidden md:flex flex-col w-72 ${T.bgSidebar} border-r z-40 transition-colors duration-300 relative`}>
        <div className="p-7 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${A.textCol}`}>
            <div className={`w-10 h-10 ${A.lightBg} rounded-2xl flex items-center justify-center border ${A.border}`}><Wallet size={22} strokeWidth={2.5} /></div>
            <h1 className="text-2xl font-extrabold tracking-tight">PetaUang</h1>
          </div>
        </div>
        <div className="px-6 py-2">
          <div className={`flex items-center gap-3 ${themeMode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'} px-4 py-3.5 rounded-2xl border backdrop-blur-md`}>
             <div className={`w-9 h-9 ${A.bg} ${A.text} rounded-xl flex items-center justify-center font-bold text-sm shadow-md`}>{displaySessionName.charAt(0).toUpperCase()}</div>
             <div className="overflow-hidden">
               <p className={`text-[10px] ${T.textMuted} font-medium mb-0.5 uppercase tracking-wider`}>Sesi Aktif</p>
               <p className={`font-bold text-sm ${T.textMain} truncate w-full`}>{displaySessionName}</p>
             </div>
          </div>
        </div>
        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <p className={`px-4 text-[10px] font-bold tracking-widest ${T.textMuted} uppercase mb-3`}>Menu Utama</p>
          {NAV_TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 ${activeTab === tab.id ? `${A.bg} ${A.text} font-bold shadow-md` : `${T.textMuted} font-medium ${T.navHover} border border-transparent`}`}>
              <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} /> <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className={`p-6 border-t ${themeMode === 'dark' ? 'border-white/5' : 'border-slate-200'} mt-auto`}>
          <button onClick={() => setIsSettingsModalOpen(true)} className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl ${T.textMuted} hover:${T.textMain} ${T.navHover} transition-all group`}>
            <div className="flex items-center gap-3"><Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" /><span className="text-sm font-medium">Pengaturan</span></div>
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${T.bgApp} relative`}>
        <header className={`md:hidden px-5 pt-6 pb-4 sticky top-0 ${themeMode === 'dark' ? 'bg-[#09090b]/80 border-white/5' : 'bg-[#F3F4F6]/80 border-slate-200'} backdrop-blur-xl z-30 border-b flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${A.bg} ${A.text} rounded-xl flex items-center justify-center font-bold text-sm shadow-md`}>{displaySessionName.charAt(0).toUpperCase()}</div>
            <div>
              <p className={`text-[10px] ${T.textMuted} font-medium uppercase tracking-wider`}>Sesi Aktif</p>
              <span className={`font-bold text-sm tracking-wide ${T.textMain}`}>{displaySessionName}</span>
            </div>
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className={`w-10 h-10 ${themeMode === 'dark' ? 'bg-[#18181b] border-white/5' : 'bg-white border-slate-200'} ${T.textMuted} hover:${T.textMain} rounded-xl flex items-center justify-center border transition-colors`}><Settings size={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto pb-32 md:pb-10 p-5 md:p-8 lg:p-10 scroll-smooth no-scrollbar">
          <div className="max-w-6xl mx-auto">
            {renderActiveView()}
          </div>
        </div>

        <nav className={`md:hidden absolute bottom-0 left-0 w-full ${themeMode === 'dark' ? 'bg-[#18181b]/95 border-white/5' : 'bg-white/95 border-slate-200'} backdrop-blur-2xl border-t z-40 pb-safe pt-2 px-2 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-colors duration-300`}>
          <div className="flex justify-between items-center relative mb-2 max-w-md mx-auto">
             <button onClick={() => setActiveTab("Dashboard")} className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors ${activeTab === "Dashboard" ? A.textCol : T.textMuted}`}><LayoutGrid size={24} strokeWidth={activeTab === "Dashboard" ? 2.5 : 2} /></button>
             <button onClick={() => setActiveTab("Dompet")} className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors ${activeTab === "Dompet" ? A.textCol : T.textMuted}`}><Wallet size={24} strokeWidth={activeTab === "Dompet" ? 2.5 : 2} /></button>
             <div className="flex-1 flex justify-center -mt-10 relative z-50">
                <button onClick={handleAddTxClick} className={`${A.bg} ${A.text} hover:scale-105 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-transform border-4 ${themeMode === 'dark' ? 'border-[#09090b]' : 'border-[#F3F4F6]'} rotate-3 hover:rotate-6`}><Plus size={32} strokeWidth={3} /></button>
             </div>
             <button onClick={() => setActiveTab("Transaksi")} className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors ${activeTab === "Transaksi" ? A.textCol : T.textMuted}`}><ArrowRightLeft size={24} strokeWidth={activeTab === "Transaksi" ? 2.5 : 2} /></button>
             <button onClick={() => setActiveTab("Utang")} className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors ${activeTab === "Utang" ? A.textCol : T.textMuted}`}><HandCoins size={24} strokeWidth={activeTab === "Utang" ? 2.5 : 2} /></button>
          </div>
        </nav>

        <ModalTransaksi isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} editingId={editingTxId} />
        <ModalPengaturan isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} session={session} />
      </main>
    </div>
  );
}