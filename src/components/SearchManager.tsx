import { useState } from 'react';
import { Player } from '../types';
import { ROLE_DETAILS } from '../constants';
import { UserX, Shield, Search, BookOpen, ArrowLeft, ArrowUpRight } from 'lucide-react';

interface SearchManagerProps {
  players: Player[];
  showSecrets?: boolean;
  onNavigateToGuide?: (roleType: string, roleNameFa: string) => void;
}

export default function SearchPlayers({ players, showSecrets = false, onNavigateToGuide }: SearchManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localShowSecrets, setLocalShowSecrets] = useState(false);

  const revealSecrets = showSecrets || localShowSecrets;

  // Filter 1: Active Players / Game Cards
  const filteredPlayers = players.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return false;

    // Check basic details
    const nameMatch = p.name.toLowerCase().includes(term);
    
    // Always search roles
    const roleId = p.role.toLowerCase();
    const roleInfo = ROLE_DETAILS[p.role];
    const roleFaMatch = roleInfo?.nameFa.toLowerCase().includes(term) || false;
    const roleEnMatch = roleId.includes(term);
    const roleDescMatch = roleInfo?.descriptionFa.toLowerCase().includes(term) || false;

    // Faction match (identity) ONLY if revealSecrets is true
    const factionText = revealSecrets ? (p.identity === 'freemason' ? 'فراماسون ماسون لژ ضدحکومتی' : 'شهروند حکومت قانون ملّت') : '';
    const factionMatch = factionText.toLowerCase().includes(term);

    // Status matching
    const isAliveText = p.isAlive ? 'زنده فعال حاضر' : 'مرده فراری اعدامی کشته خارج غایب مرحوم فوت شده';
    const isAliveMatch = isAliveText.includes(term);

    const isImprisonedText = p.isImprisoned ? 'زندانی زندان حبس انفرادی متهم بند بند محبوس' : 'آزاد بی گناه بیرون';
    const isImprisonedMatch = isImprisonedText.includes(term);

    const shieldText = p.hasShield && !p.shieldBroken ? 'سپر محافظ زره ایمن ضدضربه' : 'بدون سپر بی دفاع';
    const shieldMatch = shieldText.includes(term);

    // Terrorist ability ONLY if revealSecrets is true
    const terroristText = p.hasTerroristAbility && revealSecrets ? 'تروریست انتحاری بمب گذار خرابکار بمب' : '';
    const terroristMatch = terroristText && terroristText.includes(term);

    return nameMatch || roleFaMatch || roleEnMatch || roleDescMatch || factionMatch || isAliveMatch || isImprisonedMatch || shieldMatch || terroristMatch;
  });

  // Filter 2: Game Wiki Roles / Guide
  const filteredRoles = Object.values(ROLE_DETAILS).filter((role) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return false;

    // Filter by title, abilities, description, or system identifier
    return (
      (role.nameFa && role.nameFa.toLowerCase().includes(term)) ||
      (role.dayAbilityFa && role.dayAbilityFa.toLowerCase().includes(term)) ||
      (role.nightAbilityFa && role.nightAbilityFa.toLowerCase().includes(term)) ||
      (role.chooserFa && role.chooserFa.toLowerCase().includes(term)) ||
      (role.descriptionFa && role.descriptionFa.toLowerCase().includes(term)) ||
      (role.type && role.type.toLowerCase().includes(term))
    );
  });

  const totalResults = filteredPlayers.length + filteredRoles.length;

  return (
    <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3.5 shadow-xl w-full text-right" dir="rtl" id="search-manager-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
            <Search className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-black text-slate-100">موتور جستجوی همه‌جانبه مجمع</h4>
        </div>
        {!showSecrets && (
          <button
            onClick={() => setLocalShowSecrets(!localShowSecrets)}
            className={`text-[9px] font-bold px-2 py-1 rounded border transition ${
              localShowSecrets
                ? 'bg-amber-950/40 text-amber-400 border-amber-950/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            {localShowSecrets ? 'پوشاندن هویت‌ها' : 'رویت محرمانه هویت‌ها (دستیار گرداننده)'}
          </button>
        )}
      </div>
      
      <p className="text-[10px] text-slate-500 mb-2.5 leading-relaxed font-semibold">
        در کادر زیر بنویسید تا همزمان میان <strong>بازیکنان فعال صحنه</strong> و <strong>کتابچه راهنما و قوانین بازی</strong> جستجو شود:
      </p>

      <div className="relative">
        <input
          type="text"
          placeholder="شروع به نوشتن کنید (مثال: رئیس‌جمهور، پاپ، فراماسون، کشته)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#050810] text-slate-200 border border-slate-850 rounded-xl py-2 px-3 text-xs leading-5 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition shadow-inner font-medium pl-8"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute left-2.5 top-2 ml-1 text-[10px] text-slate-400 hover:text-slate-200 transition px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
          >
            پاک کردن
          </button>
        )}
      </div>

      {searchTerm && (
        <div className="mt-3 bg-slate-950/50 rounded-lg border border-slate-950 divide-y divide-slate-900/60 overflow-hidden text-right">
          <div className="p-1.5 bg-slate-950/80 text-[10px] font-bold text-slate-400 flex justify-between items-center">
            <span>نتایج منطبق با جستجوی شما:</span>
            <span className="font-mono bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800">{totalResults} مورد یافت شد</span>
          </div>

          {totalResults === 0 ? (
            <div className="p-4 text-center text-[11px] text-slate-600 font-semibold bg-[#050810]/50">
              هیچ نتیجه منطبقی برای «{searchTerm}» در کل مجمع و راهنما یافت نشد.
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              
              {/* SECTION 1: PLAYERS / CARDS */}
              {filteredPlayers.length > 0 && (
                <div className="border-b border-slate-900/40">
                  <div className="bg-slate-900/40 px-2 py-1 text-[9px] font-black text-amber-500 border-r-2 border-amber-500 flex justify-between items-center">
                    <span>کارت‌های بازی و وضعیت بازیکنان ({filteredPlayers.length})</span>
                    <span className="text-[8px] text-slate-500 font-medium">برای پرش به کارت بازیکن کلیک کنید</span>
                  </div>
                  
                  {filteredPlayers.map((p) => {
                    const roleInfo = ROLE_DETAILS[p.role];
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setTimeout(() => {
                            const element = document.getElementById(`player-card-${p.id}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              element.classList.add('ring-2', 'ring-amber-500', 'scale-[1.01]', 'border-amber-500/80', 'shadow-2xl', 'shadow-amber-500/10');
                              setTimeout(() => {
                                element.classList.remove('ring-2', 'ring-amber-500', 'scale-[1.01]', 'border-amber-500/80', 'shadow-2xl', 'shadow-amber-500/10');
                              }, 2000);
                            }
                          }, 100);
                        }}
                        className="p-2 hover:bg-slate-900/90 cursor-pointer transition-all border-r border-transparent hover:border-r-amber-500 flex items-center justify-between text-right gap-3 text-xs"
                      >
                        <div className="flex flex-col text-right">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">{p.name}</span>
                            {revealSecrets ? (
                              <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-bold ${
                                p.identity === 'freemason' ? 'bg-rose-950 text-rose-400' : 'bg-sky-950 text-sky-400'
                              }`}>
                                {p.identity === 'freemason' ? 'فراماسون' : 'شهروند'}
                              </span>
                            ) : (
                              <span className="text-[8.5px] px-1.5 py-0.5 rounded-full font-bold bg-slate-900 text-slate-500">
                                هویت محفوظ
                              </span>
                            )}
                            {p.hasTerroristAbility && revealSecrets && (
                              <span className="bg-red-950 text-red-400 text-[8px] px-1 py-0.5 rounded border border-red-900/60 font-bold animate-pulse">
                                💣 تروریست
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                            نقش مجمع: {roleInfo?.nameFa || 'شهروند ساده (بدون نقش)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {p.isAlive ? (
                            <span className="text-[9px] bg-emerald-950/25 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              زنده
                            </span>
                          ) : (
                            <span className="text-[9px] bg-rose-950/30 text-rose-400 border border-rose-900/40 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                              <UserX className="w-3 h-3 text-rose-400" />
                              کشته
                            </span>
                          )}

                          {p.isImprisoned && (
                            <span className="text-[9px] bg-amber-950/40 text-amber-300 border border-amber-900/40 px-1.5 py-0.5 rounded font-black">
                              ⛓️ در محبس
                            </span>
                          )}

                          {p.hasShield && !p.shieldBroken && revealSecrets && (
                            <span className="text-[9.5px] bg-teal-950/30 text-teal-400 border border-teal-900/30 p-1 rounded-md" title="دارای سپر">
                              <Shield className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECTION 2: GAME GUIDE WIKI */}
              {filteredRoles.length > 0 && (
                <div>
                  <div className="bg-slate-900/45 px-2 py-1 text-[9px] font-black text-teal-400 border-r-2 border-teal-400 flex justify-between items-center">
                    <span>راهنمای سناریو و شناسنامه نقش‌ها ({filteredRoles.length})</span>
                    <span className="text-[8px] text-slate-500 font-medium">برای انتقال به بخش راهنما کلیک کنید</span>
                  </div>

                  {filteredRoles.map((role) => (
                    <div
                      key={role.type}
                      onClick={() => {
                        if (onNavigateToGuide) {
                          onNavigateToGuide(role.type, role.nameFa);
                        }
                      }}
                      className="p-2.5 hover:bg-slate-900/90 cursor-pointer transition-all border-r border-transparent hover:border-r-teal-500 hover:bg-teal-950/10 flex flex-col gap-1 text-right text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                          <span className="font-extrabold text-[#e2e8f0]">{role.nameFa}</span>
                          <span className="text-[8.5px] uppercase font-mono px-1 py-0.2 bg-teal-950 text-teal-400 rounded">
                            {role.type}
                          </span>
                        </div>
                        
                        <span className="text-[9px] text-teal-400 font-bold flex items-center gap-0.5 group">
                          مشاهده کامل در راهنما
                          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        {role.descriptionFa}
                      </p>

                      <div className="grid grid-cols-2 gap-2 mt-1 bg-slate-950/40 p-1.5 rounded border border-slate-900/30 text-[9.5px]">
                        <div>
                          <span className="text-slate-500 font-bold">توانایی روز:</span>{' '}
                          <span className="text-amber-200/90 font-medium">{role.dayAbilityFa || 'بدون توانایی روزانه'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-bold">قدرت شب:</span>{' '}
                          <span className="text-teal-200/90 font-medium">{role.nightAbilityFa || 'بدون توانایی شبانه'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
