// ============= EAI LEARN ADAPTER =============
// State / viewmodel layer — derives UI-facing state from analysis.
// All inhoudelijke validatie (SSOT healing, G-factor, logic gates)
// is consolidated in reliabilityPipeline.ts (Stap 2).

import type { EAIAnalysis, MechanicalState, ScaffoldingState } from '../types';

export interface EAIBands {
  K?: string | null;
  P?: string | null;
  C?: string | null;
  TD?: string | null;
  V?: string | null;
  T?: string | null;
  E?: string | null;
  S?: string | null;
  L?: string | null;
  B?: string | null;
}

export interface EAIHistoryEntry {
  turn: number;
  bands: EAIBands;
  primary_band_id: string | null;
  srl_state: string | null;
  content_bands: string[];
  skill_bands: string[];
  timestamp: number;
  agency_score?: number;
}

export interface EAIStateLike {
  turn_counter: number;
  current_bands: EAIBands;
  current_phase: string | null;
  srl_state: string | null;
  diagnostic_alert: string | null;
  active_fix: string | null;
  cognitive_mode: string | null;
  epistemic_status: string | null;
  history: EAIHistoryEntry[];
  mechanical: MechanicalState | null;
  scaffolding?: ScaffoldingState;
}

const CONTENT_DIMENSIONS = ['K', 'V', 'E', 'B', 'T'] as const;
const SKILL_DIMENSIONS = ['P', 'C', 'TD', 'S', 'L'] as const;

function extractDimensionFromBandId(bandId: string | null | undefined): string | null {
  if (!bandId) return null;
  const prefix = bandId.split('_')[0];
  const firstOne = bandId.charAt(0);
  if (['P', 'C', 'V', 'T', 'E', 'S', 'L', 'B', 'K'].includes(prefix)) return prefix;
  if (bandId.startsWith('TD')) return 'TD';
  if (['P', 'C', 'V', 'T', 'E', 'S', 'L', 'B', 'K'].includes(firstOne)) return firstOne;
  return null;
}

function getAgencyScoreFromBands(bands: EAIBands): number {
  if (!bands.TD) return 50;
  const level = parseInt(bands.TD.replace('TD', ''), 10);
  if (isNaN(level)) return 50;
  const map = [0, 100, 80, 50, 20, 0];
  return map[level] !== undefined ? map[level] : 50;
}

export function calculateScaffoldingTrend(history: EAIHistoryEntry[], currentAgency: number): ScaffoldingState {
  const recentHistory = history.slice(-4);
  const scores = [...recentHistory.map(h => h.agency_score || 50), currentAgency];
  let trend: 'RISING' | 'STABLE' | 'FALLING' = 'STABLE';
  if (scores.length >= 3) {
    const avgEarly = (scores[0] + scores[1]) / 2;
    const avgLate = (scores[scores.length-1] + scores[scores.length-2]) / 2;
    if (avgLate > avgEarly + 15) trend = 'RISING';
    else if (avgLate < avgEarly - 15) trend = 'FALLING';
  }
  let advice = null;
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (scores.length >= 3) {
    if (avgScore < 30) advice = "CRITICAL DEPENDENCY DETECTED. INITIATE FADING (FORCE TD2/TD3).";
    else if (trend === 'FALLING' && avgScore < 50) advice = "AGENCY DROPPING. REDUCE SUPPORT LEVEL.";
    else if (trend === 'RISING' && avgScore > 80) advice = "HIGH AGENCY. INCREASE COMPLEXITY (E4/S5).";
  }
  return { agency_score: currentAgency, trend, advice, history_window: scores };
}

export function calculateDynamicTTL(analysis: EAIAnalysis | null): number {
  let ttl = 60000; 
  if (!analysis) return ttl;
  const bands = [
    ...(analysis.process_phases || []),
    ...(analysis.coregulation_bands || []),
    ...(analysis.task_densities || []),
    ...(analysis.secondary_dimensions || [])
  ];
  const tdBand = bands.find(b => b.startsWith('TD'));
  const kBand = bands.find(b => b.startsWith('K'));
  if (tdBand === 'TD1' || tdBand === 'TD2') ttl += 60000;
  if (kBand === 'K3') ttl += 45000;
  if (tdBand === 'TD4' || tdBand === 'TD5') ttl -= 20000;
  if (kBand === 'K1') ttl -= 15000;
  return Math.max(30000, Math.min(180000, ttl));
}

export function createInitialEAIState(): EAIStateLike {
  return {
    turn_counter: 0,
    current_bands: {},
    current_phase: null,
    srl_state: 'PLAN',
    diagnostic_alert: null,
    active_fix: null,
    cognitive_mode: null,
    epistemic_status: null,
    history: [],
    mechanical: null,
  };
}

export function updateStateFromAnalysis(prev: EAIStateLike, analysis: EAIAnalysis, mechanical?: MechanicalState | null): EAIStateLike {
  const nextTurn = prev.turn_counter + 1;
  const nextBands: EAIBands = { ...prev.current_bands };
  const processBandList = (list: string[] | undefined) => {
    if (!list) return;
    list.forEach(bandId => {
      const dim = extractDimensionFromBandId(bandId);
      if (dim) (nextBands as Record<string, string | null>)[dim] = bandId;
    });
  };
  processBandList(analysis.process_phases);
  processBandList(analysis.coregulation_bands);
  processBandList(analysis.task_densities);
  processBandList(analysis.secondary_dimensions);
  const currentPhase = (nextBands.P) || prev.current_phase;
  const srlState = analysis.srl_state || prev.srl_state;
  const primaryBand = nextBands.K || nextBands.P || nextBands.TD || nextBands.C || null;
  const contentBands: string[] = [];
  const skillBands: string[] = [];
  for (const [dim, bandId] of Object.entries(nextBands)) {
    if (!bandId) continue;
    if (CONTENT_DIMENSIONS.includes(dim as typeof CONTENT_DIMENSIONS[number])) contentBands.push(bandId as string);
    if (SKILL_DIMENSIONS.includes(dim as typeof SKILL_DIMENSIONS[number])) skillBands.push(bandId as string);
  }
  const agencyScore = getAgencyScoreFromBands(nextBands);
  const historyEntry: EAIHistoryEntry = {
    turn: nextTurn,
    bands: nextBands,
    primary_band_id: primaryBand,
    srl_state: srlState,
    content_bands: contentBands,
    skill_bands: skillBands,
    timestamp: Date.now(),
    agency_score: agencyScore
  };
  const scaffolding = calculateScaffoldingTrend(prev.history, agencyScore);
  return {
    turn_counter: nextTurn,
    current_bands: nextBands,
    current_phase: currentPhase,
    srl_state: srlState,
    diagnostic_alert: null, 
    active_fix: analysis.active_fix ?? prev.active_fix ?? null,
    cognitive_mode: analysis.cognitive_mode ?? prev.cognitive_mode ?? null,
    epistemic_status: analysis.epistemic_status ?? prev.epistemic_status ?? null,
    history: [...prev.history, historyEntry],
    mechanical: mechanical ?? prev.mechanical ?? null,
    scaffolding: scaffolding
  };
}
