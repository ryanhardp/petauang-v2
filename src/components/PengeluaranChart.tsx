import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Data disesuaikan warnanya biar lebih nyatu sama tema aplikasi
const data = [
  { name: 'Makan & Minum', value: 380000, color: '#EF4444' }, // Rose/Red
  { name: 'Transportasi', value: 150000, color: '#3B82F6' }, // Blue
  { name: 'Top-up Modal', value: 500000, color: '#F59E0B' }, // Amber/Gold (Sesuai tema menu lu)
];

export default function PengeluaranChart() {
  return (
    // Background dan rounded disamakan persis dengan card "Sekilas Hari Ini"
    <div className="bg-[#18181b] rounded-[32px] p-6 md:p-10 flex flex-col w-full shadow-xl">
      
      {/* Header Kartu */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-white font-bold text-sm">Pengeluaran Terbanyak</h3>
        <button className="text-amber-500 text-[10px] font-bold hover:opacity-70 transition-opacity">
          Lihat Semua
        </button>
      </div>

      {/* Konten Chart & Legend - Dibuat CENTER */}
      <div className="flex flex-col md:flex-row flex-1 items-center justify-center gap-10 md:gap-16 py-4">
        
        {/* Bagian Chart (Ukurannya dibesarkan dan di-center) */}
        <div className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius="65%" // Bikin lubang donatnya pas, gak terlalu tebal/tipis
                outerRadius="100%"
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#27272a', // zinc-800
                  border: 'none', 
                  borderRadius: '16px', 
                  color: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' 
                }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bagian Legend (Daftar Pengeluaran) */}
        <div className="flex flex-col gap-5 justify-center">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3.5 h-3.5 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-zinc-400 text-xs md:text-sm font-medium">
                  {item.name}
                </span>
              </div>
              <span className="text-white text-sm md:text-base font-bold">
                Rp{item.value.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}