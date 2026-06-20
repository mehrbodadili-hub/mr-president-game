import { Player } from '../types';

export default function Night0Terrorist({ players }: { players: Player[] }) {
  const terrorist = players.find(p => p.hasTerroristAbility && p.isAlive);
  if (!terrorist) return null;
  return (
    <div className="bg-purple-950/20 p-4 border border-purple-900/40 rounded-xl mb-6 text-right space-y-2">
      <h4 className="text-xs font-bold text-purple-300">هویت تروریست مجمع:</h4>
      <div className="text-xs font-semibold text-purple-200">
        • {terrorist.name}
      </div>
      <p className="text-[10px] text-purple-400 mt-2 font-medium leading-relaxed">
        <strong>نکته مهم:</strong> تنها شبی که تروریست نمی‌تواند اقدامی بکند همین شب (شب صفر) است و قابلیت او از فردا قابل استفاده خواهد بود. قوانین تروریست فقط همین استثنا را دارد و در بقیه بازی شرایط تروریست تغییری نکرده است.
      </p>
    </div>
  );
}
