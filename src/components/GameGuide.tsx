import { useState } from 'react';
import { ROLE_DETAILS } from '../constants';
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
            راهنمای جامع بازی سناریو «آقای رئیس‌جمهور»
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            آموزش سناریوی فکری و سیاسی، قابلیت‌های جناح‌ها، وظایف گرداننده و شناسنامه تخصصی نقش‌ها
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
            راهنمای بازیکنان
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
            راهنمای گرداننده
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
            شناسنامه نقش‌ها
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
                <CollapsibleGuide title="مقدمه و هدف سناریو مجمع" defaultOpen={true}>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    بازی سناریو <strong>«آقای رئیس‌جمهور»</strong> یک بازی استنتاجی، استراتژیک و مذاکره‌محور است که در مجمعی عالی اتفاق می‌افتد. شهر بین دو جناح <strong>شهروندان مجمع</strong> و <strong>فراماسون‌های وفادار به مجمع مخفی</strong> تقسیم شده است. 
                  </p>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex gap-2 items-start">
                      <span className="text-amber-500">•</span>
                      <p><strong>هدف فراماسون‌ها:</strong> کسب اکثریت یا برابری عددی در مجمع از طریق نفوذ، فریب در رای‌گیری یا اعدام و زندانی کردن شهروندان.</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-amber-500">•</span>
                      <p><strong>هدف شهروندان:</strong> کشف فراماسون‌ها، دفاع از ارکان جمهوری مجمع و نابودسازی یا اسارت کامل آن‌ها در پشت میله‌های زندان.</p>
                    </div>
                  </div>
                </CollapsibleGuide>
              </div>

              {/* Quick Status Bar */}
              <div className="md:col-span-1">
                <CollapsibleGuide title="خلاصه کارت‌های هویت مجمع" defaultOpen={false}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-[#070c17] px-2.5 py-1.5 rounded border border-[#1e293bb3]">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        شهروندان مجمع
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">تکثر آرا</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#070c17] px-2.5 py-1.5 rounded border border-[#1e293bb3]">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        فراماسون‌ها
                      </span>
                      <span className="text-[10px] text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">شبکه آگاه</span>
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
              <CollapsibleGuide title="الزامات شروع مجمع و قوانین وابسته به تعداد اعضا (بر پایه جمعیت)" defaultOpen={false}>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  تعداد بازیکنان رسمی مجمع حاکمیتی جهت حفظ توازن قوای سیاسی و امنیت ملی مابین <strong className="text-amber-400">۸ الی ۳۰ بازیکن</strong> است. برای جمعیت‌های مختلف در این بازه، برخی قوانین و نقش‌ها به صورت خودکار تعدیل می‌گردند:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">جمعیت مجمع بین ۸ تا ۱۱ نفر:</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                      <li>در جمعیت کمتر از ۱۱ نفر، <strong className="text-slate-300">حق رای معاون اول به ۱ رای</strong> کاهش می‌یابد (در حالت عادی ۲ رای دارد).</li>
                      <li>نقش <strong className="text-slate-300">پلیس مسلح</strong> از بازی به طور کامل حذف می‌گردد.</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">جمعیت مجمع کمتر از ۱۰ نفر (۸ و ۹ نفر):</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                      <li>نقش <strong className="text-slate-300">معاون اول</strong> به طور کامل از بازی خلع و حذف می‌شود.</li>
                      <li>انتصاب افراد تحت امر این رده (خبرنگار و گزارشگر) مستقیماً توسط خود <strong className="text-slate-300">رئیس‌جمهور</strong> در فاز روز صفر صورت می‌پذیرد.</li>
                      <li>نقش <strong className="text-slate-300">کشیش</strong> به طور کامل از بازی حذف شده و شب صفر مربوط به او نیز نادیده گرفته می‌شود.</li>
                    </ul>
                  </div>

                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800">
                    <span className="font-bold text-amber-300 block mb-1">جمعیت مجمع کمتر از ۹ نفر (۸ نفر):</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-[11px] leading-relaxed">
                      <li>نقش <strong className="text-slate-300">وکیل مدافع</strong> (زیرمجموعه قاضی ارشد) از بازی حذف می‌گردد و گام انتصاب آن طی نخواهد شد.</li>
                    </ul>
                  </div>

                  <div className="bg-[#050810] p-3 rounded-md border border-slate-800 flex flex-col justify-center">
                    <span className="font-bold text-rose-400 block mb-1">محدودیت‌ها و هشدارها:</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      برای تعداد کمتر از ۸ نفر مجمع رسمی حاکمیتی تشکیل نمی‌شود. همچنین جهت کارایی و پایداری قوانین و توازن استدلال، مجمع نباید بیش از ۳۰ عضو داشته باشد.
                    </p>
                  </div>
                </div>
              </CollapsibleGuide>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Rule Item: Mason Specialized Rules */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title="قوانین اختصاصی و پیچیده فراماسون‌ها" defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-500 h-fit">
                        <Skull className="w-5 h-5" />
                      </div>
                      <div>
                        <ul className="text-xs text-slate-300 mt-1 space-y-2 list-disc list-inside">
                          <li><strong>زندان:</strong> فراماسونی که زندانی شده باشد، به هیچ وجه با اعضای فعال لژ بیدار نمی‌شود و حق مشارکت در شلیک شبانه را ندارد.</li>
                          <li><strong>انسداد کشیش:</strong> شلیک شبانه تیم فراماسون <strong>تنها در صورتی مسدود و بی‌اثر می‌شود</strong> که <strong>فراماسون ارشد</strong> (دارای کوچکترین شماره فعال) توسط کشیش مسدود شود. اگر مسدود شود، طبق الزامات بازی تیم فراماسون هم‌چنان به دستور گرداننده شلیک خود را انجام می‌دهند (بدون آنکه بدانند مسدود شده‌اند)، اما <strong>هدف تیراندازی هیچ آسیبی نخواهد دید</strong>. (توجه: مسدود شدن یک فراماسون عادی، شلیک تیمی را مختل نمی‌کند).</li>
                          <li><strong>ایمنی زندان:</strong> هیچ بازیکنی (اعم از فراماسون، شهروند یا غیره) اگر در سلول زندان باشد، تحت هیچ شرایطی (شلیک پلیس، شلیک فراماسون‌ها) توسط این تیراندازی‌ها در شب کشته نمی‌شود.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item: Chaos Phase */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title="فاز اضطراری آشوب شهر (نفس‌های آخر)" defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-500 h-fit">
                        <Skull className="w-5 h-5" />
                      </div>
                      <div>
                        <ul className="text-xs text-slate-300 mt-1 space-y-2 list-disc list-inside">
                          <li><strong>آستانه ورود:</strong> این فاز زمانی فعال می‌شود که تعداد بازیکنان <b>فعال</b> (زنده و خارج از زندان) به <b>۵ نفر</b> (یا در بازی‌های ۸ نفره و کمتر، به <b>۴ نفر</b>) برسد.</li>
                          <li><strong>حذف زندانیان و نقش‌ها:</strong> تمام زندانیان بالافاصله کشته می‌شوند، بازی دیگر فاز شب نخواهد داشت، و <b>همه نقش‌های قبلی باطل می‌شوند.</b></li>
                          <li><strong>۳۰ ثانیه صحبت و رأی اجباری:</strong> بازیکنان به ترتیب تصادفی سیستم، هر کدام ۳۰ ثانیه صحبت می‌کنند و باید <b>اجباراً به یک نفر رأی خروج بدهند.</b> گزینه عفوی وجود ندارد.</li>
                          <li><strong>خروج و بررسی:</strong> فردی که بیشترین رأی خروج را بیاورد مستقیماً بازی را ترک کرده و سیستم وضعیت پیروزی را می‌سنجد. اگر بازی تمام نشده باشد مجددا صحبت و رأی تا تعیین هویت فاتح ادامه می‌یابد.</li>
                          <li><strong>تساوی آرا:</strong> اگر آرا برابر شد یکی از نفراتی که رأی بالا آورده‌اند بصورت <b>تصادفی</b> توسط نرم‌افزار حذف می‌شود.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 1 */}
                <div className="md:col-span-1">
                  <CollapsibleGuide title="قوانین سخت‌گیرانه زندان (جدید و فوق‌پیشرفته)" defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 h-fit">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          هنگامی که بازیکنی توسط حکم نهایی دادگاه (با رای قاضی) به <strong>زندان</strong> فرستاده می‌شود:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                          <li><strong>ظرفیت زندان:</strong> بر اساس جمعیت مجمع در شروع بازی ثابت است.</li>
                          <li>او هویت ملی/جناحی خود را حفظ می‌کند اما نقش ویژه خود را به یک شهروند ساده واگذار می‌کند.</li>
                          <li>حق رای ندارند و شمارش نمی‌شوند، اما حق دکترین و گفتمان را دارند.</li>
                          <li><strong>قانون جدیدالورود:</strong> امکان صدور هیچ‌گونه حکمی (اعدام/عفو) در روز اول ورود تفهیمی وجود ندارد.</li>
                          <li>قاضی الزامی به عفو یا اعدام روزانه اشخاص بومی زندان ندارد.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 2 */}
                <div className="md:col-span-1">
                  <CollapsibleGuide title="مکانیزم‌های تروریست انتحاری مجمع" defaultOpen={false}>
                    <div className="flex gap-3 text-right">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 h-fit">
                        <Skull className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 leading-relaxed mb-2">
                          تیر موفق پلیس، وتوی پاپ و انقلاب شهردار تهدید امنیتی را افزایش داده و تروریست تولید می‌کند:
                        </p>
                        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                          <li><strong>مهلت کارایی بمب:</strong> یک شب و روزِ پس از رخداد (در غیر اینصورت باطل گشته و می‌سوزد).</li>
                          <li>سپر یا محافظت نجات دکتر هیچ اثری بر انتحار تروریست ندارد.</li>
                          <li>بمب‌گذاری زنده زندانیان فقط تروریست را منفجر کرده و فرد مصون در سلول آسیب نمی‌بیند.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 6 */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title="قوانین و پیامدهای لایحه انقلاب روزانه شهردار" defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-rose-500/10 rounded border border-rose-500/20 text-rose-500 h-fit">
                        <UserX className="w-5 h-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          علاوه بر جانشینی‌های سلسله‌مراتبی هنگام مرگ، <strong>شهردار زنده</strong> این اختیار را دارد که در تالار روز دادخواست «انقلاب» بدهد.
                        </p>
                        <ul className="text-xs text-rose-200 mt-2 space-y-2 list-disc list-inside">
                          <li><strong>رای‌گیری مستقیم (نصف + ۱):</strong> انقلاب فقط با رای موافق اکثریت مطلق مجمع شکل می‌گیرد. در لایحه انقلاب <strong>قاضی به هیچ وجه امکان وتو ندارد</strong> و فقط رای‌گیری تعیین‌کننده است.</li>
                          <li><strong>عدم مصونیت پاپ:</strong> پاپ اعظم نیز مطلقا <strong>نمی‌تواند</strong> لایحه انقلاب را باطل (وتو) یا رد کند.</li>
                          <li><strong>جانشینی فاتح:</strong> در صورت پیروزی، رئیس‌جمهور فعلی از سمت خود خلع شده و شهردار مستقیماً جانشین او می‌شود. همچنین، <strong>رئیس‌جمهور خلع‌شده مستقیماً به عنوان متهم اول وارد دادگاه می‌شود</strong>.</li>
                          <li><strong>سقوط مسببان:</strong> در صورت شکست رای‌گیری در دادگاه، این شهردار است که جایگاه خود را به صورت کامل از دست داده و او به عنوان متهم وارد دادگاه به جهت محاکمه می‌گردد.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 7: Pope Veto Rules */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title="قوانین وتوی پاپ اعظم" defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20 text-amber-500 h-fit">
                        <Shield className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          نکات بسیار مهم درباره نقش وتو (استفاده از وتو تنها یک روز در میان و آن هم برای یک بار فعال می‌شود):
                        </p>
                        <ul className="text-xs text-amber-400 mt-2 space-y-2 list-disc list-inside">
                          <li>هر گاه پاپ حکمی را وتو کند (بازگرداندن شخصی از مرگ)، به واسطه هرج و مرجِ رخ داده <strong>یک قابلیت تروریست (عملیات انتحاری)</strong> بصورت اتفاقی میان بازیکنان ایجاد خواهد شد.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 8 */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title="قوانین جانشینی پاپ و کشیش" defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-[#0d1e2e] rounded border border-teal-500/20 text-teal-400 h-fit">
                        <History className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          ترتیب و ساختار کلیسا همواره در مجمع دارای اهمیت و قوانین پیوسته است:
                        </p>
                        <ul className="text-xs text-slate-300 mt-2 space-y-2 list-disc list-inside">
                          <li><strong>جانشینی خودکار پاپ:</strong> در صورت فوت پاپ، نرم‌افزار به صورت <strong>خودکار</strong> کشیش زنده را به مقام پاپ اعظم ارتقا می‌دهد و به او توانایی‌های پاپ و یک سپر اولیه اعطا می‌کند.</li>
                          <li><strong>شرط انتصاب کشیش جدید:</strong> پاپ اعظم برای تعیین کشیش جایگزین <strong>فقط</strong> می‌تواند از میان بازیکنان <strong className="text-amber-400">شهروند بدون نقش (ساده)</strong> یکی را انتخاب کند. اگر در بازی هیچ شهروند آزاد و بدون نقشی وجود نداشته باشد، پاپ باید تا ایجاد یک شهروند بدون نقش (مثلاً فرد آزاد شده از زندان) برای تعیین کشیش صبر کند.</li>
                          <li><strong>خالی ماندن صندلی کشیش (اختیاری):</strong> این انتصاب کاملاً <strong>اختیاری</strong> است. پاپ می‌تواند تصمیم بگیرد صندلی کشیش را خالی نگه دارد. اما باید توجه داشت که فرمان رهایی زندانیِ تالار منوط به امضای هر دو (پاپ و کشیش) است؛ پس تا زمان حضور کشیش جدید، قابلیت وتوی مرگ زندانی غیرفعال خواهد ماند.</li>
                          <li><strong>بحران فوت همزمان (قاعده ۸):</strong> تنها در صورتی که <strong>پاپ و کشیش هر دو به صورت قطعی کشته شده باشند</strong>، مجمع دچار بحران کلیسا می‌شود. در این موقعیت استثنایی، سیستم خودکار از رئیس‌جمهور می‌خواهد که سریعاً یک بازیکن زنده را برای مقام پاپ اعظم منصوب کند. در لیست پیشنهادی سیستم، اولویت همواره با شهروندان ساده (بدون نقش) است و نقش‌های قاضی و کشیش قطعاً در این لیست حضور نخواهند داشت.</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>

                {/* Rule Item 9 */}
                <div className="md:col-span-2">
                  <CollapsibleGuide title="قوانین سلسله‌مراتب جانشینی ریاست‌جمهوری" defaultOpen={false}>
                    <div className="flex gap-3">
                      <div className="p-2 bg-[#2d143c] rounded border border-purple-500/20 text-purple-400 h-fit">
                        <History className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          در صورت کشته‌شدن رئیس‌جمهور، سیستم مجمع به صورت خودکار زنجیره جانشینی زیر را طی می‌کند:
                        </p>
                        <ul className="text-xs text-slate-300 mt-2 space-y-2 list-disc list-inside">
                          <li><strong>جانشینی سطح اول (معاون اول):</strong> در صورتی که <strong>معاون اول</strong> در قید حیات باشد، بلافاصله و به صورت اتوماتیک مقام ریاست‌جمهوری را در دست می‌گیرد (سپر اولیه جدید دریافت می‌کند).</li>
                          <li><strong>جانشینی سطح دوم (شهردار):</strong> اگر معاون مرده باشد اما <strong>شهردار</strong> زنده باشد، مقام ریاست‌جمهوری اضطراراً به شهردار تفویض می‌گردد.</li>
                          <li><strong>جانشینی سطح ۵ (تصادفی در وضعیت بحران):</strong> چنانچه هم رئیس‌جمهور، هم معاون و هم شهردار به قتل رسیده باشند (مردگان اجرایی)، نرم‌افزار به صورت <strong>تصادفی</strong> یک نفر را از بین شهروندان جانشین می‌سازد.</li>
                          <li><strong>شفافیت تفکیک قوا:</strong> در این قرعه‌کشی تصادفیِ ریاست‌جمهوری، <strong>پاپ اعظم، کشیش، قاضی مجمع و تمام زندانیان</strong> اکیداً از لیست کاندیداها حذف شده‌اند و هرگز مجریه را در دست نخواهند گرفت. (در صورتی که فقط این افراد در بازی مانده باشند، جامعه بدون قوه مجریه خواهد ماند!).</li>
                        </ul>
                      </div>
                    </div>
                  </CollapsibleGuide>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4">
              <CollapsibleGuide title="توصیه‌های استراتژیک برای بازیکنان مجمع" defaultOpen={false}>
                <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
                  <p>۱. اگر <strong>شهروند مجمع</strong> هستید، دقت کنید که قدرت در مجمع متعلق به رئیس جمهورتان است. همواره برای حفظ پایداری کابینه بکوشید و از افتادن نقش قاضی به دست فراماسون‌های مرموز ممانعت کنید.</p>
                  <p>۲. به عنوان <strong>وکیل</strong>، شما ۱ دقیقه فرصت برای پایان روز دارید تا بتوانید درباره متهمین و پرونده‌های روزانه آنها صحبت کنید. شما می‌توانید از آن‌ها دفاع یا به آن‌ها حمله کنید.</p>
                  <p>۳. <strong>فراماسون‌ها</strong> تمایل دارند رئیس‌جمهور حامی خود را برپا کنند یا شهردار را برای انقلاب و کودتا برانگیزند تا کنترل مجمع را تماماً در دست بگیرند.</p>
                </div>
              </CollapsibleGuide>
            </div>
          </div>
        )}

        {/* 2. MODERATOR MODE */}
        {activeMode === 'moderator' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Intro / Mission */}
            <CollapsibleGuide title="بیانیه مأموریت و تعهد سیاسی گرداننده مجمع" defaultOpen={true}>
              <p className="text-xs text-slate-300 leading-relaxed">
                به عنوان گرداننده یا لیدر رسمی مجمع، شما نظم شب، استعلام‌های خبرنگار، تیرهای پلیس و حکم قضات را اداره می‌کنید. این نرم‌افزار به شما کمک می‌کند تمام فازها را راحت‌تر، دقیق‌تر و بدون اشتباه طی کنید.
              </p>
            </CollapsibleGuide>

            {/* Step-by-Step Moderator Guide */}
            <CollapsibleGuide title="گام‌های شبانه هدایت ترتیبی مجمع توسط لیدر" defaultOpen={false}>
              <div className="relative border-r-2 border-[#1e293b] pr-6 mr-3 space-y-4 text-right pt-2 pb-1">
                {/* Step 1 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">توزیع و رؤیت محرمانه هویت‌ها (روز صفر)</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    با وارد کردن نام‌ها، بازی را آغاز کنید. سپس بازیکنان را یکی‌یکی بیدار کرده تا با کلیک بر روی دکمه چشم سیستم، هویت مخفی خود (فراماسون به همراه شماره خود یا شهروند عادی) را دور از چشم دیگران بررسی کنند.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">مدیریت غصب قابلیت‌ها در شب</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    ابتدا کشیش (Priest) یا دزد (Thief) را بیدار کنید تا نقش هدفش را مختل سازد. این کار قبل از بیدار شدن مابقی نقش‌های اصلی شب الزامی است.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    3
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">اعمال استعلامات خبرنگار و گزارشگر</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    خبرنگار و گزارشگر را فراخوان کرده و نتایج را در پنل شب پیاده کنید تا گزارش‌های آنها به دست مجمع برسد. <strong>توجه مهم:</strong> افشای خبرنگار به هیچ وجه ربطی به ورود به دادگاه ندارد و او نمی‌تواند متهمی را به دادگاه بفرستد. <strong>فقط کارآگاه</strong> می‌تواند مستقیماً اتهام ورود به دادگاه را صادر نماید.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    4
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">اعمال نجات‌ها، شلیک‌ها و خروجی شب</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    نجات دکتر را بپرسید. شلیک‌های پلیس یا مافیا را اعمال کنید. فاز خروجی شب شامل کسانی که سپرهایشان شکسته یا کشته شده‌اند به بازی تسلیم می‌شود.
                  </p>
                </div>

                {/* Step 5 */}
                <div className="relative">
                  <span className="absolute -right-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold font-mono">
                    5
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 mb-1">مدیریت تروریست فعال و ترورهای غیرمنتظره</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    اگر در شب قبل پلیس شلیک کرده، به صورت تصادفی حتماً قابلیت تروریستی به یک بازیکن غیر‌تروریست داده شده است (در سیستم ثبت می‌گردد). لیدر باید بپرسد آیا تروریست قصد عملیات شبانه یا آغاز فردا را دارد یا خیر.
                  </p>
                </div>
              </div>
            </CollapsibleGuide>

            {/* Critical Moderator Checklist */}
            <CollapsibleGuide title="چک‌لیست حیاتی مدیریت و کنترل زندانیان مجمع حاکمیت" defaultOpen={false}>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed text-right">
                <li>به محض فرستادن بازیکنی به زندان با تصمیم قاضی در فاز روز، حتماً روی دکمهٔ <strong>«انتقال به زندان»</strong> روی کارت او کلیک کنید.</li>
                <li>سیستم به طور خودکار نقش او را خلع می‌کند اما هویت او برای شمارش‌های برد و باخت باقی می‌ماند و از حق رای‌گیری در مجمع محروم می‌شود.</li>
                <li><strong>قانون جدیدالورود:</strong> بازیکنی که تازه وارد زندان می‌شود، در همان روز نمی‌تواند هیچ حکم جدیدی (اعدام یا عفو) دریافت کند.</li>
                <li><strong>اختیار قاضی:</strong> قاضی کاملاً مختار است که در یک روز هیچکدام از زندانیان واجد شرایط را اعدام یا عفو نکند و آنها را در همان وضعیت حبس نگه دارد. صدور حکم برای زندان الزامی نیست.</li>
                <li>فراموش نکنید: رئیس‌جمهور، پاپ و قاضی هیچ‌گاه به زندان و دادگاه نرفته و متهم مجمع نمی‌گردند.</li>
              </ul>
            </CollapsibleGuide>
          </div>
        )}

        {/* 3. ROLES WIKI */}
        {activeMode === 'roles' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-200">کودکس و شناسنامه قدرت نقش‌ها</h3>
                <p className="text-[11px] text-slate-400">جستجوی سریع قابلیت‌های شب و روز هر یک از شخصیت‌های بازی مجمع</p>
              </div>
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="جستجوی نقش..."
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
                    <th scope="col" className="px-4 py-2 text-right">عنوان نقش</th>
                    <th scope="col" className="px-4 py-2 text-right">وظیفه روز</th>
                    <th scope="col" className="px-4 py-2 text-right">وظیفه شب</th>
                    <th scope="col" className="px-4 py-2 text-right">انتصاب دهنده</th>
                    <th scope="col" className="px-4 py-2 text-center">سپر دفاعی</th>
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
                              دارد
                            </span>
                          ) : (
                            <span className="text-slate-600">ـ</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {rolesList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 font-medium">
                        نقشی متناظر با جستجوی شما پیدا نشد.
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
                <strong>راهنمای مکانیزم سپر:</strong> نقش‌هایی نظیر رئیس‌جمهور، پاپ، شهردار و قاضی که اداره ارکان مجمع را برعهده دارند، در اولین نفوذ شبانه یا سوءقصد آسیب نمی‌بینند و بقای آنها وابسته به سپر است. شکستن سپر در فاز غسل شب مشخص می‌گردد.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer view */}
      <div className="mt-6 flex justify-between items-center text-xs text-slate-400 border-t border-[#1e293b] pt-4">
        <div className="flex gap-2 text-[10px] text-slate-500">
          <span>کد سناریو: MP-2026</span>
          <span>|</span>
          <span>نسخه پایدار ۱.۲</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition duration-200"
          >
            بستن راهنما
          </button>
        )}
      </div>
    </div>
  );
}
