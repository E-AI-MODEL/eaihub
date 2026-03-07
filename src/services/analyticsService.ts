// CLIENT-SIDE ANALYTICS & CLASSROOM SIMULATION
// Simulates a live classroom state. Slot 0 is reserved for the local user.

import { CURRICULUM_PATHS } from '../data/curriculum';
import { fetchProfile } from './profileService';
import { getOrCreateUserId } from './identity';
import { fetchMastery } from './masteryService';
import { fetchAllSessions, type StudentSessionRow } from './sessionSyncService';
import type { EAIAnalysis } from '../types';

export type StudentEvent = {
  timestamp: number;
  type: 'ANSWER' | 'HINT' | 'NAVIGATION' | 'ERROR';
  desc: string;
};

export type StudentSession = {
  id: string;
  isRealUser: boolean;
  name: string;
  avatar: string;
  status: 'ONLINE' | 'IDLE' | 'OFFLINE' | 'WAITING';
  currentModule: string; 
  progress: number; 
  currentNodeId: string;
  stats: {
    exercisesDone: number;
    correctCount: number;
    accuracy: number; 
    streak: number;
    lastActiveSecondsAgo: number;
  };
  lastAnalysis: {
    phase: string; 
    kLevel: string; 
    agency: string; 
    sentiment: 'FLOW' | 'STRUGGLE' | 'BORED' | 'NEUTRAL';
    summary: string;
  };
  recentEvents: StudentEvent[];
  alerts: string[];
};

export type AnalyticsSnapshot = {
  totalModules: number;
  activeStudents: number;
  avgMastery: number;
  interventionNeeded: number;
  breachRate: number;
  students: StudentSession[];
};

// Mock peers for demo
const MOCK_PEERS: StudentSession[] = [
  { 
    id: 'mock-1', isRealUser: false, name: "Emma de Vries", avatar: "EV", status: 'ONLINE',
    currentModule: "Biologie", progress: 65, currentNodeId: "BIO_VWO_GEN_03",
    stats: { exercisesDone: 24, correctCount: 21, accuracy: 87, streak: 5, lastActiveSecondsAgo: 12 },
    lastAnalysis: { phase: "P4", kLevel: "K2", agency: "TD2", sentiment: "FLOW", summary: "Loopt soepel door translatie-opdrachten heen." },
    recentEvents: [
      { timestamp: Date.now() - 15000, type: 'ANSWER', desc: 'Correct antwoord op translatie' },
      { timestamp: Date.now() - 65000, type: 'NAVIGATION', desc: 'Start node BIO_03' }
    ],
    alerts: [] 
  },
  { 
    id: 'mock-2', isRealUser: false, name: "Liam Bakker", avatar: "LB", status: 'ONLINE',
    currentModule: "Wiskunde B", progress: 15, currentNodeId: "WISB_VWO_DIFF_01",
    stats: { exercisesDone: 8, correctCount: 3, accuracy: 37, streak: 0, lastActiveSecondsAgo: 140 },
    lastAnalysis: { phase: "P3", kLevel: "K1", agency: "TD5", sentiment: "STRUGGLE", summary: "Vraagt constant om uitleg, voert weinig zelf uit." },
    recentEvents: [
      { timestamp: Date.now() - 120000, type: 'HINT', desc: 'Vroeg om de definitie' },
      { timestamp: Date.now() - 240000, type: 'ERROR', desc: 'Fout antwoord limiet' }
    ],
    alerts: ["Low Agency Loop", "High Cognitive Load"] 
  },
  { 
    id: 'mock-3', isRealUser: false, name: "Sophie Jansen", avatar: "SJ", status: 'IDLE',
    currentModule: "Economie", progress: 88, currentNodeId: "ECO_HAVO_MARKT_04",
    stats: { exercisesDone: 42, correctCount: 40, accuracy: 95, streak: 12, lastActiveSecondsAgo: 450 },
    lastAnalysis: { phase: "P5", kLevel: "K3", agency: "TD1", sentiment: "NEUTRAL", summary: "Reflecteert op elasticiteit. Zeer zelfstandig." },
    recentEvents: [
      { timestamp: Date.now() - 400000, type: 'ANSWER', desc: 'Zelfreflectie ingediend' }
    ],
    alerts: [] 
  },
];

