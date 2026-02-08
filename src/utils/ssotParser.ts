import { SSOT_DATA, type RubricBand } from '../data/ssot';

export interface SSOTCommand {
  command: string;
  description: string;
}

export interface SSOTLogicGate {
  trigger_band: string;
  condition: string;
  enforcement: string; 
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface SSOTBand {
  band_id: string;
  label: string;
  description: string;
  fix?: string;
  fix_ref?: string;
  learner_obs?: string[];
  ai_obs?: string[];
  didactic_principle?: string;
  mechanistic?: {
    timescale: string;
    fast: number;
    mid: number;
    slow: number;
  };
  flag?: string;
}

export interface SSOTRubric {
  rubric_id: string;
  name: string;
  bands: SSOTBand[];
}

export interface SSOTStructure {
  commands: SSOTCommand[];
  rubrics: SSOTRubric[];
  cycleOrder: string[];
  metadata: {
    version: string;
    system: string;
  };
  context_model?: unknown;
  external_tools?: unknown;
  web_search_policy?: unknown;
  srl_model?: unknown;
  trace_schema?: unknown;
  interaction_protocol?: {
    logic_gates: SSOTLogicGate[];
  };
  didactic_diagnostics?: unknown;
}

let cachedCore: SSOTStructure | null = null;

const parseSSOT = (data: typeof SSOT_DATA): SSOTStructure => {
  try {
    const raw = data;
    const commandsObj = raw.command_library?.commands || {};
    const commands: SSOTCommand[] = Object.entries(commandsObj).map(([cmd, desc]) => ({
      command: cmd,
      description: desc as string
    }));

    const rubrics: SSOTRubric[] = (raw.rubrics || []).map((r) => ({
      rubric_id: r.rubric_id,
      name: r.name,
      bands: (r.bands || []).map((b: RubricBand) => ({
        band_id: b.band_id as string,
        label: b.label as string,
        description: b.description as string,
        fix: b.fix as string | undefined,
        learner_obs: b.learner_obs as string[] | undefined,
        ai_obs: b.ai_obs as string[] | undefined,
        didactic_principle: b.didactic_principle as string | undefined,
        mechanistic: b.mechanistic as SSOTBand['mechanistic'],
        flag: b.flag as string | undefined
      }))
    }));

    const cycleOrder = raw.metadata?.cycle?.order || [];
    const logic_gates: SSOTLogicGate[] = (raw.interaction_protocol?.logic_gates || []).map((g) => ({
      trigger_band: g.trigger_band,
      condition: g.condition,
      enforcement: g.enforcement,
      priority: g.priority as 'CRITICAL' | 'HIGH' | 'MEDIUM'
    }));

    return {
      commands,
      rubrics,
      cycleOrder,
      metadata: {
        version: raw.version,
        system: raw.metadata?.system
      },
      srl_model: raw.srl_model,
      interaction_protocol: { logic_gates }
    };
  } catch (e) {
    console.error("CRITICAL: Failed to parse SSOT TS", e);
    return {
      commands: [],
      rubrics: [],
      cycleOrder: [],
      metadata: { version: '0.0.0', system: 'Error' }
    };
  }
};

export const getEAICore = (): SSOTStructure => {
  if (!cachedCore) cachedCore = parseSSOT(SSOT_DATA);
  return cachedCore;
};

export const EAI_CORE = getEAICore();
