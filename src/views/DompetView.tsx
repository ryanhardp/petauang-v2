"use client";

import { useState } from "react";
// Gua masukin 'Crown' ke dalam import lucide-react biar ga error lagi!
import { Plus, Wallet as WalletIcon, Landmark, Banknote, ArrowRightLeft, MoreVertical, PiggyBank, Edit3, Trash2, Crown } from "lucide-react";
import { useStore } from "../store/useStore";
import ModalDompet from "../components/ModalDompet";

const THEME_STYLES = {
  dark: { bgApp: "bg-[#09090b]", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", hover: "hover:bg-white/5", menuBg: "bg-[#27272a]" },
  light: { bgApp: "bg-[#F3F4F6]", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", hover: "hover:bg-slate-50", menuBg: "bg-white" }
};

const ICONS = { 
  cash: Banknote, ewallet: WalletIcon, bank: Landmark, savings: PiggyBank 
};

export default function DompetView({ onAddTx }: { onAddTx?: () => void }) {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const wallets = useStore((state) => state.wallets);
  const transactions = useStore((state) => state.transactions);
  const targets = useStore((state) => state.targets);
  const deleteWallet = useStore((state) => state.deleteWallet);
  const togglePinnedWallet = useStore((state) => state.togglePinnedWallet);
  const pinnedWallets = useStore((state) => state.pinnedWallets);

  const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const calculateRealBalance = (walletName: string, initialBalance: number) => {
    let balance = 0; 
    let hasSaldoAwalTx = false;
    
    transactions.forEach(tx => {
       if (tx.wallet === walletName && tx.note === "Saldo Awal Dompet") hasSaldoAwalTx = true;
       if (tx.type === 'income' && tx.wallet === walletName) balance += tx.amount;
       if (tx.type === 'expense' && tx.wallet === walletName) balance -= tx.amount;
       if (tx.type === 'transfer' && tx.wallet === walletName) balance -= tx.amount; 
       if (tx.type === 'transfer' && tx.toWallet === walletName) balance += tx.amount; 
    });
    
    return hasSaldoAwalTx ? balance : balance + initialBalance;
  };

  const totalWalletBalance = wallets.reduce((sum, wallet) => {
    return sum + calculateRealBalance(wallet.name, wallet.initialBalance);
  }, 0);

  const totalTargetBalance = targets
    .filter(t => !t.isBought) 
    .reduce((sum, t) => sum + t.currentAmount, 0);

  const totalKekayaanBersih = totalWalletBalance + totalTargetBalance;

  const handleEditClick = (walletId: string) => {
    setEditingWalletId(walletId);
    setOpenMenuId(null);
    setIsWalletModalOpen(true);
  };

  const handleDeleteClick = (walletId: string, walletName: string) => {
    if(confirm(`Yakin ingin menghapus dompet "${walletName}"? Seluruh transaksi terkait mungkin akan kehilangan referensi nama dompet ini.`)) {
      deleteWallet(walletId);
    }
    setOpenMenuId(null);
  };

  return (
    <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen ${T.bgApp} p-4 md:p-8 transition-colors pb-32`} onClick={() => setOpenMenuId(null)}>
      
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 md:p-8 rounded-[32px] ${T.bgCard} border ${T.border} shadow-sm`}>
        <div>
          <p className={`text-xs font-bold ${T.textMuted} uppercase tracking-widest mb-2`}>Total Kekayaan Bersih</p>
          <h1 className={`text-4xl md:text-5xl font-black ${T.textMain} tracking-tight flex items-baseline gap-3`}>
            Rp{formatRupiah(totalKekayaanBersih)}
          </h1>
          <p className={`text-xs font-semibold ${T.textMuted} mt-3`}>
            (Termasuk uang Rp{formatRupiah(totalTargetBalance)} di Target Finansial)
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onAddTx} className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm ${T.textMain} border ${T.border} ${T.hover} transition-colors`}>
            <ArrowRightLeft size={18} /> Transfer Dana
          </button>
          <button onClick={() => { setEditingWalletId(null); setIsWalletModalOpen(true); }} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-md">
            <Plus size={18} /> Tambah Dompet
          </button>
        </div>
      </div>

      <h3 className={`text-lg font-bold ${T.textMain} mb-4 ml-2`}>Daftar Dompet Anda</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wallets.map((wallet) => {
          const IconComponent = ICONS[wallet.type];
          const realBalance = calculateRealBalance(wallet.name, wallet.initialBalance);
          const isMenuOpen = openMenuId === wallet.id;
          const isPinned = pinnedWallets.includes(wallet.id);

          return (
            <div key={wallet.id} className={`${T.bgCard} border ${T.border} rounded-3xl p-6 relative group overflow-visible transition-all hover:shadow-md cursor-pointer`}>
              
              <button 
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(isMenuOpen ? null : wallet.id); }} 
                className={`absolute top-4 right-4 p-2 rounded-lg transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${T.hover} ${T.textMuted}`}
              >
                <MoreVertical size={18} />
              </button>

              {isMenuOpen && (
                <div className={`absolute top-12 right-4 w-48 rounded-xl shadow-xl border ${T.border} ${T.menuBg} z-10 overflow-hidden animate-in fade-in zoom-in-95`}>
                  <button onClick={(e) => { e.stopPropagation(); togglePinnedWallet(wallet.id); setOpenMenuId(null); }} className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold ${T.textMain} ${T.hover} transition-colors`}>
                    {isPinned ? "Unpin dari Dashboard" : "Pin ke Dashboard"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(wallet.id); }} className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold ${T.textMain} ${T.hover} transition-colors`}>
                    <Edit3 size={16} /> Edit Dompet
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(wallet.id, wallet.name); }} className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors`}>
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${wallet.bg}`}>
                  <IconComponent className={wallet.color} size={28} />
                </div>
                <div>
                  <h4 className={`text-xl font-bold ${T.textMain}`}>{wallet.name} {isPinned && <Crown size={14} className="inline text-amber-500 ml-1"/>}</h4>
                  <p className={`text-xs font-semibold ${T.textMuted} uppercase tracking-wider`}>
                    {wallet.type === 'cash' ? 'Uang Tunai' : wallet.type === 'ewallet' ? 'E-Wallet' : wallet.type === 'bank' ? 'Rekening Bank' : 'Tabungan'}
                  </p>
                </div>
              </div>
              <div>
                <p className={`text-xs font-bold ${T.textMuted} mb-1 uppercase tracking-wider`}>Saldo Saat Ini</p>
                <p className={`text-2xl font-black ${T.textMain}`}>Rp{formatRupiah(realBalance)}</p>
              </div>
            </div>
          )
        })}
      </div>

      <ModalDompet 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        editingId={editingWalletId} 
      />
    </div>
  );
}