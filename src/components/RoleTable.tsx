/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ROLE_DETAILS } from '../constants';
import { RoleType } from '../types';
import { Shield, Search, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RoleTableProps {
  onClose?: () => void;
}

export default function RoleTable({ onClose }: RoleTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language !== 'en';

  const rolesList = Object.values(ROLE_DETAILS).filter((role) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    return (
      t(`roles.${role.type}.name`).toLowerCase().includes(q) ||
      t(`roles.${role.type}.description`).toLowerCase().includes(q)
    );
  });

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-w-4xl w-full ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-500" />
            {t('roleTable.title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('roleTable.subtitle')}
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder={t('roleTable.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full md:w-64 bg-slate-950 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 ${isRtl ? 'pr-9 text-right' : 'pl-9 text-left'}`}
          />
          <Search className={`w-4 h-4 text-slate-400 absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`} />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
        <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'} text-slate-300`}>
          <thead className="text-xs text-slate-400 bg-slate-950 uppercase sticky top-0">
            <tr>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">{t('roleTable.col.name')}</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">{t('roleTable.col.day')}</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">{t('roleTable.col.night')}</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">{t('roleTable.col.chooser')}</th>
              <th scope="col" className="px-4 py-3 border-b border-slate-800">{t('roleTable.col.shield')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rolesList.map((role) => {
              const hasShield = ['pope', 'president', 'mayor', 'judge'].includes(role.type);

              return (
                <tr key={role.type} className="hover:bg-slate-800/50 transition">
                  <td className="px-4 py-4 font-bold text-white flex items-center gap-2 min-w-[120px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {t(`roles.${role.type}.name`)}
                  </td>
                  <td className="px-4 py-4 text-xs leading-relaxed max-w-[280px]">
                    {t(`roles.${role.type}.dayAbility`)}
                  </td>
                  <td className="px-4 py-4 text-xs leading-relaxed max-w-[280px] text-teal-300">
                    {t(`roles.${role.type}.nightAbility`)}
                  </td>
                  <td className="px-4 py-4 text-xs font-semibold text-slate-400 min-w-[120px]">
                    {t(`roles.${role.type}.chooser`)}
                  </td>
                  <td className="px-4 py-4 text-center min-w-[80px]">
                    {hasShield ? (
                      <span className="inline-flex items-center gap-1 bg-teal-950/40 text-teal-400 border border-teal-800/50 text-[10px] px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3 text-teal-400" />
                        {t('roleTable.has')}
                      </span>
                    ) : (
                      <span className="text-slate-600">{t('common.dash')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rolesList.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
                  {t('roleTable.noResults')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-4">
        <div>
          <span className="text-amber-500 font-bold">{t('roleTable.shieldRuleLabel')}</span> {t('roleTable.shieldRule')}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-amber-600 hover:bg-amber-700 text-slate-900 font-bold px-4 py-2 rounded-lg transition"
          >
            {t('roleTable.closeBtn')}
          </button>
        )}
      </div>
    </div>
  );
}
