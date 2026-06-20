/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Player, Cabinet, GamePhase } from '../types';
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
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fadeIn text-right" dir="rtl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#090e1f] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/30">
              <Scale className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">📋 توضیح شرایط و قوانین جاری مجمع</h3>
              <p className="text-[10px] text-slate-400">تحلیل عمیق و زنده از اختیارات، مسدودی‌ها و روابط سیاسی بر پایه چیدمان مجمع</p>
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
              <span className="text-[10px] text-slate-400 block font-bold">بازه جاری مجمع:</span>
              <span className="text-xs font-black text-amber-400">
                {gamePhase === 'setup' && 'صفحه آغازین (پیکربندی اسامی)'}
                {gamePhase === 'day0' && 'روز صفر (پیکربندی و انتصاب نوبت اول مجمع)'}
                {gamePhase === 'night0' && 'شب صفر (تشخیص نفوذ و عملیات اول تروریست)'}
                {gamePhase === 'day' && `روز ${cycleNumber} ${currentDayStep > 0 ? `(گام لولایی ${currentDayStep})` : ''}`}
                {gamePhase === 'night' && `شب ${cycleNumber}`}
                {gamePhase === 'gameover' && 'پایان کل رقابت‌ها'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-[10px] bg-indigo-950/40 text-indigo-300 px-2 py-1 rounded-md border border-indigo-900/40 font-mono">
                بازماندگان: {totalAlive} نفر
              </span>
              {isChaosActive && (
                <span className="text-[10px] bg-rose-950/40 text-rose-300 px-2 py-1 rounded-md border border-rose-900/40 font-bold flex items-center gap-1 animate-pulse">
                  <Flame className="w-3.5 h-3.5" /> وضعیت آشوب فعال است!
                </span>
              )}
            </div>
          </div>

          {/* Core Institutional Rules Dynamics */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-200 border-r-2 border-teal-500 pr-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-400" />
              تفسیر زنده قوانین و شرایط مجمع در این فاز
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Veto Mechanics */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-350">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>محدودیت‌ها و شرط وتو</span>
                </div>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <p>
                    <strong className="text-slate-300">۱. وتوی مدنی شهردار:</strong> فقط زمانی فعال است که شهردار زنده و بیرون از انفرادی باشد. شهردار مجاز است حکم دادگاه در فاز دفاعیه را وتو کند (حداکثر ۱ بار در کل بازی).
                  </p>
                  <p>
                    <strong className="text-slate-300">۲. وتوی مذهبی پاپ (رهایی از سلول):</strong> پاپ مقتدر می‌تواند اجرای حکم اعدام زندانیان را لغو کرده و آن‌ها را به سلول بازگرداند. این وتو کوول‌داون دارد و <span className="text-teal-400 font-semibold">تنها در حضور کشیش فعال زنده</span> کار می‌کند. در صورت عدم انتصاب/مرگ کشیش، وتوی مذهبی نیز غیرفعال است!
                  </p>
                </div>
              </div>

              {/* Cabinet Hierarchy */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-350">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>محوریت قاضی در کابینه و تب ریاست</span>
                </div>
                <div className="space-y-1.5 text-slate-400 text-[11px]">
                  <p>
                    <strong className="text-slate-300">۱. ترتیبات تعویض و انتقال قدرت:</strong> قاضی مجمع به عنوان رئیس مصلحت‌اندیشان، بالاترین تکیه‌گاه قضایی کابینه است و خود وی مصون از جابه‌جایی مستقیم است. او وظیفه انتقال ریاست‌جمهوری را در نبود رئیس‌جمهور مدیریت می‌کند.
                  </p>
                  <p>
                    <strong className="text-slate-300">۲. ضرورت وجود قاضی:</strong> در صورتی که صندلی قاضی خالی شود، بازی تا زمان پر شدن آن توسط شهروندان متوقف نخواهد شد اما در فاز روز، رئیس‌جمهور باید پیش از هر جابه‌جایی، قاضی جدید را منصوب کند.
                  </p>
                </div>
              </div>

              {/* Optional Priest Role Rule */}
              <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2 md:col-span-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-400">
                  <Heart className="w-4 h-4 text-teal-400 animate-pulse" />
                  <span>قانون مقدس مجمع: انتصاب کشیش از سوی پاپ اختیاری است</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  طبق قانونِ به‌روزشده مجمع، <strong className="text-white">انتصاب کشیش جدید پس از مرگ کشیش قبلی اجباری نیست</strong>. پاپ اعظم مجمع اختیار کامل دارد ردا را به شهروند بدون نقش واگذار کند یا صندلی او را خالی نگه دارد. پاپ با این تصمیم، مجمع را از حق وتوی پاپ محروم می‌سازد در حالی که مجمع مجبور به توقف به خاطر کمبود نقش‌های مذهبی نخواهد بود. همچنین رئیس‌جمهور دیگر بابت خالی بودن نقش‌های مقدس (پاپ یا کشیش) جریمه یا محدود نخواهد شد.
                </p>
              </div>

            </div>
          </div>

          {/* Checklist of Active Legal States */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-200 border-r-2 border-emerald-500 pr-2 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              تطبیق بلادرنگ معیارهای قانونی مجمع
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              
              {/* Criterion 1: President Active */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">۱. فعالیت رئیس‌جمهور در دولت (President Status)</span>
                {president ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> فعال ({president.name})
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> غایب / مقتول! (نیاز به عزل و نصب فوری)
                  </span>
                )}
              </div>

              {/* Criterion 2: Judge Active */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">۲. حضور قانون‌مدار قاضی مجمع (Judge Status)</span>
                {judge ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> فعال ({judge.name})
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> مقتول! (رئیس‌جمهور ملزم به عزل و نصب است)
                  </span>
                )}
              </div>

              {/* Criterion 3: Mayor active (Veto authority active) */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">۳. حق وتوی مدنی شهردار (Mayor Veto)</span>
                {isMayorVetoPossible ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> آماده اقدام ({mayor?.name})
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> مسدود یا مقتول
                  </span>
                )}
              </div>

              {/* Criterion 4: Pope veto active based on Priest status */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                <span className="text-slate-300">۴. حق وتوی مذهبی پاپ (Pope Veto Active?)</span>
                {isPopeVetoPossible && isPriestActive ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> آماده اجرا در صورت لزوم
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" /> غیرفعال (به دلیل فقدان کشیش یا پاپ مقتدر)
                  </span>
                )}
              </div>

              {/* Criterion 5: Secular Vacancies status */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850 md:col-span-2">
                <span className="text-slate-300">۵. وضعیت صندلی‌های بدون متصدی حاکمیتی بازی</span>
                {vacantSecularRoles.length === 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> تمامی جایگاه‌ها دارای متصدی فعال هستند
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    {vacantSecularRoles.length} صندلی خالی مجاز وجود دارد (از عهده پاپ خارج و برعهده رئیس‌جمهور)
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Strategic Advisory Section */}
          <div className="p-3.5 rounded-xl bg-teal-950/20 border border-teal-900/30 text-teal-300 space-y-1">
            <h5 className="font-bold flex items-center gap-1 text-teal-400">
              <Info className="w-4 h-4" />
              توصیه راهبردی گرداننده در مقطع کنونی:
            </h5>
            <p className="text-[10px] leading-relaxed">
              {isChaosActive ? (
                "به دلیل ورود بازی به محدوده اضطراری آشوب (زنده بودن ۵ نفر یا کمتر)، به هیچ وجه وقت خود را صرف انتصاب، مبادلات مجدد کابینه یا پیگیری اختیارات پیچیده نکنید. تمرکز مطلق مجمع باید روی بحث‌ها و اعدام مستقیم تروریسم/فراماسون بازی باشد."
              ) : vacantSecularRoles.includes('judge') ? (
                "هشدار مصلحتی: قاضی مقتول شده است. رئیس‌جمهور باید در گام اول روز مجدداً یک شهروند بدون نقش زنده را به صندلی قاضی منصوب کند تا روند قانونی تعویض‌ها مجاز گردد."
              ) : !priest ? (
                "ردای کشیش مجمع خالی است. پاپ اعظم مجاز است یک شهروند ساده بدون نقش را به این عنوان مفتخر کند. در صورت صلاحدید، پاپ می‌تواند فعلاً بدون کشیش بازی را پیگیری کند؛ اما آگاه باشید که امکان گره‌گشایی مذهبی سلول (وتوی پاپ) تا زمان انتصاب مجدد قفل خواهد ماند."
              ) : (
                "روابط و تعادل قوا در مجمع به صورت قانونی برقرار است. تصمیمات فاز جاری را بدون مانع اداری بگیرید و مجمع را به درستی به سمت فاز بعدی سوق دهید."
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
            متوجه شدم
          </button>
        </div>

      </div>
    </div>
  );
};
