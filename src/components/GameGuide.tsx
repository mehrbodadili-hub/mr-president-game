import { useState } from 'react';
import { ROLE_DETAILS } from '../constants';
import { tl } from '../i18n';
import { 
  HelpCircle, 
  Users, 
  BookOpen, 
  Shield, 
  Search, 
  Award, 
  Scale, 
  Clock, 
  Skull, 
  UserX, 
  Play, 
  Info, 
  Sparkles,
  Lock,
  ChevronRight,
  Ban,
  History
} from 'lucide-react';
import { CollapsibleGuide } from './CollapsibleGuide';

interface GameGuideProps {
  key?: string | number;
  onClose?: () => void;
  defaultActiveMode?: 'players' | 'moderator' | 'roles';
  defaultSearchTerm?: string;
}

export default function GameGuide({ onClose, defaultActiveMode = 'players', defaultSearchTerm = '' }: GameGuideProps) {
  const [activeMode, setActiveMode] = useState<'players' | 'moderator' | 'roles'>(defaultActiveMode);
  const [searchTerm, setSearchTerm] = useState(defaultSearchTerm);

  const rolesList = Object.values(ROLE_DETAILS).filter((role) =>
    role.nameFa.includes(searchTerm) || role.descriptionFa.includes(searchTerm)
  );

  return (
    <div className="bg-[#0b0f19] border border-[#1e293b] rounded-xl p-6 shadow-2xl max-w-5xl w-full text-right" dir="rtl">
      {/* Header section with cover elements */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1e293b]">
        <div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            {tl('راهنمای جامع بازی سناریو «آقای رئیس‌جمهور»', 'guide of جامع game سناریو "آقای President"')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {tl('آموزش سناریوی فکری و سیاسی، قابلیت‌های جناح‌ها، وظایف گرداننده و شناسنامه تخصصی نقش‌ها', 'آموزش سناریوی فکری and political, قابلیت‌های جناح‌ها, وظایف moderator and شناسnameه تخصصی roles')}
          </p>
        </div>
        
        {/* Tab Selection */}
        <div className="flex bg-[#050810] p-1 rounded-lg border border-[#1e293b]">
          <button
            onClick={() => setActiveMode('players')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
              activeMode === 'players'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {tl('راهنمای بازیکنان', 'guide of players')}
          </button>
          <button
            onClick={() => setActiveMode('moderator')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
              activeMode === 'moderator'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {tl('راهنمای گرداننده', 'guide of moderator')}
          </button>
          <button
            onClick={() => setActiveMode('roles')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${
              activeMode === 'roles'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {tl('شناسنامه نقش‌ها', 'شناسnameه roles')}
          </button>
        </div>
      </div>

      {/* Content based on selected mode */}
      <div className="min-h-[350px]">
        {/* 1. PLAYERS MODE */}
        {activeMode === 'players' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Introduction Card */}
              <div className="md:col-span-2">
                <CollapsibleGuide title={tl("مقدمه و هدف سناریو مجمع", "مقدمه and target سناریو assembly")} defaultOpen={true}>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    بازی «آقای رئیس‌جمهور» یک بازی استنتاجی، استراتژیک و مذاکره‌محور است که در قالب یک شهر خیالی اتفاق می‌افتد. بازی بین دو گروه شهروندان و فراماسون‌ها تقسیم شده است.
                  </p>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex gap-2 items-start">
                      <span className="text-amber-500">•</span>
                      <p><strong>هدف فراماسون‌ها:</strong> با نفوذ، فریب و حذف مخالفان، اکثریت بازی را در دست بگیرند.</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-amber-500">•</span>
                      <p><strong>هدف شهروندان:</strong> فراماسون‌ها را شناسایی و پیش از آنکه دیر شود، آن‌ها را از بازی حذف کنند.</p>
                    </div>
                  </div>
                </CollapsibleGuide>
              </div>

              {/* Quick Status Bar */}
              <div className="md:col-span-1">
                <CollapsibleGuide title={tl("خلاصه کارت‌های هویت مجمع", "خلاصه کارت‌های identity assembly")} defaultOpen={false}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-[#070c17] px-2.5 py-1.5 rounded border border-[#1e293bb3]">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {tl('شهروندان مجمع', 'citizens assembly')}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">{tl('تکثر آرا', 'تکثر votes')}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#070c17] px-2.5 py-1.5 rounded border border-[#1e293bb3]">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        {tl('فراماسون‌ها', 'Freemasons')}
                      </span>
                      <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">{tl('شبکه آگاه', 'nightکه آگاه')}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-4 leading-relaxed bg-[#050810] p-2 rounded border border-slate-800">
                    تمامی بازیکنان در این سناریو بازی دارای هویت مخفی و پنهان هستند. فراماسون‌ها دارای شماره‌های غیابی مخفی (ترتیب توزیع هویت) می‌باشند؛ در فاز شب، فراماسونی که زنده و فعال بوده و دارای کوچکترین شماره باشد، تصمیم‌گیرنده نهایی و صاحب حق انتخاب شلیک شب مجمع است.
                  </div>
                </CollapsibleGuide>
              </div>
            </div>

            {/* Core Rules Section */}
            <div className="space-y-3">
              {/* Variable Player Count Rules */}
              <CollapsibleGuide title={tl("الزامات شروع مجمع و قوانین وابسته به تعداد اعضا (بر پایه جمعیت)", "الزامات start assembly and rules وابسته to count اعضا (on پایه جمعیت)")} defaultOpen={false}>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  تعداد بازیکنان رسمی مجمع حاکمیتی جهت حفظ توازن قوای سیاسی و امنیت ملی مابین <strong className="text-amber-400">{tl('۸ الی ۳۰ بازیکن', '8 الی 30 player')}</strong> است. برای جمعیت‌های مختلف در این بازه، برخی قوانین و نقش‌ها به صورت خودکار تعدیل می‌گردند:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">{tl('جمعیت مجمع بین ۸ تا ۱۱ نفر:', 'جمعیت assembly بین 8 until 11 نفر:')}</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                      <li>{tl('در جمعیت کمتر از ۱۱ نفر، ', 'in جمعیت کمتر from 11 نفر,')}<strong className="text-slate-300">{tl('حق رای معاون اول به ۱ رای', 'حق vote Vice President to 1 vote')}</strong>{tl(' کاهش می‌یابد (در حالت عادی ۲ رای دارد).', 'کاهش می‌یابد (in حالت normal 2 vote has).')}</li>
                      <li>{tl('نقش ', 'role')}<strong className="text-slate-300">{tl('پلیس مسلح', 'Police مسلح')}</strong>{tl(' از بازی به طور کامل حذف می‌گردد.', 'from game to طور کامل remove می‌گردد.')}</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">{tl('جمعیت مجمع کمتر از ۱۰ نفر (۸ و ۹ نفر):', 'جمعیت assembly کمتر from 10 نفر (8 and 9 نفر):')}</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                      <li>{tl('نقش ', 'role')}<strong className="text-slate-300">{tl('معاون اول', 'Vice President')}</strong>{tl(' به طور کامل از بازی خلع و حذف می‌شود.', 'to طور کامل from game خلع and remove می‌شود.')}</li>
                      <li>{tl('انتصاب افراد تحت امر این رده (خبرنگار و گزارشگر) مستقیماً توسط خود ', 'appointment افراد تحت امر this رده (Journalist and Reporter) مستقیماً توسط خود')}<strong className="text-slate-300">{tl('رئیس‌جمهور', 'President')}</strong>{tl(' در فاز روز صفر صورت می‌پذیرد.', 'in phase Day Zero صورت می‌پذیرد.')}</li>
                      <li>{tl('نقش ', 'role')}<strong className="text-slate-300">{tl('کشیش', 'Priest')}</strong>{tl(' به طور کامل از بازی حذف شده و شب صفر مربوط به او نیز نادیده گرفته می‌شود.', 'to طور کامل from game remove شده and Night Zero مربوط to او نیز نادیده گرفته می‌شود.')}</li>
                    </ul>
                  </div>

                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">{tl('جمعیت مجمع کمتر از ۹ نفر (۸ نفر):', 'جمعیت assembly کمتر from 9 نفر (8 نفر):')}</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                      <li>{tl('نقش ', 'role')}<strong className="text-slate-300">{tl('وکیل مدافع', 'defense Lawyer')}</strong>{tl(' (زیرمجموعه قاضی ارشد) از بازی حذف می‌گردد و گام انتصاب آن طی نخواهد شد.', '(زیرtotalه Judge ارشد) from game remove می‌گردد and step appointment that طی نخواهد شد.')}</li>
                    </ul>
                  </div>

                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800 flex flex-col justify-center">
                    <span className="font-bold text-rose-400 block mb-1">{tl('محدودیت‌ها و هشدارها:', 'محtwoدیت‌ها and Warningها:')}</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {tl('برای تعداد کمتر از ۸ نفر مجمع رسمی حاکمیتی تشکیل نمی‌شود. همچنین جهت کارایی و پایداری قوانین و توازن استدلال، مجمع نباید بیش از ۳۰ عضو داشته باشد.', 'بvote count کمتر from 8 نفر assembly رسمی sovereigntyی تشکیل نمی‌شود. همچنین جهت کاvoteی and stability rules and balance استدلال, assembly نmust بیش from 30 عضو داشته باشد.')}
                    </p>
                  </div>
                </div>
              </CollapsibleGuide>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Rule Item: Mason Specialized Rules */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title={tl("قوانین اختصاصی و پیچیده فراماسون‌ها", "rules اختصاصی and پیچیده Freemasons")} defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-500 h-fit">
                        <Skull className="w-5 h-5" />
                      </div>
                      <div>
                        <ul className="text-xs text-slate-300 mt-1 space-y-2 list-disc list-inside">
                          <li><strong>{tl('زندان:', 'prison:')}</strong>{tl(' فراماسونی که زندانی شده باشد، به هیچ وجه با اعضای فعال لژ بیدار نمی‌شود و حق مشارکت در شلیک شبانه را ندارد.', 'Freemasonی که prisoner شده باشد, to no وجه with اعضای active lodge awake نمی‌شود and حق مشارکت in shot nightانه را lacks.')}</li>
                          <li><strong>{tl('انسداد کشیش:', 'block Priest:')}</strong>{tl(' شلیک شبانه تیم فراماسون ', 'shot nightانه تیم Freemason')}<strong>{tl('تنها در صورتی مسدود و بی‌اثر می‌شود', 'only in صورتی blocked and بی‌اثر می‌شود')}</strong>{tl(' که ', 'که')}<strong>{tl('فراماسون ارشد', 'Freemason ارشد')}</strong>{tl(' (دارای کوچکترین شماره فعال) توسط کشیش مسدود شود. اگر مسدود شود، طبق الزامات بازی تیم فراماسون هم‌چنان به دستور گرداننده شلیک خود را انجام می‌دهند (بدون آنکه بدانند مسدود شده‌اند)، اما ', '(داvote smallترین شماره active) توسط Priest blocked شود. اگر blocked شود, طبق الزامات game تیم Freemason هم‌چنان to دستور moderator shot خود را انجام می‌دهند (without آنکه بدانند blocked شده‌اند), اما')}<strong>{tl('هدف تیراندازی هیچ آسیبی نخواهد دید', 'target shotاندازی no آسیبی نخواهد دید')}</strong>{tl('. (توجه: مسدود شدن یک فراماسون عادی، شلیک تیمی را مختل نمی‌کند).', '. (note: blocked شدن a Freemason normal, shot تیمی را disrupted نمی‌کند).')}</li>
                          <li><strong>{tl('ایمنی زندان:', 'ایمنی prison:')}</strong>{tl(' هیچ بازیکنی (اعم از فراماسون، شهروند یا غیره) اگر در سلول زندان باشد، تحت هیچ شرایطی (شلیک پلیس، شلیک فراماسون‌ها) توسط این تیراندازی‌ها در شب کشته نمی‌شود.', 'no a player (اعم from Freemason, citizen or غیره) اگر in cell prison باشد, تحت no conditionsی (shot Police, shot Freemasons) توسط this shotاندازی‌ها in night killed نمی‌شود.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item: Chaos Phase */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title={tl("فاز اضطراری آشوب شهر (نفس‌های آخر)", "phase emergency chaos city (نفس‌های آخر)")} defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-500 h-fit">
                        <Skull className="w-5 h-5" />
                      </div>
                      <div>
                        <ul className="text-xs text-slate-300 mt-1 space-y-2 list-disc list-inside">
                          <li><strong>{tl('آستانه ورود:', 'آستانه enter:')}</strong>{tl(' این فاز زمانی فعال می‌شود که تعداد بازیکنان ', 'this phase زمانی active می‌شود که count players')}<b>{tl('فعال', 'active')}</b>{tl(' (زنده و خارج از زندان) به ', '(alive and خارج from prison) to')}<b>{tl('۵ نفر', '5 نفر')}</b>{tl(' (یا در بازی‌های ۸ نفره و کمتر، به ', '(or in game‌های 8 نفره and کمتر, to')}<b>{tl('۴ نفر', '4 نفر')}</b>{tl(') برسد.', ') برسد.')}</li>
                          <li><strong>{tl('حذف زندانیان و نقش‌ها:', 'remove prisoners and roles:')}</strong>{tl(' تمام زندانیان بالافاصله کشته می‌شوند، بازی دیگر فاز شب نخواهد داشت، و ', 'تمام prisoners بالافاصله killed می‌شوند, game دیگر night phase نخواهد داشت, and')}<b>{tl('همه نقش‌های قبلی باطل می‌شوند.', 'all roles Previous باطل می‌شوند.')}</b></li>
                          <li><strong>{tl('۳۰ ثانیه صحبت و رأی اجباری:', '30 ثانیه speak and vote اجباری:')}</strong>{tl(' بازیکنان به ترتیب تصادفی سیستم، هر کدام ۳۰ ثانیه صحبت می‌کنند و باید ', 'players to ترتیب random سیستم, each کدام 30 ثانیه speak می‌کنند and must')}<b>{tl('اجباراً به یک نفر رأی خروج بدهند.', 'اجباراً to a نفر vote exit بدهند.')}</b>{tl(' گزینه عفوی وجود ندارد.', 'option pardonی exists lacks.')}</li>
                          <li><strong>{tl('خروج و بررسی:', 'exit and بررسی:')}</strong>{tl(' فردی که بیشترین رأی خروج را بیاورد مستقیماً بازی را ترک کرده و سیستم وضعیت پیروزی را می‌سنجد. اگر بازی تمام نشده باشد مجددا صحبت و رأی تا تعیین هویت فاتح ادامه می‌یابد.', 'فردی که بیشترین vote exit را بیاورد مستقیماً game را ترک کرده and سیستم وضعیت پیdayی را می‌سنجد. اگر game تمام نشده باشد مجددا speak and vote until set identity فاتح continue می‌یابد.')}</li>
                          <li><strong>{tl('تساوی آرا:', 'تساوی votes:')}</strong>{tl(' اگر آرا برابر شد یکی از نفراتی که رأی بالا آورده‌اند بصورت ', 'اگر votes برابر شد یکی from نفراتی که vote بالا آورده‌اند بصورت')}<b>{tl('تصادفی', 'random')}</b>{tl(' توسط نرم‌افزار حذف می‌شود.', 'توسط نرم‌افزار remove می‌شود.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 1 */}
                <div className="md:col-span-1">
                  <CollapsibleGuide title={tl("قوانین سخت‌گیرانه زندان (جدید و فوق‌پیشرفته)", "rules سخت‌گیرانه prison (new and فوق‌پیشرفته)")} defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 h-fit">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          هنگامی که بازیکنی توسط حکم نهایی دادگاه (با رای قاضی) به <strong>{tl('زندان', 'prison')}</strong> فرستاده می‌شود:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                          <li><strong>{tl('ظرفیت زندان:', 'ظرفیت prison:')}</strong>{tl(' بر اساس جمعیت مجمع در شروع بازی ثابت است.', 'on اساس جمعیت assembly in start game ثابت است.')}</li>
                          <li>{tl('او هویت ملی/جناحی خود را حفظ می‌کند اما نقش ویژه خود را به یک شهروند ساده واگذار می‌کند.', 'او identity ملی/جناحی خود را حفظ می‌کند اما role ویژه خود را to a citizen plain واگذار می‌کند.')}</li>
                          <li>{tl('حق رای ندارند و شمارش نمی‌شوند، اما حق دکترین و گفتمان را دارند.', 'حق vote ندارند and شمارش نمی‌شوند, اما حق Doctorین and discourse را دارند.')}</li>
                          <li><strong>{tl('قانون جدیدالورود:', 'rule newالenter:')}</strong>{tl(' امکان صدور هیچ‌گونه حکمی (اعدام/عفو) در روز اول ورود تفهیمی وجود ندارد.', 'امکان issue هیچ‌گونه verdictی (execution/pardon) in day اول enter تفهیمی exists lacks.')}</li>
                          <li>{tl('قاضی الزامی به عفو یا اعدام روزانه اشخاص بومی زندان ندارد.', 'Judge mandatory to pardon or execution dayانه اشخاص بومی prison lacks.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 2 */}
                <div className="md:col-span-1">
                  <CollapsibleGuide title={tl("مکانیزم‌های تروریست انتحاری مجمع", "مکانیزم‌های terrorist suicide assembly")} defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 h-fit">
                        <Skull className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          {tl('تیر موفق پلیس، وتوی پاپ و انقلاب شهردار تهدید امنیتی را افزایش داده و تروریست تولید می‌کند:', 'shot successful Police, veto Pope and Mayor revolution تهدید امنیتی را افزایش داده and terrorist تولید می‌کند:')}
                        </p>
                        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                          <li><strong>{tl('مهلت کارایی بمب:', 'مهلت کاvoteی bomb:')}</strong>{tl(' یک شب و روزِ پس از رخداد (در غیر اینصورت باطل گشته و می‌سوزد).', 'a night and dayِ then from رخداد (in غیر اینصورت باطل گشته and می‌سوزد).')}</li>
                          <li>{tl('سپر یا محافظت نجات دکتر هیچ اثری بر انتحار تروریست ندارد.', 'shield or protection save Doctor no اثری on suicide attack terrorist lacks.')}</li>
                          <li>{tl('بمب‌گذاری زنده زندانیان فقط تروریست را منفجر کرده و فرد مصون در سلول آسیب نمی‌بیند.', 'bombing alive prisoners only terrorist را detonate کرده and فرد مصون in cell آسیب نمی‌بیند.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 6 */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title={tl("قوانین و پیامدهای لایحه انقلاب روزانه شهردار", "rules and پیامدهای لایحه revolution dayانه Mayor")} defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-500 h-fit">
                        <UserX className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          علاوه بر جانشینی‌های سلسله‌مراتبی هنگام مرگ، <strong>{tl('شهردار زنده', 'Mayor alive')}</strong> این اختیار را دارد که در تالار روز دادخواست «انقلاب» بدهد.
                        </p>
                        <ul className="text-xs text-rose-200 mt-2 space-y-2 list-disc list-inside">
                          <li><strong>{tl('رای‌گیری مستقیم (نصف + ۱):', 'voting مستقیم (نصف + 1):')}</strong>{tl(' انقلاب فقط با رای موافق اکثریت مطلق مجمع شکل می‌گیرد. در لایحه انقلاب ', 'revolution only with vote in favor majority مطلق assembly شکل می‌گیرد. in لایحه revolution')}<strong>{tl('قاضی به هیچ وجه امکان وتو ندارد', 'Judge to no وجه امکان veto lacks')}</strong>{tl(' و فقط رای‌گیری تعیین‌کننده است.', 'and only voting set‌کننده است.')}</li>
                          <li><strong>{tl('عدم مصونیت پاپ:', 'عدم مصونیت Pope:')}</strong>{tl(' پاپ اعظم نیز مطلقا ', 'High Pope نیز مطلقا')}<strong>{tl('نمی‌تواند', 'cannot')}</strong>{tl(' لایحه انقلاب را باطل (وتو) یا رد کند.', 'لایحه revolution را باطل (veto) or رد کند.')}</li>
                          <li><strong>{tl('جانشینی فاتح:', 'succession فاتح:')}</strong>{tl(' در صورت پیروزی، رئیس‌جمهور فعلی از سمت خود خلع شده و شهردار مستقیماً جانشین او می‌شود. همچنین، ', 'in صورت پیdayی, President فعلی from سمت خود خلع شده and Mayor مستقیماً successor او می‌شود. همچنین,')}<strong>{tl('رئیس‌جمهور خلع‌شده مستقیماً به عنوان متهم اول وارد دادگاه می‌شود', 'President خلع‌شده مستقیماً to عنوان defendant اول وارد court می‌شود')}</strong>.</li>
                          <li><strong>{tl('سقوط مسببان:', 'سقوط مسببان:')}</strong>{tl(' در صورت شکست رای‌گیری در دادگاه، این شهردار است که جایگاه خود را به صورت کامل از دست داده و او به عنوان متهم وارد دادگاه به جهت محاکمه می‌گردد.', 'in صورت شکست voting in court, this Mayor است که position خود را to صورت کامل from دست داده and او to عنوان defendant وارد court to جهت محاکمه می‌گردد.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 7: Pope Veto Rules */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title={tl("قوانین وتوی پاپ اعظم", "rules veto High Pope")} defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 h-fit">
                        <Shield className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          نکات بسیار مهم درباره نقش وتو (استفاده از وتو تنها یک روز در میان و آن هم برای یک بار فعال می‌شود):
                        </p>
                        <ul className="text-xs text-amber-400 mt-2 space-y-2 list-disc list-inside">
                          <li>{tl('هر گاه پاپ حکمی را وتو کند (بازگرداندن شخصی از مرگ)، به واسطه هرج و مرجِ رخ داده ', 'each گاه Pope verdictی را veto کند (بازگرداندن شخصی from death), to واسطه chaosِ رخ داده')}<strong>{tl('یک قابلیت تروریست (عملیات انتحاری)', 'a قابلیت terrorist (operation suicide)')}</strong>{tl(' بصورت اتفاقی میان بازیکنان ایجاد خواهد شد.', 'بصورت اتفاقی میان players ایجاد خواهد شد.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 8 */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title={tl("قوانین جانشینی پاپ و کشیش", "rules succession Pope and Priest")} defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-[#0d1e2e] rounded border border-teal-500/20 text-teal-400 h-fit">
                        <History className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          {tl('ترتیب و ساختار کلیسا همواره در مجمع دارای اهمیت و قوانین پیوسته است:', 'ترتیب and ساختار کلیسا همواره in assembly داvote اهمیت and rules پیوسته است:')}
                        </p>
                        <ul className="text-xs text-slate-300 mt-2 space-y-2 list-disc list-inside">
                          <li><strong>{tl('جانشینی خودکار پاپ:', 'succession خودکار Pope:')}</strong>{tl(' در صورت فوت پاپ، نرم‌افزار به صورت ', 'in صورت death Pope, نرم‌افزار to صورت')}<strong>{tl('خودکار', 'خودکار')}</strong>{tl(' کشیش زنده را به مقام پاپ اعظم ارتقا می‌دهد و به او توانایی‌های پاپ و یک سپر اولیه اعطا می‌کند.', 'Priest alive را to office High Pope ارتقا می‌دهد and to او توانایی‌های Pope and a shield اولیه اعطا می‌کند.')}</li>
                          <li><strong>{tl('شرط انتصاب کشیش جدید:', 'شرط appointment Priest new:')}</strong>{tl(' پاپ اعظم برای تعیین کشیش جایگزین ', 'High Pope بvote set Priest جایگزین')}<strong>{tl('فقط', 'only')}</strong>{tl(' می‌تواند از میان بازیکنان ', 'can from میان players')}<strong className="text-amber-400">{tl('شهروند بدون نقش (ساده)', 'citizen without role (plain)')}</strong>{tl(' یکی را انتخاب کند. اگر در بازی هیچ شهروند آزاد و بدون نقشی وجود نداشته باشد، پاپ باید تا ایجاد یک شهروند بدون نقش (مثلاً فرد آزاد شده از زندان) برای تعیین کشیش صبر کند.', 'یکی را select کند. اگر in game no citizen آزاد and without roleی exists نداشته باشد, Pope must until ایجاد a citizen without role (مثلاً فرد آزاد شده from prison) بvote set Priest صبر کند.')}</li>
                          <li><strong>{tl('خالی ماندن صندلی کشیش (اختیاری):', 'خالی ماندن seat Priest (optional):')}</strong>{tl(' این انتصاب کاملاً ', 'this appointment fully')}<strong>{tl('اختیاری', 'optional')}</strong>{tl(' است. پاپ می‌تواند تصمیم بگیرد صندلی کشیش را خالی نگه دارد. اما باید توجه داشت که فرمان رهایی زندانیِ تالار منوط به امضای هر دو (پاپ و کشیش) است؛ پس تا زمان حضور کشیش جدید، قابلیت وتوی مرگ زندانی غیرفعال خواهد ماند.', 'است. Pope can تصمیم بگیرد seat Priest را خالی نگه has. اما must note داشت که order رهایی prisonerِ hall منوط to امضای each two (Pope and Priest) است; then until زمان presence Priest new, قابلیت veto death prisoner inactive خواهد ماند.')}</li>
                          <li><strong>{tl('بحران فوت همزمان (قاعده ۸):', 'crisis death همزمان (قاعده 8):')}</strong>{tl(' تنها در صورتی که ', 'only in صورتی که')}<strong>{tl('پاپ و کشیش هر دو به صورت قطعی کشته شده باشند', 'Pope and Priest each two to صورت قطعی killed شده باشند')}</strong>{tl('، مجمع دچار بحران کلیسا می‌شود. در این موقعیت استثنایی، سیستم خودکار از رئیس‌جمهور می‌خواهد که سریعاً یک بازیکن زنده را برای مقام پاپ اعظم منصوب کند. در لیست پیشنهادی سیستم، اولویت همواره با شهروندان ساده (بدون نقش) است و نقش‌های قاضی و کشیش قطعاً در این لیست حضور نخواهند داشت.', ', assembly دچار crisis کلیسا می‌شود. in this موقعیت استثنایی, سیستم خودکار from President می‌خواهد که سریعاً a player alive را بvote office High Pope appointed کند. in list پیشنهادی سیستم, اولویت همواره with citizens plain (without role) است and roles Judge and Priest قطعاً in this list presence نخواهند داشت.')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 9 */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title={tl("قوانین سلسله‌مراتب جانشینی ریاست‌جمهوری", "rules hierarchy succession presidency")} defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-[#2d143c] rounded border border-purple-500/20 text-purple-400 h-fit">
                        <History className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          {tl('در صورت کشته‌شدن رئیس‌جمهور، سیستم مجمع به صورت خودکار زنجیره جانشینی زیر را طی می‌کند:', 'in صورت killed‌شدن President, سیستم assembly to صورت خودکار زنجیره succession زیر را طی می‌کند:')}
                        </p>
                        <ul className="text-xs text-slate-300 mt-2 space-y-2 list-disc list-inside">
                          <li><strong>{tl('جانشینی سطح اول (معاون اول):', 'succession سطح اول (Vice President):')}</strong>{tl(' در صورتی که ', 'in صورتی که')}<strong>{tl('معاون اول', 'Vice President')}</strong>{tl(' در قید حیات باشد، بلافاصله و به صورت اتوماتیک مقام ریاست‌جمهوری را در دست می‌گیرد (سپر اولیه جدید دریافت می‌کند).', 'in قید حیات باشد, بلافاصله and to صورت اتوماتیک office presidency را in دست می‌گیرد (shield اولیه new دریافت می‌کند).')}</li>
                          <li><strong>{tl('جانشینی سطح دوم (شهردار):', 'succession سطح twoم (Mayor):')}</strong>{tl(' اگر معاون مرده باشد اما ', 'اگر Vice President dead باشد اما')}<strong>{tl('شهردار', 'Mayor')}</strong>{tl(' زنده باشد، مقام ریاست‌جمهوری اضطراراً به شهردار تفویض می‌گردد.', 'alive باشد, office presidency اضطراراً to Mayor تفویض می‌گردد.')}</li>
                          <li><strong>{tl('جانشینی سطح ۵ (تصادفی در وضعیت بحران):', 'succession سطح 5 (random in وضعیت crisis):')}</strong>{tl(' چنانچه هم رئیس‌جمهور، هم معاون و هم شهردار به قتل رسیده باشند (مردگان اجرایی)، نرم‌افزار به صورت ', 'چنانچه هم President, هم Vice President and هم Mayor to قتل رسیده باشند (مردگان executive), نرم‌افزار to صورت')}<strong>{tl('تصادفی', 'random')}</strong>{tl(' یک نفر را از بین شهروندان جانشین می‌سازد.', 'a نفر را from بین citizens successor می‌سازد.')}</li>
                          <li><strong>{tl('شفافیت تفکیک قوا:', 'شفافیت تفکیک قوا:')}</strong>{tl(' در این قرعه‌کشی تصادفیِ ریاست‌جمهوری، ', 'in this قرعه‌کشی randomِ presidency,')}<strong>{tl('پاپ اعظم، کشیش، قاضی مجمع و تمام زندانیان', 'High Pope, Priest, Judge assembly and تمام prisoners')}</strong>{tl(' اکیداً از لیست کاندیداها حذف شده‌اند و هرگز مجریه را در دست نخواهند گرفت. (در صورتی که فقط این افراد در بازی مانده باشند، جامعه بدون قوه مجریه خواهد ماند!).', 'اکیداً from list کاندیداها remove شده‌اند and هرگز مجریه را in دست نخواهند گرفت. (in صورتی که only this افراد in game مانده باشند, جامعه without قوه مجریه خواهد ماند!).')}</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4">
              <CollapsibleGuide title={tl("توصیه‌های استراتژیک برای بازیکنان مجمع", "advice‌های strategic بvote players assembly")} defaultOpen={false}>
                <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                  <p>{tl('۱. اگر ', '1. اگر')}<strong>{tl('شهروند مجمع', 'citizen assembly')}</strong>{tl(' هستید، دقت کنید که قدرت در مجمع متعلق به رئیس جمهورتان است. همواره برای حفظ پایداری کابینه بکوشید و از افتادن نقش قاضی به دست فراماسون‌های مرموز ممانعت کنید.', 'هستید, دقت کنید که قدرت in assembly متعلق to Presidentتان است. همواره بvote حفظ stability cabinet بکوشید and from افتادن role Judge to دست Freemasons مرموز ممانعت کنید.')}</p>
                  <p>{tl('۲. به عنوان ', '2. to عنوان')}<strong>{tl('وکیل', 'Lawyer')}</strong>{tl('، شما ۱ دقیقه فرصت برای پایان روز دارید تا بتوانید درباره متهمین و پرونده‌های روزانه آنها صحبت کنید. شما می‌توانید از آن‌ها دفاع یا به آن‌ها حمله کنید.', ', شما 1 دقیقه فرصت بvote End day دارید until بتوانید درباره defendantین and case‌های dayانه آنها speak کنید. شما canید from آن‌ها defense or to آن‌ها حمله کنید.')}</p>
                  <p>{tl('۳. ', '3.')}<strong>{tl('فراماسون‌ها', 'Freemasons')}</strong>{tl(' تمایل دارند رئیس‌جمهور حامی خود را برپا کنند یا شهردار را برای انقلاب و کودتا برانگیزند تا کنترل مجمع را تماماً در دست بگیرند.', 'تمایل دارند President حامی خود را برپا کنند or Mayor را بvote revolution and coup برانگیزند until کنترل assembly را تماماً in دست بگیرند.')}</p>
                </div>
              </CollapsibleGuide>
            </div>
          </div>
        )}

        {/* 2. MODERATOR MODE */}
        {activeMode === 'moderator' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Intro / Mission */}
            <CollapsibleGuide title={tl("بیانیه مأموریت و تعهد سیاسی گرداننده مجمع", "بیانیه مأموریت and commitment political moderator assembly")} defaultOpen={true}>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tl('به عنوان گرداننده یا لیدر رسمی مجمع، شما نظم شب، استعلام‌های خبرنگار، تیرهای پلیس و حکم قضات را اداره می‌کنید. این نرم‌افزار به شما کمک می‌کند تمام فازها را راحت‌تر، دقیق‌تر و بدون اشتباه طی کنید.', 'to عنوان moderator or leader رسمی assembly, شما نظم night, inquiry‌های Journalist, shotهای Police and verdict قضات را اداره می‌کنید. this نرم‌افزار to شما کمک می‌کند تمام phaseها را راحت‌تر, دقیق‌تر and without اشتباه طی کنید.')}
              </p>
            </CollapsibleGuide>

            {/* Step-by-Step Moderator Guide */}
            <CollapsibleGuide title={tl("گام‌های شبانه هدایت ترتیبی مجمع توسط لیدر", "step‌های nightانه guidance ترتیبی assembly توسط leader")} defaultOpen={false}>
              <div className="relative border-r-2 border-[#1e293b] pr-6 mr-3 space-y-4 text-right pt-2 pb-1">
                {/* Step 1 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">{tl('توزیع و رؤیت محرمانه هویت‌ها (روز صفر)', 'توزیع and رؤیت secret identities (Day Zero)')}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    با وارد کردن نام‌ها، بازی را آغاز کنید. سپس بازیکنان را یکی‌یکی بیدار کرده تا با کلیک بر روی دکمه چشم سیستم، هویت مخفی خود (فراماسون به همراه شماره خود یا شهروند عادی) را دور از چشم دیگران بررسی کنند.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">{tl('مدیریت غصب قابلیت‌ها در شب', 'management غصب قابلیت‌ها in night')}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    ابتدا کشیش (Priest) یا دزد (Thief) را بیدار کنید تا نقش هدفش را مختل سازد. این کار قبل از بیدار شدن مابقی نقش‌های اصلی شب الزامی است.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    3
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">{tl('اعمال استعلامات خبرنگار و گزارشگر', 'اعمال inquiries Journalist and Reporter')}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    خبرنگار و گزارشگر را فراخوان کرده و نتایج را در پنل شب پیاده کنید تا گزارش‌های آنها به دست مجمع برسد. <strong>{tl('توجه مهم:', 'note important:')}</strong>{tl(' افشای خبرنگار به هیچ وجه ربطی به ورود به دادگاه ندارد و او نمی‌تواند متهمی را به دادگاه بفرستد. ', 'revealی Journalist to no وجه ربطی to enter to court lacks and او cannot defendantی را to court بفرستد.')}<strong>{tl('فقط کارآگاه', 'only Detective')}</strong> می‌تواند مستقیماً اتهام ورود به دادگاه را صادر نماید.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    4
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">{tl('اعمال نجات‌ها، شلیک‌ها و خروجی شب', 'اعمال save‌ها, shot‌ها and exitی night')}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {tl('نجات دکتر را بپرسید. شلیک‌های پلیس یا مافیا را اعمال کنید. فاز خروجی شب شامل کسانی که سپرهایشان شکسته یا کشته شده‌اند به بازی تسلیم می‌شود.', 'save Doctor را بپرسید. shot‌های Police or مافیا را اعمال کنید. output phase night شامل کسانی که shieldهایشان شکسته or killed شده‌اند to game تسلیم می‌شود.')}
                  </p>
                </div>

                {/* Step 5 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    5
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">{tl('مدیریت تروریست فعال و ترورهای غیرمنتظره', 'management terrorist active and ترورهای غیرمنتظره')}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    اگر در شب قبل پلیس شلیک کرده، به صورت تصادفی حتماً قابلیت تروریستی به یک بازیکن غیر‌تروریست داده شده است (در سیستم ثبت می‌گردد). لیدر باید بپرسد آیا تروریست قصد عملیات شبانه یا آغاز فردا را دارد یا خیر.
                  </p>
                </div>
              </div>
            </CollapsibleGuide>

            {/* Critical Moderator Checklist */}
            <CollapsibleGuide title={tl("چک‌لیست حیاتی مدیریت و کنترل زندانیان مجمع حاکمیت", "چک‌list critical management and کنترل prisoners assembly sovereignty")} defaultOpen={false}>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed text-right">
                <li>{tl('به محض فرستادن بازیکنی به زندان با تصمیم قاضی در فاز روز، حتماً روی دکمهٔ ', 'to محض فرستادن a player to prison with تصمیم Judge in day phase, حتماً روی buttonٔ')}<strong>{tl('«انتقال به زندان»', '"send to prison"')}</strong>{tl(' روی کارت او کلیک کنید.', 'روی کارت او کلیک کنید.')}</li>
                <li>{tl('سیستم به طور خودکار نقش او را خلع می‌کند اما هویت او برای شمارش‌های برد و باخت باقی می‌ماند و از حق رای‌گیری در مجمع محروم می‌شود.', 'سیستم to طور خودکار role او را خلع می‌کند اما identity او بvote شمارش‌های برد and باخت باقی می‌ماند and from حق voting in assembly محروم می‌شود.')}</li>
                <li><strong>{tl('قانون جدیدالورود:', 'rule newالenter:')}</strong>{tl(' بازیکنی که تازه وارد زندان می‌شود، در همان روز نمی‌تواند هیچ حکم جدیدی (اعدام یا عفو) دریافت کند.', 'a player که تازه وارد prison می‌شود, in همان day cannot no verdict newی (execution or pardon) دریافت کند.')}</li>
                <li><strong>{tl('اختیار قاضی:', 'authority Judge:')}</strong>{tl(' قاضی کاملاً مختار است که در یک روز هیچکدام از زندانیان واجد شرایط را اعدام یا عفو نکند و آنها را در همان وضعیت حبس نگه دارد. صدور حکم برای زندان الزامی نیست.', 'Judge fully مختار است که in a day هیچکدام from prisoners واجد conditions را execution or pardon نکند and آنها را in همان وضعیت حبس نگه has. issue verdict بvote prison mandatory نیست.')}</li>
                <li>{tl('فراموش نکنید: رئیس‌جمهور، پاپ و قاضی هیچ‌گاه به زندان و دادگاه نرفته و متهم مجمع نمی‌گردند.', 'فراموش نکنید: President, Pope and Judge هیچ‌گاه to prison and court نرفته and defendant assembly نمی‌گردند.')}</li>
              </ul>
            </CollapsibleGuide>
          </div>
        )}

        {/* 3. ROLES WIKI */}
        {activeMode === 'roles' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-200">{tl('کودکس و شناسنامه قدرت نقش‌ها', 'کودکس and شناسnameه قدرت roles')}</h3>
                <p className="text-[11px] text-slate-400">{tl('جستجوی سریع قابلیت‌های شب و روز هر یک از شخصیت‌های بازی مجمع', 'search for سریع قابلیت‌های night and day each a from شخصیت‌های game assembly')}</p>
              </div>
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder={tl("جستجوی نقش...", "search for role...")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#050810] text-slate-100 border border-[#1e293b] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 pr-9 text-right"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Roles Table */}
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto custom-scrollbar border border-[#1e293b] rounded-lg">
              <table className="w-full text-xs text-right text-slate-300">
                <thead className="bg-[#050810] text-slate-400 sticky top-0 border-b border-[#1e293b] z-10">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-right">{tl('عنوان نقش', 'عنوان role')}</th>
                    <th scope="col" className="px-4 py-2 text-right">{tl('وظیفه روز', 'وظیفه day')}</th>
                    <th scope="col" className="px-4 py-2 text-right">{tl('وظیفه شب', 'وظیفه night')}</th>
                    <th scope="col" className="px-4 py-2 text-right">{tl('انتصاب دهنده', 'appointment دهنده')}</th>
                    <th scope="col" className="px-4 py-2 text-center">{tl('سپر دفاعی', 'shield defensive')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/50">
                  {rolesList.map((role) => {
                    const hasShield = ['pope', 'president', 'mayor', 'judge'].includes(role.type);

                    return (
                      <tr key={role.type} className="hover:bg-[#0c1222] transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-100 flex items-center gap-1.5 min-w-[120px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          {role.nameFa}
                        </td>
                        <td className="px-4 py-3 leading-relaxed max-w-[250px] text-slate-300">
                          {role.dayAbilityFa}
                        </td>
                        <td className="px-4 py-3 leading-relaxed max-w-[250px] text-amber-100">
                          {role.nightAbilityFa}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-semibold min-w-[100px]">
                          {role.chooserFa}
                        </td>
                        <td className="px-4 py-3 text-center min-w-[80px]">
                          {hasShield ? (
                            <span className="inline-flex items-center gap-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 text-[9px] px-1.5 py-0.5 rounded-full">
                              <Shield className="w-2.5 h-2.5" />
                              {tl('دارد', 'has')}
                            </span>
                          ) : (
                            <span className="text-slate-600">{tl('ـ', '-')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {rolesList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                        {tl('نقشی متناظر با جستجوی شما پیدا نشد.', 'roleی textاظر with search for شما پیدا نشد.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Note */}
            <div className="flex items-center gap-2 bg-[#050810] border border-[#1e293b] p-3 rounded-lg text-[11px] text-slate-400">
              <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p>
                <strong>{tl('راهنمای مکانیزم سپر:', 'guide of مکانیزم shield:')}</strong> نقش‌هایی نظیر رئیس‌جمهور، پاپ، شهردار و قاضی که اداره ارکان مجمع را برعهده دارند، در اولین نفوذ شبانه یا سوءقصد آسیب نمی‌بینند و بقای آنها وابسته به سپر است. شکستن سپر در فاز غسل شب مشخص می‌گردد.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer view */}
      <div className="mt-6 flex justify-between items-center text-xs text-slate-400 border-t border-[#1e293b] pt-4">
        <div className="flex gap-2 text-[10px] text-slate-500">
          <span>{tl('کد سناریو: MP-2026', 'کد سناریو: MP-2026')}</span>
          <span>|</span>
          <span>{tl('نسخه پایدار ۱.۲', 'نسخه پایدار 1.2')}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition duration-200"
          >
            {tl('بستن راهنما', 'close guide')}
          </button>
        )}
      </div>
    </div>
  );
}
