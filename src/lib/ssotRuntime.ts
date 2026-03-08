// ============= SSOT RUNTIME =============
// Loads the effective SSOT by merging base SSOT with an active school plugin overlay.
// Uses explicit path whitelist merge — NO generic deep merge.
// The base SSOT is the constitutive source layer; the plugin annotates but never redefines.

import { supabase } from '@/integrations/supabase/client';
import { BASE_SSOT, type SSOTData, type Rubric, type RubricBand, type SRLState } from '@/data/ssot';
import { validatePlugin, validateVersionMatch, type PluginJson } from '@/lib/ssotValidator';

// ============= TYPES =============

export interface SchoolPlugin {
  id: string;
  school_id: string;
  school_name: string;
  based_on_version: string;
  plugin_json: PluginJson;
  is_active: boolean;
  change_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GateAnnotation {
  rationale?: string;
  teacher_note?: string;
}

// ============= CACHE =============

let cachedEffective: SSOTData | null = null;
let cachedPlugin: SchoolPlugin | null = null;
let cachedGateAnnotations: Map<string, GateAnnotation> = new Map();

// ============= WHITELIST MERGE =============

/**
 * Merge base SSOT with a validated plugin overlay.
 * Only whitelisted fields are applied. All structural/machine fields remain from base.
 *
 * MVP Whitelist:
 * - Band: label, description, didactic_principle, fix (descriptive text only)
 * - Command: descriptions (NOT keys)
 * - SRL: label, goal
 * - Gate annotations: stored separately (not merged into interaction_protocol)
 */
export function whitelistMerge(base: SSOTData, plugin: PluginJson): SSOTData {
  // Deep clone base to avoid mutations
  const effective: SSOTData = structuredClone(base);

  // --- Band overlays ---
  if (plugin.bands) {
    for (const rubric of effective.rubrics) {
      for (const band of rubric.bands) {
        const overlay = plugin.bands[band.band_id];
        if (!overlay) continue;

        if (overlay.label !== undefined) band.label = overlay.label;
        if (overlay.description !== undefined) band.description = overlay.description;
        if (overlay.didactic_principle !== undefined) band.didactic_principle = overlay.didactic_principle;
        if (overlay.fix !== undefined) band.fix = overlay.fix;
      }
    }
  }

  // --- Command description overlays ---
  if (plugin.commands) {
    for (const [cmd, description] of Object.entries(plugin.commands)) {
      if (cmd in effective.command_library.commands) {
        effective.command_library.commands[cmd] = description;
      }
    }
  }

  // --- SRL state overlays ---
  if (plugin.srl_states) {
    for (const state of effective.srl_model.states) {
      const overlay = plugin.srl_states[state.id];
      if (!overlay) continue;

      if (overlay.label !== undefined) state.label = overlay.label;
      if (overlay.goal !== undefined) state.goal = overlay.goal;
    }
  }

  return effective;
}

// ============= LOADER =============

/**
 * Load the effective SSOT for a given school.
 * Fetches the active plugin, validates it, merges with base, and caches.
 * Falls back to base SSOT on any failure.
 *
 * @param schoolId - Optional school ID. If omitted, returns base SSOT.
 * @returns The effective SSOT data.
 */
export async function loadEffectiveSSOT(schoolId?: string): Promise<SSOTData> {
  // No school = base SSOT
  if (!schoolId) {
    cachedEffective = null;
    cachedPlugin = null;
    cachedGateAnnotations = new Map();
    return BASE_SSOT;
  }

  try {
    const { data, error } = await supabase
      .from('school_ssot')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.log('[SSOT Runtime] No active plugin found for school:', schoolId);
      cachedEffective = null;
      cachedPlugin = null;
      cachedGateAnnotations = new Map();
      return BASE_SSOT;
    }

    const pluginJson = data.plugin_json as unknown as PluginJson;

    // Validate
    const validation = validatePlugin(pluginJson, BASE_SSOT);
    const versionCheck = validateVersionMatch(data.based_on_version, BASE_SSOT.version);

    if (!validation.valid) {
      console.warn('[SSOT Runtime] Plugin validation failed:', validation.issues);
      cachedEffective = null;
      cachedPlugin = null;
      cachedGateAnnotations = new Map();
      return BASE_SSOT;
    }

    if (versionCheck) {
      console.warn('[SSOT Runtime]', versionCheck.message);
    }

    // Merge
    const effective = whitelistMerge(BASE_SSOT, pluginJson);

    // Cache gate annotations separately
    const annotations = new Map<string, GateAnnotation>();
    if (pluginJson.logic_gate_annotations) {
      for (const [bandId, annotation] of Object.entries(pluginJson.logic_gate_annotations)) {
        annotations.set(bandId, annotation);
      }
    }

    cachedEffective = effective;
    cachedPlugin = {
      id: data.id,
      school_id: data.school_id,
      school_name: data.school_name,
      based_on_version: data.based_on_version,
      plugin_json: pluginJson,
      is_active: data.is_active,
      change_notes: data.change_notes,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
    cachedGateAnnotations = annotations;

    console.log(`[SSOT Runtime] Loaded plugin for school "${data.school_name}" (v${data.based_on_version})`);
    return effective;
  } catch (err) {
    console.error('[SSOT Runtime] Failed to load plugin, falling back to base:', err);
    cachedEffective = null;
    cachedPlugin = null;
    cachedGateAnnotations = new Map();
    return BASE_SSOT;
  }
}

// ============= SYNC GETTERS =============

/**
 * Get the effective SSOT (cached or base as fallback).
 * This is the primary runtime getter used by all helpers in ssot.ts.
 */
export function getEffectiveSSOT(): SSOTData {
  return cachedEffective || BASE_SSOT;
}

/**
 * Get the currently active school plugin (or null if none).
 */
export function getActivePlugin(): SchoolPlugin | null {
  return cachedPlugin;
}

/**
 * Get gate annotations for a specific band (from plugin, not from base SSOT).
 */
export function getGateAnnotation(bandId: string): GateAnnotation | undefined {
  return cachedGateAnnotations.get(bandId);
}

/**
 * Get all gate annotations.
 */
export function getAllGateAnnotations(): Map<string, GateAnnotation> {
  return new Map(cachedGateAnnotations);
}

/**
 * Check if a school plugin is currently active.
 */
export function hasActivePlugin(): boolean {
  return cachedPlugin !== null;
}

/**
 * Clear the runtime cache (e.g., on logout or school switch).
 */
export function clearSSOTCache(): void {
  cachedEffective = null;
  cachedPlugin = null;
  cachedGateAnnotations = new Map();
}
