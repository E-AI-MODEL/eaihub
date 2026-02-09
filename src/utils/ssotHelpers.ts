// ============= SSOT Helpers - Central transformation layer =============
// Generates UI-ready data from authoritative SSOT v15.0.0 JSON
// All components should import from here instead of hardcoding data

import { 
  SSOT_DATA, 
  getLogicGates, 
  getRubric, 
  getRubricByShortKey,
  getShortKey,
  getCommands,
  getSRLStates,
  type Rubric,
  type RubricBand,
  type LogicGate
} from '@/data/ssot';
import { getNodeById, getLearningPath, type LearningNode } from '@/data/curriculum';

// ============= TYPE DEFINITIONS =============

export interface DimensionForUI {
  code: string;           // 'K', 'P', 'TD', etc.
  name: string;           // 'Kennis & Automatisering'
  goal: string;           // From rubric.goal or band didactic_principle
  bands: BandForUI[];
}

export interface BandForUI {
  id: string;             // 'K1', 'K2', etc.
  label: string;          // 'Feitenkennis'
  description: string;    // Full description
  fix?: string;           // Fix command
  fix_ref?: string;       // Fix reference
  principle?: string;     // Didactic principle
}

export interface LogicGateForUI {
  trigger: string;        // 'K1'
  condition: string;      // 'Feitenkennis' - from band label
  enforcement: string;    // 'MAX_TD = TD2'
  description: string;    // Full enforcement text
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface KnowledgeLevelForUI {
  id: string;             // 'K1'
  label: string;          // 'Feitenkennis'
  desc: string;           // Description
  gate: string;           // 'MAX_TD = TD2'
  gateDesc: string;       // Gate explanation
  fix: string;            // '/flits'
  color: string;          // Tailwind class
  border: string;         // Border class
  bg: string;             // Background class
}

export interface DimensionMeta {
  text: string;
  border: string;
  bg: string;
  goal: string;
}

export interface DimensionLabel {
  label: string;
  description: string;
}

// ============= COLOR SCHEME =============

const DIMENSION_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  K:  { text: 'text-yellow-400',  border: 'border-yellow-500/30', bg: 'bg-yellow-900/10' },
  P:  { text: 'text-cyan-400',    border: 'border-cyan-500/30',   bg: 'bg-cyan-900/10' },
  TD: { text: 'text-orange-400',  border: 'border-orange-500/30', bg: 'bg-orange-900/10' },
  C:  { text: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-900/10' },
  V:  { text: 'text-emerald-400', border: 'border-emerald-500/30',bg: 'bg-emerald-900/10' },
  T:  { text: 'text-pink-400',    border: 'border-pink-500/30',   bg: 'bg-pink-900/10' },
  E:  { text: 'text-purple-400',  border: 'border-purple-500/30', bg: 'bg-purple-900/10' },
  L:  { text: 'text-teal-400',    border: 'border-teal-500/30',   bg: 'bg-teal-900/10' },
  S:  { text: 'text-indigo-400',  border: 'border-indigo-500/30', bg: 'bg-indigo-900/10' },
  B:  { text: 'text-rose-400',    border: 'border-rose-500/30',   bg: 'bg-rose-900/10' },
};

const DEFAULT_COLORS = { text: 'text-primary', border: 'border-border', bg: 'bg-secondary/30' };

// ============= HELPER FUNCTIONS =============

/**
 * Get all dimensions with bands for UI display
 * Used by ConceptPage and DidacticLegend
 */
export function getDimensionsForUI(): DimensionForUI[] {
  const cycleOrder = SSOT_DATA.metadata.cycle.order;
  const dimensions: DimensionForUI[] = [];
  
  for (const rubricId of cycleOrder) {
    const rubric = getRubric(rubricId);
    if (!rubric) continue;
    
    const shortKey = getShortKey(rubricId);
    
    dimensions.push({
      code: shortKey,
      name: rubric.name,
      goal: rubric.goal || rubric.bands[0]?.didactic_principle || '',
      bands: rubric.bands.map(band => ({
        id: band.band_id,
        label: band.label,
        description: band.description,
        fix: band.fix,
        fix_ref: band.fix_ref,
        principle: band.didactic_principle,
      })),
    });
  }
  
  return dimensions;
}

/**
 * Get logic gates formatted for UI display
 * Used by ConceptPage, DidacticLegend
 */
export function getLogicGatesForUI(): LogicGateForUI[] {
  const gates = getLogicGates();
  
  return gates.map(gate => {
    // Get the label for the trigger band
    const rubric = getRubricByShortKey(gate.trigger_band.replace(/\d+/, ''));
    const band = rubric?.bands.find(b => b.band_id === gate.trigger_band);
    
    return {
      trigger: gate.trigger_band,
      condition: band?.label || gate.condition,
      enforcement: gate.enforcement,
      description: gate.condition,
      priority: gate.priority,
    };
  });
}

/**
 * Get K1-K3 knowledge levels with logic gates for UI
 * Used by DidacticLegend KENNIS tab
 */
export function getKnowledgeLevelsForUI(): KnowledgeLevelForUI[] {
  const kRubric = getRubric('K_KennisType');
  const gates = getLogicGates();
  
  if (!kRubric) return [];
  
  // K1, K2, K3 only (skip K0)
  return kRubric.bands.filter(band => band.band_id !== 'K0').map(band => {
    const gate = gates.find(g => g.trigger_band === band.band_id);
    const bandNum = parseInt(band.band_id.replace('K', ''));
    
    // Color mapping based on K level
    const colors = bandNum === 1 ? DIMENSION_COLORS.K :
                   bandNum === 2 ? DIMENSION_COLORS.P :
                   DIMENSION_COLORS.E;
    
    return {
      id: band.band_id,
      label: band.label,
      desc: band.description,
      gate: gate?.enforcement || '',
      gateDesc: gate?.condition || '',
      fix: band.fix || band.fix_ref || '',
      color: colors.text,
      border: colors.border,
      bg: colors.bg,
    };
  });
}

/**
 * Get dimension metadata with colors and goals
 * Used by DidacticLegend DIMENSIES tab
 */
export function getDimensionMeta(): Record<string, DimensionMeta> {
  const meta: Record<string, DimensionMeta> = {};
  
  for (const rubricId of SSOT_DATA.metadata.cycle.order) {
    const rubric = getRubric(rubricId);
    const shortKey = getShortKey(rubricId);
    const colors = DIMENSION_COLORS[shortKey] || DEFAULT_COLORS;
    
    meta[shortKey] = {
      ...colors,
      goal: rubric?.goal || rubric?.bands[0]?.didactic_principle || '',
    };
  }
  
  return meta;
}

/**
 * Get dimension labels for Dashboard
 * Returns short labels and descriptions
 */
export function getDimensionLabels(): Record<string, DimensionLabel> {
  const labels: Record<string, DimensionLabel> = {};
  
  for (const rubricId of SSOT_DATA.metadata.cycle.order) {
    const rubric = getRubric(rubricId);
    const shortKey = getShortKey(rubricId);
    
    if (rubric) {
      labels[shortKey] = {
        label: rubric.name.split(' ')[0] || shortKey,
        description: rubric.goal || rubric.bands[0]?.didactic_principle || '',
      };
    }
  }
  
  return labels;
}

/**
 * Get colors for a dimension
 */
export function getDimensionColors(shortKey: string): { text: string; border: string; bg: string } {
  return DIMENSION_COLORS[shortKey] || DEFAULT_COLORS;
}

// ============= SYSTEM PROMPT GENERATION =============

interface ProfileData {
  name?: string | null;
  subject?: string | null;
  level?: string | null;
  goal?: string | null;
  currentNodeId?: string | null;
}

/**
 * Generate curriculum context block for AI prompt
 * Injects learning node details, misconceptions, mastery criteria
 */
function generateCurriculumContext(profile: ProfileData): string {
  if (!profile.currentNodeId) return '';
  
  const node = getNodeById(profile.currentNodeId);
  if (!node) return '';
  
  const lines: string[] = [
    '\n## CURRICULUM CONTEXT (ACTIEF LESONDERWERP)\n',
    `**Onderwerp:** ${node.title}`,
    `**Beschrijving:** ${node.description}`,
    `**Didactische Focus:** ${node.didactic_focus}`,
    `**Beheersingscriteria:** ${node.mastery_criteria}`,
  ];
  
  if (node.common_misconceptions && node.common_misconceptions.length > 0) {
    lines.push('\n**Veelvoorkomende Misconcepties (LET OP!):**');
    node.common_misconceptions.forEach((misc, i) => {
      lines.push(`${i + 1}. ${misc}`);
    });
    lines.push('\n*Wees alert op deze misconcepties en corrigeer ze proactief.*');
  }
  
  lines.push(`\n**Geschatte studielast:** ${node.study_load_minutes} minuten`);
  
  return lines.join('\n');
}

/**
 * Generate dynamic system prompt from SSOT data
 * Used by chatService to send to edge function
 * Now includes curriculum context when a learning node is selected
 */
export function generateSystemPrompt(profile: ProfileData): string {
  const sections: string[] = [];
  
  // Header section
  sections.push(`Je bent EAI, een Educatieve AI-coach die werkt volgens het 10-Dimensionaal Didactisch Model (SSOT v${SSOT_DATA.version}).

## KERNPRINCIPES
1. **Nooit direct het antwoord geven** - Begeleid de leerling naar inzicht
2. **Socratische methode** - Stel vragen die tot nadenken aanzetten
3. **Scaffolding** - Pas ondersteuning aan op basis van het niveau van de leerling
4. **Metacognitie stimuleren** - Help leerlingen reflecteren op hun leerproces`);

  // Presentation Guard
  sections.push(`
## PRESENTATIE REGELS (KRITIEK)
- Schrijf NOOIT slash-commando's (/intro, /devil, /schema, etc.) in je antwoord aan de leerling.
- Slash-commando's zijn INTERNE instructies. De leerling mag ze NOOIT zien.
- Gebruik GEEN meta-taal zoals 'inventarisatie', 'diagnose', 'strategie', 'volgens mijn analyse'.
- Formuleer alles als directe, natuurlijke communicatie met de leerling.`);

  // 10D Rubric section - generate tables from SSOT (without fix commands, replaced by variation hints)
  sections.push('\n## 10D RUBRIC DIMENSIES (SSOT v' + SSOT_DATA.version + ')\n');
  
  const VARIATION_HINTS: Record<string, string> = {
    '/intro': 'Activeer voorkennis (varieer: vraag begrippen, scenario, of real-world connectie)',
    '/flits': 'Snelle herhaling (varieer: flashcard-stijl, waar/onwaar, of vul-aan)',
    '/anchor': 'Veranker kennis (varieer: analogie, voorbeeld uit dagelijks leven, of vergelijking)',
    '/chunk': 'Splits complexiteit op (varieer: stap-voor-stap, deelvragen, of visueel schema)',
    '/hint': 'Geef een hint (varieer: richting wijzen, eliminatie, of denkvraag)',
    '/devil': 'Daag uit met tegenargument (varieer: provocerende stelling, paradox, of edge case)',
    '/schema': 'Structureer kennis (varieer: mindmap, tabel, of hiërarchie)',
    '/checkin': 'Check begrip (varieer: samenvatting vragen, toepassing, of uitleg-aan-ander)',
    '/reflectie': 'Stimuleer reflectie (varieer: wat ging goed, wat was lastig, of wat zou je anders doen)',
    '/model': 'Modelleer aanpak (varieer: hardop denken, worked example, of stapsgewijze demonstratie)',
    '/exit': 'Sluit af en evalueer (varieer: kernpunten samenvatten, volgende stap, of zelfbeoordeling)',
  };

  for (const rubricId of SSOT_DATA.metadata.cycle.order) {
    const rubric = getRubric(rubricId);
    if (!rubric) continue;
    
    const shortKey = getShortKey(rubricId);
    sections.push(`### ${shortKey} - ${rubric.name}`);
    sections.push('| Band | Label | Didactische Actie | Principe |');
    sections.push('|------|-------|-------------------|----------|');
    
    for (const band of rubric.bands) {
      const fixKey = band.fix || band.fix_ref || '';
      const action = VARIATION_HINTS[fixKey] || band.didactic_principle || fixKey;
      const principle = band.didactic_principle || '';
      sections.push(`| ${band.band_id} | ${band.label} | ${action} | ${principle} |`);
    }
    sections.push('');
  }

  // Logic Gates section
  const gates = getLogicGates();
  if (gates.length > 0) {
    sections.push('\n## LOGIC GATES (KRITIEK)\n');
    for (const gate of gates) {
      sections.push(`- **${gate.trigger_band}** (${gate.priority}): ${gate.enforcement}`);
      sections.push(`  ${gate.condition}`);
    }
  }

  // SRL Model section
  const srlStates = getSRLStates();
  if (srlStates.length > 0) {
    sections.push('\n## SRL MODEL\n');
    for (const state of srlStates) {
      sections.push(`- **${state.id}**: ${state.goal}`);
    }
  }

  // Commands reference (internal only — never output these to the student)
  const commands = getCommands();
  const cmdEntries = Object.entries(commands);
  if (cmdEntries.length > 0) {
    sections.push('\n## BESCHIKBARE COMMANDO\'S (INTERN — NOOIT TONEN AAN LEERLING)\n');
    for (const [cmd, desc] of cmdEntries.slice(0, 15)) {
      sections.push(`- \`${cmd}\`: ${desc}`);
    }
    sections.push(`
BELANGRIJK: Wanneer je een commando-actie uitvoert, varieer dan ALTIJD je formulering.
Gebruik het commando als richtlijn voor het TYPE actie, niet als letterlijke tekst.
Voorbeelden van variatie bij /intro:
- "Welke 3 dingen weet je al over [onderwerp]?"
- "Stel je voor dat je [onderwerp] moet uitleggen aan een vriend. Waar begin je?"
- "Wat heb je eerder geleerd dat te maken heeft met [onderwerp]?"
Herhaal NOOIT dezelfde openingsvraag of formulering.`);
  }

  // Response format
  sections.push(`
## RESPONSE FORMAT
- Antwoord altijd in het Nederlands
- Gebruik Markdown voor formatting
- Wees beknopt maar helder
- Stel 1-2 gerichte vragen per respons
- Pas je modaliteit aan op de leerling`);

  // Context section
  sections.push(`
## HUIDIGE CONTEXT
Vak: ${profile.subject || 'Algemeen'}
Niveau: ${profile.level || 'Onbekend'}
Naam leerling: ${profile.name || 'Leerling'}
Doel: ${profile.goal || 'Begrip verdiepen'}`);

  // CURRICULUM CONTEXT - NEW!
  const curriculumContext = generateCurriculumContext(profile);
  if (curriculumContext) {
    sections.push(curriculumContext);
  }

  return sections.join('\n');
}

// ============= VALIDATION HELPERS =============

/**
 * Validate SSOT data integrity
 * Returns array of issues (empty if valid)
 */
export function validateSSOT(): string[] {
  const issues: string[] = [];
  
  // Check rubric count matches cycle order
  const cycleCount = SSOT_DATA.metadata.cycle.order.length;
  if (cycleCount !== 10) {
    issues.push(`Expected 10 dimensions in cycle order, found ${cycleCount}`);
  }
  
  // Check each rubric has bands
  for (const rubricId of SSOT_DATA.metadata.cycle.order) {
    const rubric = getRubric(rubricId);
    if (!rubric) {
      issues.push(`Rubric not found: ${rubricId}`);
      continue;
    }
    if (!rubric.bands || rubric.bands.length === 0) {
      issues.push(`Rubric has no bands: ${rubricId}`);
    }
  }
  
  // Check logic gates reference existing bands
  for (const gate of getLogicGates()) {
    const rubric = getRubricByShortKey(gate.trigger_band.replace(/\d+/, ''));
    if (!rubric) {
      issues.push(`Logic gate references unknown dimension: ${gate.trigger_band}`);
    }
  }
  
  return issues;
}

// ============= LEGACY COMPATIBILITY =============
// Re-export EAI_CORE structure for backward compatibility with ssotParser consumers

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
  interaction_protocol?: {
    logic_gates: SSOTLogicGate[];
  };
}

