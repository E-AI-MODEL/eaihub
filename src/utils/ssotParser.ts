import { SSOT_DATA, type Rubric, type RubricBand, type LogicGate } from '@/data/ssot';

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
  score_range?: [number, number];
}

export interface SSOTRubric {
  rubric_id: string;
  name: string;
  dimension?: string;
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
  srl_model?: {
    states: Array<{ id: string; label: string; goal: string }>;
  };
  trace_schema?: unknown;
  interaction_protocol?: {
    logic_gates: SSOTLogicGate[];
  };
  didactic_diagnostics?: unknown;
  global_logic?: {
    cycle_priority: string[];
    secondary_check: string[];
    interrupt_check: string[];
  };
}

let cachedCore: SSOTStructure | null = null;

const parseSSOT = (): SSOTStructure => {
  try {
    const raw = SSOT_DATA;
    
    // Parse commands from command_library
    const commandsObj = raw.command_library?.commands || {};
    const commands: SSOTCommand[] = Object.entries(commandsObj).map(([cmd, desc]) => ({
      command: cmd,
      description: desc as string
    }));

    // Parse rubrics with full band data
    const rubrics: SSOTRubric[] = (raw.rubrics || []).map((r: Rubric) => ({
      rubric_id: r.rubric_id,
      name: r.name,
      dimension: r.dimension,
      bands: (r.bands || []).map((b: RubricBand) => ({
        band_id: b.band_id,
        label: b.label,
        description: b.description,
        fix: b.fix,
        fix_ref: b.fix_ref,
        learner_obs: b.learner_obs,
        ai_obs: b.ai_obs,
        didactic_principle: b.didactic_principle,
        mechanistic: b.mechanistic,
        flag: b.flag,
        score_range: b.score_range
      }))
    }));

    // Parse cycle order from metadata
    const cycleOrder = raw.metadata?.cycle?.order || [];
    
    // Parse logic gates
    const logic_gates: SSOTLogicGate[] = (raw.interaction_protocol?.logic_gates || []).map((g: LogicGate) => ({
      trigger_band: g.trigger_band,
      condition: g.condition,
      enforcement: g.enforcement,
      priority: g.priority
    }));

    // Parse SRL model
    const srl_model = raw.srl_model ? {
      states: raw.srl_model.states.map(s => ({
        id: s.id,
        label: s.label,
        goal: s.goal
      }))
    } : undefined;

    // Parse global logic
    const global_logic = raw.global_logic ? {
      cycle_priority: raw.global_logic.cycle_priority,
      secondary_check: raw.global_logic.secondary_check,
      interrupt_check: raw.global_logic.interrupt_check
    } : undefined;

    return {
      commands,
      rubrics,
      cycleOrder,
      metadata: {
        version: raw.version,
        system: raw.metadata?.system || 'EAI'
      },
      srl_model,
      interaction_protocol: { logic_gates },
      global_logic,
      context_model: raw.context_model,
      external_tools: raw.external_tools,
      web_search_policy: raw.web_search_policy,
      trace_schema: raw.trace_schema
    };
  } catch (e) {
    console.error("CRITICAL: Failed to parse SSOT", e);
    return {
      commands: [],
      rubrics: [],
      cycleOrder: [],
      metadata: { version: '0.0.0', system: 'Error' }
    };
  }
};

export const getEAICore = (): SSOTStructure => {
  if (!cachedCore) cachedCore = parseSSOT();
  return cachedCore;
};

export const EAI_CORE = getEAICore();

// Re-export useful helpers from ssot.ts
export { 
  getRubric, 
  getBand, 
  getFixForBand, 
  getFlagForBand,
  getCommands,
  getLogicGates,
  getCycleOrder,
  getSRLStates 
} from '@/data/ssot';
