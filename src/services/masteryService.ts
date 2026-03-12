// HYBRID MASTERY SERVICE — Local-first + async Supabase sync
// localStorage is primary (fast), Supabase is persistent backup
import type { MasteryStateV2 } from '../types';
import { supabase } from '@/integrations/supabase/client';

const MASTERY_STORAGE_PREFIX = 'eai_mastery_local_';

export type MasteryStatus = 'INTRO' | 'WORKING' | 'CHECKING' | 'MASTERED';

const STATUS_ORDER: Record<MasteryStatus, number> = {
  INTRO: 0,
  WORKING: 1,
  CHECKING: 2,
  MASTERED: 3,
};

export type MasteryUpdate = {
  userId: string;
  pathId: string;
  currentNodeId: string | null;
  status: MasteryStatus;
  evidence?: {
    nodeId: string;
    evidence: string;
    score?: number;
  };
};

// ═══ READ: Local first, Supabase fallback ═══

export const fetchMastery = async (userId: string, pathId?: string): Promise<{ item: MasteryStateV2 | null; items: MasteryStateV2[] }> => {
  if (!pathId) return { item: null, items: [] };

  const key = `${MASTERY_STORAGE_PREFIX}${userId}_${pathId}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    return { item: JSON.parse(stored), items: [] };
  }

  // Fallback: try Supabase
  try {
    const { data, error } = await supabase
      .from('mastery')
      .select('*')
      .eq('user_id', userId)
      .eq('path_id', pathId)
      .maybeSingle();

    if (!error && data) {
      const mastery: MasteryStateV2 = {
        userId: data.user_id,
        pathId: data.path_id,
        currentNodeId: data.current_node_id,
        status: data.status as MasteryStateV2['status'],
        history: (data.history as any[]) || [],
      };
      // Cache locally for next read
      localStorage.setItem(key, JSON.stringify(mastery));
      return { item: mastery, items: [] };
    }
  } catch (err) {
    console.warn('[Mastery] Supabase fallback failed, no data available:', err);
  }

  return { item: null, items: [] };
};

// ═══ WRITE: Local immediately + async Supabase sync ═══

export const updateMastery = async (payload: MasteryUpdate) => {
  const key = `${MASTERY_STORAGE_PREFIX}${payload.userId}_${payload.pathId}`;

  // 1. Read/build local state
  const existingStr = localStorage.getItem(key);
  let mastery: MasteryStateV2;

  if (existingStr) {
    mastery = JSON.parse(existingStr);
    mastery.status = payload.status;
    mastery.currentNodeId = payload.currentNodeId;
    if (payload.evidence) {
      mastery.history.push({
        nodeId: payload.evidence.nodeId,
        evidence: payload.evidence.evidence,
        createdAt: Date.now(),
        score: payload.evidence.score || null,
      });
    }
  } else {
    mastery = {
      userId: payload.userId,
      pathId: payload.pathId,
      currentNodeId: payload.currentNodeId,
      status: payload.status,
      history: payload.evidence
        ? [{
            nodeId: payload.evidence.nodeId,
            evidence: payload.evidence.evidence,
            createdAt: Date.now(),
            score: payload.evidence.score || null,
          }]
        : [],
    };
  }

  // 2. Write local (fast, synchronous)
  localStorage.setItem(key, JSON.stringify(mastery));

  // 3. Async sync to Supabase (fire-and-forget)
  syncToSupabase(mastery).catch(err =>
    console.warn('[Mastery] Supabase sync failed (data safe in localStorage):', err)
  );

  return { ok: true, mastery };
};

// ═══ SUPABASE SYNC (background) ═══

async function syncToSupabase(mastery: MasteryStateV2) {
  const { error } = await supabase
    .from('mastery')
    .upsert(
      {
        user_id: mastery.userId,
        path_id: mastery.pathId,
        current_node_id: mastery.currentNodeId,
        status: mastery.status,
        history: mastery.history as any,
      },
      { onConflict: 'user_id,path_id' }
    );

  if (error) {
    console.error('[Mastery] Supabase upsert error:', error);
    throw error;
  }
}

// ═══ FETCH ALL (for analytics/admin) ═══

export const fetchAllMastery = async (userId: string): Promise<MasteryStateV2[]> => {
  try {
    const { data, error } = await supabase
      .from('mastery')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(row => ({
      userId: row.user_id,
      pathId: row.path_id,
      currentNodeId: row.current_node_id,
      status: row.status as MasteryStateV2['status'],
      history: (row.history as any[]) || [],
    }));
  } catch (err) {
    console.warn('[Mastery] fetchAll failed:', err);
    return [];
  }
};
