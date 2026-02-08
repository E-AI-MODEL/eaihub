// EAI Hub Type Definitions

export interface EAIAnalysis {
  process_phases?: string[];
  coregulation_bands?: string[];
  task_densities?: string[];
  secondary_dimensions?: string[];
  srl_state?: string | null;
  active_fix?: string | null;
  cognitive_mode?: string | null;
  epistemic_status?: string | null;
  reasoning?: string;
  current_profile?: {
    name?: string | null;
    subject?: string | null;
    level?: string | null;
    grade?: string | null;
    goal?: string | null;
  };
  task_density_balance?: number;
  mastery_check?: boolean;
}

export interface MechanicalState {
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  temperature?: number;
  timestamp?: string;
  logicGateBreach?: LogicGateBreach;
  repairAttempts?: number;
  repairLog?: {
    timestamp: number;
    error: string;
    brokenPayload: string;
  };
  semanticValidation?: SemanticValidation;
  // Legacy fields
  timescale?: string;
  fast?: number;
  mid?: number;
  slow?: number;
}

export interface LogicGateBreach {
  trigger_band: string;
  rule_description: string;
  detected_value: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface ScaffoldingState {
  agency_score: number;
  trend: 'RISING' | 'STABLE' | 'FALLING';
  advice: string | null;
  history_window: number[];
}

export interface SemanticValidation {
  gFactor: number;
  penalties: string[];
  alignment_status: 'OPTIMAL' | 'DRIFT' | 'CRITICAL';
}

export interface DiagnosticResult {
  id: string;
  category: 'ENV' | 'LOGIC' | 'SSOT' | 'SYSTEM';
  label: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  analysis?: EAIAnalysis;
  theme?: DidacticTheme;
}

export type DidacticTheme = 
  | 'DEFAULT' 
  | 'DEVIL' 
  | 'META' 
  | 'CREATIVE' 
  | 'COACH' 
  | 'SYSTEM' 
  | 'PRAGMATIC';

export type KnowledgeLevel = 'K1' | 'K2' | 'K3';

export interface LearnerProfile {
  name: string;
  subject: string | null;
  level: string | null;
  grade?: string | null;
  goal?: string | null;
}

export interface StudentProfile {
  id: string;
  name: string;
  subject: string;
  level: string;
  learningGoal: string;
  knowledgeLevel: KnowledgeLevel;
}

export interface SessionState {
  id: string;
  studentId: string;
  startTime: number;
  messages: ChatMessage[];
  currentTheme: DidacticTheme;
}

export interface TeacherInterventionRequest {
  id: string;
  studentId: string;
  studentName: string;
  type: 'SUMMATIEF' | 'FORMATIEF';
  question: string;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface MasteryStateV2 {
  userId: string;
  pathId: string;
  currentNodeId: string | null;
  status: 'INTRO' | 'WORKING' | 'CHECKING' | 'MASTERED';
  history: Array<{
    nodeId: string;
    evidence: string;
    createdAt: number;
    score: number | null;
  }>;
}

export interface LearningNode {
  id: string;
  title: string;
  description: string;
  didactic_focus: string;
  mastery_criteria: string;
  common_misconceptions?: string[];
  study_load_minutes: number;
}
