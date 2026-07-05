/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, RoleType, NightState, GameLog } from '../types';
import { Shield, Skull, Ban, Eye, Target, Sparkles, ArrowLeft, ArrowRight, Zap, Play } from 'lucide-react';
import { CollapsibleGuide } from './CollapsibleGuide';

interface NightWizardProps {
  players: Player[];
  cycle: number;
  showSecrets?: boolean;
  logs?: GameLog[];
  lastPriestBlockedId?: string | null;
  onLogEvent: (message: string, type: 'info' | 'kill' | 'protect' | 'block' | 'ability' | 'system') => void;
  onCompleteNight: (results: {
    deaths: string[];
    shieldBreaks: string[];
    courtNominees: string[];
    terroristsAdded: string[];
    terroristsUsed: string[];
    journalistReport: string | null;
    reporterReport: string | null;
    policeShotOccurred: boolean;
    priestBlockedId: string | null;
  }) => void;
}

export default function NightWizard({ players, cycle, showSecrets = false, logs = [], lastPriestBlockedId, onLogEvent, onCompleteNight }: NightWizardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const NextArrow = isRTL ? ArrowLeft : ArrowRight;
  const PrevArrow = isRTL ? ArrowRight : ArrowLeft;

  const roleName = (r: RoleType | string | undefined | null) => {
    if (!r || r === 'none') return '';
    return t(`roles.${r}.name`);
  };

  const blockDesc = (p: Player) => {
    const blocks: string[] = [];
    if (p.hasTerroristAbility) blocks.push(t('night.blocks.terrorist'));
    if (p.identity === 'freemason') blocks.push(t('night.blocks.mason'));
    if (p.role && p.role !== 'none') {
      blocks.push(t('night.blocks.activeRole', { role: roleName(p.role) }));
    }
    return blocks.join(t('night.blocks.joiner')) || t('night.blocks.fallback');
  };

  const isStepRemovedByPopulation = (stepNum: number) => {
    if (stepNum === 1) return players.length < 10;
    if (stepNum === 4) return players.length < 12;
    return false;
  };

  const isStepEnabled = (stepNum: number) => {
    if (isStepRemovedByPopulation(stepNum)) return false;
    if (stepNum === 1) return players.some(p => p.role === 'priest');
    if (stepNum === 4) return players.some(p => p.role === 'police');
    if (stepNum === 2) return players.some(p => p.role === 'doctor');
    if (stepNum === 3) return players.some(p => p.hasTerroristAbility);
    if (stepNum === 5) return players.some(p => p.role === 'detective');
    if (stepNum === 6) return players.some(p => p.identity === 'freemason');
    if (stepNum === 7) return players.some(p => p.role === 'reporter');
    if (stepNum === 8) return players.some(p => p.role === 'journalist');
    return true;
  };

  const getFirstEnabledStep = () => { let s = 1; while (s <= 8 && !isStepEnabled(s)) s++; return s > 8 ? 1 : s; };
  const getLastEnabledStep = () => { let s = 8; while (s >= 1 && !isStepEnabled(s)) s--; return s < 1 ? 8 : s; };

  const [step, setStep] = useState(() => { let s = 1; while (s <= 8 && !isStepEnabled(s)) s++; return s > 8 ? 8 : s; });
  const [nightAction, setNightAction] = useState<NightState>({
    currentStep: 1,
    priestTargetRole: null,
    priestTargetPlayerId: null,
    doctorTargetId: null,
    terroristTargetId: null,
    policeTargetId: null,
    detectiveTargetId: null,
    journalistTargetType: null,
    masonTargetId: null,
    reporterTargetId: null,
  });

  const [terroristShooterId, setTerroristShooterId] = useState<string | null>(null);

  const activeTerrorists = players.filter((p) => p.hasTerroristAbility && p.isAlive && !p.isImprisoned);
  useEffect(() => {
    if (activeTerrorists.length === 1 && !terroristShooterId) {
      setTerroristShooterId(activeTerrorists[0].id);
    }
  }, [activeTerrorists, terroristShooterId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setNightStep = (s: number) => setStep(s);
      return () => { delete (window as any).setNightStep; };
    }
  }, []);

  const alivePlayers = players.filter((p) => p.isAlive && !p.isImprisoned);

  const getDoctorMaxTargets = () => {
    const activeCount = players.filter(p => p.isAlive && !p.isImprisoned).length;
    if (activeCount <= 10) return 1;
    if (activeCount <= 20) return 2;
    return 3;
  };

  const isRoleAlive = (role: RoleType) => players.some((p) => p.role === role && p.isAlive && !p.isImprisoned);
  const getPlayerWithRole = (role: RoleType) => players.find((p) => p.role === role && p.isAlive && !p.isImprisoned);

  const priestActive = isRoleAlive('priest');
  const doctorActive = isRoleAlive('doctor');
  const terroristActive = players.some((p) => p.hasTerroristAbility && p.isAlive && !p.isImprisoned);
  const policeActive = isRoleAlive('police');
  const detectiveActive = isRoleAlive('detective') && cycle % 2 === 1;
  const masonsActive = players.some((p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned);
  const aliveMasons = players.filter((p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned);
  const activeMasonCommander = aliveMasons.length > 0
    ? aliveMasons.reduce((prev, current) => (prev.masonNumber < current.masonNumber ? prev : current))
    : null;
  const reporterActive = isRoleAlive('reporter');
  const journalistActive = isRoleAlive('journalist') && cycle % 2 === 1;

  const isPlayerBlocked = (playerId: string | null) => {
    if (!priestActive) return false;
    if (!nightAction.priestTargetPlayerId) return false;
    return nightAction.priestTargetPlayerId === playerId;
  };

  const isRoleBlocked = (role: RoleType) => {
    const p = getPlayerWithRole(role);
    return p ? isPlayerBlocked(p.id) : false;
  };

  const isMasonBlockedCurrent = !!(
    priestActive &&
    nightAction.priestTargetPlayerId &&
    activeMasonCommander?.id === nightAction.priestTargetPlayerId
  );

  const handleNextStep = () => {
    let nextStep = step + 1;
    while (nextStep <= 8 && !isStepEnabled(nextStep)) nextStep++;
    if (nextStep > 8) evaluateNight();
    else setStep(nextStep);
  };

  const handlePrevStep = () => {
    let prevStep = step - 1;
    while (prevStep >= 1 && !isStepEnabled(prevStep)) prevStep--;
    if (prevStep >= 1) setStep(prevStep);
  };

  const evaluateNight = () => {
    const deaths: string[] = [];
    const shieldBreaks: string[] = [];
    const courtNominees: string[] = [];
    const terroristsAdded: string[] = [];
    const terroristsUsed: string[] = [];
    let journalistReport: string | null = null;
    let reporterReport: string | null = null;

    const isRoleBlockedValue = (role: string) => {
      if (!priestActive) return false;
      if (!nightAction.priestTargetPlayerId) return false;
      const targetPlayer = players.find(p => p.id === nightAction.priestTargetPlayerId);
      if (!targetPlayer) return false;
      if (role === 'terrorist') return targetPlayer.hasTerroristAbility;
      if (role === 'freemason') return activeMasonCommander ? targetPlayer.id === activeMasonCommander.id : false;
      return targetPlayer.role === role;
    };

    const isDoctorBlocked = isRoleBlockedValue('doctor');
    const isPoliceBlocked = isRoleBlockedValue('police');
    const isDetectiveBlocked = isRoleBlockedValue('detective');
    const isMasonBlocked = isRoleBlockedValue('freemason');
    const isReporterBlocked = isRoleBlockedValue('reporter');
    const isJournalistBlocked = isRoleBlockedValue('journalist');

    if (priestActive && nightAction.priestTargetPlayerId) {
      const targetPlayer = players.find(p => p.id === nightAction.priestTargetPlayerId);
      if (targetPlayer) {
        onLogEvent(t('night.logs.priestBlock', { name: targetPlayer.name, desc: blockDesc(targetPlayer) }), 'block');
      }
    }

    let protectedPlayerId = !isDoctorBlocked ? nightAction.doctorTargetId : null;
    if (doctorActive && protectedPlayerId) {
      if (isDoctorBlocked) {
        onLogEvent(t('night.logs.doctorBlocked'), 'block');
      } else {
        const savedPlayerIds = protectedPlayerId.split(',').filter(Boolean);
        savedPlayerIds.forEach((pId) => {
          const savedPlayer = players.find((p) => p.id === pId);
          if (savedPlayer) onLogEvent(t('night.logs.doctorTreated', { name: savedPlayer.name }), 'protect');
        });
      }
    }

    const attacksMap = new Map<string, Array<'police' | 'mason' | 'terrorist'>>();
    const addAttack = (pId: string, type: 'police' | 'mason' | 'terrorist') => {
      if (!attacksMap.has(pId)) attacksMap.set(pId, []);
      attacksMap.get(pId)?.push(type);
    };

    let triggerTerroristCount = 0;
    let policeShotOccurred = false;

    if (terroristActive && terroristShooterId) {
      const terroristPlayer = players.find((p) => p.id === terroristShooterId);
      if (terroristPlayer) {
        const isShooterBlocked = priestActive && nightAction.priestTargetPlayerId === terroristPlayer.id;
        if (nightAction.terroristTargetId) {
          terroristsUsed.push(terroristPlayer.id);
          if (isShooterBlocked) {
            onLogEvent(t('night.logs.terroristBlocked', { name: terroristPlayer.name }), 'block');
          } else {
            const targetPlayer = players.find((p) => p.id === nightAction.terroristTargetId);
            if (targetPlayer) {
              if (targetPlayer.isImprisoned) {
                onLogEvent(t('night.logs.terroristPrison', { terror: terroristPlayer.name, target: targetPlayer.name }), 'kill');
                deaths.push(terroristPlayer.id);
              } else {
                onLogEvent(t('night.logs.terroristKill', { terror: terroristPlayer.name, target: targetPlayer.name }), 'kill');
                addAttack(targetPlayer.id, 'terrorist');
                deaths.push(terroristPlayer.id);
              }
            }
          }
        }
      }
    }

    if (policeActive && nightAction.policeTargetId) {
      if (isPoliceBlocked) {
        onLogEvent(t('night.logs.policeBlocked'), 'block');
      } else {
        const targetPlayer = players.find((p) => p.id === nightAction.policeTargetId);
        onLogEvent(t('night.logs.policeShot', { name: targetPlayer?.name }), 'kill');
        addAttack(nightAction.policeTargetId, 'police');
        policeShotOccurred = true;
      }
    }

    if (detectiveActive && nightAction.detectiveTargetId) {
      if (isDetectiveBlocked) {
        onLogEvent(t('night.logs.detectiveBlocked'), 'block');
      } else {
        const targetPlayer = players.find((p) => p.id === nightAction.detectiveTargetId);
        onLogEvent(t('night.logs.detectiveCourt', { name: targetPlayer?.name }), 'ability');
        courtNominees.push(nightAction.detectiveTargetId);
      }
    }

    if (masonsActive && nightAction.masonTargetId) {
      if (isMasonBlocked) {
        onLogEvent(t('night.logs.masonBlocked'), 'block');
      } else {
        const targetPlayer = players.find((p) => p.id === nightAction.masonTargetId);
        const commander = activeMasonCommander ? t('night.logs.masonCommander', { name: activeMasonCommander.name }) : '';
        onLogEvent(t('night.logs.masonKill', { commander, name: targetPlayer?.name }), 'kill');
        addAttack(nightAction.masonTargetId, 'mason');
      }
    }

    if (reporterActive && nightAction.reporterTargetId) {
      if (isReporterBlocked) {
        onLogEvent(t('night.logs.reporterBlocked'), 'block');
        reporterReport = t('night.logs.reporterBlockedMsg');
      } else {
        const inspectPlayer = players.find((p) => p.id === nightAction.reporterTargetId);
        reporterReport = t('night.logs.reporterReport', { name: inspectPlayer?.name });
        onLogEvent(t('night.logs.reporterDone', { name: inspectPlayer?.name }), 'ability');
      }
    }

    if (journalistActive && nightAction.journalistTargetType) {
      if (isJournalistBlocked) {
        onLogEvent(t('night.logs.journalistBlocked'), 'block');
        journalistReport = t('night.logs.journalistBlockedMsg');
      } else {
        const when = nightAction.journalistTargetType === 'night' ? t('night.logs.journalistWhenNight') : t('night.logs.journalistWhenDay');
        journalistReport = t('night.logs.journalistReport', { when });
        onLogEvent(t('night.logs.journalistDone'), 'ability');
      }
    }

    attacksMap.forEach((attackTypes, attackerId) => {
      const victim = players.find((p) => p.id === attackerId);
      if (!victim) return;
      const isSaved = protectedPlayerId && protectedPlayerId.split(',').filter(Boolean).includes(victim.id);
      attackTypes.forEach((atkType) => {
        if (atkType === 'terrorist') {
          if (!deaths.includes(victim.id)) deaths.push(victim.id);
          return;
        }
        if (isSaved) {
          const attacker = atkType === 'police' ? t('night.logs.attackerPolice') : t('night.logs.attackerMason');
          onLogEvent(t('night.logs.doctorSaved', { victim: victim.name, attacker }), 'protect');
          return;
        }
        const hasShieldActive = victim.hasShield && !victim.shieldBroken;
        if (hasShieldActive) {
          shieldBreaks.push(victim.id);
          onLogEvent(t('night.logs.shieldBreak', { name: victim.name }), 'protect');
          return;
        }
        if (!deaths.includes(victim.id)) deaths.push(victim.id);
      });
    });

    if (policeShotOccurred && nightAction.policeTargetId && !deaths.includes(nightAction.policeTargetId)) {
      policeShotOccurred = false;
    }

    if (triggerTerroristCount > 0) {
      for (let i = 0; i < triggerTerroristCount; i++) {
        const alreadyDeadSet = new Set(deaths);
        let eligible = players.filter(
          (p) => p.isAlive && !p.isImprisoned && !p.hasTerroristAbility && !alreadyDeadSet.has(p.id)
        );
        if (eligible.length > 0) {
          const roleless = eligible.filter((p) => p.role === 'none');
          const pool = roleless.length > 0 ? roleless : eligible;
          const chosen = pool[Math.floor(Math.random() * pool.length)];
          terroristsAdded.push(chosen.id);
          onLogEvent(t('night.logs.terroristAdded', { name: chosen.name }), 'ability');
        }
      }
    }

    onCompleteNight({
      deaths,
      shieldBreaks,
      courtNominees,
      terroristsAdded,
      terroristsUsed,
      journalistReport,
      reporterReport,
      policeShotOccurred,
      priestBlockedId: priestActive ? nightAction.priestTargetPlayerId : null,
    });
  };

  const simulateThisNightDeathsAndFactions = () => {
    const simulatedDeaths: string[] = [];
    const isBlockedSim = (role: string) => {
      if (!priestActive) return false;
      if (!nightAction.priestTargetPlayerId) return false;
      const targetPlayer = players.find(p => p.id === nightAction.priestTargetPlayerId);
      if (!targetPlayer) return false;
      if (role === 'terrorist') return targetPlayer.hasTerroristAbility;
      if (role === 'freemason') return activeMasonCommander ? targetPlayer.id === activeMasonCommander.id : false;
      return targetPlayer.role === role;
    };
    const protectedId = doctorActive && !isBlockedSim('doctor') ? nightAction.doctorTargetId : null;
    const attacks = new Map<string, Array<'police' | 'mason' | 'terrorist'>>();
    const addSimAtk = (pId: string, type: 'police' | 'mason' | 'terrorist') => {
      if (!attacks.has(pId)) attacks.set(pId, []);
      attacks.get(pId)?.push(type);
    };
    if (terroristActive && nightAction.terroristTargetId && !isBlockedSim('terrorist')) {
      const terrPlayer = players.find(p => p.hasTerroristAbility && p.isAlive && !p.isImprisoned);
      const targetP = players.find(p => p.id === nightAction.terroristTargetId);
      if (terrPlayer && targetP) {
        if (!targetP.isImprisoned) addSimAtk(targetP.id, 'terrorist');
        simulatedDeaths.push(terrPlayer.id);
      }
    }
    if (policeActive && nightAction.policeTargetId && !isBlockedSim('police')) addSimAtk(nightAction.policeTargetId, 'police');
    if (masonsActive && nightAction.masonTargetId && !isBlockedSim('freemason')) addSimAtk(nightAction.masonTargetId, 'mason');
    attacks.forEach((atkTypes, victimId) => {
      const victim = players.find(v => v.id === victimId);
      if (!victim) return;
      const isSaved = protectedId && protectedId.split(',').filter(Boolean).includes(victimId);
      atkTypes.forEach((type) => {
        if (type === 'terrorist') { if (!simulatedDeaths.includes(victimId)) simulatedDeaths.push(victimId); return; }
        if (isSaved) return;
        const hasShield = victim.hasShield && !victim.shieldBroken;
        if (hasShield) return;
        if (!simulatedDeaths.includes(victimId)) simulatedDeaths.push(victimId);
      });
    });
    let masonsCount = 0, citizensCount = 0;
    simulatedDeaths.forEach((id) => {
      const p = players.find(x => x.id === id);
      if (p) { if (p.identity === 'freemason') masonsCount++; else citizensCount++; }
    });
    return { masons: masonsCount, citizens: citizensCount, count: simulatedDeaths.length };
  };

  const getPastDayDeathsAndFactions = () => {
    const dayDeadPlayers = players.filter(p =>
      !p.isAlive &&
      logs && logs.some(log => log.cycle === cycle && log.phase === 'day' && log.type === 'kill' && log.message.includes(p.name))
    );
    let masonsCount = 0, citizensCount = 0;
    dayDeadPlayers.forEach((p) => { if (p.identity === 'freemason') masonsCount++; else citizensCount++; });
    return { masons: masonsCount, citizens: citizensCount, count: dayDeadPlayers.length };
  };

  const PlayerSelector = ({
    targetId, onChange, excludeId, includeImprisoned, excludeRoles,
  }: {
    targetId: string | null;
    onChange: (id: string) => void;
    excludeId?: string;
    includeImprisoned?: boolean;
    excludeRoles?: string[];
  }) => {
    const list = includeImprisoned ? players.filter(p => p.isAlive) : alivePlayers;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        {list
          .filter((p) => p.id !== excludeId && (!excludeRoles || !excludeRoles.includes(p.role)))
          .map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition border ${
                targetId === p.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {p.name} {p.isImprisoned ? t('night.common.inPrison') : ''}
            </button>
          ))}
      </div>
    );
  };

  const playersWithRoleNames = (role: RoleType) =>
    players.filter(p => p.role === role && p.isAlive && !p.isImprisoned).map(p => p.name).join(isRTL ? '، ' : ', ') || t('night.common.unknown');

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl max-w-3xl w-full mx-auto text-slate-200" dir={i18n.dir()}>
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-1">{t('night.header.eyebrow')}</span>
          <h2 className="text-xl font-black text-white">{t('night.header.title')}</h2>
        </div>
        <div className="text-xs font-bold bg-slate-950 px-3 py-1 rounded-full text-slate-400">
          {t('night.header.stepLabel', { step })}
        </div>
      </div>

      {/* STEP 1: PRIEST */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Ban className="w-5 h-5 text-teal-400" />
                {t('night.step1.title')}
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {playersWithRoleNames('priest')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{t('night.step1.desc')}</p>
          </div>

          {priestActive ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {players.filter((p) => p.isAlive && !p.isImprisoned).map((p) => {
                  const isSelected = nightAction.priestTargetPlayerId === p.id;
                  const isDisallowed = p.id === lastPriestBlockedId;
                  const blocks: string[] = [];
                  if (p.hasTerroristAbility) blocks.push(t('night.blocks.terrorist'));
                  if (p.identity === 'freemason') blocks.push(t('night.blocks.mason'));
                  if (p.role && p.role !== 'none') blocks.push(roleName(p.role));
                  const pDesc = blocks.join(' + ') || t('night.common.commoner');

                  return (
                    <button
                      key={p.id}
                      disabled={isDisallowed}
                      onClick={() => setNightAction({
                        ...nightAction,
                        priestTargetPlayerId: p.id,
                        priestTargetRole: p.role !== 'none' ? p.role : (p.hasTerroristAbility ? 'terrorist' as any : (p.identity === 'freemason' ? 'freemason' as any : null))
                      })}
                      className={`p-3 rounded-xl text-xs font-black transition border flex flex-col gap-1.5 items-start justify-between min-h-[68px] leading-normal ${
                        isSelected
                          ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-600/15'
                          : isDisallowed
                          ? 'bg-slate-950/20 border-rose-900/30 text-rose-800/60 opacity-50 cursor-not-allowed'
                          : 'bg-slate-950/40 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="text-xs font-extrabold flex items-center justify-between w-full">
                        <span>{p.name} {p.role === 'priest' ? t('night.common.selfPriest') : ''}</span>
                        {isDisallowed && <Ban className="w-3 h-3 text-rose-500/50" />}
                      </span>
                      <span className={`text-[9px] font-bold ${isSelected ? 'text-slate-900' : isDisallowed ? 'text-rose-900/50' : 'text-slate-500'}`}>
                        {isDisallowed ? t('night.common.blockedPrev') : pDesc}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setNightAction({ ...nightAction, priestTargetPlayerId: null, priestTargetRole: null })}
                  className={`p-3 rounded-xl text-xs font-black transition border flex flex-col items-start justify-center leading-normal min-h-[68px] ${
                    nightAction.priestTargetPlayerId === null
                      ? 'bg-amber-600 text-slate-950 border-amber-400 font-extrabold'
                      : 'bg-slate-950/10 border-slate-900 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-extrabold">{t('night.common.noAction')}</span>
                  <span className="text-[9px] text-slate-500">{t('night.common.noActionSub')}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step1.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: DOCTOR */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
            <div className="flex items-center gap-2 justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                {t('night.step2.title')}
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {playersWithRoleNames('doctor')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{t('night.step2.desc')}</p>

            <CollapsibleGuide title={t('night.step2.rulesHeader')} defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 w-full">
                <div className={`p-2 rounded-lg border transition ${players.length <= 10 ? 'bg-teal-950/25 border-teal-700/50 text-teal-300 shadow-md shadow-teal-950/20' : 'bg-slate-900/40 border-slate-800'}`}>
                  <span>{t('night.step2.rulesLt10Label')}</span>
                  <span className="block text-xs font-black mt-1">{t('night.step2.rulesLt10Value')}</span>
                  {players.length <= 10 && <span className="text-[9px] text-teal-400 block mt-0.5">{t('night.step2.activeAt')}</span>}
                </div>
                <div className={`p-2 rounded-lg border transition ${players.length >= 11 && players.length <= 20 ? 'bg-teal-950/25 border-teal-700/50 text-teal-300 shadow-md shadow-teal-950/20' : 'bg-slate-900/40 border-slate-800'}`}>
                  <span>{t('night.step2.rulesMidLabel')}</span>
                  <span className="block text-xs font-black mt-1">{t('night.step2.rulesMidValue')}</span>
                  {players.length >= 11 && players.length <= 20 && <span className="text-[9px] text-teal-400 block mt-0.5">{t('night.step2.activeAt')}</span>}
                </div>
                <div className={`p-2 rounded-lg border transition ${players.length >= 21 ? 'bg-teal-950/25 border-teal-700/50 text-teal-300 shadow-md shadow-teal-950/20' : 'bg-slate-900/40 border-slate-800'}`}>
                  <span>{t('night.step2.rulesGtLabel')}</span>
                  <span className="block text-xs font-black mt-1">{t('night.step2.rulesGtValue')}</span>
                  {players.length >= 21 && <span className="text-[9px] text-teal-400 block mt-0.5">{t('night.step2.activeAt')}</span>}
                </div>
              </div>
            </CollapsibleGuide>
          </div>

          {doctorActive ? (
            <>
              {showSecrets && isRoleBlocked('doctor') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step2.blockedAlert')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {alivePlayers.map((p) => {
                  const selectedIds = nightAction.doctorTargetId ? nightAction.doctorTargetId.split(',').filter(Boolean) : [];
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        let nextIds = [...selectedIds];
                        if (isSelected) nextIds = nextIds.filter((id) => id !== p.id);
                        else {
                          const maxAllowed = getDoctorMaxTargets();
                          if (nextIds.length >= maxAllowed) {
                            alert(t('night.step2.capacityFull', { max: maxAllowed }));
                            return;
                          }
                          nextIds.push(p.id);
                        }
                        setNightAction({ ...nightAction, doctorTargetId: nextIds.length > 0 ? nextIds.join(',') : null });
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold transition border flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-600 text-slate-950 border-teal-400 shadow-md shadow-teal-600/15'
                          : 'bg-slate-950/40 border-slate-800 text-slate-350 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <span>{p.name} {p.role === 'doctor' ? t('night.common.you') : ''}</span>
                      {isSelected ? (
                        <span className="text-[9px] bg-slate-950 p-1 py-0.5 rounded text-teal-400 font-black">{t('night.common.selected')}</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">{t('night.common.select')}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {nightAction.doctorTargetId && (
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-3.5 rounded-xl text-xs font-semibold text-center mt-3 animate-fadeIn">
                  <span className="font-black block mb-1">{t('night.step2.selectedHeader')}</span>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-1.5">
                    {nightAction.doctorTargetId.split(',').filter(Boolean).map((id) => (
                      <span key={id} className="bg-teal-950/60 border border-teal-900/50 px-3 py-1 rounded-lg text-teal-350 font-black text-[11px]">
                        {players.find(p => p.id === id)?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step2.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: TERRORIST */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                {t('night.step3.title')}
              </h3>
              <span className="text-[10px] font-black bg-purple-900/30 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-900/40">
                {players.filter(p => p.hasTerroristAbility && p.isAlive && !p.isImprisoned).map(p => p.name).join(isRTL ? '، ' : ', ') || t('night.common.unknown')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              {t('night.step3.desc1')}<br/>
              <span className="text-rose-400/90 mt-1 block font-bold text-[10px]">{t('night.step3.desc2')}</span>
              <span className="text-amber-400/90 mt-1 block font-bold text-[10px]">{t('night.step3.desc3')}</span>
            </p>

            <div className="bg-purple-950/20 border border-purple-900/40 p-3 rounded-xl text-xs space-y-2">
              <span className="text-slate-400 text-[10px] block font-bold">{t('night.step3.activeListLabel')}</span>
              {activeTerrorists.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {activeTerrorists.map(p => (
                    <span key={p.id} className="bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-lg font-extrabold border border-purple-850/60">
                      💣 {p.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 font-black">{t('night.step3.noActive')}</div>
              )}
            </div>
          </div>

          {terroristActive ? (
            <>
              {showSecrets && terroristShooterId && isPlayerBlocked(terroristShooterId) && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step3.blockedAlert', { name: players.find(x => x.id === terroristShooterId)?.name })}</span>
                </div>
              )}
              {activeTerrorists.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                  <span className="text-xs font-black text-slate-300 block">{t('night.step3.shooterSelectLabel')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {activeTerrorists.map((p) => {
                      const isSelected = terroristShooterId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setTerroristShooterId(isSelected ? null : p.id);
                            setNightAction({ ...nightAction, terroristTargetId: null });
                          }}
                          className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                            isSelected ? 'bg-purple-700 text-white border-purple-500 font-extrabold' : 'bg-slate-900/50 border-slate-800 text-slate-350 hover:border-slate-800'
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => { setTerroristShooterId(null); setNightAction({ ...nightAction, terroristTargetId: null }); }}
                      className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                        terroristShooterId === null ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-950/10 border-slate-900 text-slate-400'
                      }`}
                    >
                      {t('night.common.noAction')}
                    </button>
                  </div>
                </div>
              )}

              {terroristShooterId && (
                <div className="space-y-3 mt-4 bg-slate-950/30 p-4 rounded-xl border border-slate-850">
                  <span className="text-xs font-black text-slate-300 block">{t('night.step3.targetSelectLabel')}</span>
                  <PlayerSelector
                    targetId={nightAction.terroristTargetId}
                    onChange={(id) => setNightAction({ ...nightAction, terroristTargetId: id })}
                    excludeId={terroristShooterId || undefined}
                  />
                  {nightAction.terroristTargetId && (
                    <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                      {t('night.step3.targetAimed')} <span className="font-bold underline">{players.find(p => p.id === nightAction.terroristTargetId)?.name}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step3.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 4: POLICE */}
      {step === 4 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-500" />
                {t('night.step4.title')}
              </h3>
              <span className="text-[10px] font-black bg-red-900/30 text-red-400 px-2.5 py-0.5 rounded-full border border-red-900/40">
                {playersWithRoleNames('police')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{t('night.step4.desc')}</p>
          </div>

          {policeActive ? (
            <>
              {showSecrets && isRoleBlocked('police') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step4.blockedAlert')}</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.policeTargetId}
                onChange={(id) => setNightAction({ ...nightAction, policeTargetId: id })}
              />
              {nightAction.policeTargetId && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                  {t('night.step4.selected')} <span className="font-bold underline">{players.find(p => p.id === nightAction.policeTargetId)?.name}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step4.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 5: DETECTIVE */}
      {step === 5 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal-400" />
                {t('night.step5.title')}
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {playersWithRoleNames('detective')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{t('night.step5.desc')}</p>
          </div>

          {detectiveActive ? (
            <>
              {showSecrets && isRoleBlocked('detective') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step5.blockedAlert')}</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.detectiveTargetId}
                onChange={(id) => setNightAction({ ...nightAction, detectiveTargetId: id })}
                excludeRoles={['president', 'judge', 'pope']}
              />
              {nightAction.detectiveTargetId && (
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                  {t('night.step5.selected')} <span className="font-bold underline">{players.find(p => p.id === nightAction.detectiveTargetId)?.name}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step5.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 6: FREEMASONS */}
      {step === 6 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Skull className="w-5 h-5 text-rose-500" />
                {t('night.step6.title')}
              </h3>
              <span className="text-[10px] font-black bg-rose-900/30 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-900/40">
                {players.filter(p => p.identity === 'freemason' && p.isAlive && !p.isImprisoned).map(p => p.name).join(isRTL ? '، ' : ', ') || t('night.common.unknown')}
              </span>
            </div>

            {(() => {
              const activeMasons = players.filter(p => p.identity === 'freemason' && p.isAlive && !p.isImprisoned);
              const imprisonedMasons = players.filter(p => p.identity === 'freemason' && p.isAlive && p.isImprisoned);
              const smallestMason = activeMasons.length > 0 ? activeMasons.reduce((prev, current) => (prev.masonNumber < current.masonNumber ? prev : current)) : null;

              return (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <div className="bg-rose-900/10 border border-rose-500/20 p-2.5 rounded-lg text-rose-200 font-bold">
                    {t('night.step6.shooterLabel')}{' '}
                    <span className="font-black text-rose-300">
                      {smallestMason ? t('night.step6.masonNumbered', { name: smallestMason.name, n: smallestMason.masonNumber }) : t('night.step6.nobody')}
                    </span>
                  </div>
                  <div className="text-slate-400 font-semibold">
                    {activeMasons.length > 0
                      ? t('night.step6.active', { list: activeMasons.map(m => `${m.name} (${m.masonNumber})`).join(isRTL ? '، ' : ', ') })
                      : t('night.step6.noActive')}
                  </div>
                  {imprisonedMasons.length > 0 && (
                    <div className="text-rose-400 font-semibold">{t('night.step6.imprisoned', { list: imprisonedMasons.map(m => m.name).join(isRTL ? '، ' : ', ') })}</div>
                  )}
                </div>
              );
            })()}
          </div>

          {masonsActive ? (
            <>
              {showSecrets && isMasonBlockedCurrent && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step6.blockedAlert')}</span>
                </div>
              )}
              {(() => {
                const imprisonedMasons = players.filter(p => p.identity === 'freemason' && p.isImprisoned && p.isAlive);
                return imprisonedMasons.length > 0 ? (
                  <div className="text-[11px] text-slate-500 mb-3">
                    {t('night.step6.imprisonedReminder', { list: imprisonedMasons.map(m => m.name).join('، ') })}
                  </div>
                ) : null;
              })()}
              <PlayerSelector
                targetId={nightAction.masonTargetId}
                onChange={(id) => setNightAction({ ...nightAction, masonTargetId: id })}
              />
              {nightAction.masonTargetId && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                  {t('night.step6.selected')} <span className="font-bold underline">{players.find(p => p.id === nightAction.masonTargetId)?.name}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step6.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 7: REPORTER */}
      {step === 7 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-teal-400" />
                {t('night.step7.title')}
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {playersWithRoleNames('reporter')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{t('night.step7.desc')}</p>
          </div>

          {reporterActive ? (
            <>
              {showSecrets && isRoleBlocked('reporter') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step7.blockedAlert')}</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.reporterTargetId}
                onChange={(id) => setNightAction({ ...nightAction, reporterTargetId: id })}
              />

              {nightAction.reporterTargetId && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-2 mt-4 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-extrabold text-white mb-2 pb-1 border-b border-emerald-950">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{t('night.step7.panelTitle', { name: players.find(p => p.id === nightAction.reporterTargetId)?.name })}</span>
                  </div>
                  <div className="space-y-1 text-slate-300 font-bold">
                    {(() => {
                      const target = players.find(p => p.id === nightAction.reporterTargetId);
                      if (!target) return null;

                      const isReporterBlockedCurrent = isRoleBlocked('reporter');
                      if (isReporterBlockedCurrent && !showSecrets) {
                        return (
                          <div className="bg-amber-950/40 border border-amber-900/40 p-3 rounded-lg text-amber-300 text-xs text-center font-black leading-relaxed shrink-0 mb-2">
                            {t('night.step7.blockedPublic')}<br />
                            <span className="text-white text-sm block mt-1.5 underline underline-offset-4 font-extrabold pb-1">{t('night.step7.blockedPublicMsg')}</span>
                          </div>
                        );
                      }

                      const events: string[] = [];
                      const checkSimBlocked = (role: string) => {
                        if (!priestActive) return false;
                        if (!nightAction.priestTargetPlayerId) return false;
                        const p = players.find(x => x.id === nightAction.priestTargetPlayerId);
                        if (!p) return false;
                        if (role === 'terrorist' && p.hasTerroristAbility) return true;
                        if (role === 'freemason') return activeMasonCommander ? p.id === activeMasonCommander.id : false;
                        return p.role === role;
                      };

                      const isBlockedVal = priestActive && nightAction.priestTargetPlayerId === target.id;
                      if (isBlockedVal) events.push(t('night.step7.events.priestBlock'));

                      const isSaved = doctorActive && nightAction.doctorTargetId?.split(',').filter(Boolean).includes(target.id) && !checkSimBlocked('doctor');
                      if (isSaved) events.push(t('night.step7.events.doctorSave'));

                      const isTerrorTarget = terroristActive && nightAction.terroristTargetId === target.id && !checkSimBlocked('terrorist');
                      if (isTerrorTarget) events.push(t('night.step7.events.terrorist'));

                      const isPoliceTarget = policeActive && nightAction.policeTargetId === target.id && !checkSimBlocked('police');
                      if (isPoliceTarget) events.push(t('night.step7.events.police'));

                      const isDetTarget = detectiveActive && nightAction.detectiveTargetId === target.id && !checkSimBlocked('detective');
                      if (isDetTarget) events.push(t('night.step7.events.detective'));

                      const isMasonTarget = masonsActive && nightAction.masonTargetId === target.id && !checkSimBlocked('freemason');
                      if (isMasonTarget) events.push(t('night.step7.events.mason'));

                      if (events.length === 0) events.push(t('night.step7.events.calm'));

                      return (
                        <ul className="list-disc list-inside space-y-1.5">
                          {events.map((ev, idx) => (<li key={idx} className="text-slate-200">{ev}</li>))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step7.inactive')}
            </div>
          )}
        </div>
      )}

      {/* STEP 8: JOURNALIST */}
      {step === 8 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                {t('night.step8.title')}
              </h3>
              <span className="text-[10px] font-black bg-amber-900/30 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-900/40">
                {playersWithRoleNames('journalist')}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">{t('night.step8.desc')}</p>
          </div>

          {journalistActive ? (
            <>
              {isRoleBlocked('journalist') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{t('night.step8.blockedAlert')}</span>
                </div>
              )}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setNightAction({ ...nightAction, journalistTargetType: 'night' })}
                  className={`py-3 px-6 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    nightAction.journalistTargetType === 'night'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg font-black'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {t('night.step8.thisNight')}
                </button>
                <button
                  onClick={() => setNightAction({ ...nightAction, journalistTargetType: 'day' })}
                  className={`py-3 px-6 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    nightAction.journalistTargetType === 'day'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg font-black'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {t('night.step8.pastDay')}
                </button>
              </div>

              {nightAction.journalistTargetType && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-xs space-y-2 mt-4 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-extrabold text-white mb-2 pb-1 border-b border-amber-955">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{t('night.step8.summaryTitle')}</span>
                  </div>
                  {(() => {
                    const report = nightAction.journalistTargetType === 'night'
                      ? simulateThisNightDeathsAndFactions()
                      : getPastDayDeathsAndFactions();
                    return (
                      <div className="space-y-4 text-slate-300 font-bold">
                        <p className="text-slate-100 font-sans">
                          {t('night.step8.rangeLabel')}{' '}
                          <span className="text-amber-400 underline">
                            {nightAction.journalistTargetType === 'night' ? t('night.step8.rangeNight') : t('night.step8.rangeDay')}
                          </span>
                        </p>
                        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-900 font-sans">
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40 rounded border border-slate-800 font-mono">
                            <span className="text-slate-400 text-[10px] mb-1 font-sans">{t('night.step8.citizensOut')}</span>
                            <span className="text-sky-400 text-lg font-black">{report.citizens}{t('night.step8.peopleSuffix')}</span>
                          </div>
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40 rounded border border-slate-800 font-mono">
                            <span className="text-slate-400 text-[10px] mb-1 font-sans">{t('night.step8.masonsOut')}</span>
                            <span className="text-rose-400 text-lg font-black">{report.masons}{t('night.step8.peopleSuffix')}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center font-semibold font-sans">{t('night.step8.noteFooter')}</p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed whitespace-pre-line">
              {t('night.step8.inactive')}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
        <button
          onClick={handlePrevStep}
          disabled={step === getFirstEnabledStep()}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
            step === getFirstEnabledStep()
              ? 'text-slate-600 cursor-not-allowed opacity-50 bg-[#070b13]'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-755'
          }`}
        >
          <PrevArrow className="w-4 h-4" />
          {t('night.footer.prev')}
        </button>

        <button
          onClick={handleNextStep}
          className="bg-teal-600 hover:bg-teal-700 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          {step === getLastEnabledStep() ? t('night.footer.finish') : t('night.footer.next')}
          {step === getLastEnabledStep() ? <Play className="w-4 h-4" /> : <NextArrow className="w-4 h-4" />}
        </button>
      </div>

      {/* Reference */}
      <div className="mt-8 bg-[#070b13] border border-slate-850 rounded-xl p-4">
        <h4 className="font-black text-slate-400 mb-3 border-b border-slate-850 pb-2 flex items-center gap-1.5 justify-start text-xs">
          <Eye className="w-4 h-4 text-teal-400" />
          <span>{t('night.footer.guideTitle')}</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 font-semibold leading-normal font-sans">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className={`p-2 rounded border transition-all ${isStepEnabled(n) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
              <span className={`${isStepEnabled(n) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
                {t(`night.reference.step${n}.title`)}{isStepRemovedByPopulation(n) ? t('night.common.removedVar') : ''}
              </span>
              {t(`night.reference.step${n}.desc`)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
