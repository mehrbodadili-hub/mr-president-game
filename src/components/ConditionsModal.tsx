/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Cabinet, GamePhase } from '../types';
import { useTranslation } from 'react-i18next';
import { tl } from '../i18n';
import { 
  Info, 
  HelpCircle, 
  Shield, 
  X, 
  Check, 
  AlertTriangle, 
  Scale, 
  Vote, 
  Flame, 
  BookOpen,
  User,
  Heart
} from 'lucide-react';

interface ConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  cabinet: Cabinet;
  cycleNumber: number;
  gamePhase: GamePhase;
  currentDayStep?: number;
  rolesInPlay: string[];
}

export const ConditionsModal: React.FC<ConditionsModalProps> = ({
  isOpen,
  onClose,
  players,
  cabinet,
  cycleNumber,
  gamePhase,
  currentDayStep = 0,
  rolesInPlay
}) => {
  if (!isOpen) return null;
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  // Analytical calculations
  const alivePlayers = players.filter(p => p.isAlive);
  const totalAlive = alivePlayers.length;
  const isChaosActive = totalAlive <= 5;

  const president = players.find(p => p.role === 'president' && p.isAlive);
  const judge = players.find(p => p.role === 'judge' && p.isAlive);
  const mayor = players.find(p => p.role === 'mayor' && p.isAlive);
  const pope = players.find(p => p.role === 'pope' && p.isAlive);
  const priest = players.find(p => p.role === 'priest' && p.isAlive);

  // Veto options checks
  const isMayorVetoPossible = !!(mayor && !mayor.isImprisoned);
  const isPopeVetoPossible = !!(pope && !pope.isImprisoned);
  const isPriestActive = !!(priest && !priest.isImprisoned);

  // Vacant positions under President authority (pope/priest are excluded)
  const aliveRoles = new Set(alivePlayers.map(p => p.role));
  const cabinetAndSecularRoles = [
    'judge', 'mayor', 'vice_president', 'reporter', 
    'journalist', 'doctor', 'police', 'detective', 'lawyer'
  ];
  const vacantSecularRoles = cabinetAndSecularRoles.filter(
    role => rolesInPlay.includes(role) && !aliveRoles.has(role as any)
  );

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fadeIn ${isRTL ? 'text-right' : 'text-left'}`} dir={i18n.dir()}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#090e1f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/30">
              <Scale className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">📋 {tl('توضیح شرایط و قوانین جاری مجمع', 'Current assembly rules & conditions')}</h3>
              <p className="text-[10px] text-slate-400">{tl('تحلیل عمیق و زنده از اختیارات، مسدودی‌ها و روابط سیاسی بر پایه چیدمان مجمع', 'Live analysis of powers, blocks and political relations based on the assembly layout')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed custom-scrollbar max-h-[calc(90vh-120px)]">
          
          {/* Phase Status Banner */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-wrap gap-4 justify-between items-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">{tl('بازه جاری مجمع:', 'Current phase:')}</span>
              <span className="text-xs font-black text-amber-400">
                {gamePhase === 'setup' && tl('صفحه آغازین (پیکربندی اسامی)', 'Setup screen (player names)')}
                {gamePhase === 'day0' && tl('روز صفر (پیکربندی و انتصاب نوبت اول مجمع)', 'Day Zero (first cabinet setup)')}
                {gamePhase === 'night0' && tl('شب صفر (تشخیص نفوذ و عملیات اول تروریست)', 'Night Zero (infiltration & first terrorist op)')}
                {gamePhase === 'day' && tl(`روز ${cycleNumber} ${currentDayStep > 0 ? `(گام لولایی ${currentDayStep})` : ''}`, `Day ${cycleNumber} ${currentDayStep > 0 ? `(step ${currentDayStep})` : ''}`)}
                {gamePhase === 'night' && tl(`شب ${cycleNumber}`, `Night ${cycleNumber}`)}
                {gamePhase === 'gameover' && tl('پایان کل رقابت‌ها', 'Game over')}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] bg-indigo-950/40 text-indigo-300 px-2 py-1 rounded-md border border-indigo-900/40 font-mono">
                {tl(`بازماندگان: ${totalAlive} نفر`, `Survivors: ${totalAlive}`)}
              </span>
              {isChaosActive && (
                <span className="text-[10px] bg-rose-950/40 text-rose-300 px-2 py-1 rounded-md border border-rose-900/40 font-bold flex items-center gap-1 animate-pulse">
                  <Flame className="w-3.5 h-3.5" /> {tl('وضعیت آشوب فعال است!', 'Chaos phase active!')}
                </span>
              )}
            </div>
          </div>

          {/* Core Institutional Rules Dynamics */}
          <div className="space-y-3">
            <h4 className={`text-xs font-black text-slate-200 ${isRTL ? 'border-r-2 pr-2' : 'border-l-2 pl-2'} border-teal-500 flex items-center gap-1.5`}>
              <BookOpen className="w-4 h-4 text-teal-400" />
              {tl('تفسیر زنده قوانین و شرایط مجمع در این فاز', 'Live interpretation of rules & conditions this phase')}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Veto Mechanics */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-350">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>{tl('محدودیت‌ها و شرط وتو', 'Veto limits & conditions')}</span>
                </div>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <p>
                    <strong className="text-slate-300">{tl('۱. وتوی مدنی شهردار:', '1. Mayor civil veto:')}</strong> {tl('فقط زمانی فعال است که شهردار زنده و بیرون از انفرادی باشد. شهردار مجاز است حکم دادگاه در فاز دفاعیه را وتو کند (حداکثر ۱ بار در کل بازی).', 'Only active while the Mayor is alive and out of solitary. The Mayor may veto a court verdict during defense (once per game).')}
                  </p>
                  <p>
                    <strong className="text-slate-300">{tl('۲. وتوی مذهبی پاپ (رهایی از سلول):', '2. Pope religious veto (cell pardon):')}</strong> {tl('پاپ مقتدر می‌تواند اجرای حکم اعدام زندانیان را لغو کرده و آن‌ها را به سلول بازگرداند. این وتو کوول‌داون دارد و ', 'The Pope can cancel an execution and send the prisoner back to the cell. This veto has a cooldown and ')}<span className="text-teal-400 font-semibold">{tl('تنها در حضور کشیش فعال زنده', 'only works while an active living Priest exists')}</span>{tl(' کار می‌کند. در صورت عدم انتصاب/مرگ کشیش، وتوی مذهبی نیز غیرفعال است!', '. Without a Priest, the religious veto is disabled!')}
                  </p>
                </div>
              </div>

              {/* Cabinet Hierarchy */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-350">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>{tl('محوریت قاضی در کابینه و تب ریاست', 'Judge centrality & presidential succession')}</span>
                </div>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <p>
                    <strong className="text-slate-300">{tl('۱. ترتیبات تعویض و انتقال قدرت:', '1. Power-transfer order:')}</strong> {tl('قاضی مجمع به عنوان رئیس مصلحت‌اندیشان، بالاترین تکیه‌گاه قضایی کابینه است و خود وی مصون از جابه‌جایی مستقیم است. او وظیفه انتقال ریاست‌جمهوری را در نبود رئیس‌جمهور مدیریت می‌کند.', 'The Judge is the cabinet\'s highest judicial pillar and is immune to direct swaps. The Judge manages the transfer of the presidency when the President is gone.')}
                  </p>
                  <p>
                    <strong className="text-slate-300">{tl('۲. ضرورت وجود قاضی:', '2. Necessity of a Judge:')}</strong> {tl('در صورتی که صندلی قاضی خالی شود، بازی تا زمان پر شدن آن توسط شهروندان متوقف نخواهد شد اما در فاز روز، رئیس‌جمهور باید پیش از هر جابه‌جایی، قاضی جدید را منصوب کند.', 'If the Judge seat is empty the game does not pause, but during the day phase the President must appoint a new Judge before any other swap.')}
                  </p>
                </div>
              </div>

              {/* Optional Priest Role Rule */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 md:col-span-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-400">
                  <Heart className="w-4 h-4 text-teal-400 animate-pulse" />
                  <span>{tl('قانون مقدس مجمع: انتصاب کشیش از سوی پاپ اختیاری است', 'Sacred rule: appointing a Priest is optional for the Pope')}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  {tl('طبق قانونِ به‌روزشده مجمع، ', 'Per the updated rules, ')}<strong className="text-white">{tl('انتصاب کشیش جدید پس از مرگ کشیش قبلی اجباری نیست', 'appointing a new Priest after the previous one dies is not mandatory')}</strong>{tl('. پاپ مجمع اختیار کامل دارد ردا را به شهروند بدون نقش واگذار کند یا صندلی او را خالی نگه دارد. پاپ با این تصمیم، مجمع را از حق وتوی پاپ محروم می‌سازد در حالی که مجمع مجبور به توقف به خاطر کمبود نقش‌های مذهبی نخواهد بود. همچنین رئیس‌جمهور دیگر بابت خالی بودن نقش‌های مقدس (پاپ یا کشیش) جریمه یا محدود نخواهد شد.', '. The Pope may hand the robe to a role-less citizen or leave the seat empty. By doing so the assembly loses the Pope\'s veto power, but it is not forced to pause for missing religious roles, and the President is no longer penalised for empty sacred seats (Pope or Priest).')}
                </p>
              </div>

            </div>
          </div>

          {/* Checklist of Active Legal States */}
          <div className="space-y-3">
            <h4 className={`text-xs font-black text-slate-200 ${isRTL ? 'border-r-2 pr-2' : 'border-l-2 pl-2'} border-emerald-500 flex items-center gap-1.5`}>
              <Check className="w-4 h-4 text-emerald-400" />
              {tl('تطبیق بلادرنگ معیارهای قانونی مجمع', 'Real-time legal checklist for the assembly')}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              
              {/* Criterion 1: President Active */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">{tl('۱. فعالیت رئیس‌جمهور در دولت (President Status)', '1. President status')}</span>
                {president ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> {tl(`فعال (${president.name})`, `Active (${president.name})`)}
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> {tl('غایب / مقتول! (نیاز به عزل و نصب فوری)', 'Absent / killed (urgent reappointment needed)')}
                  </span>
                )}
              </div>

              {/* Criterion 2: Judge Active */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">{tl('۲. حضور قانون‌مدار قاضی مجمع (Judge Status)', '2. Judge status')}</span>
                {judge ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> {tl(`فعال (${judge.name})`, `Active (${judge.name})`)}
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> {tl('مقتول! (رئیس‌جمهور ملزم به عزل و نصب است)', 'Killed (the President must reappoint)')}
                  </span>
                )}
              </div>

              {/* Criterion 3: Mayor active (Veto authority active) */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">{tl('۳. حق وتوی مدنی شهردار (Mayor Veto)', '3. Mayor civil veto')}</span>
                {isMayorVetoPossible ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> {tl(`آماده اقدام (${mayor?.name})`, `Ready (${mayor?.name})`)}
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> {tl('مسدود یا مقتول', 'Blocked or killed')}
                  </span>
                )}
              </div>

              {/* Criterion 4: Pope veto active based on Priest status */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">{tl('۴. حق وتوی مذهبی پاپ (Pope Veto Active?)', '4. Pope religious veto')}</span>
                {isPopeVetoPossible && isPriestActive ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> {tl('آماده اجرا در صورت لزوم', 'Ready when needed')}
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> {tl('غیرفعال (به دلیل فقدان کشیش یا پاپ مقتدر)', 'Disabled (no active Priest or Pope)')}
                  </span>
                )}
              </div>

              {/* Criterion 5: Secular Vacancies status */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850 md:col-span-2">
                <span className="text-slate-300">{tl('۵. وضعیت صندلی‌های بدون متصدی حاکمیتی بازی', '5. Vacant secular cabinet seats')}</span>
                {vacantSecularRoles.length === 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> {tl('تمامی جایگاه‌ها دارای متصدی فعال هستند', 'All seats filled')}
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    {tl(`${vacantSecularRoles.length} صندلی خالی مجاز وجود دارد (از عهده پاپ خارج و برعهده رئیس‌جمهور)`, `${vacantSecularRoles.length} vacant seats (President's responsibility, not the Pope's)`)}
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Strategic Advisory Section */}
          <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/30 text-teal-300 space-y-1">
            <h5 className="font-bold flex items-center gap-1 text-teal-400">
              <Info className="w-4 h-4" />
              {tl('توصیه راهبردی گرداننده در مقطع کنونی:', 'Strategic moderator advice for this moment:')}
            </h5>
            <p className="text-[10px] leading-relaxed">
              {isChaosActive ? (
                tl('به دلیل ورود بازی به محدوده اضطراری آشوب (زنده بودن ۵ نفر یا کمتر)، به هیچ وجه وقت خود را صرف انتصاب، مبادلات مجدد کابینه یا پیگیری اختیارات پیچیده نکنید. تمرکز مطلق مجمع باید روی بحث‌ها و اعدام مستقیم تروریسم/فراماسون بازی باشد.', 'Because the game has entered chaos (5 or fewer alive), do not spend time on appointments, swaps or complex powers. Focus entirely on debate and direct execution of terrorists/freemasons.')
              ) : vacantSecularRoles.includes('judge') ? (
                tl('هشدار مصلحتی: قاضی مقتول شده است. رئیس‌جمهور باید در گام اول روز مجدداً یک شهروند بدون نقش زنده را به صندلی قاضی منصوب کند تا روند قانونی تعویض‌ها مجاز گردد.', 'Advisory: the Judge has been killed. As the first day step, the President must appoint a living role-less citizen as the new Judge so further swaps become legal.')
              ) : !priest ? (
                tl('ردای کشیش مجمع خالی است. پاپ مجاز است یک شهروند بدون نقش را به این عنوان مفتخر کند. در صورت صلاحدید، پاپ می‌تواند فعلاً بدون کشیش بازی را پیگیری کند؛ اما آگاه باشید که امکان گره‌گشایی مذهبی سلول (وتوی پاپ) تا زمان انتصاب مجدد قفل خواهد ماند.', 'The Priest seat is vacant. The Pope may appoint a role-less citizen, or continue without one — but note that the Pope\'s religious veto will be locked until the seat is filled again.')
              ) : (
                tl('روابط و تعادل قوا در مجمع به صورت قانونی برقرار است. تصمیمات فاز جاری را بدون مانع اداری بگیرید و مجمع را به درستی به سمت فاز بعدی سوق دهید.', 'Powers and balance in the assembly are intact. Make the current phase\'s decisions without administrative blockers and move the assembly forward.')
              )}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090e1f] flex justify-end">
          <button
            onClick={onClose}
            className="bg-teal-600 hover:bg-teal-700 text-slate-950 font-black px-5 py-2 rounded-xl transition text-xs shadow-sm cursor-pointer"
          >
            {tl('متوجه شدم', 'Got it')}
          </button>
        </div>

      </div>
    </div>
  );
};
