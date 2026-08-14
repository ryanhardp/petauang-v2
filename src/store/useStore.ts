import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase'; 

export interface Category { id: string; name: string; emoji: string; type: 'income' | 'expense'; group: string; color: string; }
export interface Transaction { id: string; category: string; wallet: string; toWallet?: string; amount: number; type: 'income' | 'expense' | 'transfer'; date: string; time: string; note?: string }
export interface TargetPlan { id: string; name: string; emoji: string; targetAmount: number; currentAmount: number; deadlineDate: string; durationMonths: number; color: string; isBought?: boolean; }
export interface DebtPlan { id: string; name: string; emoji: string; totalAmount: number; paidAmount: number; tenorMonths: number; firstDueDate: string; type: 'utang' | 'piutang'; color: string; }
export interface WalletPlan { id: string; name: string; type: 'cash' | 'ewallet' | 'bank' | 'savings'; initialBalance: number; color: string; bg: string; }

interface AppState {
  theme: string; accent: string; userName: string;
  pinnedWallets: string[];
  dashboardWidgets: string[];
  transactions: Transaction[]; categories: Category[]; targets: TargetPlan[]; debts: DebtPlan[]; wallets: WalletPlan[];
  
  setTheme: (theme: string) => void; 
  setAccent: (accent: string) => void;
  setUserName: (userName: string) => void; 
  togglePinnedWallet: (walletId: string) => void;
  toggleWidget: (widgetId: string) => void;
  
  fetchInitialData: (userId: string) => Promise<void>;
  
