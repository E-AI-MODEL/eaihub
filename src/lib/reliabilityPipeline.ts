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
 * Validate that a rubric ID exists in SSOT
 */
function ssotHasRubric(rubricId: string): boolean {
  return getRubric(rubricId) !== undefined;
}

/**
 * Validate that a band ID exists in a rubric
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
 * SSOT-healing: prune unknown rubric/band/command references
 * This is the control-plane anti-hallucination mechanism
 */
export function healAnalysisToSSOT(
  analysis: EAIAnalysis,
  sessionId: string
): { healed: EAIAnalysis; events: string[]; ssotHealingCount: number; commandNullCount: number } {
  const events: string[] = [];
  const healed: EAIAnalysis = structuredClone(analysis);

  // Validate coregulation_bands
  if (healed.coregulation_bands) {
    const validBands = healed.coregulation_bands.filter(bandId => {
      const band = getBand(bandId);
      if (!band) {
        events.push(`PRUNE_UNKNOWN_BAND:${bandId}`);
        pushTrace(sessionId, {
          severity: 'REPAIR',
          source: 'SSOT',
          step: 'SSOT_HEAL',
          message: `Pruned unknown band: ${bandId}`,
          data: { prunedBand: bandId },
        });
        return false;
      }
      return true;
    });
    healed.coregulation_bands = validBands;
  }

  // Validate process_phases
  if (healed.process_phases) {
    const validPhases = healed.process_phases.filter(phase => {
      const band = getBand(phase);
      if (!band) {
        events.push(`PRUNE_UNKNOWN_PHASE:${phase}`);
        pushTrace(sessionId, {
          severity: 'REPAIR',
          source: 'SSOT',
          step: 'SSOT_HEAL',
          message: `Pruned unknown phase: ${phase}`,
          data: { prunedPhase: phase },
        });
        return false;
      }
      return true;
    });
    healed.process_phases = validPhases;
  }

  // Validate task_densities
  if (healed.task_densities) {
    const validTDs = healed.task_densities.filter(td => {
      const band = getBand(td);
      if (!band) {
        events.push(`PRUNE_UNKNOWN_TD:${td}`);
        pushTrace(sessionId, {
          severity: 'REPAIR',
          source: 'SSOT',
          step: 'SSOT_HEAL',
          message: `Pruned unknown task density: ${td}`,
          data: { prunedTD: td },
        });
        return false;
      }
      return true;
    });
    healed.task_densities = validTDs;
  }

  // Validate secondary_dimensions
  if (healed.secondary_dimensions) {
    const validSecondary = healed.secondary_dimensions.filter(dim => {
      const band = getBand(dim);
      if (!band) {
        events.push(`PRUNE_UNKNOWN_SECONDARY:${dim}`);
        pushTrace(sessionId, {
          severity: 'REPAIR',
          source: 'SSOT',
          step: 'SSOT_HEAL',
          message: `Pruned unknown secondary dimension: ${dim}`,
          data: { prunedDim: dim },
        });
        return false;
      }
      return true;
    });
    healed.secondary_dimensions = validSecondary;
  }

  // Validate active_fix command
  if (healed.active_fix && !ssotHasCommand(healed.active_fix)) {
    events.push(`NULL_UNKNOWN_COMMAND:${healed.active_fix}`);
    pushTrace(sessionId, {
      severity: 'REPAIR',
      source: 'SSOT',
      step: 'SSOT_HEAL',
      message: `Nulled unknown command: ${healed.active_fix}`,
      data: { nulledCommand: healed.active_fix },
    });
    healed.active_fix = null;
  }

  // Log summary if any healing occurred
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

  const ssotHealingCount = events.filter(e => e.startsWith('PRUNE_UNKNOWN_')).length;
  const commandNullCount = events.filter(e => e.startsWith('NULL_UNKNOWN_COMMAND')).length;

  return { healed, events, ssotHealingCount, commandNullCount };
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

// ============= SEMANTIC VALIDATION (G-FACTOR) =============

/**
 * Calculate G-Factor (Semantic Integrity score)
 * Based on alignment between detected bands and expected SSOT patterns
 */
export function calculateSemanticValidation(
  analysis: EAIAnalysis,
  sessionId: string
): SemanticValidation {
  const penalties: string[] = [];
  let gFactor = 1.0;

  // Check for missing primary dimensions
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

  // Check for missing scaffolding
  if (!analysis.scaffolding) {
    penalties.push('MISSING_SCAFFOLDING');
    gFactor -= 0.1;
  }

  // Check for unknown epistemic status
  if (analysis.epistemic_status === 'ONBEKEND') {
    penalties.push('UNKNOWN_EPISTEMIC');
    gFactor -= 0.1;
  }

  // Check for missing active fix when needed
  const tdLevel = analysis.task_densities?.[0] 
    ? parseInt(analysis.task_densities[0].replace('TD', '')) 
    : 0;
  if (tdLevel >= 4 && !analysis.active_fix) {
    penalties.push('HIGH_TD_NO_FIX');
    gFactor -= 0.1;
  }

  // Determine alignment status
  const alignment_status: 'OPTIMAL' | 'DRIFT' | 'CRITICAL' = 
    gFactor >= 0.8 ? 'OPTIMAL' :
    gFactor >= 0.5 ? 'DRIFT' : 'CRITICAL';

  pushTrace(sessionId, {
    severity: alignment_status === 'OPTIMAL' ? 'INFO' : 
              alignment_status === 'DRIFT' ? 'WARNING' : 'ERROR',
    source: 'VALIDATOR',
    step: 'SCHEMA_VALIDATE',
    message: `G-Factor: ${(gFactor * 100).toFixed(0)}% (${alignment_status})`,
    data: { gFactor, penalties, alignment_status },
  });

  return {
    gFactor: Math.max(0, Math.min(1, gFactor)),
    penalties,
    alignment_status,
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
): SemanticValidation {
  const penalties: string[] = [];
  let gFactor = 1.0;

  // --- Logic gate breach penalty ---
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

  return { gFactor: finalScore, penalties, alignment_status };
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
 * Consolidated from eaiLearnAdapter — this is now the single authoritative validator.
 */
export function validateAnalysisAgainstSSOT(analysis: EAIAnalysis, _language: 'nl' | 'en' = 'nl'): SSOTValidationResult {
  const core = getEAICore();
  const knownBandIds = new Set<string>();
  const knownCommands = new Set<string>();
  const warnings: string[] = [];
  const healed = JSON.parse(JSON.stringify(analysis));

  core.rubrics.forEach((rubric: any) => {
    (rubric.bands ?? []).forEach((band: any) => {
      if (band.band_id) knownBandIds.add(band.band_id);
    });
  });
  core.commands.forEach((cmd: any) => knownCommands.add(cmd.command));

  const cleanBandList = (list: string[], fieldName: string) => {
    const clean: string[] = [];
    list.forEach(bandId => {
      if (knownBandIds.has(bandId)) {
        clean.push(bandId);
      } else if (bandId && bandId.length > 1) {
        warnings.push(`Pruned unknown band ID: ${bandId} in ${fieldName}`);
      }
    });
    return clean;
  };

  healed.process_phases = cleanBandList(healed.process_phases || [], 'process_phases');
  healed.coregulation_bands = cleanBandList(healed.coregulation_bands || [], 'coregulation_bands');
  healed.task_densities = cleanBandList(healed.task_densities || [], 'task_densities');
  healed.secondary_dimensions = cleanBandList(healed.secondary_dimensions || [], 'secondary_dimensions');

  if (healed.active_fix && healed.active_fix !== 'NONE' && healed.active_fix !== 'null') {
    const fix = healed.active_fix.trim();
    if (!knownCommands.has(fix)) {
      if (COMMAND_FUZZY_MAP[fix]) {
        healed.active_fix = COMMAND_FUZZY_MAP[fix];
        warnings.push(`Healed command: '${fix}' -> '${healed.active_fix}'`);
      } else if (!fix.startsWith('/') && knownCommands.has(`/${fix}`)) {
        healed.active_fix = `/${fix}`;
        warnings.push(`Added missing prefix: '${fix}' -> '${healed.active_fix}'`);
      } else {
        warnings.push(`Nullified unknown command: '${fix}'`);
        healed.active_fix = null;
      }
    }
  } else {
    healed.active_fix = null;
  }

  const validSrl = ['PLAN', 'MONITOR', 'REFLECT', 'ADJUST', 'UNKNOWN'];
  if (healed.srl_state && !validSrl.includes(healed.srl_state)) {
    warnings.push(`Invalid SRL state: ${healed.srl_state}. Resetting to UNKNOWN.`);
    healed.srl_state = 'UNKNOWN';
  }

  const gateBreach = checkLogicGatesAnalysis(healed);

  return { ok: true, warnings, healedAnalysis: healed, logicGateBreach: gateBreach };
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

  // Step 1: SSOT Healing
  const { healed, events: healingEvents, ssotHealingCount, commandNullCount } = healAnalysisToSSOT(analysis, sessionId);

  // Step 2: Epistemic Guard
  const { guarded, result: epistemicResult } = epistemicGuard(healed, sessionId);

  // Step 3: Consolidated G-Factor (cross-dimensional + structural)
  const semanticValidation = calculateGFactor(guarded, sessionId);

  // Step 4: Logic gate breach (authoritative, post-healing)
  const logicGateBreach = checkLogicGatesAnalysis(guarded);

  // Update mechanical state with pipeline results
  const enhancedMechanical: MechanicalState = {
    ...mechanical,
    repairAttempts: healingEvents.length > 0 ? 1 : 0,
    semanticValidation,
    logicGateBreach: logicGateBreach || undefined,
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
