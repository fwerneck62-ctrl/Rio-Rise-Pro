import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { DEFAULT_SITE_CONFIG } from './src/data/rioRiseData.ts';
import type {
  FaqItem,
  FeatureCardItem,
  HeroMetric,
  PricingPlan,
  ScriptModule,
  SiteConfig,
} from './src/data/rioRiseData.ts';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'site-config.json');
const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');

// Ephemeral signing secret fallback if SESSION_SECRET env var is unset
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16
    ? process.env.SESSION_SECRET.trim()
    : crypto.randomBytes(32).toString('hex');

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

interface StoredAdminAuth {
  salt: string;
  passwordHash: string;
  createdAt: string;
}

// Simple in-memory rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
}

function getEnvPasscode(): string {
  return (process.env.ADMIN_PASSCODE ?? '').trim();
}

function readAdminAuth(): StoredAdminAuth | null {
  try {
    if (!fs.existsSync(AUTH_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredAdminAuth>;
    if (typeof parsed.salt === 'string' && typeof parsed.passwordHash === 'string') {
      return {
        salt: parsed.salt,
        passwordHash: parsed.passwordHash,
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeAdminAuth(password: string): void {
  ensureDataDir();
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const record: StoredAdminAuth = {
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(record, null, 2), { mode: 0o600 });
}

function verifyPasswordAgainstRecord(password: string, record: StoredAdminAuth): boolean {
  const derived = crypto.scryptSync(password, record.salt, 64);
  const stored = Buffer.from(record.passwordHash, 'hex');
  if (derived.length !== stored.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, stored);
}

function verifyEnvPasscode(password: string, envPasscode: string): boolean {
  const a = crypto.createHash('sha256').update(password).digest();
  const b = crypto.createHash('sha256').update(envPasscode).digest();
  return crypto.timingSafeEqual(a, b);
}

function issueAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({
      role: 'admin',
      exp: Date.now() + TOKEN_TTL_MS,
      nonce: crypto.randomBytes(8).toString('hex'),
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) {
    return false;
  }
  const [payload, sig] = parts;
  if (!payload || !sig) {
    return false;
  }
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Date.now();
  } catch {
    return false;
  }
}

function sanitizeText(value: unknown, fallback: string, maxLen = 400): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : fallback;
}

function sanitizeImagePath(value: unknown, fallback?: string): string | undefined {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  // Allow only safe relative /src/assets/ paths or http/https URLs
  if (trimmed.startsWith('/src/assets/') || /^https?:\/\//i.test(trimmed)) {
    return trimmed.slice(0, 500);
  }
  return fallback;
}

function sanitizeSiteConfig(raw: unknown): SiteConfig {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SITE_CONFIG;

  const brandIn = (input.brand && typeof input.brand === 'object' ? input.brand : {}) as Record<string, unknown>;
  const heroIn = (input.hero && typeof input.hero === 'object' ? input.hero : {}) as Record<string, unknown>;
  const modSecIn = (input.modulesSection && typeof input.modulesSection === 'object' ? input.modulesSection : {}) as Record<string, unknown>;
  const featSecIn = (input.featuresSection && typeof input.featuresSection === 'object' ? input.featuresSection : {}) as Record<string, unknown>;
  const planSecIn = (input.plansSection && typeof input.plansSection === 'object' ? input.plansSection : {}) as Record<string, unknown>;
  const faqSecIn = (input.faqSection && typeof input.faqSection === 'object' ? input.faqSection : {}) as Record<string, unknown>;
  const scareIn = (input.jumpscare && typeof input.jumpscare === 'object' ? input.jumpscare : {}) as Record<string, unknown>;

  const rawMetrics = Array.isArray(heroIn.metrics) ? heroIn.metrics : d.hero.metrics;
  const metrics: HeroMetric[] = rawMetrics.slice(0, 6).map((item, idx) => {
    const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fb = d.hero.metrics[idx] ?? { value: '100%', label: 'Ativo' };
    return {
      value: sanitizeText(obj.value, fb.value, 40),
      label: sanitizeText(obj.label, fb.label, 80),
    };
  });

  const rawModules = Array.isArray(modSecIn.modules) ? modSecIn.modules : d.modulesSection.modules;
  const modules: ScriptModule[] = rawModules.slice(0, 12).map((item, idx) => {
    const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fb = d.modulesSection.modules[idx] ?? d.modulesSection.modules[0];
    const cat = obj.category;
    const validCat = cat === 'autofarm' || cat === 'vehicles' || cat === 'bypass' ? cat : fb.category;
    return {
      id: sanitizeText(obj.id, `mod-${idx + 1}`, 50),
      index: sanitizeText(obj.index, `0${idx + 1}.`, 10),
      category: validCat,
      categoryLabel: sanitizeText(obj.categoryLabel, fb.categoryLabel, 40),
      platform: sanitizeText(obj.platform, fb.platform, 60),
      title: sanitizeText(obj.title, fb.title, 120),
      description: sanitizeText(obj.description, fb.description, 400),
      metrics: sanitizeText(obj.metrics, fb.metrics, 120),
      featured: Boolean(obj.featured),
      image: sanitizeImagePath(obj.image, fb.image),
      imageAlt: sanitizeText(obj.imageAlt, fb.imageAlt ?? fb.title, 160),
    };
  });

  const rawCards = Array.isArray(featSecIn.cards) ? featSecIn.cards : d.featuresSection.cards;
  const cards: FeatureCardItem[] = rawCards.slice(0, 8).map((item, idx) => {
    const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fb = d.featuresSection.cards[idx] ?? d.featuresSection.cards[0];
    return {
      kicker: sanitizeText(obj.kicker, fb.kicker, 40),
      title: sanitizeText(obj.title, fb.title, 100),
      description: sanitizeText(obj.description, fb.description, 300),
    };
  });

  const rawPlans = Array.isArray(planSecIn.plans) ? planSecIn.plans : d.plansSection.plans;
  const plans: PricingPlan[] = rawPlans.slice(0, 6).map((item, idx) => {
    const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fb = d.plansSection.plans[idx] ?? d.plansSection.plans[0];
    const rawFeatures = Array.isArray(obj.features) ? obj.features : fb.features;
    const features = rawFeatures
      .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      .slice(0, 10)
      .map((f) => f.trim().slice(0, 120));

    return {
      id: sanitizeText(obj.id, `plan-${idx + 1}`, 40),
      name: sanitizeText(obj.name, fb.name, 60),
      tagline: sanitizeText(obj.tagline, fb.tagline, 200),
      price: sanitizeText(obj.price, fb.price, 24),
      durationLabel: sanitizeText(obj.durationLabel, fb.durationLabel, 40),
      highlighted: Boolean(obj.highlighted),
      features: features.length > 0 ? features : fb.features,
    };
  });

  const rawFaqs = Array.isArray(faqSecIn.items) ? faqSecIn.items : d.faqSection.items;
  const faqItems: FaqItem[] = rawFaqs.slice(0, 12).map((item, idx) => {
    const obj = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const fb = d.faqSection.items[idx] ?? d.faqSection.items[0];
    return {
      id: sanitizeText(obj.id, `faq-${idx + 1}`, 40),
      question: sanitizeText(obj.question, fb.question, 200),
      answer: sanitizeText(obj.answer, fb.answer, 600),
    };
  });

  const vol = typeof scareIn.volume === 'number' && Number.isFinite(scareIn.volume)
    ? Math.min(1, Math.max(0.1, scareIn.volume))
    : d.jumpscare.volume;
  const dur = typeof scareIn.durationSeconds === 'number' && Number.isFinite(scareIn.durationSeconds)
    ? Math.min(6, Math.max(1.2, scareIn.durationSeconds))
    : d.jumpscare.durationSeconds;
  const exitDelay = typeof scareIn.exitDelayMs === 'number' && Number.isFinite(scareIn.exitDelayMs)
    ? Math.min(6000, Math.max(800, Math.round(scareIn.exitDelayMs)))
    : d.jumpscare.exitDelayMs;

  return {
    brand: {
      primary: sanitizeText(brandIn.primary, d.brand.primary, 40),
      accent: sanitizeText(brandIn.accent, d.brand.accent, 24),
      footerText: sanitizeText(brandIn.footerText, d.brand.footerText, 120),
    },
    hero: {
      kicker: sanitizeText(heroIn.kicker, d.hero.kicker, 140),
      title: sanitizeText(heroIn.title, d.hero.title, 160),
      subtitle: sanitizeText(heroIn.subtitle, d.hero.subtitle, 450),
      ctaLabel: sanitizeText(heroIn.ctaLabel, d.hero.ctaLabel, 40),
      secondaryCtaLabel: sanitizeText(heroIn.secondaryCtaLabel, d.hero.secondaryCtaLabel, 60),
      note: sanitizeText(heroIn.note, d.hero.note, 220),
      metrics,
    },
    modulesSection: {
      kicker: sanitizeText(modSecIn.kicker, d.modulesSection.kicker, 60),
      title: sanitizeText(modSecIn.title, d.modulesSection.title, 140),
      modules,
    },
    featuresSection: {
      kicker: sanitizeText(featSecIn.kicker, d.featuresSection.kicker, 60),
      title: sanitizeText(featSecIn.title, d.featuresSection.title, 140),
      description: sanitizeText(featSecIn.description, d.featuresSection.description, 450),
      ctaLabel: sanitizeText(featSecIn.ctaLabel, d.featuresSection.ctaLabel, 40),
      cards,
    },
    plansSection: {
      kicker: sanitizeText(planSecIn.kicker, d.plansSection.kicker, 60),
      title: sanitizeText(planSecIn.title, d.plansSection.title, 140),
      promoKicker: sanitizeText(planSecIn.promoKicker, d.plansSection.promoKicker, 80),
      promoTitle: sanitizeText(planSecIn.promoTitle, d.plansSection.promoTitle, 140),
      promoDescription: sanitizeText(planSecIn.promoDescription, d.plansSection.promoDescription, 320),
      promoCtaLabel: sanitizeText(planSecIn.promoCtaLabel, d.plansSection.promoCtaLabel, 40),
      plans,
    },
    faqSection: {
      kicker: sanitizeText(faqSecIn.kicker, d.faqSection.kicker, 60),
      title: sanitizeText(faqSecIn.title, d.faqSection.title, 140),
      items: faqItems,
    },
    jumpscare: {
      volume: Number(vol.toFixed(2)),
      durationSeconds: Number(dur.toFixed(1)),
      exitDelayMs: exitDelay,
    },
  };
}

function readSiteConfig(): SiteConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return DEFAULT_SITE_CONFIG;
    }
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return sanitizeSiteConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

function writeSiteConfig(config: SiteConfig): void {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sessão administrativa expirada ou ausente.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
    return;
  }
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  // Public site configuration
  app.get('/api/config', (_req, res) => {
    res.json(readSiteConfig());
  });

  // Admin status (boolean only)
  app.get('/api/admin/status', (_req, res) => {
    const envManaged = getEnvPasscode().length > 0;
    const configured = envManaged || readAdminAuth() !== null;
    res.json({ configured, envManaged });
  });

  // First-time admin password creation (atomically locked after claim)
  app.post('/api/admin/setup', (req, res) => {
    if (getEnvPasscode().length > 0 || readAdminAuth() !== null) {
      res.status(409).json({ error: 'A senha de administrador já foi configurada.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 4 || password.length > 128) {
      res.status(400).json({ error: 'A senha deve ter entre 4 e 128 caracteres.' });
      return;
    }

    writeAdminAuth(password);
    const token = issueAdminToken();
    res.status(201).json({ token });
  });

  // Admin login
  app.post('/api/admin/login', (req, res) => {
    const clientIp = req.ip || 'unknown';
    const now = Date.now();
    const record = loginAttempts.get(clientIp);
    if (record && record.resetAt > now && record.count >= 10) {
      res.status(429).json({ error: 'Muitas tentativas incorretas. Aguarde alguns minutos.' });
      return;
    }

    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const envPasscode = getEnvPasscode();
    let valid = false;

    if (envPasscode.length > 0) {
      valid = verifyEnvPasscode(password, envPasscode);
    } else {
      const stored = readAdminAuth();
      if (!stored) {
        res.status(409).json({ error: 'Senha ainda não configurada. Crie uma senha primeiro.' });
        return;
      }
      valid = verifyPasswordAgainstRecord(password, stored);
    }

    if (!valid) {
      const nextCount = record && record.resetAt > now ? record.count + 1 : 1;
      loginAttempts.set(clientIp, { count: nextCount, resetAt: now + 5 * 60 * 1000 });
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }

    loginAttempts.delete(clientIp);
    const token = issueAdminToken();
    res.json({ token });
  });

  // Save full site configuration (protected)
  app.put('/api/config', requireAdminAuth, (req, res) => {
    const sanitized = sanitizeSiteConfig(req.body);
    writeSiteConfig(sanitized);
    res.json(sanitized);
  });

  // Reset site configuration to defaults (protected)
  app.post('/api/admin/reset-config', requireAdminAuth, (_req, res) => {
    writeSiteConfig(DEFAULT_SITE_CONFIG);
    res.json(DEFAULT_SITE_CONFIG);
  });

  // Change admin password (protected)
  app.post('/api/admin/change-password', requireAdminAuth, (req, res) => {
    if (getEnvPasscode().length > 0) {
      res.status(400).json({
        error: 'A senha está sendo gerenciada pela variável de ambiente ADMIN_PASSCODE.',
      });
      return;
    }

    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    const stored = readAdminAuth();
    if (!stored || !verifyPasswordAgainstRecord(currentPassword, stored)) {
      res.status(401).json({ error: 'Senha atual incorreta.' });
      return;
    }

    if (newPassword.length < 4 || newPassword.length > 128) {
      res.status(400).json({ error: 'A nova senha deve ter entre 4 e 128 caracteres.' });
      return;
    }

    writeAdminAuth(newPassword);
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
