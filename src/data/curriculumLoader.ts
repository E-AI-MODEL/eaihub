// ============= Curriculum Loader =============
// Loads pilot_core JSON data and maps to runtime LearningNode/LearningPath types
// Single source of truth for curriculum data — all consumers import from here

import type { LearningNode, LearningPath } from '@/types';
import nodesJson from './curriculum/curriculum.nodes.ob.nieuw.pilot_core.json';
import pathsJson from './curriculum/curriculum.paths.ob.nieuw.pilot_core.json';

// ============= RAW JSON TYPES =============

interface RawNode {
  id: string;
  source_refs: string[];
  path_ref: string;
  curriculum_layer: string;
  title: string;
  description: string;
  mastery: {
    can_demonstrate: string[];
    evidence_types: string[];
  };
  microsteps: string[];
  prerequisite_ids: string[];
  misconceptions: string[];
  illustrations: string[];
  tags: {
    subject_code: string;
    subject: string;
    build: string;
    level_scope: string[];
    framework_type: string;
    framework_code: string;
    theme: string[];
    context: string[];
  };
  source_enrichment?: {
    fo_doelzin_ref: number;
    fo_doelzin_title: string;
  };
  actor: string;
  goal_type: string;
  is_havo_vwo_extension: boolean;
  legal_alignment: string;
  supplementary_publication: boolean;
}

interface RawPath {
  id: string;
  curriculum_layer: string;
  build: string;
  subject_code: string;
  subject: string;
  title: string;
  source_refs: string[];
  node_ids: string[];
  end_goal: string;
  level_scope: string[];
}

// ============= INDEXES =============

const rawNodes: RawNode[] = (nodesJson as any).nodes;
const rawPaths: RawPath[] = (pathsJson as any).paths;

// Map raw nodes to runtime LearningNode
function mapNode(raw: RawNode): LearningNode {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    didactic_focus: raw.tags.theme?.length > 0 ? raw.tags.theme.join(' | ') : 'Kerndoel',
    mastery_criteria: raw.mastery.can_demonstrate?.length > 0
      ? raw.mastery.can_demonstrate.join(' | ')
      : raw.description,
    common_misconceptions: raw.misconceptions?.length > 0 ? raw.misconceptions : undefined,
    micro_steps: raw.microsteps?.length > 0 ? raw.microsteps : undefined,
    illustrations: raw.illustrations?.length > 0 ? raw.illustrations : undefined,
    evidence_types: raw.mastery.evidence_types?.length > 0 ? raw.mastery.evidence_types : undefined,
    prerequisite_ids: raw.prerequisite_ids?.length > 0 ? raw.prerequisite_ids : undefined,
    slo_ref: raw.tags.framework_code || undefined,
  };
}

// Build node index
const NODE_INDEX = new Map<string, LearningNode>();
for (const raw of rawNodes) {
  NODE_INDEX.set(raw.id, mapNode(raw));
}

// Build path index and runtime LearningPath objects
const PATH_INDEX = new Map<string, LearningPath>();
const PATHS_BY_SUBJECT = new Map<string, LearningPath[]>();

for (const raw of rawPaths) {
  const nodes: LearningNode[] = [];
  for (const nodeId of raw.node_ids) {
    const node = NODE_INDEX.get(nodeId);
    if (node) nodes.push(node);
  }

  const path: LearningPath = {
    id: raw.id,
    subject: raw.subject,
    level: raw.level_scope.join('/'),
    topic: raw.title,
    nodes,
  };

  PATH_INDEX.set(raw.id, path);

  // Index by subject_code
  const existing = PATHS_BY_SUBJECT.get(raw.subject_code) || [];
  existing.push(path);
  PATHS_BY_SUBJECT.set(raw.subject_code, existing);

  // Also index by subject name (for UI lookups)
  const byName = PATHS_BY_SUBJECT.get(raw.subject) || [];
  if (!byName.includes(path)) {
    byName.push(path);
    PATHS_BY_SUBJECT.set(raw.subject, byName);
  }
}

// ============= PUBLIC API =============

/** Get a single node by ID */
export function getNodeById(nodeId: string): LearningNode | undefined {
  return NODE_INDEX.get(nodeId);
}

/** Get a path by its ID */
export function getPathById(pathId: string): LearningPath | undefined {
  return PATH_INDEX.get(pathId);
}

/** Get all paths for a subject (by code or name) */
export function getPathsBySubject(subjectKey: string): LearningPath[] {
  return PATHS_BY_SUBJECT.get(subjectKey) || [];
}

/** Get all unique subjects with their codes */
export function getAllSubjects(): { code: string; name: string; pathCount: number }[] {
  const seen = new Set<string>();
  const subjects: { code: string; name: string; pathCount: number }[] = [];

  for (const raw of rawPaths) {
    if (seen.has(raw.subject_code)) continue;
    seen.add(raw.subject_code);
    const paths = PATHS_BY_SUBJECT.get(raw.subject_code) || [];
    subjects.push({
      code: raw.subject_code,
      name: raw.subject,
      pathCount: paths.length,
    });
  }

  return subjects.sort((a, b) => a.name.localeCompare(b.name));
}


/** Get all raw path records (for admin counts) */
export function getAllPaths(): LearningPath[] {
  return Array.from(PATH_INDEX.values());
}

/** Total node count */
export const PILOT_NODE_COUNT = NODE_INDEX.size;

/** Total path count */
export const PILOT_PATH_COUNT = PATH_INDEX.size;

/** All raw paths for iteration */
export const PILOT_PATHS = rawPaths;

/** Get all nodes for a path by path ID */
export function getPathNodes(pathId: string): LearningNode[] {
  const path = PATH_INDEX.get(pathId);
  return path?.nodes || [];
}

/** Find which path a node belongs to */
export function getPathForNode(nodeId: string): { pathId: string; path: LearningPath } | undefined {
  for (const raw of rawPaths) {
    if (raw.node_ids.includes(nodeId)) {
      const path = PATH_INDEX.get(raw.id);
      if (path) return { pathId: raw.id, path };
    }
  }
  return undefined;
}
