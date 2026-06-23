import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { playTimerSound } from '../utils';

interface SpeakingTimerProps {
  onTimeEnd?: () => void;
  title?: string;
}

export default function SpeakingTimer({ onTimeEnd, title }: SpeakingTimerProps) {
  const { t, i18n } = useTranslation();
  const resolvedTitle = title ?? t('timer.title');
  const [time, setTime] = useState(30);
  const [running, setRunning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [alertText, setAlertText] = useState<string | null>(null);
  
  const hasWarned10 = useRef(false);
  const hasEnded = useRef(false);

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      // Cancel any ongoing speeches
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'en' ? 'en-US' : 'fa-IR';
      
      // Try to find a Persian voice if available, otherwise fallback to default
      const voices = window.speechSynthesis.getVoices();
      const matchPrefix = i18n.language === 'en' ? 'en' : 'fa';
      const voice = voices.find(v => v.lang.toLowerCase().startsWith(matchPrefix));
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running && time > 0) {
      interval = setInterval(() => {
        setTime((prev) => {
          const nextTime = prev - 1;
          
          // 10 seconds reminder
          if (nextTime === 10 && !hasWarned10.current) {
            hasWarned10.current = true;
            setAlertText(t('timer.warn10'));
            speak(t('timer.warn10Speech'));
            playTimerSound();
            setTimeout(() => setAlertText(null), 3000);
          }
          
          return nextTime;
        });
      }, 1000);
    } else if (time === 0 && running) {
      setRunning(false);
      if (!hasEnded.current) {
        hasEnded.current = true;
        setAlertText(t('timer.ended'));
        speak(t('timer.endedSpeech'));
        playTimerSound();
        if (onTimeEnd) {
          onTimeEnd();
        }
      }
    }
    return () => clearInterval(interval);
  }, [running, time, voiceEnabled]);

  const handleStartStop = () => {
    setRunning(!running);
  };

  const handleReset = () => {
    setRunning(false);
    setTime(30);
    hasWarned10.current = false;
    hasEnded.current = false;
    setAlertText(null);
  };

  // Progress percentage for circular/bar visualization
  const progressPercent = (time / 30) * 100;

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-between shadow-xl relative overflow-hidden w-full max-w-sm mx-auto text-right my-3" dir={i18n.dir()}>
      {/* Absolute top glow based on remaining time */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1 transition-all duration-500 ${
          time <= 5 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]' :
          time <= 10 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' :
          'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
        }`}
        style={{ width: `${progressPercent}%` }}
      />

      <div className="w-full flex items-center justify-between mb-3 text-slate-400">
        <span className="text-[10px] font-black tracking-wider text-slate-500 uppercase">{resolvedTitle}</span>
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-1.5 rounded-lg border transition-all ${
            voiceEnabled 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
              : 'bg-slate-950 text-slate-600 border-slate-900'
          }`}
          title={voiceEnabled ? t('timer.voiceOn') : t('timer.voiceOff')}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="flex items-center gap-6 w-full justify-center py-1">
        {/* Big Counter */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Pulsing effect in critical range */}
            {running && time <= 10 && (
              <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-ping" />
            )}
            <span className={`text-5xl font-extrabold font-mono tracking-tighter select-none ${
              time <= 5 ? 'text-rose-500' :
              time <= 10 ? 'text-amber-400' :
              'text-slate-100'
            }`}>
              {time}
              <span className="text-xs font-bold text-slate-500 mr-0.5">{t('timer.seconds')}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStartStop}
            className={`w-11 h-11 flex items-center justify-center rounded-xl font-bold transition-all shadow-md cursor-pointer ${
              running
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/10'
            }`}
          >
            {running ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
          
          <button
            onClick={handleReset}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 transition-all cursor-pointer"
            title={t('timer.restart')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating alert banners */}
      {alertText && (
        <div className="mt-2 text-[10px] font-bold py-1 px-3 rounded-full animate-bounce text-center w-full transition border bg-amber-950/20 text-amber-400 border-amber-500/20">
          {alertText}
        </div>
      )}
    </div>
  );
}
