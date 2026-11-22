import { FormEvent, useEffect, useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';

interface AdminAuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (token: string, envManaged: boolean) => void;
}

export function AdminAuthModal({ open, onClose, onAuthenticated }: AdminAuthModalProps) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [envManaged, setEnvManaged] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      return;
    }

    let cancelled = false;
    setLoadingStatus(true);
    setError('');

    fetch('/api/admin/status')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Falha ao verificar status do servidor.');
        }
        return (await res.json()) as { configured: boolean; envManaged: boolean };
      })
      .then((data) => {
        if (!cancelled) {
          setConfigured(data.configured);
          setEnvManaged(data.envManaged);
          setLoadingStatus(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Não foi possível conectar ao servidor.');
          setLoadingStatus(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!configured) {
      if (password.length < 4) {
        setError('A senha precisa ter pelo menos 4 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }
    } else if (!password) {
      setError('Digite sua senha de administrador.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = configured ? '/api/admin/login' : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        token?: string;
        error?: string;
      };

      if (!res.ok || !data.token) {
        setError(data.error || 'Erro ao autenticar.');
        setSubmitting(false);
        return;
      }

      onAuthenticated(data.token, envManaged);
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-auth-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-[#11151E] border border-white/15 rounded-xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar login"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {loadingStatus ? (
          <div className="py-10 text-center text-sm text-slate-300">
            Verificando acesso administrativo...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00D4FF]">
              {configured ? (
                <Lock className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{configured ? 'Acesso Restrito' : 'Primeiro Acesso'}</span>
            </div>

            <div>
              <h2
                id="admin-auth-title"
                className="font-display text-2xl font-bold text-white"
              >
                {configured
                  ? 'Entrar na Administração'
                  : 'Criar Senha de Administrador'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {configured
                  ? 'Digite sua senha para editar textos, preços, rodapé e configurações da pegadinha.'
                  : 'Como este é o primeiro acesso, defina a senha que protegerá o painel administrativo.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3 text-xs font-medium text-red-200 bg-red-950/60 border border-red-500/40 rounded-lg"
              >
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="admin-password-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  {configured ? 'Senha' : 'Nova senha (mínimo 4 caracteres)'}
                </label>
                <input
                  id="admin-password-input"
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="w-full px-3.5 py-2.5 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
                />
              </div>

              {!configured && (
                <div>
                  <label
                    htmlFor="admin-password-confirm"
                    className="block text-xs font-medium text-slate-300 mb-1.5"
                  >
                    Confirmar senha
                  </label>
                  <input
                    id="admin-password-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-3.5 py-2.5 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-bold text-[#090B10] bg-[#00D4FF] hover:bg-[#38BDF8] disabled:opacity-60 rounded-lg cursor-pointer"
              >
                {submitting
                  ? 'Aguarde...'
                  : configured
                    ? 'Entrar no Painel'
                    : 'Criar Senha e Entrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
