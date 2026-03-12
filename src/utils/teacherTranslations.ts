// ============= Teacher Translations =============
// Thin translation layer for TeacherCockpit.
// Uses existing SSOT helpers — no new domain logic.

import { getBand } from '@/data/ssot';
import type { EAIAnalysis } from '@/types';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';
import type { StudentSessionRow } from '@/services/sessionSyncService';

// ── Band code → Dutch label ──
// Delegates to getBand() which returns RubricBand.label from SSOT.

export function translateBand(bandId: string | null | undefined): string {
  if (!bandId) return '—';
  const band = getBand(bandId);
  return band?.label || bandId;
}

// ── active_fix → teacher-facing description ──
// Uses the same COMMAND_INTENTS already defined in ssotHelpers.ts (line 328-348)
// but kept as a short lookup here to avoid coupling to prompt generation.

const FIX_LABELS: Record<string, string> = {
  '/intro':       'Activeert voorkennis',
  '/flits':       'Snelle herhaling feiten',
  '/anchor':      'Verankert aan bestaande kennis',
  '/chunk':       'Splitst in kleinere stappen',
  '/hint':        'Geeft een hint',
  '/devil':       'Daagt uit met tegenargument',
  '/schema':      'Helpt kennis structureren',
  '/checkin':     'Checkt begrip',
  '/reflectie':   'Stimuleert reflectie',
  '/model':       'Doet het stapsgewijs voor',
  '/exit':        'Sluit sessie af',
  '/quiz':        'Genereert toetsvragen',
  '/quizgen':     'Genereert toetsvragen',
  '/leervraag':   'Stelt een kernvraag',
  '/deeper':      'Stelt verdiepingsvragen',
  '/beeld':       'Toont een afbeelding',
  '/pauze':       'Geeft ademruimte',
  '/recap':       'Vat samen',
  '/meta':        'Stimuleert metacognitie',
  '/fase_check':  'Checkt leerfase',
};

export function translateFix(fixCode: string | null | undefined): string {
  if (!fixCode) return '—';
  return FIX_LABELS[fixCode] || fixCode;
}

// ── Process phase code → label ──

const PHASE_LABEL_MAP: Record<string, string> = {
  P1: 'Start',
  P2: 'Uitleg',
  P3: 'Oefening',
  P4: 'Check',
  P5: 'Reflectie',
};

export function translatePhase(phaseCode: string | null | undefined): string {
  if (!phaseCode) return '—';
  // P3a, P3b etc. → match on first two chars
  const prefix = phaseCode.substring(0, 2);
  return PHASE_LABEL_MAP[prefix] || phaseCode;
}

// ── Trend → Dutch ──

export function translateTrend(trend: string | null | undefined): string {
  if (!trend) return '—';
  if (trend === 'RISING') return '↑ Wordt zelfstandiger';
  if (trend === 'FALLING') return '↓ Heeft meer hulp nodig';
  return 'Stabiel';
}

// ── Urgency level from existing agency + trend ──

export type UrgencyLevel = 'high' | 'medium' | 'low';

export interface UrgencyResult {
  level: UrgencyLevel;
  /** Tailwind text color class */
  color: string;
  /** Tailwind dot/bg color class */
  dot: string;
}

export function getUrgencyLevel(session: StudentSessionRow): UrgencyResult {
  const eai = session.eai_state as EAIStateLike | null;
  const agency = eai?.scaffolding?.agency_score;
  const trend = eai?.scaffolding?.trend;

  if (agency !== undefined && agency < 40) {
    return { level: 'high', color: 'text-red-400', dot: 'bg-red-500' };
  }
  if (trend === 'FALLING' || (agency !== undefined && agency < 55)) {
    return { level: 'medium', color: 'text-amber-400', dot: 'bg-amber-500' };
  }
  return { level: 'low', color: 'text-emerald-400', dot: 'bg-emerald-600' };
}

// ── Sort sessions by urgency (high first) ──

const URGENCY_ORDER: Record<UrgencyLevel, number> = { high: 0, medium: 1, low: 2 };

export function sortByUrgency(sessions: StudentSessionRow[]): StudentSessionRow[] {
  return [...sessions].sort((a, b) => {
    const ua = getUrgencyLevel(a);
    const ub = getUrgencyLevel(b);
    if (ua.level !== ub.level) return URGENCY_ORDER[ua.level] - URGENCY_ORDER[ub.level];
    // Within same urgency: most recently active first
    return new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime();
  });
}

// ── scaffolding.advice → Dutch (3 fixed strings) ──

const ADVICE_TRANSLATIONS: Record<string, string> = {
  'CRITICAL DEPENDENCY DETECTED. INITIATE FADING (FORCE TD2/TD3).':
    '⚠️ Leerling leunt zwaar op AI. Geleidelijk loslaten nodig.',
  'AGENCY DROPPING. REDUCE SUPPORT LEVEL.':
    '↓ Zelfstandigheid daalt. Minder ondersteuning bieden.',
  'HIGH AGENCY. INCREASE COMPLEXITY (E4/S5).':
    '↑ Werkt zelfstandig. Complexiteit kan omhoog.',
};

export function translateAdvice(advice: string | null | undefined): string {
  if (!advice) return '—';
  return ADVICE_TRANSLATIONS[advice] || advice;
}

// ── Qualitative agency label ──

export interface AgencyLabel {
  label: string;
  color: string;
}

export function getAgencyLabel(score: number | undefined): AgencyLabel {
  if (score === undefined) return { label: '—', color: 'text-slate-400' };
  if (score < 40) return { label: 'Laag', color: 'text-red-400' };
  if (score <= 70) return { label: 'Matig', color: 'text-amber-400' };
  return { label: 'Goed', color: 'text-emerald-400' };
}

// ── Compact teacher status line per student ──
// Thin derivation from existing agency + trend + K-band. No weighting model.

export function getTeacherStatusLine(session: StudentSessionRow): string {
  const eai = session.eai_state as EAIStateLike | null;
  const agency = eai?.scaffolding?.agency_score;
  const trend = eai?.scaffolding?.trend as string | undefined;

  // K-band from analysis
  const a = session.analysis as unknown as EAIAnalysis | null;
  const kBand = a?.knowledge_type
    || a?.coregulation_bands?.find((c: string) => c.startsWith('K'));

  if (agency !== undefined && agency < 40) return 'Heeft hulp nodig';
  if (trend === 'FALLING') return 'Wordt afhankelijker';
  if (agency !== undefined && agency > 70 && trend !== 'FALLING') return 'Werkt zelfstandig';
  if ((kBand === 'K0' || kBand === 'K1') && agency !== undefined && agency >= 40 && agency <= 70) return 'Check begrip';
  return 'Actief';
}
