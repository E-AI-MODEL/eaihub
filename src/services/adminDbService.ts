// Admin Database Service
// CRUD operations on Supabase tables for admin panel

import { supabase } from '@/integrations/supabase/client';

// ═══ SESSIONS ═══

export async function fetchAllSessionsAdmin() {
  const { data, error } = await supabase
    .from('student_sessions')
    .select('*')
    .order('last_active_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteSession(sessionId: string) {
  // Delete associated chat messages first
  await supabase.from('chat_messages').delete().eq('session_id', sessionId);
  // Delete associated teacher messages
  await supabase.from('teacher_messages').delete().eq('session_id', sessionId);
  // Delete session
  const { error } = await supabase.from('student_sessions').delete().eq('session_id', sessionId);
  if (error) throw error;
}

export async function deleteAllSessions() {
  await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('teacher_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error } = await supabase.from('student_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

export async function deleteOfflineSessions() {
  // Get offline session IDs first
  const { data: offlineSessions } = await supabase
    .from('student_sessions')
    .select('session_id')
    .eq('status', 'OFFLINE');
  
  if (offlineSessions && offlineSessions.length > 0) {
    const ids = offlineSessions.map(s => s.session_id);
    await supabase.from('chat_messages').delete().in('session_id', ids);
    await supabase.from('teacher_messages').delete().in('session_id', ids);
  }
  
  const { error } = await supabase.from('student_sessions').delete().eq('status', 'OFFLINE');
  if (error) throw error;
}

// ═══ CHAT MESSAGES ═══

export async function fetchChatMessages(sessionId?: string) {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (sessionId) query = query.eq('session_id', sessionId);
  
  const { data, error } = await query;
  if (error) {
    console.error('[AdminDB] fetchChatMessages error:', error);
    return [];
  }
  return data || [];
}

export async function deleteChatMessage(id: string) {
  const { error } = await supabase.from('chat_messages').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllChatMessages() {
  const { error } = await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}

// ═══ TEACHER MESSAGES ═══

export async function deleteTeacherMessage(id: string) {
  const { error } = await supabase.from('teacher_messages').delete().eq('id', id);
  if (error) throw error;
}

// ═══ PERSIST CHAT MESSAGE ═══

export async function persistChatMessage(params: {
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  analysis?: any;
  mechanical?: any;
}) {
  const { error } = await supabase.from('chat_messages').insert({
    session_id: params.sessionId,
    role: params.role,
    content: params.content,
    analysis: params.analysis || null,
    mechanical: params.mechanical || null,
  });
  if (error) console.error('[AdminDB] Persist chat message error:', error);
}
