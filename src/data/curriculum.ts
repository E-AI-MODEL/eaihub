// ============= Curriculum Compatibility Layer =============
// Re-exports from curriculumLoader for backward compatibility
// All new code should import from '@/data/curriculumLoader' directly

import type { LearningNode, LearningPath } from '@/types';

export type { LearningNode, LearningPath };

export {
  getNodeById,
  getAllSubjects,
  getPathsBySubject,
  getPathById,
  getPathForNode,
  getAllPaths,
  PILOT_NODE_COUNT,
  PILOT_PATH_COUNT,
  PILOT_PATHS,
} from './curriculumLoader';

// Legacy compat: CURRICULUM_PATHS as flat array of all paths
import { getAllPaths } from './curriculumLoader';
export const CURRICULUM_PATHS = getAllPaths();