// Helper: map student_sessions row to StudentSession format
function mapSessionRowToStudent(row: StudentSessionRow): StudentSession {
  const analysis = row.analysis as EAIAnalysis | null;
  const secondsAgo = row.last_active_at 
    ? Math.round((Date.now() - new Date(row.last_active_at).getTime()) / 1000) 
    : 9999;

  const status: StudentSession['status'] = 
    row.status === 'ONLINE' && secondsAgo < 300 ? 'ONLINE' :
    row.status === 'ONLINE' && secondsAgo < 900 ? 'IDLE' : 'OFFLINE';

  // Derive pedagogical status from real analysis or fallback
  const phase = analysis?.process_phases?.[0] || '-';
  const kLevel = analysis?.coregulation_bands?.find(b => b.startsWith('K')) || '-';
  const agency = analysis?.task_densities?.[0] || '-';
  const agencyScore = analysis?.scaffolding?.agency_score ?? 0.5;
  
  const sentiment: StudentSession['lastAnalysis']['sentiment'] = 
    agencyScore < 0.3 ? 'STRUGGLE' :
    agencyScore > 0.7 ? 'FLOW' :
    analysis?.srl_state === 'REFLECT' ? 'NEUTRAL' : 'NEUTRAL';

  return {
    id: row.session_id,
    isRealUser: false,
    name: row.name || 'Onbekend',
    avatar: (row.name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    status,
    currentModule: row.subject || 'Onbekend',
    progress: row.progress ?? 0,
    currentNodeId: row.current_node_id || '-',
    stats: {
      exercisesDone: row.messages_count ?? 0,
      correctCount: Math.floor((row.messages_count ?? 0) * (agencyScore)),
      accuracy: Math.round(agencyScore * 100),
      streak: 0,
      lastActiveSecondsAgo: secondsAgo,
    },
    lastAnalysis: {
      phase,
      kLevel,
      agency,
      sentiment,
      summary: analysis?.reasoning || 'Geen analyse beschikbaar.',
    },
    recentEvents: [],
    alerts: agencyScore < 0.3 ? ['Low Agency'] : [],
  };
}

export const fetchAnalytics = async (): Promise<AnalyticsSnapshot> => {
  const userId = getOrCreateUserId();
  const { profile } = await fetchProfile(userId);
  
  // Fetch real sessions from database
  let dbSessions: StudentSessionRow[] = [];
  try {
    dbSessions = await fetchAllSessions();
  } catch (err) {
    console.warn('[Analytics] Could not fetch sessions from DB, using local only:', err);
  }

  // Build real user session
  let realUserSession: StudentSession;

  if (profile && profile.name) {
    const path = CURRICULUM_PATHS.find(p => p.subject === profile.subject);
    let progress = 0;
    let nodeId = 'START';
    let exercisesDone = 0;
    let correctCount = 0;
    let history: { createdAt: number; nodeId: string }[] = [];
    
    // Try to get real analysis from DB session
    const myDbSession = dbSessions.find(s => s.user_id === userId);
    const myAnalysis = myDbSession?.analysis as EAIAnalysis | null;

    if (path) {
      const pathId = `${path.subject}_${path.level}`.toUpperCase().replace(/\s/g, '');
      const mastery = await fetchMastery(userId, pathId);
      if (mastery.item) {
        const total = path.nodes.length;
        history = mastery.item.history || [];
        progress = Math.round((history.length / total) * 100);
        nodeId = mastery.item.currentNodeId || 'DONE';
        exercisesDone = history.length * 2; 
        correctCount = Math.floor(exercisesDone * 0.9);
      }
    }

    // Derive lastAnalysis from real data, fallback to defaults
    const phase = myAnalysis?.process_phases?.[0] || 'P0';
    const kLevel = myAnalysis?.coregulation_bands?.find(b => b.startsWith('K')) || 'K0';
    const agency = myAnalysis?.task_densities?.[0] || 'TD0';
    const agencyScore = myAnalysis?.scaffolding?.agency_score ?? 0.5;
    const sentiment: StudentSession['lastAnalysis']['sentiment'] = 
      agencyScore < 0.3 ? 'STRUGGLE' :
      agencyScore > 0.7 ? 'FLOW' : 'NEUTRAL';

    realUserSession = {
      id: userId,
      isRealUser: true,
      name: `${profile.name} (LIVE)`,
      avatar: "YOU",
      status: 'ONLINE',
      currentModule: profile.subject || 'Onbekend',
      progress: progress,
      currentNodeId: nodeId,
      stats: {
        exercisesDone,
        correctCount,
        accuracy: exercisesDone > 0 ? Math.round((correctCount / exercisesDone) * 100) : 100,
        streak: 0,
        lastActiveSecondsAgo: 2
      },
      lastAnalysis: {
        phase,
        kLevel,
        agency,
        sentiment,
        summary: myAnalysis?.reasoning || 'Actieve sessie. Wacht op analyse-data.'
      },
      recentEvents: [
        { timestamp: Date.now() - 5000, type: 'NAVIGATION', desc: 'Dashboard geopend' },
        ...history.slice(-2).map(h => ({ timestamp: h.createdAt, type: 'ANSWER' as const, desc: `Evidence: ${h.nodeId}` }))
      ],
      alerts: []
    };
  } else {
    realUserSession = {
      id: 'placeholder',
      isRealUser: true,
      name: "Wachten op student...",
      avatar: "?",
      status: 'WAITING',
      currentModule: "-",
      progress: 0,
      currentNodeId: "-",
      stats: { exercisesDone: 0, correctCount: 0, accuracy: 0, streak: 0, lastActiveSecondsAgo: 0 },
      lastAnalysis: { phase: "-", kLevel: "-", agency: "-", sentiment: "NEUTRAL", summary: "-" },
      recentEvents: [],
      alerts: []
    };
  }

  // Map DB sessions (excluding current user) to StudentSession format
  const otherStudents = dbSessions
    .filter(s => s.user_id !== userId)
    .map(mapSessionRowToStudent);

  // Combine: real user first, then other DB sessions, then mock peers as fallback
  const students = [realUserSession, ...otherStudents, ...(otherStudents.length === 0 ? MOCK_PEERS : [])];
  const activeStudents = students.filter(s => s.status === 'ONLINE').length;
  const avgMastery = Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length);
  const interventionNeeded = students.filter(s => s.lastAnalysis.sentiment === 'STRUGGLE' || s.alerts.length > 0).length;
  const breachRate = 0.02;

  return {
    totalModules: CURRICULUM_PATHS.length,
    activeStudents,
    avgMastery,
    interventionNeeded,
    breachRate,
    students
  };
};

export const pushIntervention = async (studentId: string, type: string, payload: unknown) => {
  console.log(`[Teacher] Pushing intervention to ${studentId}: ${type}`, payload);
  return { success: true, timestamp: Date.now() };
};
