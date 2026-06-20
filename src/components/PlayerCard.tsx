/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, RoleType } from '../types';
import { Shield, ShieldAlert, Award, AlertTriangle, Eye, EyeOff, Trash2, Heart, UserMinus, Key, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PlayerCardProps {
  player: Player;
  key?: string;
  testId?: string;
  showSecrets: boolean;
  onUpdateRole: (id: string, role: RoleType) => void;
  onUpdateIdentity?: (id: string, identity: 'citizen' | 'freemason') => void;
  onToggleAlive: (id: string) => void;
  onToggleImprisoned: (id: string) => void;
  onToggleShield: (id: string) => void;
  onToggleTerrorist: (id: string) => void;
  onRemovePlayer?: (id: string) => void;
  totalPlayers?: number;
}

const PUBLIC_ROLES = ['president', 'vice_president', 'mayor', 'judge'];

export default function PlayerCard({
  player,
  showSecrets,
  onUpdateRole,
  onUpdateIdentity,
  onToggleAlive,
  onToggleImprisoned,
  onToggleShield,
  onToggleTerrorist,
  onRemovePlayer,
  totalPlayers = 10,
}: PlayerCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language !== 'en';
  const isMason = player.identity === 'freemason';
  const displayRole = showSecrets || PUBLIC_ROLES.includes(player.role);

  return (
    <div
      id={`player-card-${player.id}`}
      className={`border rounded-xl p-4 transition-all duration-300 text-right scroll-mt-24 ${
        !player.isAlive
          ? 'bg-slate-950/40 border-slate-900 opacity-60'
          : player.isImprisoned
          ? 'bg-amber-950/20 border-amber-900/40'
          : isMason && showSecrets
          ? 'bg-rose-950/20 border-rose-900/30 shadow-md shadow-rose-955/5'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Status badge */}
          {!player.isAlive ? (
            <span className="bg-red-950 text-red-400 border border-red-900/50 text-[10px] px-2 py-0.5 rounded">
              {t('playerCard.dead')}
            </span>
          ) : player.isImprisoned ? (
            <span className="bg-amber-950 text-amber-400 border border-amber-900/50 text-[10px] px-2 py-0.5 rounded animate-pulse">
              {t('playerCard.imprisoned')}
            </span>
          ) : (
            <span className="bg-teal-950 text-teal-400 border border-teal-950 text-[10px] px-2 py-0.5 rounded">
              {t('playerCard.alive')}
            </span>
          )}

          {/* Freemason identifier (moderator only) */}
          {isMason && showSecrets && (
            <span className="bg-rose-900/40 text-rose-300 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-mono">
              {t('playerCard.freemasonTag', { n: player.masonNumber })}
            </span>
          )}

          {/* Terrorist ability indicator */}
          {player.hasTerroristAbility && player.isAlive && !player.isImprisoned && showSecrets && (
            <span className="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3 h-3 text-purple-400 animate-bounce" />
              {t('playerCard.terroristTag')}
            </span>
          )}
        </div>

        {/* Delete button (only in setup or before game starts) */}
        {onRemovePlayer && (
          <button
            onClick={() => onRemovePlayer(player.id)}
            className="text-slate-500 hover:text-rose-400 p-1"
            title={t('playerCard.removeTitle')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Player Name and Role */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-white tracking-wide">{player.name}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-slate-400">{t('playerCard.roleLabel')}</span>
          <span className={`text-xs font-bold ${PUBLIC_ROLES.includes(player.role) ? 'text-amber-400' : 'text-teal-400'}`}>
            {t(`roles.${player.role}.name`)}
          </span>
        </div>
        {/* Real identity indicator */}
        {showSecrets && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">{t('playerCard.identityLabel')}</span>
            <span className={`text-xs font-bold ${isMason ? 'text-rose-400' : 'text-sky-400'}`}>
              {isMason ? t('playerCard.mason') : t('playerCard.citizen')}
            </span>
          </div>
        )}
      </div>

      {/* Role & Identity Selector Dashboard (only visible if secrets are showing) */}
      {showSecrets && (
        <div className="mb-4 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 space-y-2.5">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">{t('playerCard.changeRoleLabel')}</label>
            <select
              value={player.role}
              onChange={(e) => onUpdateRole(player.id, e.target.value as RoleType)}
              className={`w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1 focus:outline-none focus:border-amber-500 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <option value="none">{t('roles.none.name')}</option>
              <optgroup label={t('playerCard.groupCabinet')}>
                <option value="president">{t('roles.president.name')}</option>
                {totalPlayers >= 10 && <option value="vice_president">{t('roles.vice_president.name')}</option>}
                <option value="mayor">{t('roles.mayor.name')}</option>
                <option value="judge">{t('roles.judge.name')}</option>
              </optgroup>
              <optgroup label={t('playerCard.groupReligious')}>
                <option value="pope">{t('roles.pope.name')}</option>
                {totalPlayers >= 10 && <option value="priest">{t('roles.priest.name')}</option>}
              </optgroup>
              <optgroup label={t('playerCard.groupCity')}>
                <option value="doctor">{t('roles.doctor.name')}</option>
                {totalPlayers >= 12 && <option value="police">{t('roles.police.name')}</option>}
                <option value="detective">{t('roles.detective.name')}</option>
                <option value="reporter">{t('roles.reporter.name')}</option>
                <option value="journalist">{t('roles.journalist.name')}</option>
                {totalPlayers > 8 && <option value="lawyer">{t('roles.lawyer.name')}</option>}
              </optgroup>
            </select>
          </div>

          {onUpdateIdentity && (
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">{t('playerCard.changeIdentityLabel')}</label>
              <select
                value={player.identity}
                onChange={(e) => onUpdateIdentity(player.id, e.target.value as 'citizen' | 'freemason')}
                className={`w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1 focus:outline-none focus:border-amber-500 ${isRtl ? 'text-right' : 'text-left'}`}
              >
                <option value="citizen">{t('playerCard.identityCitizen')}</option>
                <option value="freemason">{t('playerCard.identityMason')}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Player Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Toggle Alive Status */}
        <button
          onClick={() => onToggleAlive(player.id)}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs transition border font-semibold ${
            player.isAlive
              ? 'bg-rose-950/30 text-rose-400 border-rose-900/50 hover:bg-rose-900/20'
              : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/20'
          }`}
        >
          {player.isAlive ? (
            <>
              <UserMinus className="w-3.5 h-3.5" />
              {t('playerCard.kill')}
            </>
          ) : (
            <>
              <Heart className="w-3.5 h-3.5" />
              {t('playerCard.revive')}
            </>
          )}
        </button>

        {/* Imprisonment Toggle */}
        <button
          onClick={() => onToggleImprisoned(player.id)}
          disabled={!player.isAlive}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs transition border font-semibold ${
            !player.isAlive
              ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              : player.isImprisoned
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/20'
              : 'bg-amber-950/40 text-amber-300 border-amber-900/50 hover:bg-amber-900/30'
          }`}
        >
          {player.isImprisoned ? t('playerCard.release') : t('playerCard.imprison')}
        </button>

        {/* Shield status */}
        <button
          onClick={() => onToggleShield(player.id)}
          disabled={!player.isAlive}
          className={`col-span-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs transition border font-semibold ${
            !player.isAlive
              ? 'bg-slate-900 text-slate-600 border-slate-800'
              : player.hasShield && !player.shieldBroken
              ? 'bg-teal-950/50 text-teal-400 border-teal-800/80 hover:bg-teal-900/30'
              : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-800/20'
          }`}
        >
          {player.hasShield && !player.shieldBroken ? (
            <>
              <Shield className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20" />
              {t('playerCard.shieldOn')}
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              {t('playerCard.shieldGive')}
            </>
          )}
        </button>

        {/* Terrorist ability toggle */}
        {showSecrets && (
          <button
            onClick={() => onToggleTerrorist(player.id)}
            disabled={!player.isAlive || player.isImprisoned}
            className={`col-span-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded text-xs transition border font-semibold ${
              !player.isAlive || player.isImprisoned
                ? 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                : player.hasTerroristAbility
                ? 'bg-purple-900/40 text-purple-300 border-purple-800/70 hover:bg-purple-950'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-800/20'
            }`}
          >
            {player.hasTerroristAbility ? t('playerCard.terroristOff') : t('playerCard.terroristOn')}
          </button>
        )}
      </div>
    </div>
  );
}
