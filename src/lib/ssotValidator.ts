// ============= SSOT PLUGIN VALIDATOR =============
// Three-layer Zod validation for school plugin overlays
// Layer 1: Schema validation (structural correctness)
// Layer 2: Referential integrity (cross-references valid)
// Layer 3: Runtime safety (no immutable field mutations)

import { z } from 'zod';
import type { SSOTData } from '@/data/ssot';

// ============= PLUGIN JSON SCHEMA (Zod) =============

const BandOverlaySchema = z.object({
  label: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  didactic_principle: z.string().min(1).max(500).optional(),
  fix: z.string().min(1).max(500).optional(),
}).strict();

const SRLOverlaySchema = z.object({
  label: z.string().min(1).max(200).optional(),
  goal: z.string().min(1).max(500).optional(),
}).strict();

const GateAnnotationSchema = z.object({
  rationale: z.string().min(1).max(1000).optional(),
  teacher_note: z.string().min(1).max(1000).optional(),
}).strict();

export const PluginJsonSchema = z.object({
  bands: z.record(z.string(), BandOverlaySchema).optional(),
  commands: z.record(z.string(), z.string().min(1).max(500)).optional(),
  srl_states: z.record(z.string(), SRLOverlaySchema).optional(),
  logic_gate_annotations: z.record(z.string(), GateAnnotationSchema).optional(),
}).strict();

export type PluginJson = z.infer<typeof PluginJsonSchema>;

// ============= VALIDATION RESULT =============

export interface ValidationIssue {
  layer: 'SCHEMA' | 'REFERENTIAL' | 'RUNTIME';
  severity: 'ERROR' | 'WARNING';
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ============= IMMUTABLE FIELDS =============
// These fields must NEVER appear in a plugin overlay

const IMMUTABLE_BAND_FIELDS = new Set([
  'band_id', 'fix_ref', 'score_range', 'score_min', 'score_max',
  'mechanistic', 'mechanistic_signature_target', 'risks', 'mechanistic_risks',
  'nl_profile', 'band_ref', 'trace_tags', 'band_weight', 'fix_type',
  'learner_obs', 'ai_obs', 'flag',
]);

// ============= LAYER 1: SCHEMA VALIDATION =============

function validateSchema(pluginJson: unknown): ValidationIssue[] {
  const result = PluginJsonSchema.safeParse(pluginJson);
  if (!result.success) {
    return result.error.issues.map(issue => ({
      layer: 'SCHEMA' as const,
      severity: 'ERROR' as const,
      message: `${issue.path.join('.')}: ${issue.message}`,
      path: issue.path.join('.'),
    }));
  }
  return [];
}

// ============= LAYER 2: REFERENTIAL INTEGRITY =============

function validateReferential(plugin: PluginJson, baseSSOT: SSOTData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Collect all valid band IDs from base SSOT
  const validBandIds = new Set<string>();
  for (const rubric of baseSSOT.rubrics) {
    for (const band of rubric.bands) {
      validBandIds.add(band.band_id);
    }
  }

  // Collect all valid command keys
  const validCommands = new Set(Object.keys(baseSSOT.command_library.commands));

  // Collect all valid SRL state IDs
  const validSRLIds = new Set(baseSSOT.srl_model.states.map(s => s.id));

  // Check band references
  if (plugin.bands) {
    for (const bandId of Object.keys(plugin.bands)) {
      if (!validBandIds.has(bandId)) {
        issues.push({
          layer: 'REFERENTIAL',
          severity: 'ERROR',
          message: `Band "${bandId}" does not exist in base SSOT`,
          path: `bands.${bandId}`,
        });
      }
    }
  }

  // Check command references
  if (plugin.commands) {
    for (const cmd of Object.keys(plugin.commands)) {
      if (!validCommands.has(cmd)) {
        issues.push({
          layer: 'REFERENTIAL',
          severity: 'ERROR',
          message: `Command "${cmd}" does not exist in base SSOT`,
          path: `commands.${cmd}`,
        });
      }
    }
  }

  // Check SRL state references
  if (plugin.srl_states) {
    for (const stateId of Object.keys(plugin.srl_states)) {
      if (!validSRLIds.has(stateId)) {
        issues.push({
          layer: 'REFERENTIAL',
          severity: 'ERROR',
          message: `SRL state "${stateId}" does not exist in base SSOT`,
          path: `srl_states.${stateId}`,
        });
      }
    }
  }

  // Check logic gate annotation references
  if (plugin.logic_gate_annotations) {
    for (const bandId of Object.keys(plugin.logic_gate_annotations)) {
      if (!validBandIds.has(bandId)) {
        issues.push({
          layer: 'REFERENTIAL',
          severity: 'ERROR',
          message: `Logic gate annotation band "${bandId}" does not exist in base SSOT`,
          path: `logic_gate_annotations.${bandId}`,
        });
      }
    }
  }

  return issues;
}

// ============= LAYER 3: RUNTIME SAFETY =============

function validateRuntime(pluginJson: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!pluginJson || typeof pluginJson !== 'object') return issues;

