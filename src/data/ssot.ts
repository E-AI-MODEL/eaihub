// SSOT Data - Single Source of Truth for EAI Didactic Engine
// TypeScript wrapper for the authoritative v15.0.0 JSON
// This imports the JSON and provides typed access to all SSOT data

import ssotJson from './ssot_v15.json';

// ============= TYPE DEFINITIONS =============

export interface MechanisticSignature {
  timescale: string;
  fast: number;
  mid: number;
  slow: number;
}

export interface MechanisticRisks {
  fast_dominance_risk: 'low' | 'medium' | 'high';
  slow_underuse_risk: 'low' | 'medium' | 'high';
  parallel_divergence_risk: 'low' | 'medium' | 'high';
}

export interface NLProfile {
  nested_level: number;
  update_window_turns: number;
  memory_role: string;
  trigger_pattern: string[];
  microdescriptor_target: string[];
  inner_objective: string;
  lock_window_hint: number;
}

export interface RubricBand {
  band_id: string;
  label: string;
  description: string;
  fix: string;
  fix_ref?: string;
  didactic_principle: string;
  learner_obs: string[];
  ai_obs?: string[];
  score_range?: [number, number];
  score_min?: number;
  score_max?: number;
  flag?: string;
  mechanistic?: MechanisticSignature;
  mechanistic_signature_target?: {
    timescale: string;
    fast_weight: number;
    mid_weight: number;
    slow_weight: number;
  };
  risks?: MechanisticRisks;
  mechanistic_risks?: MechanisticRisks;
  nl_profile?: NLProfile;
  band_ref?: string;
  trace_tags?: string[];
  band_weight?: number;
  fix_type?: string;
}

export interface Rubric {
  rubric_id: string;
  name: string;
  dimension?: string;
  version: string;
  language: string;
  goal?: string;
  links?: Record<string, string>;
  bands: RubricBand[];
}