let cachedCore: SSOTStructure | null = null;

/**
 * Get EAI Core structure (legacy compatibility layer)
 * Used by eaiLearnAdapter, diagnostics, adminService
 */
export function getEAICore(): SSOTStructure {
  if (cachedCore) return cachedCore;
  
  const commandsObj = SSOT_DATA.command_library?.commands || {};
  const commands: SSOTCommand[] = Object.entries(commandsObj).map(([cmd, desc]) => ({
    command: cmd,
    description: desc as string
  }));

  const rubrics: SSOTRubric[] = SSOT_DATA.rubrics.map(r => ({
    rubric_id: r.rubric_id,
    name: r.name,
    dimension: r.dimension,
    bands: r.bands.map(b => ({
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

  const logic_gates: SSOTLogicGate[] = (SSOT_DATA.interaction_protocol?.logic_gates || []).map(g => ({
    trigger_band: g.trigger_band,
    condition: g.condition,
    enforcement: g.enforcement,
    priority: g.priority
  }));

  cachedCore = {
    commands,
    rubrics,
    cycleOrder: SSOT_DATA.metadata.cycle.order,
    metadata: {
      version: SSOT_DATA.version,
      system: SSOT_DATA.metadata.system || 'EAI'
    },
    interaction_protocol: { logic_gates }
  };
  
  return cachedCore;
}

export const EAI_CORE = getEAICore();
