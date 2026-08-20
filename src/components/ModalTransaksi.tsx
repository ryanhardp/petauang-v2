"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Clock, Plus, Tag } from "lucide-react";
import { useStore } from "../store/useStore";

const THEME_STYLES = {
  dark: { bgOverlay: "bg-black/60", bgCard: "bg-[#18181b]", textMain: "text-white", textMuted: "text-zinc-500", border: "border-white/10", inputBg: "bg-[#09090b]", hover: "hover:bg-white/5" },
  light: { bgOverlay: "bg-slate-900/40", bgCard: "bg-white", textMain: "text-slate-900", textMuted: "text-slate-500", border: "border-slate-200", inputBg: "bg-slate-50", hover: "hover:bg-slate-100" }
};

// 175+ Emoji Super Lengkap Khusus Aplikasi Keuangan
const PREDEFINED_EMOJIS = [
  // Makanan & Minuman
  "🍽️", "🍔", "🍕", "🌭", "🍟", "🍗", "🥩", "🍣", "🍱", "🍜", "🍞", "🥐", "🥞", "🥗", "🌮", "🍰", "🍩", "🍨", "☕", "🍵", "🍹", "🍺", "🍷", "🍎", "🍉", "🍓", "🥑", "🥦",
  // Transportasi
  "🚗", "🚕", "🚙", "🚌", "🚑", "🚓", "🚒", "🚚", "🚲", "🛵", "🏍️", "🚂", "🚆", "🚇", "✈️", "🛫", "🚁", "⛵", "🚢", "⛽", "🅿️", "🚥",
  // Rumah & Tagihan
  "🏠", "🏡", "🏢", "🛏️", "🛋️", "🚿", "🚽", "🧹", "🧻", "🧼", "🧽", "💡", "⚡", "💧", "🔥", "🗑️", "🛠️", "🔧", "🔨", "📡", "🔌",
  // Belanja & Pakaian
  "🛒", "🛍️", "🎁", "👕", "👖", "👗", "👘", "👙", "👚", "👛", "👜", "👝", "🎒", "👞", "👟", "👠", "👡", "👢", "👑", "👒", "🎩", "💄", "💍", "💎",
  // Kesehatan & Perawatan
  "🏥", "💊", "💉", "🩺", "🩹", "🦷", "🦴", "👓", "💇‍♀️", "💇‍♂️", "💅", "💆‍♀️", "💆‍♂️", "💈", "🧴",
  // Hiburan, Olahraga & Hobi
  "🎮", "🕹️", "🎲", "🎬", "🍿", "🎧", "🎵", "🎸", "🎹", "📸", "📺", "⚽", "🏀", "🏈", "🎾", "🏸", "🥊", "🚲", "🏊‍♂️", "🏋️‍♂️", "🏕️", "🏖️", "🎡", "🎨", "📚", "📖",
  // Keuangan & Bisnis
  "💰", "🪙", "💵", "💸", "💳", "🧾", "💹", "💲", "🏦", "💼", "📈", "📉",
  // Keluarga, Bayi & Hewan
  "👶", "🍼", "🧸", "👨‍👩‍👧‍👦", "🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🐟", "🐾",
  // Edukasi & Lain-lain
  "🎓", "🎒", "🏫", "✏️", "✒️", "📝", "📱", "💻", "⌚", "⏰", "⏳", "✉️", "📦"
];

const getGroupBadgeStyle = (groupName: string) => {
  const name = groupName.toLowerCase();
  if (name.includes('kebutuhan') || name.includes('housing')) return 'bg-blue-500/15 text-blue-400 border border-blue-500/30';
  if (name.includes('keinginan') || name.includes('shopping')) return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
  if (name.includes('tabungan')) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (name.includes('food') || name.includes('makan')) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  if (name.includes('transport')) return 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30';
  if (name.includes('utang') || name.includes('hutang')) return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
  return 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30';
};

