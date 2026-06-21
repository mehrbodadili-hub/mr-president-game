/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Player, RoleType } from '../types';
import { useTranslation } from 'react-i18next';
import { calculateMasonCount } from '../utils';
import { User, Volume2, ShieldCheck, Scale, Award, ArrowLeft, ArrowRight, Check, Eye, EyeOff, ThumbsDown, Skull } from 'lucide-react';
import { CollapsibleGuide } from './CollapsibleGuide';

interface Day0SetupProps {
  players: Player[];
  showSecrets: boolean;
  onSetRole: (id: string, role: RoleType) => void;
  onLogEvent: (message: string, type: 'info' | 'vote' | 'system') => void;
  onCompleteDay0: (speakerId: string, popeVeto?: boolean) => void;
  onUpdatePlayers: (players: Player[]) => void;
}

export default function Day0Setup({
  players,
  showSecrets,
  onSetRole,
  onLogEvent,
  onCompleteDay0,
  onUpdatePlayers,
}: Day0SetupProps) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const lastStep = players.length === 8 ? 8 : 9;
  const [revealedPlayerId, setRevealedPlayerId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [speakerId, setSpeakerId] = useState<string>('');
  
  // Initialize state variables from existing player assignments
  const [popeId, setPopeId] = useState<string>(() => players.find(p => p.role === 'pope')?.id || '');
  const [priestId, setPriestId] = useState<string>(() => players.find(p => p.role === 'priest')?.id || '');
  const [presidentId, setPresidentId] = useState<string>(() => players.find(p => p.role === 'president')?.id || '');
  const [viceId, setViceId] = useState<string>(() => players.find(p => p.role === 'vice_president')?.id || '');
  const [mayorId, setMayorId] = useState<string>(() => players.find(p => p.role === 'mayor')?.id || '');
  const [judgeId, setJudgeId] = useState<string>(() => players.find(p => p.role === 'judge')?.id || '');
  
  const [reporterId, setReporterId] = useState<string>(() => players.find(p => p.role === 'reporter')?.id || '');
  const [journalistId, setJournalistId] = useState<string>(() => players.find(p => p.role === 'journalist')?.id || '');
  const [doctorId, setDoctorId] = useState<string>(() => players.find(p => p.role === 'doctor')?.id || '');
  const [policeId, setPoliceId] = useState<string>(() => players.find(p => p.role === 'police')?.id || '');
  const [detectiveId, setDetectiveId] = useState<string>(() => players.find(p => p.role === 'detective')?.id || '');
  const [lawyerId, setLawyerId] = useState<string>(() => players.find(p => p.role === 'lawyer')?.id || '');
  
  const [popeVetoed, setPopeVetoed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setDay0Step = (s: number) => {
        setStep(s);
      };
      return () => {
        delete (window as any).setDay0Step;
      };
    }
  }, []);

  useEffect(() => {
    setPopeId(players.find(p => p.role === 'pope')?.id || '');
    setPriestId(players.find(p => p.role === 'priest')?.id || '');
    setPresidentId(players.find(p => p.role === 'president')?.id || '');
    setViceId(players.find(p => p.role === 'vice_president')?.id || '');
    setMayorId(players.find(p => p.role === 'mayor')?.id || '');
    setJudgeId(players.find(p => p.role === 'judge')?.id || '');
    
    setReporterId(players.find(p => p.role === 'reporter')?.id || '');
    setJournalistId(players.find(p => p.role === 'journalist')?.id || '');
    setDoctorId(players.find(p => p.role === 'doctor')?.id || '');
    setPoliceId(players.find(p => p.role === 'police')?.id || '');
    setDetectiveId(players.find(p => p.role === 'detective')?.id || '');
    setLawyerId(players.find(p => p.role === 'lawyer')?.id || '');

    if (players.length > 0 && !speakerId) {
      // Intentionally do not auto-select first player
    }
  }, [players]);

  // Find a random player for speech starter
  const handleRandomSpeaker = () => {
    const randomIdx = Math.floor(Math.random() * players.length);
    const selectedPlayer = players[randomIdx];
    setSpeakerId(selectedPlayer.id);
    onLogEvent(t('day0.logs.randomSpeaker', { name: selectedPlayer.name }), 'info');
  };

  const handleToggleIdentity = (playerId: string) => {
    const updatedPlayers = [...players];
    const playerIndex = updatedPlayers.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const p = updatedPlayers[playerIndex];
    const isMason = p.identity === 'freemason';
    
    if (isMason) {
      const removedNumber = p.masonNumber;
      updatedPlayers[playerIndex] = { ...p, identity: 'citizen', masonNumber: 0 };
      for (let i = 0; i < updatedPlayers.length; i++) {
        if (updatedPlayers[i].identity === 'freemason' && (updatedPlayers[i].masonNumber || 0) > (removedNumber || 0)) {
          updatedPlayers[i] = { ...updatedPlayers[i], masonNumber: (updatedPlayers[i].masonNumber || 0) - 1 };
        }
      }
    } else {
      const currentMasonsCount = updatedPlayers.filter(x => x.identity === 'freemason').length;
      updatedPlayers[playerIndex] = { ...p, identity: 'freemason', masonNumber: currentMasonsCount + 1 };
    }

    onUpdatePlayers(updatedPlayers);
    onLogEvent(t('day0.logs.manualMasons'), 'system');
  };

  const handleSetMasonOrder = (playerId: string, newNumber: number) => {
    const p = players.find(x => x.id === playerId);
    if (!p || p.identity !== 'freemason') return;
    const oldNumber = p.masonNumber || 0;
    if (oldNumber === newNumber) return;

    const targetPlayer = players.find(x => x.identity === 'freemason' && x.masonNumber === newNumber);

    const updated = players.map(x => {
      if (x.id === playerId) return { ...x, masonNumber: newNumber };
      if (targetPlayer && x.id === targetPlayer.id) return { ...x, masonNumber: oldNumber };
      return x;
    });
    onUpdatePlayers(updated);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!showSecrets && checkedIds.size < players.length) {
        if (!confirm(t('day0.alerts.notAllChecked'))) {
          return;
        }
      }
      
      const requiredMasons = calculateMasonCount(players.length);
      const currentMasons = players.filter(p => p.identity === 'freemason').length;
      if (currentMasons !== requiredMasons) {
        alert(t('day0.alerts.masonRatio', { players: players.length, required: requiredMasons, current: currentMasons }));
        return;
      }
    }
    if (step === 2 && !speakerId) {
      alert(t('day0.alerts.selectSpeaker'));
      return;
    }
    if (step === 3 && !popeId) {
      alert(t('day0.alerts.selectPope'));
      return;
    }
    // Step 4 (Priest) is now optional
    
    if (step === 5 && !presidentId) {
      alert(t('day0.alerts.selectPresident'));
      return;
    }

    if (step === 6) {
      const requiresVice = players.length >= 10;
      if ((requiresVice && !viceId) || !mayorId || !judgeId) {
        alert(
          requiresVice
            ? t('day0.alerts.cabinetVice')
            : t('day0.alerts.cabinetNoVice')
        );
        return;
      }
    }

    // Step 7 (Reporter, Journalist) is now optional
    // Step 8 (Doctor, Police, Detective) is now optional

    if (step === lastStep) {
      // Final confirmation
      const viceName = players.find(p => p.id === viceId)?.name || '';
      const mayorName = players.find(p => p.id === mayorId)?.name || '';
      const judgeName = players.find(p => p.id === judgeId)?.name || '';
      const presName = players.find(p => p.id === presidentId)?.name || '';
      onLogEvent(`کشور در روز صفر با حاکمیت جدید تشکیل شد. رئیس‌جمهور: ${presName}، ${players.length >= 10 ? `معاون: ${viceName}، ` : ''}شهردار: ${mayorName}، قاضی: ${judgeName}.`, 'system');

      const reporterName = players.find(p => p.id === reporterId)?.name || '';
      const journalistName = players.find(p => p.id === journalistId)?.name || '';
      const doctorName = players.find(p => p.id === doctorId)?.name || '';
      const policeName = players.find(p => p.id === policeId)?.name || '';
      const detectiveName = players.find(p => p.id === detectiveId)?.name || '';
      const lawyerName = players.find(p => p.id === lawyerId)?.name || '';

      const viceSub = [
        reporterName ? `گزارشگر (${reporterName})` : '',
        journalistName ? `خبرنگار (${journalistName})` : ''
      ].filter(Boolean).join('، ');
      if (viceSub) {
        onLogEvent(
          players.length >= 10 
            ? `زیرگروه معاون اول: ${viceSub}` 
            : `زیرگروه رئیس‌جمهور: ${viceSub}`, 
          'system'
        );
      }

      const mayorSub = [
        doctorName ? `دکتر (${doctorName})` : '',
        policeName ? `پلیس (${policeName})` : '',
        detectiveName ? `کارآگاه (${detectiveName})` : ''
      ].filter(Boolean).join('، ');
      if (mayorSub) onLogEvent(`زیرگروه شهردار: ${mayorSub}`, 'system');

      if (lawyerName && lastStep === 9) onLogEvent(`زیرگروه قاضی ارشد: وکیل (${lawyerName})`, 'system');

      onCompleteDay0(speakerId, popeVetoed);
      return;
    }

    let nextStep = step + 1;
    if (nextStep === 4 && players.length < 10) {
      nextStep = 5;
    }
    setStep(nextStep);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      let prevStep = step - 1;
      if (prevStep === 4 && players.length < 10) {
        prevStep = 3;
      }
      setStep(prevStep);
    }
  };

  // Helper selectors
  const handleSelectSpeaker = (id: string) => {
    setSpeakerId(id);
    onLogEvent(`سخنران اصلی روز صفر به ${players.find(p => p.id === id)?.name} واگذار شد.`, 'info');
  };

  const handleSelectPope = (id: string) => {
    // Reset previous pope if any
    const oldPope = players.find(p => p.role === 'pope');
    if (oldPope) onSetRole(oldPope.id, 'none');

    setPopeId(id);
    onSetRole(id, 'pope');
    onLogEvent(`${players.find(p => p.id === id)?.name} با کسب حداکثر آرا به عنوان «پاپ مقتدر» انتخاب شد.`, 'vote');
  };

  const handleSelectPriest = (id: string) => {
    const oldPriest = players.find(p => p.role === 'priest');
    if (oldPriest) onSetRole(oldPriest.id, 'none');

    setPriestId(id);
    if (id) {
      onSetRole(id, 'priest');
      onLogEvent(`پاپ بزرگ، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «کشیش» منصوب کرد.`, 'system');
    }
  };

  const handleSelectPresident = (id: string) => {
    const oldPres = players.find(p => p.role === 'president');
    if (oldPres) onSetRole(oldPres.id, 'none');

    setPresidentId(id);
    onSetRole(id, 'president');
    onLogEvent(`با شمارش آرای ملی، ${players.find(p => p.id === id)?.name} کرسی «ریاست جمهوری» را تکیه زد.`, 'vote');
  };

  const handleSelectVice = (id: string) => {
    const oldVice = players.find(p => p.role === 'vice_president');
    if (oldVice) onSetRole(oldVice.id, 'none');

    setViceId(id);
    onSetRole(id, 'vice_president');
  };

  const handleSelectMayor = (id: string) => {
    const oldMayor = players.find(p => p.role === 'mayor');
    if (oldMayor) onSetRole(oldMayor.id, 'none');

    setMayorId(id);
    onSetRole(id, 'mayor');
  };

  const handleSelectJudge = (id: string) => {
    const oldJudge = players.find(p => p.role === 'judge');
    if (oldJudge) onSetRole(oldJudge.id, 'none');

    setJudgeId(id);
    onSetRole(id, 'judge');
  };

  const handleSelectReporter = (id: string) => {
    const oldRep = players.find(p => p.role === 'reporter');
    if (oldRep) onSetRole(oldRep.id, 'none');

    setReporterId(id);
    if (id) {
      onSetRole(id, 'reporter');
      const assigner = players.length >= 10 ? 'معاون رئیس‌جمهور' : 'رئیس‌جمهور';
      onLogEvent(`${assigner}، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «گزارشگر» منصوب کرد.`, 'system');
    }
  };

  const handleSelectJournalist = (id: string) => {
    const oldJour = players.find(p => p.role === 'journalist');
    if (oldJour) onSetRole(oldJour.id, 'none');

    setJournalistId(id);
    if (id) {
      onSetRole(id, 'journalist');
      const assigner = players.length >= 10 ? 'معاون رئیس‌جمهور' : 'رئیس‌جمهور';
      onLogEvent(`${assigner}، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «خبرنگار» منصوب کرد.`, 'system');
    }
  };

  const handleSelectDoctor = (id: string) => {
    const oldDoc = players.find(p => p.role === 'doctor');
    if (oldDoc) onSetRole(oldDoc.id, 'none');

    setDoctorId(id);
    if (id) {
      onSetRole(id, 'doctor');
      onLogEvent(`شهردار فعال، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «دکتر» منصوب کرد.`, 'system');
    }
  };

  const handleSelectPolice = (id: string) => {
    const oldPol = players.find(p => p.role === 'police');
    if (oldPol) onSetRole(oldPol.id, 'none');

    setPoliceId(id);
    if (id) {
      onSetRole(id, 'police');
      onLogEvent(`شهردار فعال، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «پلیس» منصوب کرد.`, 'system');
    }
  };

  const handleSelectDetective = (id: string) => {
    const oldDet = players.find(p => p.role === 'detective');
    if (oldDet) onSetRole(oldDet.id, 'none');

    setDetectiveId(id);
    if (id) {
      onSetRole(id, 'detective');
      onLogEvent(`شهردار فعال، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «کارآگاه» منصوب کرد.`, 'system');
    }
  };

  const handleSelectLawyer = (id: string) => {
    const oldLaw = players.find(p => p.role === 'lawyer');
    if (oldLaw) onSetRole(oldLaw.id, 'none');

    setLawyerId(id);
    if (id) {
      onSetRole(id, 'lawyer');
      onLogEvent(`قاضی مقتدر، بازیکن ${players.find(p => p.id === id)?.name} را به عنوان «وکیل مدافع» منصوب کرد.`, 'system');
    }
  };

  const currentSpeaker = players.find(p => p.id === speakerId);
  const currentPope = players.find(p => p.id === popeId);
  const currentPriest = players.find(p => p.id === priestId);
  const currentPresident = players.find(p => p.id === presidentId);

  const renderSecretsLabel = (p: Player) => {
    if (!showSecrets) return null;
    const isMason = p.identity === 'freemason';
    const roleText = p.role !== 'none' ? ` / ${t(`roles.${p.role}.name`)}` : '';
    const label = isMason ? t('day0.secrets.freemasonShort', { n: p.masonNumber }) : t('day0.secrets.citizenShort');
    return (
      <span className={`text-[10px] font-bold ${isMason ? 'text-rose-400' : 'text-sky-400'}`}>
        ({label}{roleText})
      </span>
    );
  };

  const getSecretsOptionLabel = (p: Player) => {
    if (!showSecrets) return '';
    const isMason = p.identity === 'freemason';
    const roleText = p.role !== 'none' ? ` / ${t(`roles.${p.role}.name`)}` : '';
    const label = isMason ? t('day0.secrets.freemasonShort', { n: p.masonNumber }) : t('day0.secrets.citizenShort');
    return ` (${label}${roleText})`;
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl max-w-3xl w-full mx-auto text-right text-slate-200" dir="rtl">
      {/* Step Header */}
      <div className="mb-6 border-b border-slate-800 pb-4 flex flex-col items-center md:items-start text-center md:text-right">
        <span className="text-sm font-bold text-amber-500 uppercase tracking-widest block mb-2">گام {step} از ۹ فاز آغازین</span>
        <h2 className="text-2xl font-black text-white leading-tight">ترتیبات قانونی مجمع روز صفر</h2>
      </div>

      {/* Step Contents */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-amber-500 animate-pulse" />
              ۱. خوانش محرمانه هویت‌های پنهان مجمع
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              گرداننده موظف است بازیکنان را به ترتیب یا تک‌به‌تک صدا کرده و با کلیک روی دکمه مخصوص، هویت مخفی آنها را در خلوت به ایشان نشان دهد. دکمه را دوباره فشار دهید یا رها کنید تا کارت سریعاً مخفی شود.
            </p>
          </div>

          {/* Moderator manual Freemason toggler panel */}
          {showSecrets && (
            <div className="bg-rose-950/15 border border-rose-900/30 p-3.5 rounded-xl text-xs space-y-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <span className="font-extrabold text-rose-400 block text-right">⛪ پنل هدایت لژ فراماسونری (مختص گرداننده)</span>
                  <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                    حد نصاب ۲۹٪ مجمع برابر با <strong className="text-rose-420 font-bold">{calculateMasonCount(players.length)} فراماسون</strong> است. مابقی اعضا شهروند خواهند بود.
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-rose-950 border border-rose-900/50 px-2 py-1 rounded text-rose-300">
                  فراماسون‌های فعلی مجمع: {players.filter(p => p.identity === 'freemason').length} نفر
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {players.map((p) => {
              const isRevealed = revealedPlayerId === p.id || showSecrets;
              const isChecked = checkedIds.has(p.id) || showSecrets;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border transition duration-200 text-center flex flex-col justify-between items-center gap-2.5 ${
                    isRevealed
                      ? p.identity === 'freemason'
                        ? 'bg-rose-950/25 border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                        : 'bg-sky-950/25 border-sky-500/80 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                      : isChecked
                      ? 'bg-[#0b0f19] border-slate-800 opacity-75'
                      : 'bg-slate-950/40 border-slate-850 hover:border-slate-750'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-200 block mb-1">{p.name}</span>
                    {isChecked && !isRevealed && (
                      <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/20 transition">
                        ✓ خوانده شد
                      </span>
                    )}
                  </div>

                  {isRevealed ? (
                    <div className="w-full">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 mb-2 animate-fadeIn py-1.5">
                        {p.identity === 'freemason' ? (
                          <div>
                            <span className="text-xs font-black text-rose-400 block">◄ فراماسون ►</span>
                            {showSecrets ? (
                              <div className="mt-1 flex items-center justify-center gap-1">
                                <span className="text-[9px] text-rose-300">جایگاه:</span>
                                <select 
                                  value={p.masonNumber} 
                                  onChange={(e) => handleSetMasonOrder(p.id, parseInt(e.target.value))}
                                  className="bg-[#0b0f19] border border-rose-900 text-rose-300 text-[10px] rounded focus:outline-none p-0.5"
                                >
                                  {Array.from({length: players.filter(pl => pl.identity === 'freemason').length}).map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-300 block font-mono">شماره {p.masonNumber}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-black text-sky-400 block">◄ شهروند ►</span>
                        )}
                      </div>
                      {!showSecrets && (
                        <button
                          onClick={() => setRevealedPlayerId(null)}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] py-1 rounded font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <EyeOff className="w-3 h-3 text-slate-300" />
                          پنهان کردن
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setRevealedPlayerId(p.id);
                        setCheckedIds((prev) => {
                          const next = new Set(prev);
                          next.add(p.id);
                          return next;
                        });
                      }}
                      className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] py-1.5 rounded font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-500" />
                      رویت هویت
                    </button>
                  )}

                  {/* Manual Identity Assignment Control */}
                  {showSecrets && (
                    <button
                      onClick={() => handleToggleIdentity(p.id)}
                      className={`w-full mt-1 border text-[9px] py-1 rounded font-black transition cursor-pointer flex items-center justify-center gap-0.5 ${
                        p.identity === 'freemason'
                          ? 'bg-rose-950/40 border-rose-805/50 text-rose-400 hover:bg-rose-900/40'
                          : 'bg-sky-950/40 border-sky-805/50 text-sky-400 hover:bg-sky-900/40'
                      }`}
                    >
                      {p.identity === 'freemason' ? '⛪ عزل از لژ' : '👤 عضویت لژ'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#050810] p-3 rounded-lg border border-slate-850 text-center text-xs">
            بررسی هویت‌ها: <span className="text-amber-400 font-bold font-mono">{checkedIds.size}</span> از <span className="text-slate-300 font-bold font-mono">{players.length}</span> بازیکن
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Volume2 className="w-5 h-5 text-amber-500" />
              ۱. غائله نوبت صحبـت (سر صحبت)
            </h3>
            <div className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <p>
                در ابتدای روز اول بازی، هر یک از بازیکنان به نوبت در چالش‌های گفتگوی روز صفر شرکت می‌کنند. 
                شما می‌توانید شخص مورد نظر را به عنوان شروع‌کننده (سر صحبت) انتخاب کرده یا اجازه دهید سیستم به صورت کاملاً تصادفی نفر اول را مشخص کند.
              </p>

              <CollapsibleGuide title="راهنمای فاز گفتگو و انتخاب مقامات" defaultOpen={false}>
                <div className="space-y-2 text-[11px] leading-relaxed text-slate-300 w-full pl-2">
                  <p>
                    💬 <strong className="text-amber-400">دُور اول - مجمع گفتگو پاپ (جهت ساعت‌گرد با چالش):</strong> 
                    جهتِ صحبت مابقی اعضا مستقیماً در جهت ساعت‌گرد ادامه خواهد یافت. هر بازیکنِ در حال صحبت می‌تواند یک چالش (نوبت صحبت مجزا) به فرد دیگر تقدیم کند و هر فرد فقط یک چالش می‌تواند دریافت کند. فردی که سر صحبت انتخاب شده، در این دور، <strong>سر صحبت</strong> مجمع گفتگو خواهد بود.
                  </p>
                  <p>
                    🔄 <strong className="text-amber-400">دُور دوم - مجمع گفتگو رئیس‌جمهور (پادساعت‌گرد بدون چالش):</strong> 
                    برای انتخاب رئیس‌جمهور، هر یک از بازیکنان مجدداً یک‌بار نوبت گفتگو خواهند داشت، اما این بار گفتگو به صورت <strong>پادساعت‌گرد (خلاف جهت ساعت‌گرد)</strong> از همان شخصِ سر صحبت آغاز می‌شود و در طول آن هیچ چالشی رد و بدل نمی‌گردد. به عبارتی، فردی که سر صحبت انتخاب شده است، در جریان این دور برای ریاست‌جمهوری <strong>ته صحبت (آخرین نفر)</strong> مجمع خواهد بود.
                  </p>
                  <p>
                    🗳️ <strong className="text-amber-400">پروسه کاندیداتوری و رأی‌گیری نهایی مجمع:</strong> 
                    پس از پایان نوبت‌های مدافعه، رأی‌گیری اول مجمع برگزار شده و دو کاندیدا با بیشترین آرا معین می‌شوند. این دو با هم یک گفتگوی رفت‌وبرگشت دوطرفه برگزار می‌کنند و در نهایت رأی‌گیری قطعی صورت می‌پذیرد.
                  </p>
                  <p className="text-rose-400 font-semibold bg-rose-950/20 p-2 rounded border border-rose-500/20 mt-2">
                    👑 <strong className="text-rose-400">حق وتوی پاپ اعظم:</strong> 
                    کاندیدای صاحب رأی بیشتر رئیس‌جمهور می‌گردد؛ مگر اینکه پاپ او را وتو و «دیس‌لایک» نماید. در صورت وتوی گستاخانه پاپ، کاندیدای رقیب (صاحب آرای کمتر) مستقیماً رئیس‌جمهور قطعی مجمع خواهد شد.
                  </p>
                </div>
              </CollapsibleGuide>
            </div>
          </div>

          <div className="flex justify-center gap-x-4">
            <button
              onClick={handleRandomSpeaker}
              className="bg-amber-950/20 text-amber-400 border border-amber-800/50 hover:bg-amber-900/40 text-xs font-bold px-4 py-2.5 rounded-lg transition"
            >
              انتخاب سخنران تصادفی
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectSpeaker(p.id)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold text-right transition border flex items-center justify-between gap-1.5 ${
                  speakerId === p.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{p.name}</span>
                {renderSecretsLabel(p)}
              </button>
            ))}
          </div>

          {currentSpeaker && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs font-semibold text-center mt-3">
              نخستین سخنران روز صفر: <span className="font-bold underline">{currentSpeaker.name}</span>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              ۲. انتخابات پاپ اعظم (رای‌گیری مجمع)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              هر بازیکن که بیشترین آرای دور صفر مجمع را به خود اختصاص دهد، به عنوان نقش رسمی پاپ انتخاب می‌شود.
              یکی از بازیکنان را برای دریافت جایگاه پاپ انتخاب کنید.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPope(p.id)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold text-right transition border flex items-center justify-between gap-1.5 ${
                  popeId === p.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span>{p.name}</span>
                {renderSecretsLabel(p)}
              </button>
            ))}
          </div>

          {currentPope && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs font-semibold text-center mt-3">
              پاپ منصوب روز صفر: <span className="font-bold underline">{currentPope.name}</span>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-amber-500" />
              ۳. انتصاب کشیش توسط پاپ مقتدر
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              پاپ منتخب ({currentPope?.name}) اینک باید یکی از بازیکنان وفادار (غیر از خودش) را به عنوان کشیش معتمد خود منصوب کند.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            <button
              onClick={() => handleSelectPriest('')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition border ${
                priestId === ''
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              (بدون کشیش - رد شدن)
            </button>
            {players
              .filter((p) => p.id !== popeId)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPriest(p.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold text-right transition border flex items-center justify-between gap-1.5 ${
                    priestId === p.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{p.name}</span>
                  {renderSecretsLabel(p)}
                </button>
              ))}
          </div>

          {currentPriest && (
            <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-3 rounded-lg text-xs font-semibold text-center mt-3 font-semibold">
              کشیش بزرگ بازی: <span className="font-bold underline">{currentPriest.name}</span>
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-500" />
              ۴. مجمع رأی‌گیری نهایی کاندیداها و تشکیل دولت (ریاست‌جمهوری)
            </h3>
            <div className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
              <p>
                در این مرحله، مجمع رأی‌گیری نهایی مابین کاندیداهای کاندید شده آغاز می‌شود. فرآیند انتخابات به شیوه رسمی زیر تعیین تکلیف می‌گردد:
              </p>
              <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 space-y-1.5 text-[11px]">
                <p>
                  🗳️ <strong className="text-amber-400">کاندیداتوری دو نفره:</strong> در رأی‌گیری اول مجمع، دو نفر که بیشترین رأی را کسب کرده‌اند به عنوان کاندیدا نامزد می‌شوند.
                </p>
                <p>
                  🗣️ <strong className="text-amber-400">گفتمان رفت‌وبرگشت کاندیداها:</strong> این دو نفر وارد دفاع شده و یک دورِ کوتاه رفت‌وبرگشت کلامی مدافعه مابین خود برگزار می‌کنند. سپس رأی‌گیری نهایی بین آنان انجام خواهد شد.
                </p>
                <p className="font-semibold text-rose-400">
                  ❌ <strong className="text-rose-400">حق وتوی پاپ اعظم:</strong> کاندیدایی که بیشترین آرای دور نهایی را به نام خود ثبت کند رئیس‌جمهور مجمع می‌گردد؛ مشروط بر اینکه پاپ او را وتو و «دیس‌لایک» نکند. در صورت دیس‌لایک پاپ روی منتخب اول، رقیب وی (کاندیدای صاحب آرای کمتر) مستقیماً کرسی ریاست‌جمهوری را تصاحب کرده و رئیس‌جمهور قطعی خواهد بود.
                </p>
              </div>
              <p className="text-[10px] font-bold text-amber-500/80 mt-1">
                لطفاً متناسب با رأی‌گیری مجمع و حق وتوی احتمالی پاپ، رئیس‌جمهور نهایی را از فهرست زیر برگزینید:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            {players
              .filter((p) => p.role === 'none' || p.role === 'president')
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPresident(p.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold text-right transition border flex items-center justify-between gap-1.5 ${
                    presidentId === p.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{p.name}</span>
                  {renderSecretsLabel(p)}
                </button>
              ))}
          </div>

          {currentPresident && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-lg text-xs font-semibold text-center mt-3">
              رئیس جمهور منتخب: <span className="font-bold underline">{currentPresident.name}</span>
            </div>
          )}

          {/* Pope's Veto Toggle Button */}
          <div className="bg-[#0b0f19] p-4 rounded-xl border border-rose-950/50 space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4 text-rose-500" />
                حق وتوی دیس‌لایک توسط پاپ اعظم بر رئیس‌جمهور منتخب اول:
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                popeVetoed 
                  ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30' 
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}>
                {popeVetoed ? 'وتو فعال است' : 'غیرفعال'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              اگر پاپ اعظم کاندیدای رتبه اول (رئیس‌جمهور) را وتو کرده است، این دکمه را فعال کنید. فعال‌سازی این دکمه با دمیدن روح کینه در مجمع، باعث گمارده شدن تصادفی یک تروریست انتقام‌جو از بین بازیکنان (با اولویت افراد فاقد نقش) در فازهای شب پیش رو می‌گردد.
            </p>
            <button
              type="button"
              onClick={() => {
                const newValue = !popeVetoed;
                setPopeVetoed(newValue);
                if (newValue) {
                  onLogEvent('پاپ اعظم با استفاده از حق وتوی خود، کاندیدای برتر مجمع را وتو (دیس‌لایک) کرد. غبار کینه بر شهر دمیده شد و یک نفر در شب به صورت تصادفی تروریست خواهد شد.', 'system');
                } else {
                  onLogEvent('وتوی پاپ اعظم لغو گردید.', 'system');
                }
              }}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black transition duration-200 border flex items-center justify-center gap-2 cursor-pointer ${
                popeVetoed
                  ? 'bg-rose-950/60 hover:bg-rose-950/85 text-rose-400 border-rose-500/40 shadow-lg shadow-rose-950/20 active:scale-[0.98]'
                  : 'bg-slate-900/60 hover:bg-slate-900 text-slate-300 border-slate-800 active:scale-[0.98]'
              }`}
            >
              <Skull className={`w-4 h-4 ${popeVetoed ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
              {popeVetoed ? 'لغو و غیرفعال‌سازی وتوی پاپ' : 'اعمال وتو و دیس‌لایک پاپ اعظم (تخصیص تروریست تصادفی در شب)'}
            </button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-amber-500" />
              ۵. تشکیل کابینه ریاست‌جمهوری
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              رئیس‌جمهور جهت حیات قانونی دولت خود می‌بایست کابینه را تکمیل کند.
              افسران معتمد مابقی را مشخص کرده و افراد فاقد نقش را متناسب با جایگاه‌های زیر منتسب کنید.
            </p>
          </div>

          <div className="space-y-4">
            {/* Vice President */}
            {players.length >= 10 && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-2">معاون اول رئیس‌جمهور:</label>
                <select
                  value={viceId}
                  onChange={(e) => handleSelectVice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="">انتخاب معاون...</option>
                  {players
                    .filter((p) => (p.role === 'none' || p.role === 'vice_president') && p.id !== presidentId && p.id !== popeId && p.id !== priestId && p.id !== mayorId && p.id !== judgeId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{getSecretsOptionLabel(p)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Mayor */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">شهردار فعال شهر:</label>
              <select
                value={mayorId}
                onChange={(e) => handleSelectMayor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">انتخاب شهردار...</option>
                {players
                  .filter((p) => (p.role === 'none' || p.role === 'mayor') && p.id !== presidentId && p.id !== popeId && p.id !== priestId && p.id !== viceId && p.id !== judgeId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Judge */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">قاضی ارشد دادگستری:</label>
              <select
                value={judgeId}
                onChange={(e) => handleSelectJudge(e.target.value)}
                className="w-full bg-slate-900 border border-slate-756 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">انتخاب قاضی ارشد...</option>
                {players
                  .filter((p) => (p.role === 'none' || p.role === 'judge') && p.id !== presidentId && p.id !== popeId && p.id !== priestId && p.id !== viceId && p.id !== mayorId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-amber-500" />
              {players.length < 10 
                ? `۶. انتصاب زیرگروه مستقیم رئیس‌جمهور (${players.find(p => p.id === presidentId)?.name || 'رئیس‌جمهور'})`
                : `۶. انتصاب زیرگروه معاون اول رئیس‌جمهور (${players.find(p => p.id === viceId)?.name || 'معاون'})`
              }
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {players.length < 10 
                ? 'رئیس‌جمهور کشور موظف است اعضای تحت حاکمیت خود یعنی ' 
                : 'معاون اول رئیس‌جمهور (یا رئیس‌جمهور در صورت نبود معاون اول) موظف است اعضای تحت امر خود یعنی '
              }
              <strong className="text-amber-400">گزارشگر</strong> و <strong className="text-amber-400">خبرنگار</strong> را از میان افراد فاقد نقش مجمع منصوب نماید.
            </p>
          </div>

          <div className="space-y-4">
            {/* Reporter */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">گزارشگر مجمع:</label>
              <select
                value={reporterId}
                onChange={(e) => handleSelectReporter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">(اختیاری) بدون گزارشگر</option>
                {players
                  .filter((p) => p.role === 'none' || p.role === 'reporter')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Journalist */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">خبرنگار بازی:</label>
              <select
                value={journalistId}
                onChange={(e) => handleSelectJournalist(e.target.value)}
                className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">(اختیاری) بدون خبرنگار</option>
                {players
                  .filter((p) => p.role === 'none' || p.role === 'journalist')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 8 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-500" />
              ۷. انتصاب زیرگروه شهردار ({players.find(p => p.id === mayorId)?.name || 'شهردار'})
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              شهردار فعال موظف است اعضای تحت امر خود یعنی <strong className="text-amber-400">دکتر، پلیس و کارآگاه</strong> را از میان افراد فاقد نقش مجمع منصوب نماید.
            </p>
          </div>

          <div className="space-y-4">
            {/* Doctor */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">دکتر فعال:</label>
              <select
                value={doctorId}
                onChange={(e) => handleSelectDoctor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">(اختیاری) بدون دکتر</option>
                {players
                  .filter((p) => p.role === 'none' || p.role === 'doctor')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Police */}
            {players.length >= 12 && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-2">پلیس مسلح:</label>
                <select
                  value={policeId}
                  onChange={(e) => handleSelectPolice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="">(اختیاری) بدون پلیس</option>
                  {players
                    .filter((p) => p.role === 'none' || p.role === 'police')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{getSecretsOptionLabel(p)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Detective */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">کارآگاه رسمی:</label>
              <select
                value={detectiveId}
                onChange={(e) => handleSelectDetective(e.target.value)}
                className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">(اختیاری) بدون کارآگاه</option>
                {players
                  .filter((p) => p.role === 'none' || p.role === 'detective')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === lastStep && lastStep === 9 && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-amber-500" />
              ۸. انتصاب زیردست قاضی ارشد ({players.find(p => p.id === judgeId)?.name || 'قاضی'})
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              قاضی ارشد دادگستری موظف است بازوی حقوقی خود یعنی <strong className="text-amber-400">وکیل مدافع</strong> را از میان افراد فاقد نقش مجمع منصوب نماید.
            </p>
          </div>

          <div className="space-y-4">
            {/* Lawyer */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-300 mb-2">وکیل مدافع مجمع:</label>
              <select
                value={lawyerId}
                onChange={(e) => handleSelectLawyer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-755 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">(اختیاری) بدون وکیل</option>
                {players
                  .filter((p) => p.role === 'none' || p.role === 'lawyer')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{getSecretsOptionLabel(p)}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Button Controls */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
        <button
          onClick={handlePrevStep}
          disabled={step === 1}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
            step === 1
              ? 'text-slate-600 cursor-not-allowed'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-750'
          }`}
        >
          <ArrowRight className="w-4 h-4" />
          مرحله قبل
        </button>

        <button
          onClick={handleNextStep}
          className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-black px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-1.5"
        >
          {step === lastStep ? 'تشکیل کابینه و شروع شب صفر' : 'مرحله بعد'}
          {step === lastStep ? <Check className="w-5 h-5" /> : <ArrowLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