export interface LogicGate {
  trigger_band: string;
  condition: string;
  enforcement: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface SRLState {
  id: string;
  label: string;
  goal: string;
}

export interface CommandLibrary {
  commands: Record<string, string>;
}

export interface SSOTMetadata {
  system: string;
  description: string;
  integrity: string;
  cycle: {
    order: string[];
  };
}

export interface ContextModel {
  description: string;
  required_fields: string[];
  optional_fields: string[];
  notes: string[];
}

export interface ExternalTools {
  curriculum_api: {
    enabled: boolean;
    provider: string;
    preferred_usage_state: string;
    description: string;
    query_contract: {
      requires: string[];
      optional: string[];
      returns: string[];
    };
    recommended_domains: string[];
    auth: {
      type: string;
      env_var: string;
      note: string;
    };
    fallback_provider: string;
    fallback_notes: string[];
  };
  generic_web_search: {
    enabled: boolean;
    purpose: string;
    preferred_usage_state: string;
    description: string;
    guardrails: string[];
  };
}

export interface WebSearchPolicy {
  allowed_states: string[];
  forbidden_states: string[];
  notes: string[];
  max_sources: number;
  domain_filters: string[];
}

export interface TraceSchema {
  event_types: string[];
  minimum_fields: string[];
  note: string;
}

export interface GlobalLogic {
  cycle_priority: string[];
  secondary_check: string[];
  interrupt_check: string[];
}

export interface SSOTData {
  $schema: string;
  version: string;
  metadata: SSOTMetadata;
  interaction_protocol: {
    logic_gates: LogicGate[];
  };
  command_library: CommandLibrary;
  global_logic: GlobalLogic;
  didactic_diagnostics: Record<string, unknown>;
  srl_model: {
    states: SRLState[];
  };
  trace_schema: TraceSchema;
  context_model: ContextModel;
  external_tools: ExternalTools;
  web_search_policy: WebSearchPolicy;
  rubrics: Rubric[];
}

// ============= SSOT DATA EXPORT =============

export const SSOT_DATA = ssotJson as unknown as SSOTData;

// ============= HELPER FUNCTIONS =============

/**
 * Get a rubric by its ID (e.g., "K_KennisType", "C_CoRegulatie")
 */
export function getRubric(rubricId: string): Rubric | undefined {
  return SSOT_DATA.rubrics.find(r => r.rubric_id === rubricId);
}

/**
 * Get a specific band from a rubric (e.g., "K1", "C3")
 */
export function getBand(bandId: string): RubricBand | undefined {
  for (const rubric of SSOT_DATA.rubrics) {
    const band = rubric.bands.find(b => b.band_id === bandId);
    if (band) return band;
  }
  return undefined;
}

/**
 * Get the fix command for a specific band
 */
export function getFixForBand(bandId: string): string | null {
  const band = getBand(bandId);
  return band?.fix || band?.fix_ref || null;
}

/**
 * Get the flag for a specific band
 */
export function getFlagForBand(bandId: string): string | null {
  const band = getBand(bandId);
  return band?.flag || null;
}

/**
 * Get all flags for an array of band IDs
 */
export function getFlagsForBands(bandIds: string[]): string[] {
  const flags: string[] = [];
  for (const bandId of bandIds) {
    const flag = getFlagForBand(bandId);
    if (flag && !flags.includes(flag)) {
      flags.push(flag);
    }
  }
  return flags;
}

/**
 * Get learner observation patterns for a rubric as regex patterns
 */
export function getLearnerObsPatterns(rubricId: string): Map<string, RegExp> {
  const patterns = new Map<string, RegExp>();
  const rubric = getRubric(rubricId);
  
  if (rubric) {
    for (const band of rubric.bands) {
      if (band.learner_obs && band.learner_obs.length > 0) {
        const patternStr = band.learner_obs
          .map(obs => obs.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');
        patterns.set(band.band_id, new RegExp(patternStr, 'i'));
      }
    }
  }
  
  return patterns;
}

/**
 * Get AI observation patterns for a rubric
 */
export function getAiObsPatterns(rubricId: string): Map<string, RegExp> {
  const patterns = new Map<string, RegExp>();
  const rubric = getRubric(rubricId);
  
  if (rubric) {
    for (const band of rubric.bands) {
      if (band.ai_obs && band.ai_obs.length > 0) {
        const patternStr = band.ai_obs
          .map(obs => obs.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');
        patterns.set(band.band_id, new RegExp(patternStr, 'i'));
      }
    }
  }
  
  return patterns;
}

/**
 * Get all commands from the command library
 */
export function getCommands(): Record<string, string> {
  return SSOT_DATA.command_library.commands;
}

/**
 * Get a specific command description
 */
export function getCommandDescription(command: string): string | null {
  const cmd = command.startsWith('/') ? command : `/${command}`;
  return SSOT_DATA.command_library.commands[cmd] || null;
}

/**
 * Get all logic gates
 */
export function getLogicGates(): LogicGate[] {
  return SSOT_DATA.interaction_protocol.logic_gates;
}

/**
 * Get logic gates for a specific trigger band
 */
export function getLogicGatesForBand(bandId: string): LogicGate[] {
  return SSOT_DATA.interaction_protocol.logic_gates.filter(
    gate => gate.trigger_band === bandId
  );
}

/**
 * Get the cycle order (dimension processing order)
 */
export function getCycleOrder(): string[] {
  return SSOT_DATA.metadata.cycle.order;
}

/**
 * Get SRL states
 */
export function getSRLStates(): SRLState[] {
  return SSOT_DATA.srl_model.states;
}

/**
 * Get mechanistic signature for a band
 */
export function getMechanisticSignature(bandId: string): MechanisticSignature | null {
  const band = getBand(bandId);
  return band?.mechanistic || null;
}

/**
 * Get all bands for a specific rubric
 */
export function getBandsForRubric(rubricId: string): RubricBand[] {
  const rubric = getRubric(rubricId);
  return rubric?.bands || [];
}

/**
 * Extract short dimension key from full rubric ID
 * @example getShortKey("K_KennisType") => "K"
 */
export function getShortKey(rubricId: string): string {
  return rubricId.split('_')[0];
}

/**
 * Get all short dimension keys from SSOT cycle order
 */
export function getDimensionKeys(): string[] {
  return SSOT_DATA.metadata.cycle.order.map(id => id.split('_')[0]);
}

/**
 * Get rubric by short key (e.g., "K" -> K_KennisType rubric)
 */
export function getRubricByShortKey(shortKey: string): Rubric | undefined {
  return SSOT_DATA.rubrics.find(r => r.rubric_id.startsWith(shortKey + '_'));
}