export default function ModalTransaksi({ isOpen, onClose, editingId }: { isOpen: boolean, onClose: () => void, editingId?: string | null }) {
  const themeMode = useStore((state) => state.theme || "dark");
  const T = THEME_STYLES[themeMode as keyof typeof THEME_STYLES];
  
  const categories = useStore((state: any) => state.categories);
  const wallets = useStore((state) => state.wallets);
  const transactions = useStore((state) => state.transactions);
  const addTransaction = useStore((state) => state.addTransaction);
  const updateTransaction = useStore((state) => state.updateTransaction);
  const addCategory = useStore((state: any) => state.addCategory);

  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [wallet, setWallet] = useState("");
  const [toWallet, setToWallet] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [note, setNote] = useState("");

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatGroup, setNewCatGroup] = useState("Kebutuhan");
  const [newCatEmoji, setNewCatEmoji] = useState("🍽️");
  
  // STATE BUAT MUNCULIN KOTAK PILIHAN EMOJI
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

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

  const filteredCategories = categories.filter((c: any) => type === 'transfer' ? true : c.type === type);
  const groupedCategories = filteredCategories.reduce((acc: any, cat: any) => {
    const groupName = cat.group || 'Lainnya';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(cat);
    return acc;
  }, {});

  const handleSaveCategory = () => {
    if (!newCatName) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: newCatName,
      emoji: newCatEmoji,
      type: type === 'income' ? 'income' : 'expense' as const,
      group: newCatGroup,
      color: type === 'income' ? 'bg-amber-400 text-amber-500' : 'bg-rose-500 text-rose-500'
    };
    addCategory(newCat);
    setCategory(newCatName);
    setIsAddCatOpen(false);
    setNewCatName("");
  };

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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${T.bgOverlay} backdrop-blur-sm transition-opacity animate-in fade-in duration-200`}>
      <div className={`${T.bgCard} w-full max-w-lg rounded-[32px] shadow-2xl border ${T.border} overflow-hidden flex flex-col max-h-[90vh]`}>
        
        <div className={`flex items-center justify-between p-6 border-b ${T.border}`}>
          <h2 className={`text-xl font-extrabold ${T.textMain}`}>{editingId ? "Edit Transaksi" : "Catat Transaksi Baru"}</h2>
          <button onClick={onClose} className={`p-2 rounded-full ${T.hover} ${T.textMuted}`}><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 no-scrollbar">
          
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

          <div>
            <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Nominal (Rp)</label>
            <div className={`flex items-center px-4 py-3.5 rounded-xl ${T.inputBg} border ${T.border} focus-within:border-blue-500`}>
              <span className={`text-lg font-bold ${T.textMuted} mr-2`}>Rp</span>
              <input type="text" inputMode="numeric" value={amount ? new Intl.NumberFormat('id-ID').format(Number(amount)) : ""} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className={`w-full bg-transparent text-2xl font-black ${T.textMain} outline-none`} />
            </div>
          </div>

          {type !== 'transfer' && (
            <div className="relative">
              <label className={`block text-xs font-bold ${T.textMuted} uppercase tracking-wider mb-2`}>Kategori</label>
              <div 
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={`w-full px-4 py-3.5 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm font-semibold flex justify-between items-center cursor-pointer`}
              >
                <span>{category || "-- Pilih Kategori --"}</span>
                <Tag size={16} className={T.textMuted} />
              </div>

              {isCategoryDropdownOpen && (
                <div className={`absolute left-0 right-0 mt-2 rounded-2xl shadow-2xl border ${T.border} ${T.bgCard} z-20 max-h-64 overflow-y-auto p-3 space-y-3`}>
                  <button 
                    onClick={() => { setIsCategoryDropdownOpen(false); setIsAddCatOpen(true); }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-blue-400 font-bold text-xs bg-blue-500/10 hover:bg-blue-500/20 transition-colors border border-blue-500/30"
                  >
                    <Plus size={16} /> Tambah Kategori Baru
                  </button>

                  {Object.keys(groupedCategories).map(groupName => (
                    <div key={groupName} className="space-y-1.5">
                      <div className={`inline-block px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${getGroupBadgeStyle(groupName)}`}>
                        {groupName}
                      </div>
                      <div className="space-y-1 pl-1">
                        {groupedCategories[groupName].map((cat: any) => (
                          <div 
                            key={cat.id}
                            onClick={() => { setCategory(cat.name); setIsCategoryDropdownOpen(false); }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${T.hover} text-sm font-medium ${T.textMain} transition-colors`}
                          >
                            <span className="text-base">{cat.emoji}</span>
                            <span>{cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

      {/* MODAL KECIL TAMBAH KATEGORI BARU */}
      {isAddCatOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`${T.bgCard} w-full max-w-sm rounded-[32px] p-6 border ${T.border} shadow-2xl space-y-4 relative`}>
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-bold ${T.textMain}`}>Buat Kategori Baru</h3>
              <button onClick={() => setIsAddCatOpen(false)} className={`p-1.5 rounded-full ${T.hover} ${T.textMuted}`}><X size={18}/></button>
            </div>
            
            <div>
              <label className={`block text-xs font-bold ${T.textMuted} mb-1 uppercase`}>Emoji & Nama</label>
              <div className="flex gap-2 relative">
                
                {/* TOMBOL PEMICU KOTAK EMOJI */}
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`w-14 h-[46px] flex items-center justify-center rounded-xl ${T.inputBg} border ${T.border} text-xl transition hover:bg-white/10 shrink-0`}
                >
                  {newCatEmoji}
                </button>

                {/* KOTAK PILIHAN EMOJI DENGAN SCROLL & 175+ ITEM */}
                {showEmojiPicker && (
                  <div className={`absolute top-14 left-0 z-50 p-3 rounded-2xl shadow-xl border ${T.border} ${T.bgCard} grid grid-cols-6 gap-2 w-72 max-h-64 overflow-y-auto no-scrollbar`}>
                    {PREDEFINED_EMOJIS.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setNewCatEmoji(e); setShowEmojiPicker(false); }}
                        className="text-2xl p-1.5 hover:bg-white/10 rounded-xl transition flex items-center justify-center"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nama Kategori..." className={`flex-1 p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm outline-none w-full`} />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-bold ${T.textMuted} mb-1 uppercase`}>Grup (Induk)</label>
              <select value={newCatGroup} onChange={(e) => setNewCatGroup(e.target.value)} className={`w-full p-3 rounded-xl ${T.inputBg} border ${T.border} ${T.textMain} text-sm outline-none`}>
                <option value="Kebutuhan">Kebutuhan</option>
                <option value="Keinginan">Keinginan</option>
                <option value="Tabungan">Tabungan</option>
                <option value="Food & Drinks">Food & Drinks</option>
                <option value="Shopping">Shopping</option>
                <option value="Housing">Housing</option>
                <option value="Transportation">Transportation</option>
              </select>
            </div>
            <button onClick={handleSaveCategory} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-md mt-2">Simpan Kategori</button>
          </div>
        </div>
      )}
    </div>
  );
}