import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import MessageBubble from '@/components/MessageBubble';
import type { Message, LearnerProfile, EAIAnalysis, MechanicalState } from '@/types';
import { sendChat } from '@/services/chatService';
import { getOrCreateUserId } from '@/services/identity';
import { calculateDynamicTTL } from '@/utils/eaiLearnAdapter';
import { pushTrace } from '@/lib/reliabilityPipeline';
import { getNodeById } from '@/data/curriculum';
import { upsertSessionState, subscribeToTeacherMessages, fetchTeacherMessages, markMessageRead } from '@/services/sessionSyncService';

interface ChatInterfaceProps {
  profile: LearnerProfile;
  onAnalysisUpdate?: (analysis: EAIAnalysis, mechanical?: MechanicalState) => void;
  sessionId?: string;
  pendingCommand?: string | null;
  onCommandConsumed?: () => void;
  currentAnalysis?: EAIAnalysis | null;
  currentMechanical?: MechanicalState | null;
  eaiState?: any;
}

// Idle nudge messages by escalation level
const IDLE_NUDGES: Record<number, string[]> = {
  1: [
    "Neem je tijd. Waar denk je over na?",
    "Het is oké om even stil te staan. Wat speelt er?",
    "Soms helpt het om hardop te denken. Wat zie je?",
  ],
  2: [
    "Probeer de vraag in kleinere stukjes te splitsen.",
    "Welke concepten ken je al die hierbij kunnen helpen?",
    "Focus op het eerste wat je moet weten om verder te komen.",
  ],
  3: [
    "Laten we samen de eerste stap zetten. Wat is het doel?",
    "Ik kan een stappenplan maken. Wil je dat?",
    "Beschrijf wat je al geprobeerd hebt, dan gaan we daarop verder.",
  ],
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  profile,
  onAnalysisUpdate,
  sessionId: externalSessionId,
  pendingCommand,
  onCommandConsumed,
  currentAnalysis,
  currentMechanical,
  eaiState,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [internalSessionId] = useState(() => `session_${crypto.randomUUID()}`);
  const sessionId = externalSessionId || internalSessionId;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const nudgeLevelRef = useRef<number>(0);
  const analysisRef = useRef<EAIAnalysis | null>(null);
  const messageCounterRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastModelMsg = [...messages].reverse().find(m => m.role === 'model' && m.analysis);
      if (lastModelMsg?.analysis) analysisRef.current = lastModelMsg.analysis;
    }
  }, [messages]);

  // ═══ SESSION SYNC: Push state to DB every 10s ═══
  useEffect(() => {
    const userId = getOrCreateUserId();
    const pushState = () => {
      upsertSessionState({
        userId,
        sessionId,
        profile,
        analysis: currentAnalysis || analysisRef.current,
        mechanical: currentMechanical || null,
        eaiState: eaiState || null,
        messagesCount: messages.length,
        lastMessagePreview: messages.length > 0 ? messages[messages.length - 1].text.slice(0, 100) : null,
      });
    };
    pushState(); // immediate push
    const interval = setInterval(pushState, 10000);
    return () => clearInterval(interval);
  }, [sessionId, profile, currentAnalysis, currentMechanical, eaiState, messages.length]);

  // ═══ TEACHER MESSAGES: Listen for incoming messages ═══
  useEffect(() => {
    // Fetch existing messages on mount
    fetchTeacherMessages(sessionId).then(msgs => {
      const teacherMsgs: Message[] = msgs.map(m => ({
        id: m.id,
        role: 'teacher' as const,
        text: m.message,
        timestamp: new Date(m.created_at),
        teacherName: m.teacher_name,
      }));
      if (teacherMsgs.length > 0) {
        setMessages(prev => [...prev, ...teacherMsgs]);
        msgs.forEach(m => { if (!m.read) markMessageRead(m.id); });
      }
    });

    // Subscribe to new messages
    const unsub = subscribeToTeacherMessages(sessionId, (msg) => {
      const teacherMessage: Message = {
        id: msg.id,
        role: 'teacher',
        text: msg.message,
        timestamp: new Date(msg.created_at),
        teacherName: msg.teacher_name,
      };
      setMessages(prev => [...prev, teacherMessage]);
      markMessageRead(msg.id);
    });

    return unsub;
  }, [sessionId]);

  // Handle pending command from LeskaartPanel
  useEffect(() => {
    if (pendingCommand) {
      handleSend(pendingCommand);
      onCommandConsumed?.();
    }
  }, [pendingCommand]);

  // Idle timer
  useEffect(() => {
    if (idleTimerRef.current) { clearInterval(idleTimerRef.current); idleTimerRef.current = null; }
    if (messages.length === 0 || isLoading) return;
    idleTimerRef.current = setInterval(() => {
      if (nudgeLevelRef.current >= 3) return;
      const idleTime = Date.now() - lastInteractionRef.current;
      const dynamicTTL = calculateDynamicTTL(analysisRef.current);
      if (idleTime > dynamicTTL) {
        triggerProactiveNudge();
        lastInteractionRef.current = Date.now();
      }
    }, 5000);
    return () => { if (idleTimerRef.current) { clearInterval(idleTimerRef.current); idleTimerRef.current = null; } };
  }, [messages.length, isLoading]);

  const triggerProactiveNudge = () => {
    const nextLevel = Math.min(nudgeLevelRef.current + 1, 3) as 1 | 2 | 3;
    nudgeLevelRef.current = nextLevel;
    const nudges = IDLE_NUDGES[nextLevel];
    const nudgeText = nudges[Math.floor(Math.random() * nudges.length)];
    pushTrace(sessionId, { severity: 'INFO', source: 'ENGINE', step: 'RENDER', message: `Proactive nudge level ${nextLevel}`, data: { nudgeLevel: nextLevel } });
    messageCounterRef.current += 1;
    setMessages(prev => [...prev, { id: `nudge_${crypto.randomUUID()}`, role: 'model', text: nudgeText, timestamp: new Date() }]);
  };

  const resetInteraction = () => { lastInteractionRef.current = Date.now(); nudgeLevelRef.current = 0; };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    if (textToSend === 'GAME_NEURO') return;
    if (!textToSend || isLoading) return;
    resetInteraction();

    const isCommand = textToSend.startsWith('/');

    messageCounterRef.current += 1;
    // Don't show /commands as user messages — the student shouldn't see them
    if (!isCommand) {
      const userMessage: Message = { id: `msg_${crypto.randomUUID()}`, role: 'user', text: textToSend, timestamp: new Date() };
      setMessages(prev => [...prev, userMessage]);
    }
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const userId = getOrCreateUserId();
      const response = await sendChat({ sessionId, userId, message: textToSend, profile });
      messageCounterRef.current += 1;
      const modelMessage: Message = { id: `msg_${crypto.randomUUID()}`, role: 'model', text: response.text, timestamp: new Date(), analysis: response.analysis, mechanical: response.mechanical };
      setMessages(prev => [...prev, modelMessage]);
      if (response.analysis && onAnalysisUpdate) onAnalysisUpdate(response.analysis, response.mechanical);
    } catch {
      messageCounterRef.current += 1;
      setMessages(prev => [...prev, { id: `msg_${crypto.randomUUID()}`, role: 'model', text: 'Er is een fout opgetreden. Probeer het opnieuw.', timestamp: new Date(), isError: true }]);
    } finally {
      setIsLoading(false);
      resetInteraction();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resetInteraction();
    // Auto-resize textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleClearChat = () => { setMessages([]); nudgeLevelRef.current = 0; analysisRef.current = null; };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* ═══════════════════════════════════════════════════════════
          CHAT WELL — Scrollable work area with grid background
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center max-w-lg">
              {/* EAI Monogram */}
              <div className="w-14 h-14 border border-slate-700 bg-slate-800/40 flex items-center justify-center mb-5 mx-auto animate-pulse">
                <span className="text-indigo-400 text-lg font-mono font-bold tracking-tighter">EAI</span>
              </div>

              <h2 className="text-sm text-slate-200 font-medium mb-1">
                Hoi {profile.name || 'daar'}
              </h2>
              {profile.currentNodeId ? (
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                  Je werkt aan <span className="text-slate-300">{getNodeById(profile.currentNodeId)?.title || profile.subject}</span>
                  <span className="text-slate-600"> · {profile.subject} {profile.level}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                  Klaar om te werken aan <span className="text-slate-300">{profile.subject || 'je lesstof'}</span>
                  {profile.level && <span className="text-slate-600"> · {profile.level}</span>}
                </p>
              )}

              {/* Starter cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setInput("Ik begrijp dit concept niet: ")}
                  className="p-3 border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-left group"
                >
                  <span className="text-sm mb-1 block">📐</span>
                  <span className="text-xs text-slate-300 group-hover:text-slate-100 block">Concept uitleggen</span>
                  <span className="text-[10px] text-slate-600 block">Leg een begrip stap voor stap uit</span>
                </button>
                <button
                  onClick={() => handleSend("/checkin")}
                  className="p-3 border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-left group"
                >
                  <span className="text-sm mb-1 block">📍</span>
                  <span className="text-xs text-slate-300 group-hover:text-slate-100 block">Check-in starten</span>
                  <span className="text-[10px] text-slate-600 block">Bepaal samen je leerdoel</span>
                </button>
                <button
                  onClick={() => handleSend("/quizgen")}
                  className="p-3 border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-900 transition-all text-left group"
                >
                  <span className="text-sm mb-1 block">📝</span>
                  <span className="text-xs text-slate-300 group-hover:text-slate-100 block">Test mijn kennis</span>
                  <span className="text-[10px] text-slate-600 block">Krijg 3 vragen over de stof</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Message list */
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="max-w-2xl overflow-hidden">
                <div className="h-8 flex items-center gap-3 px-4 border border-slate-700 bg-slate-800/40">
                  <div className="h-1 flex-1 bg-slate-800 overflow-hidden rounded-full">
                    <div className="h-full w-1/3 bg-indigo-500/60 shimmer-bar" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest shrink-0">Verwerken...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          INPUT DOCK — Textarea with send icon
          ═══════════════════════════════════════════════════════════ */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-800 bg-slate-950 shrink-0">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 p-2 text-slate-500 hover:text-slate-300 transition-colors shrink-0 mb-0.5"
            title="Gesprek wissen"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono uppercase tracking-wider hidden sm:inline">Wis</span>
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Werk je antwoord hier uit…"
              rows={1}
              className="w-full bg-slate-900 border border-slate-700 px-3 py-2.5 pr-10 text-slate-100 text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-colors"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <span className="absolute right-10 bottom-3 text-[9px] text-slate-700 font-mono pointer-events-none">
              Enter
            </span>
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-2.5 border border-slate-700 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 mb-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
