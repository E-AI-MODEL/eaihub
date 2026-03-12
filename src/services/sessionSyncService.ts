// Session Sync Service
// Pushes student session state to Supabase and listens for teacher messages

import { supabase } from '@/integrations/supabase/client';
import type { LearnerProfile, EAIAnalysis, MechanicalState } from '@/types';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';

export interface TeacherMessage {
  id: string;
  session_id: string;
  teacher_name: string;
  message: string;
  read: boolean;
  created_at: string;
}

// ═══════════════════════════════════════════════════
// STUDENT SIDE: Push session state
// ═══════════════════════════════════════════════════

/**
 * Push student session state to DB.
 * Metrics contract:
 * - pluginId: per sessie. null = base SSOT (geen plugin geladen), string = actief plugin ID.
 * - progress: per sessie, afgeleid van mastery sync.
 */
export type WorkMode = 'LEARN' | 'TEST';

export async function upsertSessionState(params: {
  userId: string;
  sessionId: string;
  profile: LearnerProfile;
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  eaiState: EAIStateLike | null;
  messagesCount: number;
  lastMessagePreview: string | null;
  progress?: number;
  pluginId?: string | null;
  workMode?: WorkMode;
}) {
  const { error } = await supabase
    .from('student_sessions')
    .upsert({
      user_id: params.userId,
      session_id: params.sessionId,
      name: params.profile.name,
      subject: params.profile.subject,
      level: params.profile.level,
      current_node_id: params.profile.currentNodeId || null,
      status: 'ONLINE',
      analysis: params.analysis as any,
      mechanical: params.mechanical as any,
      eai_state: params.eaiState as any,
      messages_count: params.messagesCount,
      last_message_preview: params.lastMessagePreview,
      progress: params.progress ?? 0,
      plugin_id: params.pluginId ?? null,
      work_mode: params.workMode ?? 'LEARN',
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'session_id' });

  if (error) console.error('[SessionSync] Upsert error:', error);
}

export async function setSessionOffline(sessionId: string) {
  await supabase
    .from('student_sessions')
    .update({ status: 'OFFLINE' })
    .eq('session_id', sessionId);
}

// ═══════════════════════════════════════════════════
// STUDENT SIDE: Listen for teacher messages
// ═══════════════════════════════════════════════════

export function subscribeToTeacherMessages(
  sessionId: string,
  onMessage: (msg: TeacherMessage) => void
) {
  const channel = supabase
    .channel(`teacher-msgs-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'teacher_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onMessage(payload.new as TeacherMessage);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function fetchTeacherMessages(sessionId: string): Promise<TeacherMessage[]> {
  const { data, error } = await supabase
    .from('teacher_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) { console.error('[SessionSync] Fetch messages error:', error); return []; }
  return (data || []) as TeacherMessage[];
}

// ═══════════════════════════════════════════════════
// TEACHER SIDE: Subscribe to chat messages (live)
// ═══════════════════════════════════════════════════

export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  analysis: any;
  mechanical: any;
  created_at: string;
}

export function subscribeToChatMessages(
  sessionId: string,
  onInsert: (msg: ChatMessageRow) => void
) {
  const channel = supabase
    .channel(`chat-msgs-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onInsert(payload.new as ChatMessageRow);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function markMessageRead(messageId: string) {
  await supabase
    .from('teacher_messages')
    .update({ read: true })
    .eq('id', messageId);
}

// ═══════════════════════════════════════════════════
// TEACHER SIDE: Subscribe to all sessions
// ═══════════════════════════════════════════════════

export interface StudentSessionRow {
  id: string;
  user_id: string;
  session_id: string;
  name: string | null;
  subject: string | null;
  level: string | null;
  current_node_id: string | null;
  status: string;
  progress: number;
  analysis: EAIAnalysis | null;
  mechanical: MechanicalState | null;
  eai_state: EAIStateLike | null;
  messages_count: number;
  last_message_preview: string | null;
  last_active_at: string;
  created_at: string;
  updated_at: string;
  work_mode: WorkMode;
}

export async function fetchAllSessions(filterWorkMode?: WorkMode): Promise<StudentSessionRow[]> {
  let query = supabase
    .from('student_sessions')
    .select('*')
    .order('last_active_at', { ascending: false });

  if (filterWorkMode) {
    query = query.eq('work_mode', filterWorkMode);
  }

  const { data, error } = await query;
  if (error) { console.error('[SessionSync] Fetch sessions error:', error); return []; }
  return (data || []) as unknown as StudentSessionRow[];
}

export function subscribeToSessions(onUpdate: (sessions: StudentSessionRow[]) => void) {
  // Initial fetch
  fetchAllSessions().then(onUpdate);

  const channel = supabase
    .channel('all-student-sessions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'student_sessions' },
      () => { fetchAllSessions().then(onUpdate); }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ═══════════════════════════════════════════════════
// TEACHER SIDE: Send message to student
// ═══════════════════════════════════════════════════

export async function sendTeacherMessage(sessionId: string, message: string, teacherName = 'Docent') {
  const { error } = await supabase
    .from('teacher_messages')
    .insert({
      session_id: sessionId,
      teacher_name: teacherName,
      message,
    });

  if (error) { console.error('[SessionSync] Send message error:', error); throw error; }
}

// Fetch messages for a specific session (teacher view)
export async function fetchMessagesForSession(sessionId: string): Promise<TeacherMessage[]> {
  const { data, error } = await supabase
    .from('teacher_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) { console.error('[SessionSync] Fetch session messages error:', error); return []; }
  return (data || []) as TeacherMessage[];
}
