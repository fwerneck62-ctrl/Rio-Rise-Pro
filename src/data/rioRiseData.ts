export type ModuleCategory = 'all' | 'autofarm' | 'vehicles' | 'bypass';

export interface HeroMetric {
  value: string;
  label: string;
}

export interface ScriptModule {
  id: string;
  index: string;
  category: Exclude<ModuleCategory, 'all'>;
  categoryLabel: string;
  platform: string;
  title: string;
  description: string;
  metrics: string;
  featured?: boolean;
  image?: string;
  imageAlt?: string;
}

export interface FeatureCardItem {
  kicker: string;
  title: string;
  description: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  durationLabel: string;
  highlighted?: boolean;
  features: string[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface JumpscareSettings {
  volume: number;
  durationSeconds: number;
  exitDelayMs: number;
}

export interface SiteConfig {
  brand: {
    primary: string;
    accent: string;
    footerText: string;
  };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    secondaryCtaLabel: string;
    note: string;
    metrics: HeroMetric[];
  };
  modulesSection: {
    kicker: string;
    title: string;
    modules: ScriptModule[];
  };
  featuresSection: {
    kicker: string;
    title: string;
    description: string;
    ctaLabel: string;
    cards: FeatureCardItem[];
  };
  plansSection: {
    kicker: string;
    title: string;
    promoKicker: string;
    promoTitle: string;
    promoDescription: string;
    promoCtaLabel: string;
    plans: PricingPlan[];
  };
  faqSection: {
    kicker: string;
    title: string;
    items: FaqItem[];
  };
  jumpscare: JumpscareSettings;
  flashOffer: {
    title: string;
    description: string;
    ctaLabel: string;
    durationSeconds: number;
  };
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brand: {
    primary: 'RIO RISE',
    accent: 'PRO',
    footerText: '© 2026 Rio Rise Pro',
  },
  hero: {
    kicker: 'Rio Rise Mobile RP · Android & Emulador · Script Auto-Farm & Mod Menu',
    title: 'Auto-Farm de Mineração e Mod Menu para Rio Rise',
    subtitle:
      'Automatize rotas de mineração e entregas enquanto dorme, ajuste o torque dos seus carros na garagem e acompanhe viaturas no radar em tempo real sem precisar de Root.',
    ctaLabel: 'TESTE GRÁTIS',
    secondaryCtaLabel: 'Ver planos e valores',
    note: 'Liberação imediata de 24 horas para testar todos os recursos antes de escolher seu plano.',
    metrics: [
      { value: '14.280+', label: 'Contas usando no RP' },
      { value: 'R$ 420k/h', label: 'Média no Auto-Farm' },
      { value: 'Android 10–15', label: 'Sem Root e Emulador' },
      { value: '24 horas', label: 'Duração do Teste Grátis' },
    ],
  },
  modulesSection: {
    kicker: 'Recursos do Painel',
    title: 'Módulos desenhados para a economia do Rio Rise',
    modules: [
      {
        id: 'mineracao-auto',
        index: '01.',
        category: 'autofarm',
        categoryLabel: 'Auto-Farm',
        platform: 'Mineração & Entregas',
        title: 'Auto-Farm de Mineração e Rotas',
        description:
          'Executa ciclos completos na pedreira, coleta minérios automaticamente e entrega cargas sem precisar tocar na tela durante a madrugada.',
        metrics: 'Rendimento médio de R$ 420.000/h no servidor principal',
        featured: true,
        image: '/src/assets/images/rio_rise_autofarm_1795375620304.jpg',
        imageAlt: 'Caminhão de mineração operando à noite no estilo Rio Rise',
      },
      {
        id: 'garagem-turbo',
        index: '02.',
        category: 'vehicles',
        categoryLabel: 'Veículos',
        platform: 'Garagem & Tunagem',
        title: 'Ajuste de Torque, Rebaixamento e Nitro',
        description:
          'Altere aceleração, tração nas curvas da serra e altura da suspensão em qualquer carro nacional ou moto esportiva sem gastar Rio Coins na oficina.',
        metrics: 'Compatível com 100% dos carros e motos da concessionária',
        featured: true,
        image: '/src/assets/images/rio_rise_garage_1795375620608.jpg',
        imageAlt: 'Carro nacional rebaixado em garagem subterrânea no Rio Rise',
      },
      {
        id: 'radar-vip',
        index: '03.',
        category: 'bypass',
        categoryLabel: 'Bypass & Radar',
        platform: 'Proteção RP',
        title: 'Anti-AFK Inteligente e Radar de Polícia',
        description:
          'Simula toques humanos aleatórios para evitar kick por inatividade e exibe viaturas, blitz e players armados no minimapa em tempo real.',
        metrics: 'Detecção de proximidade até 450 metros',
      },
      {
        id: 'teleporte-empregos',
        index: '04.',
        category: 'autofarm',
        categoryLabel: 'Auto-Farm',
        platform: 'Rotas Seguras',
        title: 'Navegação Rápida entre Empregos',
        description:
          'Deslocamento suave ponto a ponto entre pontos de coleta, banco central e concessionária respeitando os limites de velocidade do servidor.',
        metrics: 'Economia de até 85% do tempo de trajeto',
      },
    ],
  },
  featuresSection: {
    kicker: 'Compatibilidade Mobile e PC',
    title: 'Instalação leve sem perder desempenho nas ruas',
    description:
      'O painel roda em segundo plano sem derrubar o FPS mesmo nas áreas mais cheias do mapa como o centro, a praia e os morros. Configure o ciclo de farm em menos de um minuto.',
    ctaLabel: 'TESTE GRÁTIS AGORA',
    cards: [
      {
        kicker: '01. Execução',
        title: 'Rotina 100% automática',
        description:
          'Coleta minério, descarrega o caminhão na base e reinicia o turno sem precisar clicar manualmente nos botões da tela.',
      },
      {
        kicker: '02. Disfarce',
        title: 'Movimentação humanizada',
        description:
          'Varia curvas, aceleração e tempo de resposta entre ações para não levantar suspeitas em servidores lotados.',
      },
      {
        kicker: '03. Garagem',
        title: 'Perfis salvos por veículo',
        description:
          'Salve presets prontos de arrancada, drift ou velocidade máxima para trocar com um toque no menu flutuante.',
      },
      {
        kicker: '04. Updates',
        title: 'Sincronização automática',
        description:
          'Sempre que o Rio Rise lança atualização na Play Store ou APK, os scripts ajustam os endereços automaticamente.',
      },
    ],
  },
  plansSection: {
    kicker: 'Planos, Scripts & Cheats',
    title: 'Escolha seu plano de Cheats e Auto-Farm ou teste grátis',
    promoKicker: 'Acesso de demonstração por 24 horas',
    promoTitle: 'Quer testar o Auto-Farm, Cheats e Mod Menu antes de pagar?',
    promoDescription:
      'Clique abaixo para liberar o acesso gratuito completo no seu dispositivo agora mesmo, sem informar cartão ou senha da conta.',
    promoCtaLabel: 'TESTE GRÁTIS',
    plans: [
      {
        id: '1-dia',
        name: '1 Dia',
        tagline: 'Acesso completo por 24 horas para testar tudo no servidor.',
        price: '8,00',
        durationLabel: '/ 1 dia',
        features: [
          'Auto-Farm de Mineração e Entregador',
          'Cheats PvP: Aimbot, No-Recoil e Speed Hack',
          'ESP / Wallhack (Players, Carros e Caixas)',
          'Teleporte rápido no mapa',
          'Android sem Root e Emulador',
        ],
      },
      {
        id: '7-dias',
        name: '7 Dias',
        tagline: 'Ideal para farmar pesado e dominar o servidor durante a semana.',
        price: '20,00',
        durationLabel: '/ 7 dias',
        features: [
          'Todos os Cheats e Auto-Farm liberados',
          'Cheats de Carro: Nitro infinito, Torque e Sem Dano',
          'God Mode, Munição Infinita e No-Clip',
          'Anti-AFK humanizado 24h',
          'Atualizações automáticas de patch',
        ],
      },
      {
        id: '15-dias',
        name: '15 Dias',
        tagline: 'Melhor custo-benefício com todos os cheats e suporte prioritário.',
        price: '35,00',
        durationLabel: '/ 15 dias',
        highlighted: true,
        features: [
          'Pacote completo de Cheats + Mod Menu',
          'Aimbot FOV ajustável, ESP e God Mode',
          'No-Clip (Atravessar paredes) e Modo Fantasma',
          'Execução simultânea em até 2 contas',
          'Bypass Anti-Cheat prioritário',
        ],
      },
      {
        id: '30-dias',
        name: '30 Dias',
        tagline: 'Um mês inteiro com todos os recursos e múltiplas instâncias.',
        price: '50,00',
        durationLabel: '/ 30 dias',
        features: [
          'Todos os Cheats, Scripts e Auto-Farm',
          'Execução simultânea em até 3 contas',
          'Rotas privadas de coleta rápida',
          'Bypass Anti-Cheat prioritário',
          'Suporte direto em todas as atualizações',
        ],
      },
    ],
  },
  faqSection: {
    kicker: 'Suporte Técnico',
    title: 'Dúvidas frequentes',
    items: [
      {
        id: 'root',
        question: 'Precisa de Root no celular ou funciona direto no Android normal?',
        answer:
          'Funciona sem Root em aparelhos Android 10 até Android 15 e também roda perfeitamente em emuladores de PC como BlueStacks, MSI App Player e LDPlayer.',
      },
      {
        id: 'teste',
        question: 'Como funciona o botão TESTE GRÁTIS de 24 horas?',
        answer:
          'Ao clicar em TESTE GRÁTIS, o painel libera imediatamente uma chave temporária de 24 horas com todos os módulos, scripts e cheats ativos para você testar no servidor antes de assinar.',
      },
      {
        id: 'atualizacao',
        question: 'O script para de funcionar quando o Rio Rise atualiza?',
        answer:
          'Não. Sempre que sai um novo patch do Rio Rise Mobile, os offsets são ajustados automaticamente pelo carregador sem você precisar baixar tudo de novo.',
      },
      {
        id: 'ban',
        question: 'Existe risco de kick automático usando o Auto-Farm na mineração?',
        answer:
          'O módulo utiliza intervalos aleatórios de movimento e pausas naturais para imitar um jogador real farmando no celular, evitando alertas automáticos de velocidade ou teleporte seco.',
      },
    ],
  },
  jumpscare: {
    volume: 1.0,
    durationSeconds: 3.6,
    exitDelayMs: 2400,
  },
  flashOffer: {
    title: 'Oferta Relâmpago — Libere o Teste Grátis antes de zerar',
    description:
      'Chaves gratuitas de 24 horas com todos os Cheats, Aimbot, ESP e Auto-Farm ativos. Resgate agora antes que o lote feche.',
    ctaLabel: 'TESTE GRÁTIS',
    durationSeconds: 587,
  },
};
