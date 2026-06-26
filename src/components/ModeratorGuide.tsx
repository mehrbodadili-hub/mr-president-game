import { useEffect, useRef } from 'react';
import { ClipboardList, X, Moon, Sun, Layers } from 'lucide-react';
import { MODERATOR_GUIDE_ITEMS } from '../constants/moderatorGuideData';

interface ModeratorGuideProps {
  onClose?: () => void;
  defaultScrollToId?: string;
}

const PHASE_META = {
  night: { label: 'شب', icon: Moon, cls: 'bg-indigo-950/40 text-indigo-300 border-indigo-900/40' },
  day: { label: 'روز', icon: Sun, cls: 'bg-amber-950/40 text-amber-300 border-amber-900/40' },
  both: { label: 'روز و شب', icon: Layers, cls: 'bg-teal-950/40 text-teal-300 border-teal-900/40' },
} as const;

export default function ModeratorGuide({ onClose, defaultScrollToId }: ModeratorGuideProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!defaultScrollToId) return;
    const el = document.getElementById(`mod-guide-${defaultScrollToId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-teal-500', 'shadow-2xl', 'shadow-teal-500/20');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-teal-500', 'shadow-2xl', 'shadow-teal-500/20');
        }, 2200);
      }, 120);
    }
  }, [defaultScrollToId]);

  return (
    <div
      ref={containerRef}
      className="bg-[#0b0f19] border border-[#1e293b] rounded-2xl shadow-2xl max-w-3xl w-full text-right max-h-[85vh] overflow-y-auto"
      dir="rtl"
    >
      <div className="sticky top-0 z-10 bg-[#0b0f19]/95 backdrop-blur border-b border-[#1e293b] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">
              راهنمای گرداننده
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">چک‌لیست گام‌به‌گام شب و قوانین مهم زندان و آشوب</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-3">
        {MODERATOR_GUIDE_ITEMS.map((item, idx) => {
          const meta = PHASE_META[item.phase];
          const Icon = meta.icon;
          return (
            <div
              key={item.id}
              id={`mod-guide-${item.id}`}
              className="bg-[#050810] border border-slate-900 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-amber-400 text-[10px] font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-black text-slate-100">{item.title}</h3>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.cls}`}>
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>
              <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                {item.content}
              </p>
              {item.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}