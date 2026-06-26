import { useState } from 'react';
import { Player } from '../types';
import { ROLE_DETAILS } from '../constants';
import { UserX, Shield, Search, ArrowUpRight, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tl } from '../i18n';
import { MODERATOR_GUIDE_ITEMS } from '../constants/moderatorGuideData';

interface SearchManagerProps {
  players: Player[];
  showSecrets?: boolean;
  onNavigateToGuide?: (id: string, title: string) => void;
}

export default function SearchPlayers({ players, showSecrets = false, onNavigateToGuide }: SearchManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localShowSecrets, setLocalShowSecrets] = useState(false);
  const { i18n, t } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const localizedName = (type: string) => (isRTL ? (ROLE_DETAILS as any)[type]?.nameFa : t(`roles.${type}.name`, (ROLE_DETAILS as any)[type]?.nameFa || ''));
  const localizedDay = (type: string) => (isRTL ? (ROLE_DETAILS as any)[type]?.dayAbilityFa : t(`roles.${type}.dayAbility`, (ROLE_DETAILS as any)[type]?.dayAbilityFa || ''));
  const localizedNight = (type: string) => (isRTL ? (ROLE_DETAILS as any)[type]?.nightAbilityFa : t(`roles.${type}.nightAbility`, (ROLE_DETAILS as any)[type]?.nightAbilityFa || ''));
  const localizedDesc = (type: string) => (isRTL ? (ROLE_DETAILS as any)[type]?.descriptionFa : t(`roles.${type}.description`, (ROLE_DETAILS as any)[type]?.descriptionFa || ''));

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
    const roleFaMatch = (roleInfo?.nameFa || '').toLowerCase().includes(term)
      || (localizedName(p.role) || '').toLowerCase().includes(term);
    const roleEnMatch = roleId.includes(term);
    const roleDescMatch = (roleInfo?.descriptionFa || '').toLowerCase().includes(term)
      || (localizedDesc(p.role) || '').toLowerCase().includes(term);

    // Faction match (identity) ONLY if revealSecrets is true
    const factionText = revealSecrets ? (p.identity === 'freemason' ? 'فراماسون ماسون لژ ضدحکومتی freemason mason lodge' : 'شهروند حکومت قانون ملّت citizen state law nation') : '';
    const factionMatch = factionText.toLowerCase().includes(term);

    // Status matching
    const isAliveText = p.isAlive ? 'زنده فعال حاضر alive active present' : 'مرده فراری اعدامی کشته خارج غایب مرحوم فوت شده dead killed executed eliminated absent';
    const isAliveMatch = isAliveText.includes(term);

    const isImprisonedText = p.isImprisoned ? 'زندانی زندان حبس انفرادی متهم بند بند محبوس prisoner prison jailed' : 'آزاد بی گناه بیرون free outside';
    const isImprisonedMatch = isImprisonedText.includes(term);

    const shieldText = p.hasShield && !p.shieldBroken ? 'سپر محافظ زره ایمن ضدضربه shield armor protected' : 'بدون سپر بی دفاع no shield defenseless';
    const shieldMatch = shieldText.includes(term);

    // Terrorist ability ONLY if revealSecrets is true
    const terroristText = p.hasTerroristAbility && revealSecrets ? 'تروریست انتحاری بمب گذار خرابکار بمب terrorist suicide bomber' : '';
    const terroristMatch = terroristText && terroristText.includes(term);

    return nameMatch || roleFaMatch || roleEnMatch || roleDescMatch || factionMatch || isAliveMatch || isImprisonedMatch || shieldMatch || terroristMatch;
  });

  // Filter 2: Game Wiki Roles / Guide
  const filteredGuide = MODERATOR_GUIDE_ITEMS.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return false;
    return (
      item.title.toLowerCase().includes(term) ||
      item.content.toLowerCase().includes(term) ||
      item.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  });

  const totalResults = filteredPlayers.length + filteredGuide.length;

  return (
    <div className={`bg-[#0b0f19] border border-slate-800 rounded-xl p-3.5 shadow-xl w-full ${isRTL ? 'text-right' : 'text-left'}`} dir={i18n.dir()} id="search-manager-panel">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/10 text-amber-500 rounded-lg">
            <Search className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-black text-slate-100">{tl('موتور جستجوی همه‌جانبه مجمع', 'Assembly-wide search engine')}</h4>
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
            {localShowSecrets ? tl('پوشاندن هویت‌ها', 'Hide identities') : tl('رویت محرمانه هویت‌ها (دستیار گرداننده)', 'Reveal secret identities (moderator)')}
          </button>
        )}
      </div>
      
      <p className="text-[10px] text-slate-500 mb-2.5 leading-relaxed font-semibold">
        {tl('در کادر زیر بنویسید تا همزمان میان ', 'Type below to search simultaneously across ')}
        <strong>{tl('بازیکنان فعال صحنه', 'active players on the table')}</strong>
        {tl(' و ', ' and ')}
        <strong>{tl('کتابچه راهنما و قوانین بازی', 'the rulebook and role guide')}</strong>:
      </p>

      <div className="relative">
        <input
          type="text"
          placeholder={tl('شروع به نوشتن کنید (مثال: رئیس‌جمهور، پاپ، فراماسون، کشته)...', 'Start typing (e.g. President, Pope, Freemason, killed)...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#050810] text-slate-200 border border-slate-850 rounded-xl py-2 px-3 text-xs leading-5 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition shadow-inner font-medium pl-8"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="absolute left-2.5 top-2 ml-1 text-[10px] text-slate-400 hover:text-slate-200 transition px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
          >
            {tl('پاک کردن', 'Clear')}
          </button>
        )}
      </div>

      {searchTerm && (
        <div className={`mt-3 bg-slate-950/50 rounded-lg border border-slate-950 divide-y divide-slate-900/60 overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="p-1.5 bg-slate-950/80 text-[10px] font-bold text-slate-400 flex justify-between items-center">
            <span>{tl('نتایج منطبق با جستجوی شما:', 'Results matching your search:')}</span>
            <span className="font-mono bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-800">{tl(`${totalResults} مورد یافت شد`, `${totalResults} matches`)}</span>
          </div>

          {totalResults === 0 ? (
            <div className="p-4 text-center text-[11px] text-slate-600 font-semibold bg-[#050810]/50">
              {tl(`هیچ نتیجه منطبقی برای «${searchTerm}» در کل مجمع و راهنما یافت نشد.`, `No matches found for "${searchTerm}" across the assembly or the guide.`)}
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              
              {/* SECTION 1: PLAYERS / CARDS */}
              {filteredPlayers.length > 0 && (
                <div className="border-b border-slate-900/40">
                  <div className="bg-slate-900/40 px-2 py-1 text-[9px] font-black text-amber-500 border-r-2 border-amber-500 flex justify-between items-center">
                    <span>{tl(`کارت‌های بازی و وضعیت بازیکنان (${filteredPlayers.length})`, `Player cards & status (${filteredPlayers.length})`)}</span>
                    <span className="text-[8px] text-slate-500 font-medium">{tl('برای پرش به کارت بازیکن کلیک کنید', 'Click to jump to the player card')}</span>
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
                        className={`p-2 hover:bg-slate-900/90 cursor-pointer transition-all border-r border-transparent hover:border-r-amber-500 flex items-center justify-between gap-3 text-xs ${isRTL ? 'text-right' : 'text-left'}`}
                      >
                        <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">{p.name}</span>
                            {revealSecrets ? (
                              <span className={`text-[8.5px] px-1.5 py-0.5 rounded-full font-bold ${
                                p.identity === 'freemason' ? 'bg-rose-950 text-rose-400' : 'bg-sky-950 text-sky-400'
                              }`}>
                                {p.identity === 'freemason' ? tl('فراماسون', 'Freemason') : tl('شهروند', 'Citizen')}
                              </span>
                            ) : (
                              <span className="text-[8.5px] px-1.5 py-0.5 rounded-full font-bold bg-slate-900 text-slate-500">
                                {tl('هویت محفوظ', 'Identity hidden')}
                              </span>
                            )}
                            {p.hasTerroristAbility && revealSecrets && (
                              <span className="bg-red-950 text-red-400 text-[8px] px-1 py-0.5 rounded border border-red-900/60 font-bold animate-pulse">
                                💣 {tl('تروریست', 'Terrorist')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {tl('نقش مجمع: ', 'Role: ')}{localizedName(p.role) || tl('شهروند ساده (بدون نقش)', 'Plain citizen (no role)')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {p.isAlive ? (
                            <span className="text-[9px] bg-emerald-950/25 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {tl('زنده', 'Alive')}
                            </span>
                          ) : (
                            <span className="text-[9px] bg-rose-950/30 text-rose-400 border border-rose-900/40 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                              <UserX className="w-3 h-3 text-rose-400" />
                              {tl('کشته', 'Killed')}
                            </span>
                          )}

                          {p.isImprisoned && (
                            <span className="text-[9px] bg-amber-950/40 text-amber-300 border border-amber-900/40 px-1.5 py-0.5 rounded font-black">
                              ⛓️ {tl('در محبس', 'Imprisoned')}
                            </span>
                          )}

                          {p.hasShield && !p.shieldBroken && revealSecrets && (
                            <span className="text-[9.5px] bg-teal-950/30 text-teal-400 border border-teal-900/30 p-1 rounded-md" title={tl('دارای سپر', 'Shielded')}>
                              <Shield className="w-3.5 h-3.5 text-teal-400 fill-teal-400/20" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SECTION 2: MODERATOR GUIDE */}
              {filteredGuide.length > 0 && (
                <div>
                  <div className="bg-slate-900/45 px-2 py-1 text-[9px] font-black text-teal-400 border-r-2 border-teal-400 flex justify-between items-center">
                    <span>{`راهنمای گرداننده (${filteredGuide.length})`}</span>
                    <span className="text-[8px] text-slate-500 font-medium">برای مشاهده کامل گام کلیک کنید</span>
                  </div>

                  {filteredGuide.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onNavigateToGuide) {
                          onNavigateToGuide(item.id, item.title);
                        }
                      }}
                      className={`p-2.5 hover:bg-slate-900/90 cursor-pointer transition-all border-r border-transparent hover:border-r-teal-500 hover:bg-teal-950/10 flex flex-col gap-1 text-xs ${isRTL ? 'text-right' : 'text-left'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <ClipboardList className="w-3 h-3 text-teal-400" />
                          <span className="font-extrabold text-[#e2e8f0]">{item.title}</span>
                          <span className="text-[8.5px] uppercase font-mono px-1 py-0.2 bg-teal-950 text-teal-400 rounded">
                            {item.phase === 'night' ? 'شب' : item.phase === 'day' ? 'روز' : 'روز/شب'}
                          </span>
                        </div>

                        <span className="text-[9px] text-teal-400 font-bold flex items-center gap-0.5 group">
                          مشاهده در راهنما
                          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        {item.content}
                      </p>
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
