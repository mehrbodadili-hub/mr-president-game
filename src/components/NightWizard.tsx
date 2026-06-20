/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Player, RoleType, NightState, GameLog } from '../types';
import { ROLE_DETAILS } from '../constants';
import { Shield, Skull, Ban, Eye, Target, Sparkles, ArrowLeft, ArrowRight, Zap, Play } from 'lucide-react';

interface NightWizardProps {
  players: Player[];
  cycle: number;
  showSecrets?: boolean;
  logs?: GameLog[]; // Passed for Journalist day death analysis
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
  const isStepRemovedByPopulation = (stepNum: number) => {
    if (stepNum === 1) { // Priest
      return players.length < 10;
    }
    if (stepNum === 4) { // Police
      return players.length < 12;
    }
    return false;
  };

  const isStepEnabled = (stepNum: number) => {
    if (isStepRemovedByPopulation(stepNum)) return false;
    
    // Check if the role actually exists in the starting game roster
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

  const getFirstEnabledStep = () => {
    let first = 1;
    while (first <= 8 && !isStepEnabled(first)) {
      first++;
    }
    return first > 8 ? 1 : first;
  };

  const getLastEnabledStep = () => {
    let last = 8;
    while (last >= 1 && !isStepEnabled(last)) {
      last--;
    }
    return last < 1 ? 8 : last;
  };

  const [step, setStep] = useState(() => {
    let s = 1;
    while (s <= 8 && !isStepEnabled(s)) {
      s++;
    }
    return s > 8 ? 8 : s;
  });
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
      (window as any).setNightStep = (s: number) => {
        setStep(s);
      };
      return () => {
        delete (window as any).setNightStep;
      };
    }
  }, []);

  const alivePlayers = players.filter((p) => p.isAlive && !p.isImprisoned);

  const getDoctorMaxTargets = () => {
    const totalPlayersCount = players.length;
    if (totalPlayersCount < 10) return 1;
    if (totalPlayersCount >= 11 && totalPlayersCount <= 20) return 2;
    return 3;
  };

  const getPlayerBlockInfo = (playerId: string | null) => {
    if (!playerId) return null;
    const p = players.find(x => x.id === playerId);
    if (!p) return null;
    
    const blocks: string[] = [];
    if (p.hasTerroristAbility) {
      blocks.push('قابلیت بمب‌گذاری تروریستی');
    }
    if (p.identity === 'freemason') {
      blocks.push('شلیک شبانه لژ فراماسونری');
    }
    if (p.role && p.role !== 'none') {
      const roleName = ROLE_DETAILS[p.role]?.nameFa || p.role;
      blocks.push(`نقش فعال «${roleName}»`);
    }
    
    return {
      player: p,
      blocksDescription: blocks.join(' و ') || 'هیچ نقش یا قابلیت خاصی (شهروند ساده)'
    };
  };

  // Helper selectors to check if roles are active and alive
  const isRoleAlive = (role: RoleType) => players.some((p) => p.role === role && p.isAlive && !p.isImprisoned);
  const getPlayerWithRole = (role: RoleType) => players.find((p) => p.role === role && p.isAlive && !p.isImprisoned);

  const priestActive = isRoleAlive('priest');
  const doctorActive = isRoleAlive('doctor');
  const terroristActive = players.some((p) => p.hasTerroristAbility && p.isAlive && !p.isImprisoned);
  const policeActive = isRoleAlive('police');
  const detectiveActive = isRoleAlive('detective') && cycle % 2 === 1; // every other night
  const masonsActive = players.some((p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned);
  const aliveMasons = players.filter((p) => p.identity === 'freemason' && p.isAlive && !p.isImprisoned);
  const activeMasonCommander = aliveMasons.length > 0
    ? aliveMasons.reduce((prev, current) => (prev.masonNumber < current.masonNumber ? prev : current))
    : null;
  const reporterActive = isRoleAlive('reporter');
  const journalistActive = isRoleAlive('journalist') && cycle % 2 === 1; // every other night

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

  // Skip step if role is deceased or inactive tonight
  // Step sequence:
  // 1: Priest (کشیش)
  // 2: Doctor (دکتر)
  // 3: Terrorist (تروریست)
  // 4: Police (پلیس)
  // 5: Detective (کارآگاه)
  // 6: Freemason (تیم فراماسون)
  // 7: Reporter (گزارشگر) - "نفر یکی مانده به آخر"
  // 8: Journalist (خبرنگار) - "آخرین نقش فعال شب"
  const handleNextStep = () => {
    let nextStep = step + 1;
    while (nextStep <= 8 && !isStepEnabled(nextStep)) {
      nextStep++;
    }

    if (nextStep > 8) {
      evaluateNight();
    } else {
      setStep(nextStep);
    }
  };

  const handlePrevStep = () => {
    let prevStep = step - 1;
    while (prevStep >= 1 && !isStepEnabled(prevStep)) {
      prevStep--;
    }

    if (prevStep >= 1) {
      setStep(prevStep);
    }
  };

  const evaluateNight = () => {
    const deaths: string[] = [];
    const shieldBreaks: string[] = [];
    const courtNominees: string[] = [];
    const terroristsAdded: string[] = [];
    const terroristsUsed: string[] = [];
    let journalistReport: string | null = null;
    let reporterReport: string | null = null;

    // 1. Check Blocks (Role/Ability blocked by Priest)
    const isRoleBlockedValue = (role: string) => {
      if (!priestActive) return false;
      if (!nightAction.priestTargetPlayerId) return false;
      const targetPlayer = players.find(p => p.id === nightAction.priestTargetPlayerId);
      if (!targetPlayer) return false;

      if (role === 'terrorist') {
        return targetPlayer.hasTerroristAbility;
      }
      if (role === 'freemason') {
        return activeMasonCommander ? targetPlayer.id === activeMasonCommander.id : false;
      }
      return targetPlayer.role === role;
    };

    const isDoctorBlocked = isRoleBlockedValue('doctor');
    const isTerroristBlocked = isRoleBlockedValue('terrorist');
    const isPoliceBlocked = isRoleBlockedValue('police');
    const isDetectiveBlocked = isRoleBlockedValue('detective');
    const isMasonBlocked = isRoleBlockedValue('freemason');
    const isReporterBlocked = isRoleBlockedValue('reporter');
    const isJournalistBlocked = isRoleBlockedValue('journalist');

    // Log Priest Block
    if (priestActive && nightAction.priestTargetPlayerId) {
      const targetPlayer = players.find(p => p.id === nightAction.priestTargetPlayerId);
      if (targetPlayer) {
        const blocks: string[] = [];
        if (targetPlayer.hasTerroristAbility) {
          blocks.push('قابلیت بمب‌گذاری تروریستی');
        }
        if (targetPlayer.identity === 'freemason') {
          blocks.push('شلیک شبانه لژ فراماسونری');
        }
        if (targetPlayer.role && targetPlayer.role !== 'none') {
          const roleName = ROLE_DETAILS[targetPlayer.role]?.nameFa || targetPlayer.role;
          blocks.push(`نقش فعال «${roleName}»`);
        }
        const desc = blocks.join(' و ') || 'هیچ نقش یا قابلیت خاصی (شهروند ساده)';
        onLogEvent(`کشیش در شب، تمام قابلیت‌ها و نقش بازیکن «${targetPlayer.name}» (شامل: ${desc}) را کاملاً مسدود کرد.`, 'block');
      }
    }

    // 2. Doctor Protect
    let protectedPlayerId = !isDoctorBlocked ? nightAction.doctorTargetId : null;
    if (doctorActive && protectedPlayerId) {
      if (isDoctorBlocked) {
        onLogEvent(`دکتر تلاش کرد بیماران خود را درمان کند، اما لایحه او توسط کشیش مسدود شد.`, 'block');
      } else {
        const savedPlayerIds = protectedPlayerId.split(',').filter(Boolean);
        savedPlayerIds.forEach((pId) => {
          const savedPlayer = players.find((p) => p.id === pId);
          if (savedPlayer) {
            onLogEvent(`دکتر شبانه بازیکن «${savedPlayer.name}» را پانسمان و بیمه درمانی کرد.`, 'protect');
          }
        });
      }
    }

    // Initialize list of attacked players
    const attacksMap = new Map<string, Array<'police' | 'mason' | 'terrorist'>>();
    const addAttack = (pId: string, type: 'police' | 'mason' | 'terrorist') => {
      if (!attacksMap.has(pId)) {
        attacksMap.set(pId, []);
      }
      attacksMap.get(pId)?.push(type);
    };

    let triggerTerroristCount = 0;
    let policeShotOccurred = false;

    // 3. Terrorist Action
    if (terroristActive && terroristShooterId) {
      const terroristPlayer = players.find((p) => p.id === terroristShooterId);
      if (terroristPlayer) {
        const isShooterBlocked = priestActive && nightAction.priestTargetPlayerId === terroristPlayer.id;
        if (nightAction.terroristTargetId) {
          terroristsUsed.push(terroristPlayer.id); // Add them to used list either way
          if (isShooterBlocked) {
            onLogEvent(`کشیش از عملیات انتحاری «${terroristPlayer.name}» ممانعت به عمل آورد! بمب منفجر نشد اما قابلیت تروریست دفع شد.`, 'block');
          } else {
            const targetPlayer = players.find((p) => p.id === nightAction.terroristTargetId);
            if (targetPlayer) {
              if (targetPlayer.isImprisoned) {
                onLogEvent(`انتحار بی‌ثمر در زندان! تروریست ${terroristPlayer.name} به سلول زندان هجوم برد اما ${targetPlayer.name} در امان ماند. تنها تروریست منفجر شد!`, 'kill');
                deaths.push(terroristPlayer.id);
                // Target is not attacked! Target lives!
              } else {
                onLogEvent(`انتحار تروریستی! بازیکن ${terroristPlayer.name} ضامن نارنجک خود را کشید و به همراه ${targetPlayer.name} منفجر شد!`, 'kill');
                addAttack(targetPlayer.id, 'terrorist');
                // Terrorist always dies!
                deaths.push(terroristPlayer.id);
              }
            }
          }
        }
      }
    }

    // 4. Police Action
    if (policeActive && nightAction.policeTargetId) {
      if (isPoliceBlocked) {
        onLogEvent(`شلیک پلیس توسط کشیش معلق شد.`, 'block');
      } else {
        const targetPlayer = players.find((p) => p.id === nightAction.policeTargetId);
        onLogEvent(`تک‌تیرانداز پلیس شبانه به سمت بازیکن «${targetPlayer?.name}» آتش گشود!`, 'kill');
        addAttack(nightAction.policeTargetId, 'police');
        policeShotOccurred = true;
      }
    }

    // 5. Detective Action
    if (detectiveActive && nightAction.detectiveTargetId) {
      if (isDetectiveBlocked) {
        onLogEvent(`حکم جلب کارآگاه توسط کشیش باطل شد.`, 'block');
      } else {
        const targetPlayer = players.find((p) => p.id === nightAction.detectiveTargetId);
        onLogEvent(`کارآگاه با پیدا کردن ادله کافی، بازیکن «${targetPlayer?.name}» را مستقیم به دادگاه فرستاد.`, 'ability');
        courtNominees.push(nightAction.detectiveTargetId);
      }
    }

    // 6. Freemason Action
    if (masonsActive && nightAction.masonTargetId) {
      if (isMasonBlocked) {
        onLogEvent(`کشیش توانست لژ فراماسونری را برای امشب مهرو‌موم و مسدود کند.`, 'block');
      } else {
        const targetPlayer = players.find((p) => p.id === nightAction.masonTargetId);
        const commanderName = activeMasonCommander ? ` به تصمیم ${activeMasonCommander.name}` : '';
        onLogEvent(`فراماسون‌ها${commanderName} در شب یک فنجان مرگ برای بازیکن «${targetPlayer?.name}» تدارک دیدند!`, 'kill');
        addAttack(nightAction.masonTargetId, 'mason');
      }
    }

    // 7. Reporter Action
    if (reporterActive && nightAction.reporterTargetId) {
      if (isReporterBlocked) {
        onLogEvent(`گزارشگر بایکوت خبری شد.`, 'block');
        reporterReport = 'تلاش شما برای رصد دیشب با سد سانسور روبه‌رو شد.';
      } else {
        const inspectPlayer = players.find((p) => p.id === nightAction.reporterTargetId);
        const reportText = `رصد گزارشگر با موفقیت انجام شد. رویدادهای رصد برای ${inspectPlayer?.name} گردآوری شد.`;
        reporterReport = reportText;
        onLogEvent(`گزارشگر فرآیند رصد فعالیت‌های شبانه بازیکن کریتیکال «${inspectPlayer?.name}» را تکمیل کرد.`, 'ability');
      }
    }

    // 8. Journalist Action
    if (journalistActive && nightAction.journalistTargetType) {
      if (isJournalistBlocked) {
        onLogEvent(`قلم خبرنگار توسط کشیش سانسور شد.`, 'block');
        journalistReport = 'گزارش سانسور شده است و هیچ خروجی هویتی یافت نشد.';
      } else {
        journalistReport = `بررسی خبرنگار درباره خارج‌شدگان فاز «${
          nightAction.journalistTargetType === 'night' ? 'شب جاری' : 'روز گذشته'
        }» با موفقیت ثبت شد.`;
        onLogEvent(`خبرنگار مشغول تفتیش و تهیه گزارش هویتی از خارج‌شدگان شد.`, 'ability');
      }
    }

    // --- RESOLVE ATTACKS & SHIELDS & SAVES ---
    attacksMap.forEach((attackTypes, attackerId) => {
      const victim = players.find((p) => p.id === attackerId);
      if (!victim) return;

      const isSaved = protectedPlayerId && protectedPlayerId.split(',').filter(Boolean).includes(victim.id);

      attackTypes.forEach((atkType) => {
        if (atkType === 'terrorist') {
          if (!deaths.includes(victim.id)) {
            deaths.push(victim.id);
          }
          return;
        }

        if (isSaved) {
          onLogEvent(`پزشک متعهد شهر با مهارت خود، ${victim.name} را از چنگال شلیک مرگبار ${atkType === 'police' ? 'پلیس' : 'ماسون‌ها'} رهانید.`, 'protect');
          return;
        }

        const hasShieldActive = victim.hasShield && !victim.shieldBroken;
        if (hasShieldActive) {
          shieldBreaks.push(victim.id);
          onLogEvent(`انفجار شلیک با اصابت به سپر رسمیِ بازیکن «${victim.name}» مهار شد و سپر شکست!`, 'protect');
          return;
        }

        if (!deaths.includes(victim.id)) {
          deaths.push(victim.id);
        }
      });
    });

    if (policeShotOccurred && nightAction.policeTargetId && !deaths.includes(nightAction.policeTargetId)) {
      policeShotOccurred = false;
    }

    // --- ACCRUE TERRORIST ABILITIES ---
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
          onLogEvent(`به واسطه وقایع شلیک، غبار ناامنی شهر را فرا گرفت و قابلیت تروریست تصادفی به بازیکن «${chosen.name}» واگذار شد.`, 'ability');
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

  // Pre-calculate Simulated Tonight Deaths for Journalist
  const simulateThisNightDeathsAndFactions = () => {
    const simulatedDeaths: string[] = [];
    
    const isBlockedSim = (role: string) => {
      if (!priestActive) return false;
      if (!nightAction.priestTargetPlayerId) return false;
      const targetPlayer = players.find(p => p.id === nightAction.priestTargetPlayerId);
      if (!targetPlayer) return false;

      if (role === 'terrorist') {
        return targetPlayer.hasTerroristAbility;
      }
      if (role === 'freemason') {
        return activeMasonCommander ? targetPlayer.id === activeMasonCommander.id : false;
      }
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
        if (!targetP.isImprisoned) {
            addSimAtk(targetP.id, 'terrorist');
        }
        simulatedDeaths.push(terrPlayer.id);
      }
    }

    if (policeActive && nightAction.policeTargetId && !isBlockedSim('police')) {
      addSimAtk(nightAction.policeTargetId, 'police');
    }

    if (masonsActive && nightAction.masonTargetId && !isBlockedSim('freemason')) {
      addSimAtk(nightAction.masonTargetId, 'mason');
    }

    attacks.forEach((atkTypes, victimId) => {
      const victim = players.find(v => v.id === victimId);
      if (!victim) return;

      const isSaved = protectedId && protectedId.split(',').filter(Boolean).includes(victimId);
      
      atkTypes.forEach((type) => {
        if (type === 'terrorist') {
          if (!simulatedDeaths.includes(victimId)) {
            simulatedDeaths.push(victimId);
          }
          return;
        }

        if (isSaved) return;

        const hasShield = victim.hasShield && !victim.shieldBroken;
        if (hasShield) return;

        if (!simulatedDeaths.includes(victimId)) {
          simulatedDeaths.push(victimId);
        }
      });
    });

    let masonsCount = 0;
    let citizensCount = 0;
    simulatedDeaths.forEach((id) => {
      const p = players.find(x => x.id === id);
      if (p) {
        if (p.identity === 'freemason') masonsCount++;
        else citizensCount++;
      }
    });

    return { masons: masonsCount, citizens: citizensCount, count: simulatedDeaths.length };
  };

  // Calculate Past Day's Deaths for Journalist
  const getPastDayDeathsAndFactions = () => {
    const dayDeadPlayers = players.filter(p => 
      !p.isAlive && 
      logs && logs.some(log => log.cycle === cycle && log.phase === 'day' && log.type === 'kill' && log.message.includes(p.name))
    );

    let masonsCount = 0;
    let citizensCount = 0;
    dayDeadPlayers.forEach((p) => {
      if (p.identity === 'freemason') masonsCount++;
      else citizensCount++;
    });

    return { masons: masonsCount, citizens: citizensCount, count: dayDeadPlayers.length };
  };

  const PlayerSelector = ({
    targetId,
    onChange,
    excludeId,
    includeImprisoned,
    excludeRoles,
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
              className={`py-2 px-3 rounded-lg text-xs font-semibold text-right transition border ${
                targetId === p.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              {p.name} {p.isImprisoned ? '(در زندان)' : ''}
            </button>
          ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl max-w-3xl w-full mx-auto text-right text-slate-200" dir="rtl">
      {/* Wizard Header */}
      <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-widest block mb-1">جادوگر هوشمند فاز شب</span>
          <h2 className="text-xl font-black text-white">ترتیب وقوع توانمندی‌های شبانه (فاز شب)</h2>
        </div>
        <div className="text-xs font-bold bg-slate-950 px-3 py-1 rounded-full text-slate-400">
          مرحله {step} (نقش فعال)
        </div>
      </div>

      {/* STEP 1: PRIEST */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Ban className="w-5 h-5 text-teal-400" />
                ۱. مختل‌سازی کشیش (کشیش)
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {players.filter(p => p.role === 'priest' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              کشیش بزرگ بیدار می‌شود. او می‌تواند قابلیت ۱ بازیکن فعال را برای امشب به طور کامل مسدود کند.
              در صورتی که بازیکن انتخاب شده نقش دار یا دارای قابلیت تروریستی یا فراماسونری باشد، آن مهار و مسدود می‌گردد.
            </p>
          </div>

          {priestActive ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                {players
                  .filter((p) => p.isAlive && !p.isImprisoned)
              .map((p) => {
                const isSelected = nightAction.priestTargetPlayerId === p.id;
                const isDisallowed = p.id === lastPriestBlockedId;
                
                // Get player active info
                const blocks: string[] = [];
                if (p.hasTerroristAbility) blocks.push('تروریسم');
                if (p.identity === 'freemason') blocks.push('لژ فراماسون');
                if (p.role && p.role !== 'none') {
                  blocks.push(ROLE_DETAILS[p.role]?.nameFa || p.role);
                }
                const pDesc = blocks.join(' + ') || 'شهروند ساده (بدون قابلیت)';

                return (
                  <button
                    key={p.id}
                    disabled={isDisallowed}
                    onClick={() => setNightAction({ 
                      ...nightAction, 
                      priestTargetPlayerId: p.id,
                      priestTargetRole: p.role !== 'none' ? p.role : (p.hasTerroristAbility ? 'terrorist' as any : (p.identity === 'freemason' ? 'freemason' as any : null))
                    })}
                    className={`p-3 rounded-xl text-xs font-black text-right transition border flex flex-col gap-1.5 items-start justify-between min-h-[68px] leading-normal ${
                      isSelected
                        ? 'bg-amber-600 text-slate-950 border-amber-400 shadow-md shadow-amber-600/15'
                        : isDisallowed
                        ? 'bg-slate-950/20 border-rose-900/30 text-rose-800/60 opacity-50 cursor-not-allowed'
                        : 'bg-slate-950/40 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="text-xs font-extrabold flex items-center justify-between w-full">
                      <span>{p.name} {p.role === 'priest' ? '(خود کشیش)' : ''}</span>
                      {isDisallowed && <Ban className="w-3 h-3 text-rose-500/50" />}
                    </span>
                    <span className={`text-[9px] font-bold ${isSelected ? 'text-slate-900' : isDisallowed ? 'text-rose-900/50' : 'text-slate-500'}`}>
                      {isDisallowed ? 'مسدود در شب قبل' : pDesc}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setNightAction({ ...nightAction, priestTargetPlayerId: null, priestTargetRole: null })}
                className={`p-3 rounded-xl text-xs font-black transition border flex flex-col items-start justify-center text-right leading-normal min-h-[68px] ${
                  nightAction.priestTargetPlayerId === null
                    ? 'bg-amber-600 text-slate-950 border-amber-400 font-extrabold'
                    : 'bg-slate-950/10 border-slate-900 text-slate-400'
                }`}
              >
                <span className="text-xs font-extrabold">بدون اقدام (انصراف)</span>
                <span className="text-[9px] text-slate-500">حفظ قابلیت‌ها</span>
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
            کشیش امشب در مجمع حضور ندارد یا زندانی است.<br/>برای ادامه، به مرحله بعدی بروید.
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
                ۲. تیمار اورژانسی پزشک (دکتر)
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {players.filter(p => p.role === 'doctor' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              دکتر شهر زنده و فعال گشته است. او می‌تواند جلیقه نجات را بر تن بیماران منتخب بگشاید. 
              پزشک قادر است همواره خودش را نیز نجات دهد.
            </p>

            {/* Rules showcase */}
            <div className="mt-3 bg-[#080d15] border border-slate-850 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-black text-amber-500 block">🩺 قوانین و ظرفیت رسمی درمان پزشک (بر اساس تعداد کل بازیکنان):</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-bold text-slate-400">
                <div className={`p-2 rounded-lg border transition ${players.length <= 10 ? 'bg-teal-950/25 border-teal-700/50 text-teal-300 shadow-md shadow-teal-950/20' : 'bg-slate-900/40 border-slate-800'}`}>
                  <span>کمتر از ۱۰ بازیکن:</span>
                  <span className="block text-xs font-black mt-1">۱ نفر درمان</span>
                  {players.length <= 10 && <span className="text-[9px] text-teal-400 block mt-0.5">● فعال برای مجمع فعلی</span>}
                </div>
                <div className={`p-2 rounded-lg border transition ${players.length >= 11 && players.length <= 20 ? 'bg-teal-950/25 border-teal-700/50 text-teal-300 shadow-md shadow-teal-950/20' : 'bg-slate-900/40 border-slate-800'}`}>
                  <span>بین ۱۱ تا ۲۰ بازیکن:</span>
                  <span className="block text-xs font-black mt-1">۲ نفر درمان</span>
                  {players.length >= 11 && players.length <= 20 && <span className="text-[9px] text-teal-400 block mt-0.5">● فعال برای مجمع فعلی</span>}
                </div>
                <div className={`p-2 rounded-lg border transition ${players.length >= 21 ? 'bg-teal-950/25 border-teal-700/50 text-teal-300 shadow-md shadow-teal-950/20' : 'bg-slate-900/40 border-slate-800'}`}>
                  <span>بیشتر از ۲۰ بازیکن:</span>
                  <span className="block text-xs font-black mt-1">۳ نفر درمان</span>
                  {players.length >= 21 && <span className="text-[9px] text-teal-400 block mt-0.5">● فعال برای مجمع فعلی</span>}
                </div>
              </div>
            </div>
          </div>

          {doctorActive ? (
            <>
              {showSecrets && isRoleBlocked('doctor') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>⚠️ توجه: طبق اسرار عیان، این بازیکن (پزشک) توسط کشیش مسدود شده است و انتخاب او هیچ اثری در روند زنده بازی نخواهد داشت.</span>
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
                        if (isSelected) {
                          nextIds = nextIds.filter((id) => id !== p.id);
                        } else {
                          const maxAllowed = getDoctorMaxTargets();
                          if (nextIds.length >= maxAllowed) {
                            alert(`⚠️ ظرفیت بیمارستانی پزشک پر گشته است! براساس تعداد کل بازیکنان مجمع شما مجاز به نجات حداکثر ${maxAllowed} نفر هستید.`);
                            return;
                          }
                          nextIds.push(p.id);
                        }
                        setNightAction({
                          ...nightAction,
                          doctorTargetId: nextIds.length > 0 ? nextIds.join(',') : null
                        });
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-extrabold text-right transition border flex items-center justify-between ${
                        isSelected
                          ? 'bg-teal-600 text-slate-950 border-teal-400 shadow-md shadow-teal-600/15'
                          : 'bg-slate-950/40 border-slate-800 text-slate-350 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <span>{p.name} {p.role === 'doctor' ? '(خودتان)' : ''}</span>
                      {isSelected ? (
                        <span className="text-[9px] bg-slate-950 p-1 py-0.5 rounded text-teal-400 font-black">انتخاب‌شده</span>
                      ) : (
                        <span className="text-[10px] text-slate-500">انتخاب</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {nightAction.doctorTargetId && (
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-3.5 rounded-xl text-xs font-semibold text-center mt-3 animate-fadeIn">
                  <span className="font-black block mb-1">بیماران معین‌شده امشب دکتر:</span>
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
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
              پزشک امشب در مجمع حضور ندارد یا زندانی است.<br/>برای ادامه، به مرحله بعدی بروید.
            </div>
          )}
        </div>
      )}

      {/* STEP 3: TERRORIST */}
      {step === 3 && (() => {
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  ۳. انتحار و فتنه تروریستی (تروریست‌های فعال)
                </h3>
                <span className="text-[10px] font-black bg-purple-900/30 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-900/40">
                  {players.filter(p => p.hasTerroristAbility && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                عملیات تروریستی! دارندگان بمب می‌توانند روی یک نفر مسلماً انتحار کنند. (هر دو حذف می‌شوند؛ نجات دکتر و سپر بی‌اثر است).<br/>
                <span className="text-rose-400/90 mt-1 block font-bold text-[10px]">- طول عمر: بمب‌ها ۱ شب و ۱ روز مهلت دارند. در صورتی که در طولِ شب توسط کشیش بن و خنثی شوند (در فرض اقدام)، می‌سوزند. چنانچه تا پایان مهلتِ مقرر انتحاری صورت نگیرد، ملغی می‌شوند.</span>
                <span className="text-amber-400/90 mt-1 block font-bold text-[10px]">- زندان: انتحار بر روی بازیکن زندانی بی‌اثر است و فقط تروریست از بازی حذف می‌شود!</span>
              </p>

              <div className="bg-purple-950/20 border border-purple-900/40 p-3 rounded-xl text-xs space-y-2">
                <span className="text-slate-400 text-[10px] block font-bold">تروریست‌های امشب با قابلیت بمب فعال:</span>
                {activeTerrorists.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeTerrorists.map(p => (
                      <span key={p.id} className="bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded-lg font-extrabold border border-purple-850/60">
                        💣 {p.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 font-black">هیچ تروریست فعالی امشب در مجمع وجود ندارد.</div>
                )}
              </div>
            </div>

            {terroristActive ? (
              <>
                {showSecrets && terroristShooterId && isPlayerBlocked(terroristShooterId) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                    <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>⚠️ توجه: طبق اسرار عیان، بازیکن تروریست منتخب ({players.find(x => x.id === terroristShooterId)?.name}) توسط کشیش مسدود شده است و انتخاب او هیچ اثری در روند زنده بازی نخواهد داشت.</span>
                  </div>
                )}
                {activeTerrorists.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                    <span className="text-xs font-black text-slate-300 block text-right">انتخاب تروریست فداکار (عامل امشب):</span>
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
                              isSelected
                                ? 'bg-purple-700 text-white border-purple-500 font-extrabold'
                                : 'bg-slate-900/50 border-slate-800 text-slate-350 hover:border-slate-800'
                            }`}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          setTerroristShooterId(null);
                          setNightAction({ ...nightAction, terroristTargetId: null });
                        }}
                        className={`p-2.5 rounded-lg text-xs font-bold border transition text-center ${
                          terroristShooterId === null
                            ? 'bg-slate-800 text-white border-slate-700'
                            : 'bg-slate-950/10 border-slate-900 text-slate-400'
                        }`}
                      >
                        بدون اقدام (انصراف)
                      </button>
                    </div>
                  </div>
                )}

                {terroristShooterId && (
                  <div className="space-y-3 mt-4 bg-slate-950/30 p-4 rounded-xl border border-slate-850">
                    <span className="text-xs font-black text-slate-300 block text-right">
                      انتخاب هدف تروریستی (هدف‌گذاری بمب انتحاری توسط بازیکن منتخب):
                    </span>
                    <PlayerSelector
                      targetId={nightAction.terroristTargetId}
                      onChange={(id) => setNightAction({ ...nightAction, terroristTargetId: id })}
                      excludeId={terroristShooterId || undefined}
                    />
                    {nightAction.terroristTargetId && (
                      <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                        هدف نشانه رفته تروریست: <span className="font-bold underline">{players.find(p => p.id === nightAction.terroristTargetId)?.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
                تروریست امشب در مجمع حضور ندارد یا بمب فعالی ندارد.<br/>برای ادامه، به مرحله بعدی بروید.
              </div>
            )}
          </div>
        );
      })()}

      {/* STEP 4: POLICE */}
      {step === 4 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Skull className="w-5 h-5 text-red-500" />
                ۴. شلیک مستقیم تفنگ پلیس (پلیس)
              </h3>
              <span className="text-[10px] font-black bg-red-900/30 text-red-400 px-2.5 py-0.5 rounded-full border border-red-900/40">
                {players.filter(p => p.role === 'police' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              پلیس شهر بیدار می‌شود تا شلیک شبانه خود را بر روی یک بازیکن با تایید گرداننده مستقر نماید.
            </p>
          </div>

          {policeActive ? (
            <>
              {showSecrets && isRoleBlocked('police') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>⚠️ توجه: طبق اسرار عیان، این بازیکن (پلیس) توسط کشیش مسدود شده است و انتخاب او هیچ اثری در روند زنده بازی نخواهد داشت.</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.policeTargetId}
                onChange={(id) => setNightAction({ ...nightAction, policeTargetId: id })}
              />

              {nightAction.policeTargetId && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                  مظنون نشانه رفته پلیس: <span className="font-bold underline">{players.find(p => p.id === nightAction.policeTargetId)?.name}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
              پلیس امشب در مجمع حضور ندارد یا زندانی است.<br/>برای ادامه، به مرحله بعدی بروید.
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
                ۵. حکم مستقیم جلب کارآگاه (کارآگاه)
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {players.filter(p => p.role === 'detective' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              کارآگاه اینک اسناد پرونده بازیکن مورد نظر را باطل کرده و او را بی‌واسطه به تالار دادگاه روانه می‌کند (به جز رئیس‌جمهور، قاضی و پاپ).
            </p>
          </div>

          {detectiveActive ? (
            <>
              {showSecrets && isRoleBlocked('detective') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>⚠️ توجه: طبق اسرار عیان، این بازیکن (کارآگاه) توسط کشیش مسدود شده است و انتخاب او هیچ اثری در روند زنده بازی نخواهد داشت.</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.detectiveTargetId}
                onChange={(id) => setNightAction({ ...nightAction, detectiveTargetId: id })}
                excludeRoles={['president', 'judge', 'pope']}
              />

              {nightAction.detectiveTargetId && (
                <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                  متهم اعزامی کارآگاه به دادگاه: <span className="font-bold underline">{players.find(p => p.id === nightAction.detectiveTargetId)?.name}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
              کارآگاه امشب در مجمع حضور ندارد، زندانی است یا امشب شب استعلام نیست (فعالیت یک شب در میان).<br/>برای ادامه، به مرحله بعدی بروید.
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
                ۶. تصمیم شلیک نهایی لژ مخفی (فراماسون‌ها)
              </h3>
              <span className="text-[10px] font-black bg-rose-900/30 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-900/40">
                {players.filter(p => p.identity === 'freemason' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            
            {/* Added: Mason Information */}
            {(() => {
              const activeMasons = players.filter(p => p.identity === 'freemason' && p.isAlive && !p.isImprisoned);
              const imprisonedMasons = players.filter(p => p.identity === 'freemason' && p.isAlive && p.isImprisoned);
              const smallestMason = activeMasons.length > 0 ? activeMasons.reduce((prev, current) => (prev.masonNumber < current.masonNumber ? prev : current)) : null;
              
              return (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <div className="bg-rose-900/10 border border-rose-500/20 p-2.5 rounded-lg text-rose-200 font-bold">
                    فراماسون مسئول شلیک (کوچکترین شماره فعال): <span className="font-black text-rose-300">{smallestMason ? `${smallestMason.name} (شماره ${smallestMason.masonNumber})` : 'هیچ‌کس'}</span>
                  </div>
                  <div className="text-slate-400 font-semibold">فعال: {activeMasons.length > 0 ? activeMasons.map(m => `${m.name} (${m.masonNumber})`).join('، ') : 'کسی در لژ فعال نیست'}</div>
                  {imprisonedMasons.length > 0 && (
                    <div className="text-rose-400 font-semibold">زندانی (بیدار نمی‌شوند): {imprisonedMasons.map(m => m.name).join('، ')}</div>
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
                  <span>⚠️ توجه: اعضای لژ توسط کشیش مسدود شده‌اند. شلیک آن‌ها اثری نخواهد داشت اما اقدام آنان در سامانه ثبت می‌گردد.</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.masonTargetId}
                onChange={(id) => setNightAction({ ...nightAction, masonTargetId: id })}
              />

              {nightAction.masonTargetId && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 animate-fadeIn">
                  هدف نهایی شلیک فراماسون‌ها: <span className="font-bold underline">{players.find(p => p.id === nightAction.masonTargetId)?.name}</span>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
              هیچ فراماسون زنده یا فعالی در صحنه حضور ندارد که شلیک کند.<br/>برای ادامه، به مرحله بعدی بروید.
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
                ۷. ردیابی دوربین‌های زنده گزارشگر (گزارشگر)
              </h3>
              <span className="text-[10px] font-black bg-teal-900/30 text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-900/40">
                {players.filter(p => p.role === 'reporter' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              گزارشگر بیدار می‌شود تا با قرار دادن دوربین مخفی روی یکی از اعضا، رویدادهایی که امشب بر او گذشته است را رصد کند.
            </p>
          </div>

          {reporterActive ? (
            <>
              {showSecrets && isRoleBlocked('reporter') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>⚠️ توجه: طبق اسرار عیان، این بازیکن (گزارشگر) توسط کشیش مسدود شده است و انتخاب او هیچ اثری در روند زنده بازی نخواهد داشت.</span>
                </div>
              )}
              <PlayerSelector
                targetId={nightAction.reporterTargetId}
                onChange={(id) => setNightAction({ ...nightAction, reporterTargetId: id })}
              />

              {nightAction.reporterTargetId && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs space-y-2 mt-4 text-right animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-extrabold text-white mb-2 pb-1 border-b border-emerald-950">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>رصد زنده گزارشگر بابت رویدادهای فاز شبِ «{players.find(p => p.id === nightAction.reporterTargetId)?.name}»:</span>
                  </div>
                  <div className="space-y-1 text-slate-300 font-bold">
                    {(() => {
                      const target = players.find(p => p.id === nightAction.reporterTargetId);
                      if (!target) return null;

                      const isReporterBlockedCurrent = isRoleBlocked('reporter');
                      if (isReporterBlockedCurrent && !showSecrets) {
                        return (
                          <div className="bg-amber-950/40 border border-amber-900/40 p-3 rounded-lg text-amber-300 text-xs text-center font-black leading-relaxed shrink-0 mb-2">
                             ⚠️ توجه: این بازیکن (گزارشگر) بن شده است و در نمای عمومی باید به بازیکن اطلاع داده شود:<br />
                            <span className="text-white text-sm block mt-1.5 underline underline-offset-4 font-extrabold pb-1">«در شب گذشته برای او هیچ اتفاقی نیفتاده است»</span>
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
                        if (role === 'freemason') {
                          return activeMasonCommander ? p.id === activeMasonCommander.id : false;
                        }
                        return p.role === role;
                      };

                      // Priest block
                      const isBlockedVal = priestActive && nightAction.priestTargetPlayerId === target.id;
                      if (isBlockedVal) {
                        events.push(`🚫 این بازیکن توسط کشیش مجمع مسدود شده است.`);
                      }

                      // Doctor save
                      const isSaved = doctorActive && nightAction.doctorTargetId?.split(',').filter(Boolean).includes(target.id) && !checkSimBlocked('doctor');
                      if (isSaved) {
                        events.push("🩺 پزشک متعهد شهر از این بازیکن محافظت و او را پانسمان کرده است.");
                      }

                      // Terrorist target
                      const isTerrorTarget = terroristActive && nightAction.terroristTargetId === target.id && !checkSimBlocked('terrorist');
                      if (isTerrorTarget) {
                        events.push("💣 بازیکن مورد هدف مستقیم بمب انتحاری تروریست قرار گرفته است.");
                      }

                      // Police shot
                      const isPoliceTarget = policeActive && nightAction.policeTargetId === target.id && !checkSimBlocked('police');
                      if (isPoliceTarget) {
                        events.push("🔫 پلیس شهر شبانه به سمت این بازیکن شلیک مستقیم کرده است.");
                      }

                      // Detective target
                      const isDetTarget = detectiveActive && nightAction.detectiveTargetId === target.id && !checkSimBlocked('detective');
                      if (isDetTarget) {
                        events.push("⚖️ پرونده قضایی مخفیانه توسط کارآگاه تشکیل شده و بازیکن مستقیم به دادگاه فرستاده شد.");
                      }

                      // Mason target
                      const isMasonTarget = masonsActive && nightAction.masonTargetId === target.id && !checkSimBlocked('freemason');
                      if (isMasonTarget) {
                        events.push("🌹 بازیکن با تصمیم مخفیانه لژ فراماسونری به نوشیدن فنجان زهرآگین مرگ مجمع دعوت شد.");
                      }

                      if (events.length === 0) {
                        events.push("امشب هیچ اقدام مستقیم یا سوءقصدی بر سر این بازیکن حادث نگردید و شب آرامی سپری شد.");
                      }

                      return (
                        <ul className="list-disc list-inside space-y-1.5">
                          {events.map((ev, idx) => (
                            <li key={idx} className="text-slate-200">{ev}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
              گزارشگر امشب در مجمع فعال نیست.<br/>برای ادامه، به مرحله بعدی بروید.
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
                ۸. استعلام حقیقت روزنامه (خبرنگار)
              </h3>
              <span className="text-[10px] font-black bg-amber-900/30 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-900/40">
                {players.filter(p => p.role === 'journalist' && p.isAlive && !p.isImprisoned).map(p => p.name).join('، ') || 'نامشخص'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              خبرنگار (آخرین نقشی که بیدار می‌شود) بیدار گشته و مطلع می‌شود چه هویت‌هایی در فازهای اخیر خارج شده‌اند. بازه زمانی بازرسی را معین کنید.
            </p>
          </div>

          {journalistActive ? (
            <>
              {isRoleBlocked('journalist') && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 animate-fadeIn">
                  <Ban className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>⚠️ توجه: طبق اسرار عیان، این بازیکن (خبرنگار) توسط کشیش مسدود شده است و انتخاب او هیچ اثری در روند زنده بازی نخواهد داشت.</span>
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
                  کشته‌شدگان همین شب جاری
                </button>
                <button
                  onClick={() => setNightAction({ ...nightAction, journalistTargetType: 'day' })}
                  className={`py-3 px-6 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    nightAction.journalistTargetType === 'day'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg font-black'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  کشته‌شدگان روز گذشته
                </button>
              </div>

              {nightAction.journalistTargetType && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-xs space-y-2 mt-4 text-right animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-extrabold text-white mb-2 pb-1 border-b border-amber-955">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>جمع‌بندی نهایی استعلام خبرنگار (مخصوص ابلاغ به گرداننده):</span>
                  </div>
                  
                  {(() => {
                    const report = nightAction.journalistTargetType === 'night' 
                      ? simulateThisNightDeathsAndFactions() 
                      : getPastDayDeathsAndFactions();

                    return (
                      <div className="space-y-4 text-slate-300 font-bold">
                        <p className="text-slate-100 font-sans">
                          بازه زمانی رصد: <span className="text-amber-400 underline">{nightAction.journalistTargetType === 'night' ? 'کشته‌شدگان همین فاز شب' : 'خارج‌شدگان فاز روز گذشته'}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-900 font-sans">
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40 rounded border border-slate-800 font-mono">
                            <span className="text-slate-400 text-[10px] mb-1 font-sans">تعداد شهروندان خارج شده:</span>
                            <span className="text-sky-400 text-lg font-black">{report.citizens} نفر</span>
                          </div>
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-900/40 rounded border border-slate-800 font-mono">
                            <span className="text-slate-400 text-[10px] mb-1 font-sans">تعداد فراماسون‌های خارج شده:</span>
                            <span className="text-rose-400 text-lg font-black">{report.masons} نفر</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 text-center font-semibold font-sans">
                          گرداننده موظف است نتایج جدول فوق را به عنوان فکت رسمی گزارش خبرنگار، مستقیماً به وی اعلام نماید.
                        </p>
                      </div>
                    );
              })()}
            </div>
          )}
            </>
          ) : (
            <div className="mt-4 p-4 text-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold leading-relaxed">
              خبرنگار امشب در مجمع حضور ندارد یا زندانی است.<br/>برای پایان فاز شب، ادامه دهید.
            </div>
          )}
        </div>
      )}

      {/* Wizard Footer Actions */}
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
          <ArrowRight className="w-4 h-4" />
          مقر قبل
        </button>

        <button
          onClick={handleNextStep}
          className="bg-teal-600 hover:bg-teal-700 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          {step === getLastEnabledStep()
            ? 'پایان رِفرِش شبانه و بررسی فاکتور مرگ'
            : 'توانمندی بعدی'}
          {step === getLastEnabledStep() ? <Play className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Night Action Guide Panel */}
      <div className="mt-8 bg-[#070b13] border border-slate-850 rounded-xl p-4">
        <h4 className="font-black text-slate-400 mb-3 border-b border-slate-850 pb-2 flex items-center gap-1.5 justify-start text-xs">
          <Eye className="w-4 h-4 text-teal-400" />
          <span>لیست ترتیبی اقدامات و بیدارباش فاز شب (مرجع سریع گرداننده):</span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-400 font-semibold leading-normal font-sans">
          <div className={`p-2 rounded border transition-all ${isStepEnabled(1) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(1) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۱. کشیش (مسدودساز) {isStepRemovedByPopulation(1) ? ' (حذف متغیر)' : ''}
            </span>
            ابطال توانایی یک نقش برای امشب
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(2) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(2) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۲. دکتر (پزشک نجات)
            </span>
            پوشاندن جلیقه نجات بر تن متهم
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(3) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(3) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۳. تروریست (انتحار)
            </span>
            کشیدن ضامن بمب بر بازیکن هدف
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(4) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(4) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۴. پلیس (تک تیرانداز) {isStepRemovedByPopulation(4) ? ' (حذف متغیر)' : ''}
            </span>
            آتش مستقیم به مظنون (کسب تروریست)
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(5) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(5) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۵. کارآگاه (جلب)
            </span>
            ارسال مستقیم متهم بومی به دادگاه
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(6) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(6) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۶. فراماسون (شلیک لژ)
            </span>
            فنجان زهرآگین مقتدر مجمع
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(7) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(7) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۷. گزارشگر (رصد زنده)
            </span>
            ردیابی اتفاقات رخ داده بر یک بازیکن
          </div>
          <div className={`p-2 rounded border transition-all ${isStepEnabled(8) ? 'bg-slate-900/40 border-slate-800 text-slate-350 shadow-sm' : 'bg-slate-950 border-slate-900/10 text-slate-600 line-through opacity-45 border-dashed border-slate-900'}`}>
            <span className={`${isStepEnabled(8) ? 'text-teal-400 font-extrabold' : 'text-slate-600'} block mb-0.5`}>
              ۸. خبرنگار (آماری)
            </span>
            فراوانی جناح خارج‌شدگان روز یا شب
          </div>
        </div>
      </div>
    </div>
  );
}