  addCategory: (category: Category) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updatedTx: Partial<Transaction>) => void;
  addTarget: (target: TargetPlan) => void;
  updateTarget: (id: string, updatedTarget: Partial<TargetPlan>) => void;
  deleteTarget: (id: string) => void;
  addDebt: (debt: DebtPlan) => void;
  updateDebt: (id: string, updatedDebt: Partial<DebtPlan>) => void;
  deleteDebt: (id: string) => void;
  addWallet: (wallet: WalletPlan) => void;
  updateWallet: (id: string, updatedWallet: Partial<WalletPlan>) => void;
  deleteWallet: (id: string) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'e1', name: 'Makan & Minum', emoji: '🍔', type: 'expense', group: 'Food & Drinks', color: 'bg-rose-500 text-rose-500' },
    { id: 'e2', name: 'Restoran, Cafe', emoji: '☕', type: 'expense', group: 'Food & Drinks', color: 'bg-rose-500 text-rose-500' },
    { id: 'e3', name: 'Bahan Makanan', emoji: '🛒', type: 'expense', group: 'Food & Drinks', color: 'bg-rose-500 text-rose-500' },
    { id: 'e4', name: 'Belanja Bulanan', emoji: '🛍️', type: 'expense', group: 'Shopping', color: 'bg-sky-500 text-sky-500' },
    { id: 'e5', name: 'Pakaian & Sepatu', emoji: '👕', type: 'expense', group: 'Shopping', color: 'bg-sky-500 text-sky-500' },
    { id: 'e6', name: 'Kesehatan & Beauty', emoji: '💄', type: 'expense', group: 'Shopping', color: 'bg-sky-500 text-sky-500' },
    { id: 'e7', name: 'Sewa Rumah/Kos', emoji: '🏠', type: 'expense', group: 'Housing', color: 'bg-orange-400 text-orange-400' },
    { id: 'e8', name: 'Listrik & Air', emoji: '⚡', type: 'expense', group: 'Housing', color: 'bg-orange-400 text-orange-400' },
    { id: 'e9', name: 'Internet & TV', emoji: '🌐', type: 'expense', group: 'Housing', color: 'bg-orange-400 text-orange-400' },
    { id: 'e10', name: 'Transportasi Umum', emoji: '🚌', type: 'expense', group: 'Transportation', color: 'bg-slate-500 text-slate-500' },
    { id: 'e11', name: 'Taksi / Ojol', emoji: '🚕', type: 'expense', group: 'Transportation', color: 'bg-slate-500 text-slate-500' },
    { id: 'e12', name: 'Bensin', emoji: '⛽', type: 'expense', group: 'Vehicle', color: 'bg-purple-500 text-purple-500' },
    { id: 'e13', name: 'Servis & Perawatan', emoji: '🔧', type: 'expense', group: 'Vehicle', color: 'bg-purple-500 text-purple-500' },
    { id: 'e14', name: 'Hobi & Hiburan', emoji: '🎮', type: 'expense', group: 'Life & Entertainment', color: 'bg-lime-500 text-lime-500' },
    { id: 'e15', name: 'Liburan & Jalan-jalan', emoji: '✈️', type: 'expense', group: 'Life & Entertainment', color: 'bg-lime-500 text-lime-500' },
    { id: 'e16', name: 'Admin Bank & Pajak', emoji: '💳', type: 'expense', group: 'Financial Expenses', color: 'bg-teal-600 text-teal-600' },
    { id: 'i1', name: 'Gaji & Bonus', emoji: '💰', type: 'income', group: 'Income', color: 'bg-amber-400 text-amber-500' },
    { id: 'i2', name: 'Hasil Investasi', emoji: '📈', type: 'income', group: 'Income', color: 'bg-amber-400 text-amber-500' },
    { id: 'i3', name: 'Pemasukan Lain', emoji: '🎁', type: 'income', group: 'Income', color: 'bg-amber-400 text-amber-500' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark', 
      accent: 'emerald', 
      userName: 'Klien',
      pinnedWallets: [],
      dashboardWidgets: ['wallets', 'summary', 'chart', 'transactions'],
      
      wallets: [],
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      targets: [],
      debts: [],

      setTheme: (theme) => set({ theme }), 
      setAccent: (accent) => set({ accent }),
      setUserName: (userName) => set({ userName }), 
      togglePinnedWallet: (walletId) => set((state) => ({
        pinnedWallets: state.pinnedWallets.includes(walletId)
          ? state.pinnedWallets.filter(id => id !== walletId)
          : [...state.pinnedWallets, walletId]
      })),
      toggleWidget: (widgetId) => set((state) => ({
        dashboardWidgets: state.dashboardWidgets.includes(widgetId)
          ? state.dashboardWidgets.filter(id => id !== widgetId)
          : [...state.dashboardWidgets, widgetId]
      })),

      fetchInitialData: async (userId: string) => {
        try {
          const { data: walletsData } = await supabase.from('wallets').select('*').eq('user_id', userId);
          const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId);
          const { data: targetData } = await supabase.from('targets').select('*').eq('user_id', userId);
          const { data: debtData } = await supabase.from('debts').select('*').eq('user_id', userId);
          const { data: catData } = await supabase.from('categories').select('*').eq('user_id', userId);

          const formattedTx = txData ? txData.map(t => ({
            id: t.id,
            category: t.category,
            wallet: t.wallet,
            toWallet: t.to_wallet,
            amount: Number(t.amount),
            type: t.type,
            date: t.date,
            time: (t.time && t.time !== '00:00') ? t.time : new Date().toTimeString().slice(0, 5),
            note: t.note
          })).sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()) : [];

          set(() => ({
            wallets: walletsData ? walletsData.map(w => ({ id: w.id, name: w.name, type: w.type, initialBalance: Number(w.initial_balance), color: w.color, bg: w.bg })) : [],
            transactions: formattedTx,
            targets: targetData ? targetData.map(t => ({ id: t.id, name: t.name, emoji: t.emoji, targetAmount: Number(t.target_amount), currentAmount: Number(t.current_amount), deadlineDate: t.deadline_date, durationMonths: t.duration_months, color: t.color, isBought: t.is_bought })) : [],
            debts: debtData ? debtData.map(d => ({ id: d.id, name: d.name, emoji: d.emoji, totalAmount: Number(d.total_amount), paidAmount: Number(d.paid_amount), tenorMonths: d.tenor_months, firstDueDate: d.first_due_date, type: d.type, color: d.color })) : [],
            categories: catData && catData.length > 0 ? [...DEFAULT_CATEGORIES, ...catData.map(c => ({ id: c.id, name: c.name, emoji: c.emoji, type: c.type, group: c.group, color: c.color }))] : DEFAULT_CATEGORIES
          }));
        } catch (error) {
          console.error("Gagal menarik data", error);
        }
      },

      addWallet: async (wallet) => {
        set((state) => ({ wallets: [...state.wallets, wallet] }));
        const { data: { user } } = await supabase.auth.getUser();
        if(user) await supabase.from('wallets').insert([{ id: wallet.id, user_id: user.id, name: wallet.name, type: wallet.type, initial_balance: wallet.initialBalance, color: wallet.color, bg: wallet.bg }]);
      },

      updateWallet: async (id, updatedWallet) => {
        set((state) => ({ wallets: state.wallets.map(w => w.id === id ? { ...w, ...updatedWallet } : w) }));
        await supabase.from('wallets').update({ name: updatedWallet.name, type: updatedWallet.type, initial_balance: updatedWallet.initialBalance }).eq('id', id);
      },

      deleteWallet: async (id) => {
        set((state) => ({ wallets: state.wallets.filter(w => w.id !== id) }));
        await supabase.from('wallets').delete().eq('id', id);
      },

      addTransaction: async (tx) => {
        set((state) => {
          const updated = [tx, ...state.transactions].sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
          return { transactions: updated };
        });
        const { data: { user } } = await supabase.auth.getUser();
        if(user) await supabase.from('transactions').insert([{ id: tx.id, user_id: user.id, category: tx.category, wallet: tx.wallet, to_wallet: tx.toWallet, amount: tx.amount, type: tx.type, date: tx.date, time: tx.time, note: tx.note }]);
      },

      updateTransaction: async (id, updatedTx) => {
        set((state) => {
          const updated = state.transactions.map(tx => tx.id === id ? { ...tx, ...updatedTx } : tx).sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());
          return { transactions: updated };
        });
        await supabase.from('transactions').update({ category: updatedTx.category, wallet: updatedTx.wallet, to_wallet: updatedTx.toWallet, amount: updatedTx.amount, type: updatedTx.type, date: updatedTx.date, time: updatedTx.time, note: updatedTx.note }).eq('id', id);
      },

      addTarget: async (target) => {
        set((state) => ({ targets: [...state.targets, target] }));
        const { data: { user } } = await supabase.auth.getUser();
        if(user) await supabase.from('targets').insert([{ id: target.id, user_id: user.id, name: target.name, emoji: target.emoji, target_amount: target.targetAmount, current_amount: target.currentAmount, deadline_date: target.deadlineDate, duration_months: target.durationMonths, color: target.color, is_bought: target.isBought }]);
      },

      updateTarget: async (id, updatedTarget) => {
        set((state) => ({ targets: state.targets.map(t => t.id === id ? { ...t, ...updatedTarget } : t) }));
        await supabase.from('targets').update({ name: updatedTarget.name, emoji: updatedTarget.emoji, target_amount: updatedTarget.targetAmount, current_amount: updatedTarget.currentAmount, deadline_date: updatedTarget.deadlineDate, duration_months: updatedTarget.durationMonths, color: updatedTarget.color, is_bought: updatedTarget.isBought }).eq('id', id);
      },

      deleteTarget: async (id) => {
        set((state) => ({ targets: state.targets.filter(t => t.id !== id) }));
        await supabase.from('targets').delete().eq('id', id);
      },

      addDebt: async (debt) => {
        set((state) => ({ debts: [...state.debts, debt] }));
        const { data: { user } } = await supabase.auth.getUser();
        if(user) await supabase.from('debts').insert([{ id: debt.id, user_id: user.id, name: debt.name, emoji: debt.emoji, total_amount: debt.totalAmount, paid_amount: debt.paidAmount, tenor_months: debt.tenorMonths, first_due_date: debt.firstDueDate, type: debt.type, color: debt.color }]);
      },

      updateDebt: async (id, updatedDebt) => {
        set((state) => ({ debts: state.debts.map(d => d.id === id ? { ...d, ...updatedDebt } : d) }));
        await supabase.from('debts').update({ name: updatedDebt.name, emoji: updatedDebt.emoji, total_amount: updatedDebt.totalAmount, paid_amount: updatedDebt.paidAmount, tenor_months: updatedDebt.tenorMonths, first_due_date: updatedDebt.firstDueDate, type: updatedDebt.type, color: updatedDebt.color }).eq('id', id);
      },

      deleteDebt: async (id) => {
        set((state) => ({ debts: state.debts.filter(d => d.id !== id) }));
        await supabase.from('debts').delete().eq('id', id);
      },

      addCategory: async (category) => {
        set((state) => ({ categories: [...state.categories, category] }));
        const { data: { user } } = await supabase.auth.getUser();
        if(user) await supabase.from('categories').insert([{ id: category.id, user_id: user.id, name: category.name, emoji: category.emoji, type: category.type, "group": category.group, color: category.color }]);
      },
    }),
    {
      name: 'petauang-settings',
      partialize: (state) => ({ theme: state.theme, accent: state.accent, userName: state.userName, pinnedWallets: state.pinnedWallets, dashboardWidgets: state.dashboardWidgets }),
    }
  )
);