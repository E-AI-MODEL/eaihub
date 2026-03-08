// ============= RELIABILITY PIPELINE =============
// Contract-first, SSOT-first, Observability-first
// Version 15.0.0

import { SSOT_DATA, getRubric, getBand, getCommandDescription } from '@/data/ssot';
import { getEAICore } from '@/utils/ssotHelpers';
import type { EAIAnalysis, MechanicalState, SemanticValidation, LogicGateBreach } from '@/types';

// ============= TRACE EVENT SYSTEM =============

export type TraceSeverity = 'INFO' | 'WARNING' | 'REPAIR' | 'GATE' | 'ERROR';
export type TraceSource = 'UI' | 'ENGINE' | 'LLM' | 'SSOT' | 'VALIDATOR' | 'NETWORK' | 'PIPELINE';

export interface TraceEvent {
  ts: string; // ISO timestamp
  severity: TraceSeverity;
  source: TraceSource;
  step: PipelineStep;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export type PipelineStep = 
  | 'PROMPT_ASSEMBLY'
  | 'MODEL_CALL'
  | 'PARSE'
  | 'REPAIR'
  | 'SCHEMA_VALIDATE'
  | 'SSOT_HEAL'
  | 'EPISTEMIC_GUARD'
  | 'LOGIC_GATE_CHECK'
  | 'RENDER';

// Global trace buffer (session-scoped)
const traceBuffer: Map<string, TraceEvent[]> = new Map();
const MAX_TRACE_EVENTS = 500;

export function pushTrace(sessionId: string, event: Omit<TraceEvent, 'ts'>): void {
  const events = traceBuffer.get(sessionId) || [];
  events.push({
    ts: new Date().toISOString(),
    ...event,
  });
  
  // Keep buffer bounded
  if (events.length > MAX_TRACE_EVENTS) {
    events.splice(0, events.length - MAX_TRACE_EVENTS);
  }
  
  traceBuffer.set(sessionId, events);
  
  // Log to console for debugging
  const emoji = event.severity === 'ERROR' ? '❌' : 
                event.severity === 'WARNING' ? '⚠️' : 
                event.severity === 'REPAIR' ? '🔧' :
                event.severity === 'GATE' ? '🚧' : '📋';
  console.log(`[EAI ${emoji}] ${event.step}: ${event.message}`, event.data || '');
}

export function getTraceEvents(sessionId: string): TraceEvent[] {
  return traceBuffer.get(sessionId) || [];
}

export function clearTrace(sessionId: string): void {
  traceBuffer.delete(sessionId);
}

export function downloadTraceJSON(sessionId: string): void {
  const events = getTraceEvents(sessionId);
  const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eai-trace-${sessionId}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============= SSOT HEALING =============

/**
 * Validate that a band ID exists in SSOT
 */
function ssotHasBand(rubricId: string, bandId: string): boolean {
  const rubric = getRubric(rubricId);
  return rubric?.bands.some(b => b.band_id === bandId) ?? false;
}

/**
 * Validate that a command exists in SSOT
 */
function ssotHasCommand(commandId: string): boolean {
  return getCommandDescription(commandId) !== null;
}

/**
 * Unified SSOT normalization: prune unknown bands, heal commands via fuzzy-map,
 * validate SRL state. This is the single authoritative healing function used by
 * both the pipeline and admin audit.
 *
 * @param strict - When true (admin audit), warnings are collected but no trace events emitted.
 */
export function normalizeAnalysisToSSOT(
  analysis: EAIAnalysis,
  sessionId: string,
  options: { strict?: boolean } = {}
): { healed: EAIAnalysis; events: string[]; ssotHealingCount: number; commandNullCount: number } {
  const events: string[] = [];
  const healed: EAIAnalysis = structuredClone(analysis);

  // --- Band validation (all four band arrays) ---
  const bandFields: (keyof Pick<EAIAnalysis, 'coregulation_bands' | 'process_phases' | 'task_densities' | 'secondary_dimensions'>)[] =
    ['coregulation_bands', 'process_phases', 'task_densities', 'secondary_dimensions'];

  for (const field of bandFields) {
    if (healed[field]) {
      const validBands = (healed[field] as string[]).filter(bandId => {
        const band = getBand(bandId);
        if (!band) {
          // Skip very short / empty strings silently
          if (bandId && bandId.length > 1) {
            events.push(`PRUNE_UNKNOWN_BAND:${bandId}:${field}`);
            if (!options.strict) {
              pushTrace(sessionId, {
                severity: 'REPAIR',
                source: 'SSOT',
                step: 'SSOT_HEAL',
                message: `Pruned unknown band: ${bandId} in ${field}`,
                data: { prunedBand: bandId, field },
              });
            }
          }
          return false;
        }
        return true;
      });
      (healed as any)[field] = validBands;
    }
  }

  // --- Command validation with fuzzy-map healing ---
  if (healed.active_fix && healed.active_fix !== 'NONE' && healed.active_fix !== 'null') {
    const fix = healed.active_fix.trim();
    if (!ssotHasCommand(fix)) {
      // Try fuzzy-map first
      if (COMMAND_FUZZY_MAP[fix]) {
        const healed_fix = COMMAND_FUZZY_MAP[fix];
        events.push(`FUZZY_HEAL_COMMAND:${fix}→${healed_fix}`);
        if (!options.strict) {
          pushTrace(sessionId, {
            severity: 'REPAIR',
            source: 'SSOT',
            step: 'SSOT_HEAL',
            message: `Healed command via fuzzy-map: '${fix}' → '${healed_fix}'`,
            data: { original: fix, healed: healed_fix },
          });
        }
        healed.active_fix = healed_fix;
      // Try adding missing slash prefix
      } else if (!fix.startsWith('/') && ssotHasCommand(`/${fix}`)) {
        const prefixed = `/${fix}`;
        events.push(`PREFIX_HEAL_COMMAND:${fix}→${prefixed}`);
        if (!options.strict) {
          pushTrace(sessionId, {
            severity: 'REPAIR',
            source: 'SSOT',
            step: 'SSOT_HEAL',
            message: `Added missing prefix: '${fix}' → '${prefixed}'`,
            data: { original: fix, healed: prefixed },
          });
        }
        healed.active_fix = prefixed;
      } else {
        events.push(`NULL_UNKNOWN_COMMAND:${fix}`);
        if (!options.strict) {
          pushTrace(sessionId, {
            severity: 'REPAIR',
            source: 'SSOT',
            step: 'SSOT_HEAL',
            message: `Nulled unknown command: ${fix}`,
            data: { nulledCommand: fix },
          });
        }
        healed.active_fix = null;
      }
    }
  } else {
    healed.active_fix = null;
  }

  // --- SRL state validation ---
  const validSrl = ['PLAN', 'MONITOR', 'REFLECT', 'ADJUST', 'UNKNOWN'];
  if (healed.srl_state && !validSrl.includes(healed.srl_state)) {
    events.push(`INVALID_SRL:${healed.srl_state}→UNKNOWN`);
    if (!options.strict) {
      pushTrace(sessionId, {
        severity: 'REPAIR',
        source: 'SSOT',
        step: 'SSOT_HEAL',
        message: `Invalid SRL state: ${healed.srl_state}. Reset to UNKNOWN.`,
        data: { original: healed.srl_state },
      });
    }
    healed.srl_state = 'UNKNOWN';
  }

  // --- Summary trace ---
  if (!options.strict) {
    if (events.length > 0) {
      pushTrace(sessionId, {
        severity: 'WARNING',
        source: 'SSOT',
        step: 'SSOT_HEAL',
        message: `SSOT healing complete: ${events.length} corrections made`,
        data: { corrections: events },
      });
    } else {
      pushTrace(sessionId, {
        severity: 'INFO',
        source: 'SSOT',
        step: 'SSOT_HEAL',
        message: 'SSOT validation passed, no healing required',
      });
    }
  }

  const ssotHealingCount = events.filter(e => e.startsWith('PRUNE_UNKNOWN_')).length;
  const commandNullCount = events.filter(e => e.startsWith('NULL_UNKNOWN_COMMAND')).length;

  return { healed, events, ssotHealingCount, commandNullCount };
}

/**
 * @deprecated Use normalizeAnalysisToSSOT instead. Kept for backwards compatibility.
 */
export function healAnalysisToSSOT(
  analysis: EAIAnalysis,
  sessionId: string
): { healed: EAIAnalysis; events: string[]; ssotHealingCount: number; commandNullCount: number } {
  return normalizeAnalysisToSSOT(analysis, sessionId);
}

// ============= EPISTEMIC GUARD =============

export type EpistemicLabel = 'OK' | 'CAUTION' | 'VERIFY';

export interface EpistemicGuardResult {
  label: EpistemicLabel;
  notes: string;
  confidence: number;
}

/**
 * Epistemic post-guard: validate epistemic status and add warnings
 */
export function epistemicGuard(
  analysis: EAIAnalysis,
  sessionId: string
): { guarded: EAIAnalysis; result: EpistemicGuardResult } {
  const guarded: EAIAnalysis = structuredClone(analysis);
  let label: EpistemicLabel = 'OK';
  let notes = '';
  let confidence = 1.0;

  // Check epistemic status
  switch (guarded.epistemic_status) {
    case 'FEIT':
      label = 'OK';
      notes = 'Feitelijke informatie, hoge betrouwbaarheid.';
      confidence = 0.9;
      break;
    case 'INTERPRETATIE':
      label = 'CAUTION';
      notes = 'Bevat interpretatie; overweeg meerdere perspectieven.';
      confidence = 0.7;
      break;
    case 'SPECULATIE':
      label = 'VERIFY';
      notes = 'Speculatief antwoord; verificatie aanbevolen.';
      confidence = 0.4;
      break;
    case 'ONBEKEND':
    default:
      label = 'CAUTION';
      notes = 'Epistemische status onbekend; wees kritisch.';
      confidence = 0.5;
      break;
  }

  // Check for potential hallucination indicators
  if (guarded.reasoning?.includes('unsure') || 
      guarded.reasoning?.includes('niet zeker') ||
      guarded.reasoning?.includes('misschien')) {
    if (label === 'OK') {
      label = 'CAUTION';
      notes += ' Onzekerheid gedetecteerd in redenering.';
      confidence -= 0.2;
    }
  }

  // Log epistemic guard result
  pushTrace(sessionId, {
    severity: label === 'OK' ? 'INFO' : label === 'CAUTION' ? 'WARNING' : 'GATE',
    source: 'VALIDATOR',
    step: 'EPISTEMIC_GUARD',
    message: `Epistemic guard: ${label}`,
    data: { 
      epistemicStatus: guarded.epistemic_status,
      label,
      confidence,
      notes,
    },
  });

  return {
    guarded,
    result: { label, notes, confidence },
  };
}



// ============= COMMAND FUZZY MAP =============

const COMMAND_FUZZY_MAP: Record<string, string> = {
  '/proces_evaluatie': '/proces_eval',
  '/fasecheck': '/fase_check',
  'fasecheck': '/fase_check',
  '/reflectie': '/meta',
  '/samenvatting': '/beurtvraag',
  '/quiz': '/quizgen',
  '/toets': '/quizgen',
  '/uitleg': '/beeld',
  '/voorbeelden': '/beeld',
  '/strategie': '/meta',
  'checkin': '/checkin',
  'devil': '/devil',
  'twist': '/twist',
  'vocab': '/vocab'
};

// ============= LOGIC GATE CHECK (ANALYSIS-LEVEL) =============

/**
 * Check logic gates against a full EAIAnalysis object.
 * This is the authoritative gate check used by the pipeline.
 */
export function checkLogicGatesAnalysis(analysis: EAIAnalysis): LogicGateBreach | undefined {
  const core = getEAICore();
  const gates = core.interaction_protocol?.logic_gates || [];
  const currentBands = new Set([
    ...(analysis.process_phases || []),
    ...(analysis.coregulation_bands || []),
    ...(analysis.task_densities || []),
    ...(analysis.secondary_dimensions || [])
  ]);
  const activeTDBand = Array.from(currentBands).find(b => b.startsWith('TD'));
  if (!activeTDBand) return undefined;
  const tdLevel = parseInt(activeTDBand.replace('TD', ''), 10);
  if (isNaN(tdLevel)) return undefined;

  for (const gate of gates) {
    if (currentBands.has(gate.trigger_band)) {
      let limit = 5;
      let operator: 'MAX' | 'ALLOW' = 'MAX';
      if (gate.enforcement.includes('MAX_TD = TD')) {
        const match = gate.enforcement.match(/MAX_TD\s*=\s*TD(\d)/);
        if (match) { limit = parseInt(match[1], 10); operator = 'MAX'; }
      } else if (gate.enforcement.includes('ALLOW_TD = TD')) {
        const match = gate.enforcement.match(/ALLOW_TD\s*=\s*TD(\d)/);
        if (match) { limit = parseInt(match[1], 10); operator = 'ALLOW'; }
      }
      if (operator === 'MAX' || operator === 'ALLOW') {
        if (tdLevel > limit) {
          return {
            trigger_band: gate.trigger_band,
            rule_description: gate.enforcement,
            detected_value: activeTDBand,
            priority: gate.priority
          };
        }
      }
    }
  }
  return undefined;
}

// ============= G-FACTOR (CROSS-DIMENSIONAL) =============

/**
 * Calculate G-Factor with cross-dimensional penalty logic.
 * Consolidates the adapter's calculateGFactor and the pipeline's calculateSemanticValidation.
 */
export function calculateGFactor(
  analysis: EAIAnalysis,
  sessionId: string
): SemanticValidation & { logicGateBreach?: LogicGateBreach } {
  const penalties: string[] = [];
  let gFactor = 1.0;

  // --- Logic gate breach penalty (single authoritative check) ---
  const breach = checkLogicGatesAnalysis(analysis);
  if (breach) {
    if (breach.priority === 'CRITICAL') {
      gFactor -= 1.0;
      penalties.push(`CRITICAL: Logic Gate Breach (${breach.trigger_band} violates ${breach.rule_description})`);
    } else {
      gFactor -= 0.4;
      penalties.push(`HIGH: Logic Gate Breach (${breach.trigger_band})`);
    }
  }

  // --- Cross-dimensional alignment penalties ---
  const allBands = [
    ...(analysis.process_phases || []),
    ...(analysis.coregulation_bands || []),
    ...(analysis.task_densities || []),
    ...(analysis.secondary_dimensions || [])
  ];
  const kBand = allBands.find(b => b.startsWith('K'));
  const eBand = allBands.find(b => b.startsWith('E'));
  const pBand = allBands.find(b => b.startsWith('P'));
  const tdBand = allBands.find(b => b.startsWith('TD'));

  if (kBand === 'K1' && (eBand === 'E4' || eBand === 'E5')) {
    gFactor -= 0.2;
    penalties.push(`ALIGNMENT: Fact Retrieval (K1) mismatch with Critical Epistemics (${eBand})`);
  }
  if (analysis.epistemic_status === 'FEIT' && (!eBand || eBand === 'E0' || eBand === 'E1')) {
    gFactor -= 0.3;
    penalties.push(`HALLUCINATION RISK: Claimed 'FEIT' without Verified Epistemic Band`);
  }
  if (pBand === 'P3' && (tdBand === 'TD1' || tdBand === 'TD2')) {
    gFactor -= 0.2;
    penalties.push(`DRIFT: Instruction Phase (P3) implies Teacher-Led, but Agency is High (${tdBand})`);
  }

  // --- Structural completeness penalties ---
  if (!analysis.coregulation_bands?.length) {
    penalties.push('MISSING_COREG_BANDS');
    gFactor -= 0.15;
  }
  if (!analysis.process_phases?.length) {
    penalties.push('MISSING_PROCESS_PHASES');
    gFactor -= 0.15;
  }
  if (!analysis.task_densities?.length) {
    penalties.push('MISSING_TASK_DENSITIES');
    gFactor -= 0.15;
  }
  if (!analysis.scaffolding) {
    penalties.push('MISSING_SCAFFOLDING');
    gFactor -= 0.1;
  }
  if (analysis.epistemic_status === 'ONBEKEND') {
    penalties.push('UNKNOWN_EPISTEMIC');
    gFactor -= 0.1;
  }

  const tdLevel = analysis.task_densities?.[0]
    ? parseInt(analysis.task_densities[0].replace('TD', ''))
    : 0;
  if (tdLevel >= 4 && !analysis.active_fix) {
    penalties.push('HIGH_TD_NO_FIX');
    gFactor -= 0.1;
  }

  const finalScore = Math.max(0, Math.min(1, gFactor));
  const alignment_status: 'OPTIMAL' | 'DRIFT' | 'CRITICAL' =
    finalScore >= 0.8 ? 'OPTIMAL' :
    finalScore >= 0.5 ? 'DRIFT' : 'CRITICAL';

  pushTrace(sessionId, {
    severity: alignment_status === 'OPTIMAL' ? 'INFO' :
              alignment_status === 'DRIFT' ? 'WARNING' : 'ERROR',
    source: 'VALIDATOR',
    step: 'LOGIC_GATE_CHECK',
    message: `G-Factor: ${(finalScore * 100).toFixed(0)}% (${alignment_status})`,
    data: { gFactor: finalScore, penalties, alignment_status, logicGateBreach: breach || null },
  });

  return { gFactor: finalScore, penalties, alignment_status, logicGateBreach: breach || undefined };
}

// ============= SSOT VALIDATION (CONSOLIDATED) =============

export interface SSOTValidationResult {
  ok: boolean;
  warnings: string[];
  healedAnalysis: EAIAnalysis;
  logicGateBreach?: LogicGateBreach;
}

/**
 * Validate and heal an EAIAnalysis against SSOT.
 * Delegates to normalizeAnalysisToSSOT (the single authoritative healer)
 * and adds a logic gate check.
 */
export function validateAnalysisAgainstSSOT(analysis: EAIAnalysis, _language: 'nl' | 'en' = 'nl'): SSOTValidationResult {
  const { healed, events } = normalizeAnalysisToSSOT(analysis, '__audit__', { strict: true });
  const gateBreach = checkLogicGatesAnalysis(healed);

  return {
    ok: true,
    warnings: events.map(e => e.replace(/:/, ': ')),
    healedAnalysis: healed,
    logicGateBreach: gateBreach,
  };
}

// ============= FULL PIPELINE EXECUTION =============

export interface PipelineResult {
  analysis: EAIAnalysis;
  mechanical: MechanicalState;
  epistemicGuard: EpistemicGuardResult;
  semanticValidation: SemanticValidation;
  healingEvents: string[];
  repaired: boolean;
}

/**
 * Execute full reliability pipeline on analysis result
 */
export function executePipeline(
  analysis: EAIAnalysis,
  mechanical: MechanicalState,
  sessionId: string
): PipelineResult {
  const startTime = Date.now();

  pushTrace(sessionId, {
    severity: 'INFO',
    source: 'PIPELINE',
    step: 'SCHEMA_VALIDATE',
    message: 'Starting reliability pipeline',
  });

  // Step 1: SSOT Healing (unified normalizer with fuzzy-map)
  const { healed, events: healingEvents, ssotHealingCount, commandNullCount } = normalizeAnalysisToSSOT(analysis, sessionId);

  // Step 2: Epistemic Guard
  const { guarded, result: epistemicResult } = epistemicGuard(healed, sessionId);

  // Step 3: Consolidated G-Factor (includes logic gate check internally)
  const semanticValidation = calculateGFactor(guarded, sessionId);

  // Update mechanical state with pipeline results
  const enhancedMechanical: MechanicalState = {
    ...mechanical,
    repairAttempts: healingEvents.length > 0 ? 1 : 0,
    semanticValidation,
    logicGateBreach: checkLogicGatesAnalysis(guarded) || undefined,
    epistemicGuardResult: {
      label: epistemicResult.label,
      notes: epistemicResult.notes,
      confidence: epistemicResult.confidence,
    },
    healingEventCount: healingEvents.length,
    ssotHealingCount,
    commandNullCount,
    parseRepairCount: 0,
  };

  const pipelineDuration = Date.now() - startTime;

  pushTrace(sessionId, {
    severity: 'INFO',
    source: 'PIPELINE',
    step: 'RENDER',
    message: `Pipeline complete in ${pipelineDuration}ms`,
    durationMs: pipelineDuration,
    data: {
      healingEvents: healingEvents.length,
      epistemicLabel: epistemicResult.label,
      gFactor: semanticValidation.gFactor,
    },
  });

  return {
    analysis: guarded,
    mechanical: enhancedMechanical,
    epistemicGuard: epistemicResult,
    semanticValidation,
    healingEvents,
    repaired: healingEvents.length > 0,
  };
}
