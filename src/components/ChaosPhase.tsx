import React from 'react';
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
  const activePlayers = players.filter(p => p.isAlive && !p.isImprisoned);
  const totalVotesCast = Object.keys(votes).filter(k => votes[k] !== "").length;

  return (
    <div className="bg-[#0b0f19] border-2 border-rose-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn">
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-rose-900 via-rose-500 to-rose-900"></div>
      <div className="flex items-center gap-3 mb-6">
        <Skull className="w-8 h-8 text-rose-500 animate-pulse" />
        <div>
          <h2 className="text-xl font-black text-rose-500 tracking-tight">مرحله اضطراری آشوب شهر</h2>
          <p className="text-xs text-rose-400/80 mt-1 font-bold">بقا در نفس‌های آخر... (رأی‌گیری اجباری)</p>
        </div>
      </div>
      
      <div className="mb-6">
        <CollapsibleGuide title="قوانین فاز آشوب شهر">
          <div className="text-xs text-slate-300 leading-relaxed space-y-2">
            <p>• <b>شروع مرحله:</b> این فاز زمانی آغاز می‌شود که تعداد بازیکنان فعال و زنده بازی (آزاد و خارج از زندان) به ۵ نفر برسد (اگر شروع بازی بالای ۸ نفر بوده) و یا ۴ نفر (اگر شروع بازی ۸ نفر یا کمتر بوده).</p>
            <p>• تمام بازیکنان زندانی <b>به صورت خودکار از بازی حذف می‌شوند</b>.</p>
            <p>• از این پس بازی فاز <b>شب</b> نخواهد داشت و نقش‌ها کاملاً باطل می‌شوند.</p>
            <p>• تمام بازیکنان فعال با ترتیبی که در زیر <b>توسط سیستم تصادفی</b> مشخص شده، هر کدام ۳۰ ثانیه صحبت می‌کنند.</p>
            <p>• پس از پایان صحبت، شخص در همان لحظه باید <b>یک نفر دیگر را برای خروج انتخاب کند</b> (رأی اجباری، بدون دفاعیه و گزینه عفو).</p>
            <p>• بعد از ثبت کل رأی‌ها، شخصی که بیشترین رأی را دارد از بازی خارج می‌شود. اگر رأی‌ها مساوی باشد سیستم یکی را رندوم می‌کشد.</p>
            <p>• اگر کارت‌های هویت باقی‌مانده منجر به پیروزی تیمی نشود، مجدداً رأی‌گیری ادامه می‌یابد.</p>
          </div>
        </CollapsibleGuide>
      </div>

      <div className="space-y-6">

        {/* ONE Global Speaking Timer for this phase */}
        <SpeakingTimer title="تایمر متمرکز ۳۰ ثانیه‌ای" />

        <div className="bg-[#04060a] border border-[#141b2d] rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            ترتیب تصادفی صحبت و ثبت آرا
          </h3>
          <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
            در این فاز هیچ شب و روزی وجود ندارد. سیستم ترتیب نفرات را به صورت تصادفی مشخص کرده است. نفر اول به صورت تصادفی جهت <b>سر صحبت</b> انتخاب شده است. هر شخص دقیقاً ۳۰ ثانیه صحبت کرده و در پایان صحبت خود <b>باید</b> یک نفر را برای خروج انتخاب کند (گزینه عفو وجود ندارد). فردی که بیشترین رأی را بیاورد از بازی حذف خواهد شد.
          </p>

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
                        <span className="text-[10px] text-amber-500 font-bold tracking-tighter">شروع کننده صحبت</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">نفر بعدی صحبت</span>
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
                      <option value="">(انتخاب رأی خروج...)</option>
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
          اعمال آرای خروج اجباری ({totalVotesCast} / {activePlayers.length})
        </button>
      </div>
    </div>
  );
}
