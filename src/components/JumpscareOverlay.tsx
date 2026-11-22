import { useEffect, useState } from 'react';

interface JumpscareOverlayProps {
  active: boolean;
  exitDelayMs?: number;
  onClose: () => void;
}

export function JumpscareOverlay({ active, exitDelayMs = 2400, onClose }: JumpscareOverlayProps) {
  const [showExit, setShowExit] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!active) {
      setShowExit(false);
      return;
    }

    const delay = Math.min(8000, Math.max(500, exitDelayMs));
    const timer = window.setTimeout(() => {
      setShowExit(true);
    }, delay);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, onClose]);

  if (!active) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Alerta"
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Sudden strobe flash layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-red-600/80 via-white/90 to-red-800/80 animate-strobe-flash mix-blend-screen"
      />

      {/* Supernatural creature image */}
      {!imgError ? (
        <img
          src="/src/assets/images/jumpscare_creature_1795375620153.jpg"
          alt="Criatura sobrenatural"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center animate-jumpscare-lunge"
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center animate-jumpscare-lunge">
          <svg viewBox="0 0 200 200" className="w-80 h-80 text-red-600" aria-hidden="true">
            <circle cx="65" cy="75" r="14" fill="currentColor" />
            <circle cx="135" cy="75" r="14" fill="currentColor" />
            <ellipse cx="100" cy="145" rx="34" ry="44" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* Subtle dark edge vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.92)_100%)]"
      />

      {/* Discreet escape button that appears after the initial scare */}
      {showExit && (
        <button
          type="button"
          onClick={onClose}
          className="fixed bottom-6 right-6 z-30 px-4 py-2 text-xs font-medium text-white/75 bg-black/75 border border-white/20 rounded-md hover:text-white hover:bg-black transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Voltar para a página (Esc)
        </button>
      )}
    </div>
  );
}
