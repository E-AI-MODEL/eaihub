import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Activity, Clock, RefreshCw, AlertTriangle, Send, X,
  Brain, Zap, TrendingUp, Cpu, ChevronRight, Home, MessageSquare, Eye, ArrowLeft
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  subscribeToSessions, sendTeacherMessage, fetchMessagesForSession,
  type StudentSessionRow, type TeacherMessage,
} from '@/services/sessionSyncService';
import { fetchChatMessages } from '@/services/adminDbService';
import { getNodeById } from '@/data/curriculum';
import { getDimensionColors } from '@/utils/ssotHelpers';
import { SSOT_DATA, getShortKey, getRubric } from '@/data/ssot';
import type { EAIAnalysis, MechanicalState } from '@/types';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';

interface ChatMessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  analysis: any;
  mechanical: any;
  created_at: string;
}

const TeacherCockpit = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudentSessionRow[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudentSessionRow | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sentMessages, setSentMessages] = useState<TeacherMessage[]>([]);
  const [chatLog, setChatLog] = useState<ChatMessageRow[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const unsub = subscribeToSessions((data) => {
      setSessions(data);
      setLastRefresh(new Date());
    });
    return unsub;
  }, []);

  // When a session is selected, fetch its teacher messages + chat log
  useEffect(() => {
    if (!selectedSession) { setSentMessages([]); setChatLog([]); return; }
    fetchMessagesForSession(selectedSession.session_id).then(setSentMessages);
    fetchChatMessages(selectedSession.session_id).then(setChatLog).catch(() => setChatLog([]));
  }, [selectedSession?.session_id]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedSession || !messageInput.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendTeacherMessage(selectedSession.session_id, messageInput.trim());
      setMessageInput('');
      const msgs = await fetchMessagesForSession(selectedSession.session_id);
      setSentMessages(msgs);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
    }
  }, [selectedSession, messageInput, isSending]);

  const onlineSessions = sessions.filter(s => s.status === 'ONLINE');
  const needsAttention = sessions.filter(s => {
    const analysis = s.analysis as EAIAnalysis | null;
    return analysis?.scaffolding?.agency_score !== undefined && analysis.scaffolding.agency_score < 40;
  });

  const getTimeSince = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-700 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
            <Home className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Teacher Cockpit</span>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400">{onlineSessions.length} online</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {needsAttention.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 border border-amber-500/40 bg-amber-500/10">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-mono text-amber-300">{needsAttention.length} INTERVENTIE NODIG</span>
            </div>
          )}
          <span className="text-[9px] font-mono text-slate-600">
            {lastRefresh.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Student list - hidden on mobile when session selected */}
        <div className={`w-full md:w-[360px] border-r border-slate-800 flex flex-col shrink-0 ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
          <div className="h-9 px-3 flex items-center border-b border-slate-800 bg-slate-900/60">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Actieve Sessies ({sessions.length})</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600">
                <Users className="w-8 h-8 mb-2" />
                <span className="text-[10px] font-mono">Geen actieve sessies</span>
                <span className="text-[9px] text-slate-700 mt-1">Studenten verschijnen hier zodra ze starten</span>
              </div>
            ) : (
              sessions.map(session => {
                const analysis = session.analysis as EAIAnalysis | null;
                const eai = session.eai_state as EAIStateLike | null;
                const isSelected = selectedSession?.session_id === session.session_id;
                const isOnline = session.status === 'ONLINE';
                const agencyScore = eai?.scaffolding?.agency_score;
                const isStruggling = agencyScore !== undefined && agencyScore < 40;
                const node = session.current_node_id ? getNodeById(session.current_node_id) : null;

                return (
                  <button
                    key={session.session_id}
                    onClick={() => setSelectedSession(session)}
                    className={`w-full text-left px-3 py-2.5 border-b border-slate-800/50 transition-colors ${
                      isSelected ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        <span className="text-[11px] font-medium text-slate-200 truncate max-w-[140px]">
                          {session.name || 'Anoniem'}
                        </span>
                        {isStruggling && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 font-mono uppercase">
                            Hulp
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-slate-600">{getTimeSince(session.last_active_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500">
                      <span>{session.subject || '—'} {session.level || ''}</span>
                      <span className="text-slate-700">·</span>
                      <span>{node?.title || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {analysis?.process_phases?.[0] && (
                        <span className="text-[8px] font-mono px-1.5 py-0.5 border border-slate-700 bg-slate-900 text-cyan-400">
                          {analysis.process_phases[0]}
                        </span>
                      )}
                      {analysis?.active_fix && (
                        <span className="text-[8px] font-mono px-1.5 py-0.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                          {analysis.active_fix}
                        </span>
                      )}
                      {agencyScore !== undefined && (
                        <span className={`text-[8px] font-mono ${agencyScore >= 60 ? 'text-emerald-400' : agencyScore >= 40 ? 'text-slate-400' : 'text-red-400'}`}>
                          Agency: {agencyScore}%
                        </span>
                      )}
                      <span className="text-[8px] font-mono text-slate-600 ml-auto">
                        <MessageSquare className="w-2.5 h-2.5 inline mr-0.5" />{session.messages_count}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel - full width on mobile when session selected, hidden when not */}
        <div className={`flex-1 flex flex-col ${selectedSession ? 'flex' : 'hidden md:flex'}`}>
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center text-slate-600">
              <div className="text-center">
                <Eye className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm">Selecteer een leerling om details te bekijken</p>
                <p className="text-[10px] text-slate-700 mt-1">Je kunt berichten sturen en de sessie live volgen</p>
              </div>
            </div>
          ) : (
            <StudentDetailPanel
              session={selectedSession}
              sentMessages={sentMessages}
              chatLog={chatLog}
              messageInput={messageInput}
              onMessageInputChange={setMessageInput}
              onSendMessage={handleSendMessage}
              isSending={isSending}
              onClose={() => setSelectedSession(null)}
              getTimeSince={getTimeSince}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STUDENT DETAIL PANEL
// ═══════════════════════════════════════════════════════════════

interface StudentDetailPanelProps {
  session: StudentSessionRow;
  sentMessages: TeacherMessage[];
  chatLog: ChatMessageRow[];
  messageInput: string;
  onMessageInputChange: (val: string) => void;
  onSendMessage: () => void;
  isSending: boolean;
  onClose: () => void;
  getTimeSince: (dateStr: string) => string;
}

const PHASE_STEPS = ['P1', 'P2', 'P3', 'P4', 'P5'];
const PHASE_LABELS = ['Start', 'Uitleg', 'Uitdaging', 'Check', 'Reflectie'];

// All 10 dimension short keys
const ALL_DIMENSIONS = ['K', 'P', 'TD', 'C', 'V', 'T', 'E', 'L', 'S', 'B'];

const StudentDetailPanel: React.FC<StudentDetailPanelProps> = ({
  session, sentMessages, chatLog, messageInput, onMessageInputChange, onSendMessage, isSending, onClose, getTimeSince,
}) => {
  const analysis = session.analysis as EAIAnalysis | null;
  const mechanical = session.mechanical as MechanicalState | null;
  const eai = session.eai_state as EAIStateLike | null;
  const node = session.current_node_id ? getNodeById(session.current_node_id) : null;

  const phase = analysis?.process_phases?.[0] || null;
  const currentPhaseIdx = phase ? PHASE_STEPS.findIndex(p => phase.startsWith(p)) : -1;
  const agencyScore = eai?.scaffolding?.agency_score;
  const gFactor = mechanical?.semanticValidation?.gFactor;

  // Collect all detected bands from analysis
  const allBands: string[] = [
    ...(analysis?.coregulation_bands || []),
    ...(analysis?.task_densities || []),
    ...(analysis?.secondary_dimensions || []),
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Detail header */}
      <div className="h-10 px-3 sm:px-4 flex items-center justify-between border-b border-slate-700 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile back button */}
          <button onClick={onClose} className="md:hidden p-1 text-slate-400 hover:text-slate-200 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
          <span className="text-[11px] font-medium text-slate-200 truncate">{session.name || 'Anoniem'}</span>
          <span className="text-[9px] text-slate-500 font-mono shrink-0 hidden sm:inline">{session.subject} {session.level}</span>
          {node && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-700 shrink-0 hidden sm:block" />
              <span className="text-[9px] text-slate-400 truncate hidden sm:inline">{node.title}</span>
            </>
          )}
        </div>
        <button onClick={onClose} className="p-1 text-slate-600 hover:text-slate-400 hidden md:block">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs: Overzicht / Chatlog / 10D Analyse */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="h-8 px-2 bg-slate-900 border-b border-slate-800 rounded-none justify-start gap-0">
          <TabsTrigger value="overview" className="text-[9px] font-mono uppercase tracking-wider rounded-none data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 px-3 h-7">
            Overzicht
          </TabsTrigger>
          <TabsTrigger value="chatlog" className="text-[9px] font-mono uppercase tracking-wider rounded-none data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 px-3 h-7">
            Chatlog ({chatLog.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-[9px] font-mono uppercase tracking-wider rounded-none data-[state=active]:bg-slate-800 data-[state=active]:text-slate-200 px-3 h-7">
            10D Analyse
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="flex-1 overflow-y-auto mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Live metrics */}
            <div className="border-r border-slate-800">
              {/* Phase stepper */}
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Brain className="w-3 h-3 text-indigo-400" />
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Procesfase</span>
                </div>
                <div className="flex items-center gap-0.5 mb-1.5">
                  {PHASE_STEPS.map((step, i) => (
                    <div key={step} className={`flex-1 h-1.5 transition-colors ${i <= currentPhaseIdx ? 'bg-indigo-500/70' : 'bg-slate-800'}`} />
                  ))}
                </div>
                <div className="flex justify-between">
                  {PHASE_LABELS.map((label, i) => (
                    <span key={label} className={`text-[7px] font-mono uppercase ${i === currentPhaseIdx ? 'text-indigo-300' : 'text-slate-700'}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 border-b border-slate-800">
                <MetricCell label="Interventie" value={analysis?.active_fix || '—'} icon={<Zap className="w-3 h-3 text-slate-500" />} accent={analysis?.active_fix ? 'indigo' : undefined} />
                <MetricCell label="Kennistype" value={analysis?.coregulation_bands?.find(c => c.startsWith('K')) || '—'} icon={<Brain className="w-3 h-3 text-yellow-400" />} />
                <MetricCell label="Zelfstandigheid" value={agencyScore !== undefined ? `${agencyScore}%` : '—'} icon={<TrendingUp className="w-3 h-3 text-emerald-400" />} accent={agencyScore !== undefined && agencyScore < 40 ? 'red' : undefined} />
                <MetricCell label="G-Factor" value={gFactor !== undefined ? `${Math.round(gFactor * 100)}%` : '—'} icon={<Cpu className="w-3 h-3 text-slate-400" />} />
                <MetricCell label="Alignment" value={mechanical?.semanticValidation?.alignment_status || '—'} icon={<Activity className="w-3 h-3 text-cyan-400" />} accent={mechanical?.semanticValidation?.alignment_status === 'CRITICAL' ? 'red' : undefined} />
                <MetricCell label="Epistemic Guard" value={mechanical?.epistemicGuardResult?.label || '—'} icon={<AlertTriangle className="w-3 h-3 text-amber-400" />} accent={mechanical?.epistemicGuardResult?.label === 'VERIFY' ? 'red' : undefined} />
                <MetricCell label="Repairs" value={mechanical?.repairAttempts != null ? String(mechanical.repairAttempts) : '—'} icon={<RefreshCw className="w-3 h-3 text-slate-400" />} accent={mechanical?.repairAttempts && mechanical.repairAttempts > 0 ? 'red' : undefined} />
                <MetricCell label="Trend" value={eai?.scaffolding?.trend || '—'} icon={<TrendingUp className="w-3 h-3 text-slate-400" />} accent={eai?.scaffolding?.trend === 'FALLING' ? 'red' : undefined} />
              </div>

              {/* Scaffolding sparkline */}
              {eai?.scaffolding && (
                <div className="px-4 py-3 border-b border-slate-800">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Agency Verloop</span>
                  <div className="h-6 flex items-end gap-0.5 mt-2">
                    {eai.scaffolding.history_window.map((score: number, i: number) => (
                      <div key={i} className="flex-1 bg-slate-800 relative overflow-hidden rounded-sm">
                        <div
                          className={`absolute bottom-0 w-full rounded-sm ${score >= 60 ? 'bg-emerald-600' : score >= 40 ? 'bg-slate-600' : 'bg-red-600'}`}
                          style={{ height: `${Math.max(score, 5)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  {eai.scaffolding.advice && (
                    <div className="text-[8px] text-amber-300 mt-2">💡 {eai.scaffolding.advice}</div>
                  )}
                </div>
              )}

              {/* Last message preview */}
              {session.last_message_preview && (
                <div className="px-4 py-3 border-b border-slate-800">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Laatste Bericht</span>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed italic">
                    "{session.last_message_preview}"
                  </p>
                </div>
              )}

              {/* Timing */}
              <div className="px-4 py-3 border-b border-slate-800">
                <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600">
                  <span><Clock className="w-3 h-3 inline mr-1" />Actief: {getTimeSince(session.last_active_at)} geleden</span>
                  <span>Berichten: {session.messages_count}</span>
                  {mechanical?.latencyMs && <span>Latency: {mechanical.latencyMs}ms</span>}
                </div>
              </div>
            </div>

            {/* Right: Teacher messages */}
            <div className="flex flex-col">
              <div className="h-9 px-3 flex items-center border-b border-slate-800 bg-slate-900/40">
                <MessageSquare className="w-3 h-3 text-amber-400 mr-2" />
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Berichten aan Leerling</span>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 min-h-[200px]">
                {sentMessages.length === 0 ? (
                  <div className="text-center py-8 text-slate-700">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-[10px] font-mono">Nog geen berichten gestuurd</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sentMessages.map(msg => (
                      <div key={msg.id} className="p-2.5 border border-amber-500/20 bg-amber-950/10">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-mono text-amber-400 uppercase">{msg.teacher_name}</span>
                          <span className="text-[8px] font-mono text-slate-600">
                            {new Date(msg.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 leading-relaxed">{msg.message}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-1 h-1 rounded-full ${msg.read ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          <span className="text-[8px] font-mono text-slate-600">{msg.read ? 'Gelezen' : 'Verzonden'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Message input */}
              <div className="px-3 py-2 border-t border-slate-800 bg-slate-950">
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageInput}
                    onChange={e => onMessageInputChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); } }}
                    placeholder="Bericht aan leerling (read-only in chat)..."
                    rows={2}
                    className="flex-1 bg-slate-900 border border-slate-700 px-2.5 py-2 text-slate-200 text-[16px] sm:text-[11px] placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                  <button
                    onClick={onSendMessage}
                    disabled={!messageInput.trim() || isSending}
                    className="p-2 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[8px] text-slate-700 mt-1">
                  ⚠️ Dit bericht verschijnt als read-only melding in de chat. De AI ontvangt het niet.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Chatlog tab */}
        <TabsContent value="chatlog" className="flex-1 overflow-y-auto mt-0 px-4 py-3">
          {chatLog.length === 0 ? (
            <div className="text-center py-12 text-slate-700">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" />
              <p className="text-[10px] font-mono">Geen chatberichten opgeslagen voor deze sessie</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl mx-auto">
              {chatLog.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 border ${
                    msg.role === 'user'
                      ? 'border-slate-700 bg-slate-900/60 ml-8'
                      : msg.role === 'teacher'
                      ? 'border-amber-500/20 bg-amber-950/10 mx-4'
                      : 'border-indigo-500/20 bg-indigo-950/10 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[8px] font-mono uppercase tracking-wider ${
                      msg.role === 'user' ? 'text-slate-400' : msg.role === 'teacher' ? 'text-amber-400' : 'text-indigo-400'
                    }`}>
                      {msg.role === 'user' ? 'Leerling' : msg.role === 'teacher' ? 'Docent' : 'EAI'}
                    </span>
                    <span className="text-[8px] font-mono text-slate-600">
                      {new Date(msg.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.analysis && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {(msg.analysis as EAIAnalysis).process_phases?.map((p: string) => (
                        <span key={p} className="text-[7px] font-mono px-1 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{p}</span>
                      ))}
                      {(msg.analysis as EAIAnalysis).active_fix && (
                        <span className="text-[7px] font-mono px-1 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {(msg.analysis as EAIAnalysis).active_fix}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 10D Analysis tab */}
        <TabsContent value="analysis" className="flex-1 overflow-y-auto mt-0 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-3">Alle 10 Dimensies — Live Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {SSOT_DATA.metadata.cycle.order.map(rubricId => {
                const rubric = getRubric(rubricId);
                const shortKey = getShortKey(rubricId);
                const colors = getDimensionColors(shortKey);
                if (!rubric) return null;

                // Find current band from analysis
                const currentBand = allBands.find(b => b.startsWith(shortKey)) || `${shortKey}0`;
                const bandData = rubric.bands.find(b => b.band_id === currentBand);

                return (
                  <div key={rubricId} className={`p-3 border ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-mono font-bold ${colors.text}`}>{shortKey}</span>
                      <span className={`text-[9px] font-mono ${colors.text}`}>{currentBand}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mb-1">{rubric.name}</p>
                    {bandData && (
                      <p className="text-[8px] text-slate-500">{bandData.label}: {bandData.description?.slice(0, 80)}</p>
                    )}
                    {/* Band progress bar */}
                    <div className="flex gap-0.5 mt-2">
                      {rubric.bands.map(band => (
                        <div
                          key={band.band_id}
                          className={`flex-1 h-1 ${band.band_id === currentBand ? (colors.text.replace('text-', 'bg-')) : 'bg-slate-800'}`}
                          title={band.label}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reasoning */}
            {analysis?.reasoning && (
              <div className="mt-4 p-3 border border-slate-800 bg-slate-900/40">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Analyse Reasoning</span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{analysis.reasoning}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// METRIC CELL
// ═══════════════════════════════════════════════════════════════

const MetricCell: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: 'indigo' | 'red';
}> = ({ label, value, icon, accent }) => (
  <div className="px-3 py-2.5 border-b border-r border-slate-800">
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <span className={`text-[11px] font-mono font-medium ${
      accent === 'indigo' ? 'text-indigo-300' :
      accent === 'red' ? 'text-red-300' :
      'text-slate-300'
    }`}>
      {value}
    </span>
  </div>
);

export default TeacherCockpit;