  const plugin = pluginJson as Record<string, unknown>;

  // Check for immutable fields in bands
  if (plugin.bands && typeof plugin.bands === 'object') {
    const bands = plugin.bands as Record<string, Record<string, unknown>>;
    for (const [bandId, overlay] of Object.entries(bands)) {
      if (overlay && typeof overlay === 'object') {
        for (const field of Object.keys(overlay)) {
          if (IMMUTABLE_BAND_FIELDS.has(field)) {
            issues.push({
              layer: 'RUNTIME',
              severity: 'ERROR',
              message: `Immutable field "${field}" cannot be overridden in band "${bandId}"`,
              path: `bands.${bandId}.${field}`,
            });
          }
        }
      }
    }
  }

  // Check for unknown top-level keys (beyond what PluginJsonSchema allows)
  const allowedTopKeys = new Set(['bands', 'commands', 'srl_states', 'logic_gate_annotations']);
  for (const key of Object.keys(plugin)) {
    if (!allowedTopKeys.has(key)) {
      issues.push({
        layer: 'RUNTIME',
        severity: 'ERROR',
        message: `Unknown top-level plugin key: "${key}"`,
        path: key,
      });
    }
  }

  return issues;
}

// ============= MAIN VALIDATION FUNCTION =============

/**
 * Validate a plugin JSON against the base SSOT.
 * Runs all three layers: Schema → Referential → Runtime.
 * Returns early if schema validation fails (layers 2+3 need valid structure).
 */
export function validatePlugin(pluginJson: unknown, baseSSOT: SSOTData): ValidationResult {
  // Layer 1: Schema
  const schemaIssues = validateSchema(pluginJson);
  if (schemaIssues.some(i => i.severity === 'ERROR')) {
    return { valid: false, issues: schemaIssues };
  }

  const plugin = pluginJson as PluginJson;

  // Layer 2: Referential integrity
  const refIssues = validateReferential(plugin, baseSSOT);

  // Layer 3: Runtime safety
  const runtimeIssues = validateRuntime(pluginJson);

  const allIssues = [...schemaIssues, ...refIssues, ...runtimeIssues];
  const valid = !allIssues.some(i => i.severity === 'ERROR');

  return { valid, issues: allIssues };
}

/**
 * Validate that the based_on_version matches the current SSOT version.
 */
export function validateVersionMatch(basedOnVersion: string, currentVersion: string): ValidationIssue | null {
  if (basedOnVersion !== currentVersion) {
    return {
      layer: 'RUNTIME',
      severity: 'WARNING',
      message: `Plugin was created for SSOT v${basedOnVersion}, current is v${currentVersion}. Review for compatibility.`,
    };
  }
  return null;
}
