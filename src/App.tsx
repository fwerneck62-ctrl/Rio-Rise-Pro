import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Clock,
  Menu,
  Play,
  X,
  Zap,
} from 'lucide-react';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminPanel } from './components/AdminPanel';
import { FlashOfferBanner, formatCountdown } from './components/FlashOfferBanner';
import { JumpscareOverlay } from './components/JumpscareOverlay';
import {
  DEFAULT_SITE_CONFIG,
  ModuleCategory,
  PricingPlan,
  SiteConfig,
} from './data/rioRiseData';
import { playSupernaturalScream, ScreamController } from './utils/scareAudio';

const FILTER_OPTIONS: { id: ModuleCategory; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'autofarm', label: 'Auto-Farm' },
  { id: 'vehicles', label: 'Veículos' },
  { id: 'bypass', label: 'Bypass' },
];

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [activeFilter, setActiveFilter] = useState<ModuleCategory>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('teste');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [moduleImgErrors, setModuleImgErrors] = useState<Record<string, boolean>>({});

  const [jumpscareActive, setJumpscareActive] = useState(false);
  const screamControllerRef = useRef<ScreamController | null>(null);

  // Admin state (token kept strictly in React memory)
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [envManaged, setEnvManaged] = useState(false);

  // Per-visit dynamic Flash Offer countdown (resets on every visit)
  const [flashRemaining, setFlashRemaining] = useState<number>(
    DEFAULT_SITE_CONFIG.flashOffer.durationSeconds
  );

  // 5-click footer trigger refs
  const footerClickCountRef = useRef(0);
  const footerClickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/config')
      .then(async (res) => {
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as SiteConfig;
        if (!cancelled && data && data.brand && data.hero) {
          setConfig(data);
          if (data.flashOffer?.durationSeconds) {
            setFlashRemaining(data.flashOffer.durationSeconds);
          }
        }
      })
      .catch(() => {
        // Keep DEFAULT_SITE_CONFIG if offline
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const resetSeconds = config.flashOffer?.durationSeconds ?? 587;
    const interval = window.setInterval(() => {
      setFlashRemaining((prev) => (prev <= 1 ? resetSeconds : prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [config.flashOffer?.durationSeconds]);

  const triggerJumpscare = useCallback(
    (overrideSettings?: SiteConfig['jumpscare']) => {
      const settings = overrideSettings ?? config.jumpscare;
      setSelectedPlan(null);
      setMobileMenuOpen(false);

      // Stop any previous sound cleanly
      screamControllerRef.current?.stop();

      // Start Web Audio supernatural shriek synchronously inside the user gesture
      screamControllerRef.current = playSupernaturalScream({
        volume: settings.volume,
        durationSeconds: settings.durationSeconds,
      });

      // Show creature overlay immediately
      setJumpscareActive(true);

      // Attempt fullscreen for maximum immersion (safely ignored if blocked by iframe)
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          void document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // Ignore fullscreen restrictions
      }
    },
    [config.jumpscare]
  );

  const closeJumpscare = useCallback(() => {
    screamControllerRef.current?.stop();
    screamControllerRef.current = null;
    setJumpscareActive(false);

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        void document.exitFullscreen().catch(() => {});
      }
    } catch {
      // Ignore fullscreen exit errors
    }
  }, []);

  const handleFooterTextClick = () => {
    footerClickCountRef.current += 1;

    if (footerClickTimerRef.current !== null) {
      window.clearTimeout(footerClickTimerRef.current);
    }

    if (footerClickCountRef.current >= 5) {
      footerClickCountRef.current = 0;
      footerClickTimerRef.current = null;

      if (adminToken) {
        setAdminPanelOpen(true);
      } else {
        setAdminAuthOpen(true);
      }
      return;
    }

    footerClickTimerRef.current = window.setTimeout(() => {
      footerClickCountRef.current = 0;
      footerClickTimerRef.current = null;
    }, 2500);
  };

  const filteredModules =
    activeFilter === 'all'
      ? config.modulesSection.modules
      : config.modulesSection.modules.filter((mod) => mod.category === activeFilter);

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col">
      {/* Hidden preload of jumpscare creature so frame 1 renders with zero delay */}
      <img
        src="/src/assets/images/jumpscare_creature_1795375620153.jpg"
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        className="fixed top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-50"
      />

      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-[#090B10]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#topo"
            className="font-display text-2xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            {config.brand.primary}{' '}
            <span className="text-[#00D4FF]">{config.brand.accent}</span>
          </a>

          {/* Zone 2: 4 concise single-line text links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
          >
            <a
              href="#modulos"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Módulos
            </a>
            <a
              href="#recursos"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Recursos
            </a>
            <a
              href="#planos"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Planos
            </a>
            <a
              href="#duvidas"
              className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Dúvidas
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => triggerJumpscare()}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg transition-transform duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FACC15]"
            >
              <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
              {config.hero.ctaLabel}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-white/10 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0D1017] px-6 py-4 flex flex-col gap-3">
            <a
              href="#modulos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-200 hover:text-white"
            >
              Módulos
            </a>
            <a
              href="#recursos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-200 hover:text-white"
            >
              Recursos
            </a>
            <a
              href="#planos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-200 hover:text-white"
            >
              Planos
            </a>
            <a
              href="#duvidas"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-slate-200 hover:text-white"
            >
              Dúvidas
            </a>
            <button
              type="button"
              onClick={() => triggerJumpscare()}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
              {config.hero.ctaLabel}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="topo" className="relative overflow-hidden border-b border-white/10">
          {/* Background key art */}
          <div className="absolute inset-0 z-0">
            {!heroImgFailed ? (
              <img
                src="/src/assets/images/rio_rise_hero_1795375620327.jpg"
                alt="Cenário noturno urbano no estilo Rio Rise com carro esportivo e moto"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0E1726] via-[#090B10] to-[#141A29]" />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#090B10] via-[#090B10]/85 to-[#090B10]/30"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#090B10] via-transparent to-[#090B10]/55"
            />
          </div>

          <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-20 lg:py-28">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#00D4FF] mb-4">
                <span>{config.hero.kicker}</span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.03] mb-6"
                style={{
                  fontSize: 'clamp(2.5rem, 4.8vw, 4.25rem)',
                  textWrap: 'balance',
                }}
              >
                {config.hero.title}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-xl">
                {config.hero.subtitle}
              </p>

              {/* Single Dominant Primary CTA: TESTE GRÁTIS */}
              <div className="flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => triggerJumpscare()}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 min-h-[54px] text-base font-extrabold tracking-wide text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg shadow-[0_0_32px_rgba(250,204,21,0.28)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FACC15]"
                >
                  <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                  {config.hero.ctaLabel}
                </button>

                <a
                  href="#planos"
                  className="text-sm font-semibold text-slate-200 hover:text-[#00D4FF] underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 py-2"
                >
                  {config.hero.secondaryCtaLabel}
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#FACC15] tabular-nums">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Oferta Relâmpago: {formatCountdown(flashRemaining).minutes}:
                  {formatCountdown(flashRemaining).seconds}
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-400">{config.hero.note}</span>
              </div>
            </div>
          </div>

          {/* Full-width 4-column proof metrics strip */}
          <div className="relative z-10 border-t border-white/10 bg-[#090B10]/85 backdrop-blur-sm">
            <div className="max-w-[1200px] mx-auto px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {config.hero.metrics.map((metric, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums">
                    {metric.value}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-400">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Módulos de Automação & Mod Menu */}
        <section id="modulos" className="max-w-[1200px] mx-auto px-6 py-20 border-b border-white/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#00D4FF] mb-2">
                {config.modulesSection.kicker}
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
                style={{ textWrap: 'balance' }}
              >
                {config.modulesSection.title}
              </h2>
            </div>

            {/* Interactive category filter controls */}
            <div
              role="tablist"
              aria-label="Filtrar módulos por categoria"
              className="flex items-center gap-1 p-1 bg-[#11151E] border border-white/10 rounded-lg self-start"
            >
              {FILTER_OPTIONS.map((option) => {
                const isActive = activeFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveFilter(option.id)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#00D4FF] text-[#090B10]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredModules.map((mod) => {
              const hasImage = Boolean(mod.image);
              const imgFailed = moduleImgErrors[mod.id];

              return (
                <article
                  key={mod.id}
                  className="bg-[#11151E] border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between"
                >
                  {hasImage && (
                    <div className="relative aspect-[4/3] w-full bg-[#0D1017] overflow-hidden border-b border-white/10">
                      {!imgFailed && mod.image ? (
                        <img
                          src={mod.image}
                          alt={mod.imageAlt ?? mod.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setModuleImgErrors((prev) => ({ ...prev, [mod.id]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111827] to-[#090B10] px-6 text-center">
                          <span className="font-display text-xl font-bold text-slate-300">
                            {mod.title}
                          </span>
                        </div>
                      )}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#11151E] via-transparent to-transparent"
                      />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <span className="font-semibold text-[#00D4FF]">{mod.index}</span>
                        <span>{mod.categoryLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{mod.platform}</span>
                      </div>

                      <h3 className="font-display text-2xl font-bold text-white mb-2">
                        {mod.title}
                      </h3>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/10 text-xs text-slate-400 tabular-nums">
                      {mod.metrics}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Section 3: Como funciona na prática + Recursos */}
        <section id="recursos" className="max-w-[1200px] mx-auto px-6 py-20 border-b border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold text-[#00D4FF] mb-2">
                {config.featuresSection.kicker}
              </p>
              <h2
                className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4"
                style={{ textWrap: 'balance' }}
              >
                {config.featuresSection.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                {config.featuresSection.description}
              </p>

              <button
                type="button"
                onClick={() => triggerJumpscare()}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-extrabold text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
                {config.featuresSection.ctaLabel}
              </button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.featuresSection.cards.map((card, idx) => (
                <div key={idx} className="p-6 bg-[#11151E] border border-white/10 rounded-xl">
                  <p className="text-xs font-semibold text-[#00D4FF] mb-2">{card.kicker}</p>
                  <h3 className="font-display text-xl font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Planos do Mod & Destaque TESTE GRÁTIS */}
        <section id="planos" className="max-w-[1200px] mx-auto px-6 py-20 border-b border-white/10">
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#00D4FF] mb-2">
              {config.plansSection.kicker}
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {config.plansSection.title}
            </h2>
          </div>

          {/* Dynamic Oferta Relâmpago Banner (resets every visit) */}
          <FlashOfferBanner
            title={config.flashOffer?.title ?? DEFAULT_SITE_CONFIG.flashOffer.title}
            description={
              config.flashOffer?.description ?? DEFAULT_SITE_CONFIG.flashOffer.description
            }
            ctaLabel={config.flashOffer?.ctaLabel ?? DEFAULT_SITE_CONFIG.flashOffer.ctaLabel}
            remainingSeconds={flashRemaining}
            onTrigger={() => triggerJumpscare()}
          />

          {/* 4 Duration Pricing Tiers (1, 7, 15, 30 dias) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {config.plansSection.plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-xl border flex flex-col justify-between ${
                  plan.highlighted
                    ? 'bg-[#141A26] border-[#00D4FF]/60'
                    : 'bg-[#11151E] border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-display text-2xl font-bold text-white">
                      {plan.name}
                    </h3>
                    {plan.highlighted && (
                      <span className="text-xs font-semibold text-[#00D4FF] whitespace-nowrap">
                        Mais escolhido
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-5">
                    {plan.tagline}
                  </p>

                  <div className="flex items-baseline gap-1.5 mb-5 pb-5 border-b border-white/10">
                    <span className="text-sm font-medium text-slate-400">R$</span>
                    <span className="font-display text-4xl font-extrabold text-white tabular-nums">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-400">{plan.durationLabel}</span>
                  </div>

                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-200">
                        <Check
                          className="w-4 h-4 text-[#00D4FF] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-3 px-4 text-sm font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    plan.highlighted
                      ? 'bg-[#00D4FF] hover:bg-[#38BDF8] text-[#090B10]'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  Selecionar {plan.name}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Perguntas Frequentes */}
        <section id="duvidas" className="max-w-[900px] mx-auto px-6 py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#00D4FF] mb-2">
              {config.faqSection.kicker}
            </p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              {config.faqSection.title}
            </h2>
          </div>

          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {config.faqSection.items.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                  >
                    <span className="text-base font-semibold text-white group-hover:text-[#00D4FF] transition-colors">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-[#00D4FF]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-5 text-sm text-slate-300 leading-relaxed max-w-2xl">
                      {item.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Quiet Footer (5 clicks on the footer text opens Admin Setup / Login) */}
      <footer className="border-t border-white/10 bg-[#07090D]">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            {config.brand.primary}{' '}
            <span className="text-[#00D4FF]">{config.brand.accent}</span>
          </span>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#modulos" className="hover:text-white transition-colors">
              Módulos
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
            <a href="#duvidas" className="hover:text-white transition-colors">
              Dúvidas
            </a>
            <span
              onClick={handleFooterTextClick}
              className="select-none"
            >
              {config.brand.footerText}
            </span>
          </div>
        </div>
      </footer>

      {/* Plan Modal redirecting user cleanly into the TESTE GRÁTIS trigger */}
      {selectedPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-[#11151E] border border-white/15 rounded-xl p-6 relative">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              aria-label="Fechar janela"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <p className="text-xs font-semibold text-[#00D4FF] mb-1">
              Plano {selectedPlan.name} · R$ {selectedPlan.price} {selectedPlan.durationLabel}
            </p>
            <h3 id="plan-modal-title" className="font-display text-2xl font-bold text-white mb-2">
              Ative o Teste Grátis antes de assinar
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Para evitar qualquer compra sem testar no seu aparelho, liberamos primeiro 24 horas do{' '}
              {selectedPlan.name} gratuitamente no seu dispositivo.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => triggerJumpscare()}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" aria-hidden="true" />
                {config.hero.ctaLabel} AGORA
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="w-full py-2.5 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Voltar aos planos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin First-Time Setup / Login Modal */}
      <AdminAuthModal
        open={adminAuthOpen}
        onClose={() => setAdminAuthOpen(false)}
        onAuthenticated={(token, isEnvManaged) => {
          setAdminToken(token);
          setEnvManaged(isEnvManaged);
          setAdminAuthOpen(false);
          setAdminPanelOpen(true);
        }}
      />

      {/* Full Admin Panel Editor */}
      {adminPanelOpen && adminToken && (
        <AdminPanel
          open={adminPanelOpen}
          config={config}
          token={adminToken}
          envManaged={envManaged}
          onClose={() => setAdminPanelOpen(false)}
          onConfigSaved={(updated) => setConfig(updated)}
          onTestJumpscare={(settings) => triggerJumpscare(settings)}
          onSessionExpired={() => {
            setAdminToken(null);
            setAdminPanelOpen(false);
            setAdminAuthOpen(true);
          }}
        />
      )}

      {/* Fullscreen Supernatural Jumpscare Overlay */}
      <JumpscareOverlay
        active={jumpscareActive}
        exitDelayMs={config.jumpscare.exitDelayMs}
        onClose={closeJumpscare}
      />
    </div>
  );
}
