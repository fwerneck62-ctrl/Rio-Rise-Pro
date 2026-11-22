import { Clock, Zap } from 'lucide-react';

interface FlashOfferBannerProps {
  title: string;
  description: string;
  ctaLabel: string;
  remainingSeconds: number;
  onTrigger: () => void;
}

export function formatCountdown(totalSeconds: number): { minutes: string; seconds: string } {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return {
    minutes: String(mins).padStart(2, '0'),
    seconds: String(secs).padStart(2, '0'),
  };
}

export function FlashOfferBanner({
  title,
  description,
  ctaLabel,
  remainingSeconds,
  onTrigger,
}: FlashOfferBannerProps) {
  const { minutes, seconds } = formatCountdown(remainingSeconds);

  return (
    <div className="mb-10 p-6 sm:p-8 bg-[#121824] border border-[#FACC15]/45 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="max-w-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#FACC15] mb-2">
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Oferta Relâmpago · Acesso gratuito por tempo limitado</span>
        </div>
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
        {/* Dynamic tabular countdown */}
        <div
          aria-label={`Tempo restante da oferta relâmpago: ${minutes} minutos e ${seconds} segundos`}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#090B10] border border-white/15 rounded-lg"
        >
          <div className="flex flex-col items-center min-w-[2.5rem]">
            <span className="font-mono text-2xl font-bold text-[#FACC15] tabular-nums leading-none">
              {minutes}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">min</span>
          </div>
          <span className="font-mono text-2xl font-bold text-slate-500 leading-none pb-3" aria-hidden="true">
            :
          </span>
          <div className="flex flex-col items-center min-w-[2.5rem]">
            <span className="font-mono text-2xl font-bold text-[#FACC15] tabular-nums leading-none">
              {seconds}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">seg</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onTrigger}
          className="inline-flex items-center justify-center gap-2.5 px-7 py-4 min-h-[56px] text-base font-extrabold tracking-wide text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg shadow-[0_0_28px_rgba(250,204,21,0.25)] transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FACC15]"
        >
          <Zap className="w-5 h-5 fill-current" aria-hidden="true" />
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
