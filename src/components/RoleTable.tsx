/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ROLE_DETAILS } from '../constants';
import { RoleType } from '../types';
import { Shield, Search, Eye, HelpCircle } from 'lucide-react';

interface RoleTableProps {
  onClose?: () => void;
}

export default function RoleTable({ onClose }: RoleTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const rolesList = Object.values(ROLE_DETAILS).filter((role) =>
    role.nameFa.includes(searchTerm) || role.descriptionFa.includes(searchTerm)
  );

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-4xl w-full text-right" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            راهنمای شناسنامه نقش‌ها و قوانین قدرت
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            جزئیات قابلیت‌های روز، شب و چگونگی انتصاب هر نقش در سناریوی آقای رئیس‌جمهور
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی نقش..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 pr-9 text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-right text-slate-300">
          <thead className="text-xs text-slate-400 bg-slate-950 uppercase sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">نام نقش</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">قابلیت روز</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">قابلیت شب</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">انتخاب‌کننده نقش</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">سپر اولیه</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rolesList.map((role) => {
              const hasShield = ['pope', 'president', 'mayor', 'judge'].includes(role.type);

              return (
                <tr key={role.type} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-4 font-bold text-white flex items-center gap-2 min-w-[120px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {role.nameFa}
                  </td>
                  <td className="px-4 py-4 text-xs leading-relaxed max-w-[280px]">
                    {role.dayAbilityFa}
                  </td>
                  <td className="px-4 py-4 text-xs leading-relaxed max-w-[280px] text-teal-300">
                    {role.nightAbilityFa}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-400 min-w-[120px]">
                    {role.chooserFa}
                  </td>
                  <td className="px-4 py-4 text-center min-w-[80px]">
                    {hasShield ? (
                      <span className="inline-flex items-center gap-1 bg-teal-950/40 text-teal-400 border border-teal-800/50 text-[10px] px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3 text-teal-400" />
                        دارد
                      </span>
                    ) : (
                      <span className="text-slate-600">ـ</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rolesList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  نقشی متناظر با جستجوی شما پیدا نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-4">
        <div>
          <span className="text-amber-500 font-bold">قانون سپر:</span> نقش‌های پاپ، رئیس‌جمهور، شهردار و قاضی دارای یک لایه محافظ هستند که آن‌ها را از مرگ شبانه نخست نجات می‌دهد.
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold px-4 py-2 rounded-lg transition"
          >
            بستن راهنما
          </button>
        )}
      </div>
    </div>
  );
}
