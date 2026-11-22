import { FormEvent, useState } from 'react';
import {
  Check,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { SiteConfig } from '../data/rioRiseData';

type AdminTab = 'geral' | 'modulos' | 'planos' | 'recursos' | 'pegadinha';

interface AdminPanelProps {
  open: boolean;
  config: SiteConfig;
  token: string;
  envManaged: boolean;
  onClose: () => void;
  onConfigSaved: (updated: SiteConfig) => void;
  onTestJumpscare: (settings: SiteConfig['jumpscare']) => void;
  onSessionExpired: () => void;
}

export function AdminPanel({
  open,
  config,
  token,
  envManaged,
  onClose,
  onConfigSaved,
  onTestJumpscare,
  onSessionExpired,
}: AdminPanelProps) {
  const [draft, setDraft] = useState<SiteConfig>(() => structuredClone(config));
  const [activeTab, setActiveTab] = useState<AdminTab>('geral');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  if (!open) {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draft),
      });

      if (res.status === 401) {
        onSessionExpired();
        return;
      }

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setFeedback({ type: 'err', text: err.error || 'Erro ao salvar alterações.' });
        return;
      }

      const updated = (await res.json()) as SiteConfig;
      setDraft(structuredClone(updated));
      onConfigSaved(updated);
      setFeedback({ type: 'ok', text: 'Alterações salvas e publicadas!' });
    } catch {
      setFeedback({ type: 'err', text: 'Erro de conexão ao salvar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setResetting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/reset-config', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        onSessionExpired();
        return;
      }

      if (!res.ok) {
        setFeedback({ type: 'err', text: 'Não foi possível restaurar os padrões.' });
        return;
      }

      const updated = (await res.json()) as SiteConfig;
      setDraft(structuredClone(updated));
      onConfigSaved(updated);
      setFeedback({ type: 'ok', text: 'Configurações restauradas ao padrão original.' });
    } catch {
      setFeedback({ type: 'err', text: 'Erro de conexão.' });
    } finally {
      setResetting(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setFeedback({ type: 'err', text: 'A nova senha precisa ter pelo menos 4 caracteres.' });
      return;
    }

    setChangingPass(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.status === 401 && !currentPassword) {
        onSessionExpired();
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'Não foi possível alterar a senha.' });
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setFeedback({ type: 'ok', text: 'Senha de administrador atualizada.' });
    } catch {
      setFeedback({ type: 'err', text: 'Erro ao atualizar a senha.' });
    } finally {
      setChangingPass(false);
    }
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'geral', label: 'Geral & Rodapé' },
    { id: 'modulos', label: 'Módulos' },
    { id: 'planos', label: 'Planos & Preços' },
    { id: 'recursos', label: 'Recursos & FAQ' },
    { id: 'pegadinha', label: 'Susto & Senha' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Painel Administrativo"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <div className="w-full max-w-5xl h-[90vh] bg-[#0E121B] border border-white/15 rounded-xl flex flex-col overflow-hidden">
        {/* Top Admin Bar */}
        <div className="px-6 py-4 bg-[#11151E] border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Administração da Página
            </h2>
            <p className="text-xs text-slate-400">
              Edite textos, preços, rodapé e comportamento do susto. Clique em Salvar para publicar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] disabled:opacity-60 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 bg-white/10 hover:bg-white/15 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Fechar
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-[#0B0E15] border-b border-white/10 flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#00D4FF] text-[#090B10]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`mx-6 mt-4 px-4 py-2.5 text-xs font-medium rounded-lg border flex items-center gap-2 ${
              feedback.type === 'ok'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}
          >
            {feedback.type === 'ok' && <Check className="w-4 h-4 shrink-0" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                <h3 className="font-display text-lg font-bold text-white">
                  Marca e Texto do Rodapé
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field
                    label="Nome da Marca"
                    value={draft.brand.primary}
                    onChange={(v) =>
                      setDraft({ ...draft, brand: { ...draft.brand, primary: v } })
                    }
                  />
                  <Field
                    label="Destaque da Marca"
                    value={draft.brand.accent}
                    onChange={(v) =>
                      setDraft({ ...draft, brand: { ...draft.brand, accent: v } })
                    }
                  />
                  <Field
                    label="Texto do Rodapé (5 cliques)"
                    value={draft.brand.footerText}
                    onChange={(v) =>
                      setDraft({ ...draft, brand: { ...draft.brand, footerText: v } })
                    }
                  />
                </div>
              </div>

              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                <h3 className="font-display text-lg font-bold text-white">
                  Capa Principal (Hero)
                </h3>
                <Field
                  label="Linha superior (Kicker)"
                  value={draft.hero.kicker}
                  onChange={(v) => setDraft({ ...draft, hero: { ...draft.hero, kicker: v } })}
                />
                <Field
                  label="Título Principal"
                  value={draft.hero.title}
                  onChange={(v) => setDraft({ ...draft, hero: { ...draft.hero, title: v } })}
                />
                <TextAreaField
                  label="Descrição"
                  value={draft.hero.subtitle}
                  onChange={(v) => setDraft({ ...draft, hero: { ...draft.hero, subtitle: v } })}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Texto do Botão Principal (Susto)"
                    value={draft.hero.ctaLabel}
                    onChange={(v) =>
                      setDraft({ ...draft, hero: { ...draft.hero, ctaLabel: v } })
                    }
                  />
                  <Field
                    label="Link Secundário"
                    value={draft.hero.secondaryCtaLabel}
                    onChange={(v) =>
                      setDraft({ ...draft, hero: { ...draft.hero, secondaryCtaLabel: v } })
                    }
                  />
                </div>
                <Field
                  label="Nota abaixo do botão"
                  value={draft.hero.note}
                  onChange={(v) => setDraft({ ...draft, hero: { ...draft.hero, note: v } })}
                />
              </div>

              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                <h3 className="font-display text-lg font-bold text-white">
                  Indicadores de Destaque (Faixa abaixo da capa)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draft.hero.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 bg-[#090B10] border border-white/10 rounded-lg grid grid-cols-2 gap-3">
                      <Field
                        label={`Valor ${idx + 1}`}
                        value={m.value}
                        onChange={(v) => {
                          const next = [...draft.hero.metrics];
                          next[idx] = { ...next[idx], value: v };
                          setDraft({ ...draft, hero: { ...draft.hero, metrics: next } });
                        }}
                      />
                      <Field
                        label={`Legenda ${idx + 1}`}
                        value={m.label}
                        onChange={(v) => {
                          const next = [...draft.hero.metrics];
                          next[idx] = { ...next[idx], label: v };
                          setDraft({ ...draft, hero: { ...draft.hero, metrics: next } });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modulos' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Subtítulo da Seção"
                  value={draft.modulesSection.kicker}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      modulesSection: { ...draft.modulesSection, kicker: v },
                    })
                  }
                />
                <Field
                  label="Título da Seção"
                  value={draft.modulesSection.title}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      modulesSection: { ...draft.modulesSection, title: v },
                    })
                  }
                />
              </div>

              {draft.modulesSection.modules.map((mod, idx) => (
                <div key={mod.id} className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold text-[#00D4FF]">
                      Módulo {mod.index} — {mod.title}
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Índice"
                      value={mod.index}
                      onChange={(v) => {
                        const mods = [...draft.modulesSection.modules];
                        mods[idx] = { ...mods[idx], index: v };
                        setDraft({
                          ...draft,
                          modulesSection: { ...draft.modulesSection, modules: mods },
                        });
                      }}
                    />
                    <Field
                      label="Rótulo da Categoria"
                      value={mod.categoryLabel}
                      onChange={(v) => {
                        const mods = [...draft.modulesSection.modules];
                        mods[idx] = { ...mods[idx], categoryLabel: v };
                        setDraft({
                          ...draft,
                          modulesSection: { ...draft.modulesSection, modules: mods },
                        });
                      }}
                    />
                    <Field
                      label="Plataforma / Subtítulo"
                      value={mod.platform}
                      onChange={(v) => {
                        const mods = [...draft.modulesSection.modules];
                        mods[idx] = { ...mods[idx], platform: v };
                        setDraft({
                          ...draft,
                          modulesSection: { ...draft.modulesSection, modules: mods },
                        });
                      }}
                    />
                  </div>
                  <Field
                    label="Título do Módulo"
                    value={mod.title}
                    onChange={(v) => {
                      const mods = [...draft.modulesSection.modules];
                      mods[idx] = { ...mods[idx], title: v };
                      setDraft({
                        ...draft,
                        modulesSection: { ...draft.modulesSection, modules: mods },
                      });
                    }}
                  />
                  <TextAreaField
                    label="Descrição"
                    value={mod.description}
                    onChange={(v) => {
                      const mods = [...draft.modulesSection.modules];
                      mods[idx] = { ...mods[idx], description: v };
                      setDraft({
                        ...draft,
                        modulesSection: { ...draft.modulesSection, modules: mods },
                      });
                    }}
                  />
                  <Field
                    label="Métrica / Rodapé do Card"
                    value={mod.metrics}
                    onChange={(v) => {
                      const mods = [...draft.modulesSection.modules];
                      mods[idx] = { ...mods[idx], metrics: v };
                      setDraft({
                        ...draft,
                        modulesSection: { ...draft.modulesSection, modules: mods },
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'planos' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                <h3 className="font-display text-lg font-bold text-white">
                  Cabeçalho &amp; Oferta Relâmpago
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Kicker dos Planos"
                    value={draft.plansSection.kicker}
                    onChange={(v) =>
                      setDraft({ ...draft, plansSection: { ...draft.plansSection, kicker: v } })
                    }
                  />
                  <Field
                    label="Título da Seção"
                    value={draft.plansSection.title}
                    onChange={(v) =>
                      setDraft({ ...draft, plansSection: { ...draft.plansSection, title: v } })
                    }
                  />
                  <Field
                    label="Botão da Oferta Relâmpago"
                    value={draft.flashOffer.ctaLabel}
                    onChange={(v) =>
                      setDraft({
                        ...draft,
                        flashOffer: { ...draft.flashOffer, ctaLabel: v },
                      })
                    }
                  />
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Duração do Contador por Visita (segundos)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={3599}
                      value={draft.flashOffer.durationSeconds}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          flashOffer: {
                            ...draft.flashOffer,
                            durationSeconds: Math.min(
                              3599,
                              Math.max(30, Number(e.target.value) || 30)
                            ),
                          },
                        })
                      }
                      className="w-full px-3.5 py-2 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
                    />
                  </div>
                </div>
                <Field
                  label="Título da Oferta Relâmpago"
                  value={draft.flashOffer.title}
                  onChange={(v) =>
                    setDraft({ ...draft, flashOffer: { ...draft.flashOffer, title: v } })
                  }
                />
                <TextAreaField
                  label="Descrição da Oferta Relâmpago"
                  value={draft.flashOffer.description}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      flashOffer: { ...draft.flashOffer, description: v },
                    })
                  }
                />
              </div>

              {draft.plansSection.plans.map((plan, pIdx) => (
                <div key={plan.id} className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-display text-xl font-bold text-[#00D4FF]">
                      {plan.name}
                    </h4>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(plan.highlighted)}
                        onChange={(e) => {
                          const plans = [...draft.plansSection.plans];
                          plans[pIdx] = { ...plans[pIdx], highlighted: e.target.checked };
                          setDraft({
                            ...draft,
                            plansSection: { ...draft.plansSection, plans },
                          });
                        }}
                        className="accent-[#00D4FF]"
                      />
                      Destacar como &quot;Mais escolhido&quot;
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Nome do Plano"
                      value={plan.name}
                      onChange={(v) => {
                        const plans = [...draft.plansSection.plans];
                        plans[pIdx] = { ...plans[pIdx], name: v };
                        setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                      }}
                    />
                    <Field
                      label="Preço (R$)"
                      value={plan.price}
                      onChange={(v) => {
                        const plans = [...draft.plansSection.plans];
                        plans[pIdx] = { ...plans[pIdx], price: v };
                        setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                      }}
                    />
                    <Field
                      label="Duração (ex: / 7 dias)"
                      value={plan.durationLabel}
                      onChange={(v) => {
                        const plans = [...draft.plansSection.plans];
                        plans[pIdx] = { ...plans[pIdx], durationLabel: v };
                        setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                      }}
                    />
                  </div>

                  <Field
                    label="Subtítulo do Plano"
                    value={plan.tagline}
                    onChange={(v) => {
                      const plans = [...draft.plansSection.plans];
                      plans[pIdx] = { ...plans[pIdx], tagline: v };
                      setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                    }}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">
                        Benefícios incluídos
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const plans = [...draft.plansSection.plans];
                          plans[pIdx] = {
                            ...plans[pIdx],
                            features: [...plans[pIdx].features, 'Novo recurso incluído'],
                          };
                          setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#00D4FF] hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar benefício
                      </button>
                    </div>

                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const plans = [...draft.plansSection.plans];
                            const feats = [...plans[pIdx].features];
                            feats[fIdx] = e.target.value;
                            plans[pIdx] = { ...plans[pIdx], features: feats };
                            setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                          }}
                          className="flex-1 px-3 py-2 text-xs text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const plans = [...draft.plansSection.plans];
                            const feats = plans[pIdx].features.filter((_, i) => i !== fIdx);
                            plans[pIdx] = { ...plans[pIdx], features: feats };
                            setDraft({ ...draft, plansSection: { ...draft.plansSection, plans } });
                          }}
                          aria-label="Remover benefício"
                          className="p-2 text-slate-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'recursos' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                <h3 className="font-display text-lg font-bold text-white">
                  Seção de Compatibilidade e Recursos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Kicker"
                    value={draft.featuresSection.kicker}
                    onChange={(v) =>
                      setDraft({
                        ...draft,
                        featuresSection: { ...draft.featuresSection, kicker: v },
                      })
                    }
                  />
                  <Field
                    label="Texto do Botão"
                    value={draft.featuresSection.ctaLabel}
                    onChange={(v) =>
                      setDraft({
                        ...draft,
                        featuresSection: { ...draft.featuresSection, ctaLabel: v },
                      })
                    }
                  />
                </div>
                <Field
                  label="Título"
                  value={draft.featuresSection.title}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      featuresSection: { ...draft.featuresSection, title: v },
                    })
                  }
                />
                <TextAreaField
                  label="Descrição"
                  value={draft.featuresSection.description}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      featuresSection: { ...draft.featuresSection, description: v },
                    })
                  }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {draft.featuresSection.cards.map((card, cIdx) => (
                    <div key={cIdx} className="p-4 bg-[#090B10] border border-white/10 rounded-lg space-y-3">
                      <Field
                        label="Etiqueta"
                        value={card.kicker}
                        onChange={(v) => {
                          const cards = [...draft.featuresSection.cards];
                          cards[cIdx] = { ...cards[cIdx], kicker: v };
                          setDraft({
                            ...draft,
                            featuresSection: { ...draft.featuresSection, cards },
                          });
                        }}
                      />
                      <Field
                        label="Título do Card"
                        value={card.title}
                        onChange={(v) => {
                          const cards = [...draft.featuresSection.cards];
                          cards[cIdx] = { ...cards[cIdx], title: v };
                          setDraft({
                            ...draft,
                            featuresSection: { ...draft.featuresSection, cards },
                          });
                        }}
                      />
                      <TextAreaField
                        label="Descrição"
                        value={card.description}
                        onChange={(v) => {
                          const cards = [...draft.featuresSection.cards];
                          cards[cIdx] = { ...cards[cIdx], description: v };
                          setDraft({
                            ...draft,
                            featuresSection: { ...draft.featuresSection, cards },
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-white">
                    Perguntas Frequentes (FAQ)
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        faqSection: {
                          ...draft.faqSection,
                          items: [
                            ...draft.faqSection.items,
                            {
                              id: `faq-${Date.now()}`,
                              question: 'Nova pergunta frequente',
                              answer: 'Resposta para a pergunta.',
                            },
                          ],
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D4FF] hover:text-white cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Adicionar Pergunta
                  </button>
                </div>

                {draft.faqSection.items.map((item, fIdx) => (
                  <div key={item.id} className="p-4 bg-[#090B10] border border-white/10 rounded-lg space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#00D4FF]">
                        Pergunta {fIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            faqSection: {
                              ...draft.faqSection,
                              items: draft.faqSection.items.filter((_, i) => i !== fIdx),
                            },
                          })
                        }
                        className="text-xs text-slate-400 hover:text-red-400 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </button>
                    </div>
                    <Field
                      label="Pergunta"
                      value={item.question}
                      onChange={(v) => {
                        const items = [...draft.faqSection.items];
                        items[fIdx] = { ...items[fIdx], question: v };
                        setDraft({ ...draft, faqSection: { ...draft.faqSection, items } });
                      }}
                    />
                    <TextAreaField
                      label="Resposta"
                      value={item.answer}
                      onChange={(v) => {
                        const items = [...draft.faqSection.items];
                        items[fIdx] = { ...items[fIdx], answer: v };
                        setDraft({ ...draft, faqSection: { ...draft.faqSection, items } });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pegadinha' && (
            <div className="space-y-6">
              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">
                      Áudio e Comportamento do Susto
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ajuste o volume e a duração do grito sobrenatural ao clicar em TESTE GRÁTIS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTestJumpscare(draft.jumpscare)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#090B10] bg-[#FACC15] hover:bg-[#FDE047] rounded-lg cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" /> Testar Susto Agora
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Volume do Grito: {Math.round(draft.jumpscare.volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={draft.jumpscare.volume}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          jumpscare: { ...draft.jumpscare, volume: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-[#FACC15]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Duração do Grito: {draft.jumpscare.durationSeconds.toFixed(1)}s
                    </label>
                    <input
                      type="range"
                      min={1.2}
                      max={6}
                      step={0.2}
                      value={draft.jumpscare.durationSeconds}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          jumpscare: {
                            ...draft.jumpscare,
                            durationSeconds: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-[#00D4FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Botão de sair aparece em: {(draft.jumpscare.exitDelayMs / 1000).toFixed(1)}s
                    </label>
                    <input
                      type="range"
                      min={800}
                      max={6000}
                      step={200}
                      value={draft.jumpscare.exitDelayMs}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          jumpscare: {
                            ...draft.jumpscare,
                            exitDelayMs: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-[#00D4FF]"
                    />
                  </div>
                </div>
              </div>

              {!envManaged && (
                <form
                  onSubmit={handleChangePassword}
                  className="p-5 bg-[#11151E] border border-white/10 rounded-xl space-y-4"
                >
                  <h3 className="font-display text-lg font-bold text-white">
                    Alterar Senha de Administrador
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Senha Atual
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Nova Senha (mín. 4 caracteres)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={changingPass}
                    className="px-4 py-2 text-xs font-bold text-[#090B10] bg-[#00D4FF] hover:bg-[#38BDF8] rounded-lg cursor-pointer"
                  >
                    {changingPass ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </form>
              )}

              <div className="p-5 bg-[#11151E] border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Restaurar Textos Originais
                  </h3>
                  <p className="text-xs text-slate-400">
                    Volta todos os preços, rodapé e textos da página para os valores padrão.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  disabled={resetting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-200 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  {resetting ? 'Restaurando...' : 'Restaurar Padrões'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2 text-sm text-white bg-[#090B10] border border-white/15 rounded-lg focus:outline-none focus:border-[#00D4FF]"
      />
    </div>
  );
}
