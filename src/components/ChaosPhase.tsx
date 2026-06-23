import React from 'react';
import { useTranslation } from 'react-i18next';
import { Player } from '../types';
import { Users, Skull, Target } from 'lucide-react';
import SpeakingTimer from './SpeakingTimer';
import { CollapsibleGuide } from './CollapsibleGuide';

interface ChaosPhaseProps {
  players: Player[];
  speakerOrder: string[];
  votes: Record<string, string>;
  onVoteChange: (voterId: string, targetId: string) => void;
  onSubmitVotes: () => void;
}

export default function ChaosPhase({ players, speakerOrder, votes, onVoteChange, onSubmitVotes }: ChaosPhaseProps) {
  const { t, i18n } = useTranslation();
  const activePlayers = players.filter(p => p.isAlive && !p.isImprisoned);
  const totalVotesCast = Object.keys(votes).filter(k => votes[k] !== "").length;

  return (
    <div className="bg-[#0b0f19] border-2 border-rose-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn" dir={i18n.dir()}>
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-rose-900 via-rose-500 to-rose-900"></div>
      <div className="flex items-center gap-3 mb-6">
        <Skull className="w-8 h-8 text-rose-500 animate-pulse" />
        <div>
          <h2 className="text-xl font-black text-rose-500 tracking-tight">{t('chaos.title')}</h2>
          <p className="text-xs text-rose-400/80 mt-1 font-bold">{t('chaos.subtitle')}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <CollapsibleGuide title={t('chaos.guideTitle')}>
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>• {t('chaos.rules.start')}</p>
            <p>• {t('chaos.rules.prison')}</p>
            <p>• {t('chaos.rules.noNight')}</p>
            <p>• {t('chaos.rules.order')}</p>
            <p>• {t('chaos.rules.vote')}</p>
            <p>• {t('chaos.rules.tally')}</p>
            <p>• {t('chaos.rules.loop')}</p>
          </div>
        </CollapsibleGuide>
      </div>

      <div className="space-y-6">

        {/* ONE Global Speaking Timer for this phase */}
        <SpeakingTimer title={t('chaos.timerTitle')} />

        <div className="bg-[#04060a] border border-[#141b2d] rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            {t('chaos.orderTitle')}
          </h3>
          <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">{t('chaos.orderDesc')}</p>

          <div className="space-y-3">
            {speakerOrder.map((id, index) => {
              const p = players.find(x => x.id === id);
              if (!p || !p.isAlive || p.isImprisoned) return null;
              
              const isFirst = index === 0;
              
              return (
                <div key={id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                  isFirst 
                    ? 'bg-amber-950/20 border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.1)]' 
                    : 'bg-slate-900/40 border-slate-800'
                }`}>
                  <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black shrink-0 ${
                      isFirst ? 'bg-amber-500 text-slate-900 shadow-md' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-black text-base ${isFirst ? 'text-amber-400' : 'text-slate-200'}`}>{p.name}</span>
                      {isFirst ? (
                        <span className="text-[10px] text-amber-500 font-bold tracking-tighter">{t('chaos.first')}</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">{t('chaos.next')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto mt-2 sm:mt-0">
                    <select
                      value={votes[id] || ''}
                      onChange={(e) => onVoteChange(id, e.target.value)}
                      className={`bg-slate-950 border text-sm font-bold rounded-xl px-4 py-3 w-full sm:w-56 focus:outline-none transition-colors ${
                        votes[id] 
                          ? 'border-rose-500 text-rose-400 bg-rose-950/20 shadow-[0_0_10px_rgba(225,29,72,0.1)]' 
                          : 'border-rose-900/50 text-rose-300 focus:border-rose-500'
                      }`}
                    >
                      <option value="">{t('chaos.votePlaceholder')}</option>
                      {activePlayers.map(tgt => (
                        <option key={tgt.id} value={tgt.id}>{tgt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onSubmitVotes}
          disabled={totalVotesCast < activePlayers.length}
          className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition duration-300 ${
            totalVotesCast < activePlayers.length
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed border outline-none border-slate-800'
              : 'bg-rose-700 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/50 border outline-none border-rose-600'
          }`}
        >
          <Target className="w-5 h-5" />
          {t('chaos.submit', { cast: totalVotesCast, total: activePlayers.length })}
        </button>
      </div>
    </div>
  );
}
