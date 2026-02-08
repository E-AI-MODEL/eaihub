import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Grid3X3, X, RotateCcw } from 'lucide-react';
import MessageBubble from '@/components/MessageBubble';
import type { Message, DidacticTheme, LearnerProfile, EAIAnalysis, MechanicalState } from '@/types';
import { sendChat } from '@/services/chatService';
import { getOrCreateUserId } from '@/services/identity';
import { calculateDynamicTTL } from '@/utils/eaiLearnAdapter';
import { pushTrace } from '@/lib/reliabilityPipeline';

interface ChatInterfaceProps {
  profile: LearnerProfile;
  onAnalysisUpdate?: (analysis: EAIAnalysis, mechanical?: MechanicalState) => void;
  sessionId?: string;
}

// Intervention Toolbox Categories
const TOOL_CATEGORIES: Record<string, { label: string; command: string; icon: string; desc: string; mode: DidacticTheme }[]> = {
  START: [
    { label: "Bepaal doel", command: "/checkin", icon: "📍", desc: "Maak afspraken over doel en rol", mode: "COACH" },
    { label: "Kernvraag", command: "/leervraag", icon: "💡", desc: "Vind de kern van je leervraag", mode: "DEFAULT" },
    { label: "Proces check", command: "/fase_check", icon: "⏱️", desc: "Check waar je staat in het proces", mode: "SYSTEM" },
  ],
  UITLEG: [
    { label: "Structureer", command: "/schema", icon: "📐", desc: "Zet tekst om in structuur", mode: "SYSTEM" },
    { label: "Visualiseer", command: "/beeld", icon: "🎨", desc: "Krijg uitleg via een metafoor", mode: "CREATIVE" },
    { label: "Stap-voor-stap", command: "/stappenplan", icon: "📝", desc: "Splits op in kleine stappen", mode: "PRAGMATIC" },
  ],
  UITDAGEN: [
    { label: "Devil's Advocate", command: "/devil", icon: "😈", desc: "Test je idee tegen kritiek", mode: "DEVIL" },
    { label: "Draai om", command: "/twist", icon: "🔄", desc: "Bekijk het van de andere kant", mode: "DEVIL" },
    { label: "Edge cases", command: "/randgeval", icon: "⚡", desc: "Wat als het anders gaat?", mode: "META" },
  ],
  CHECK: [
    { label: "Test mij", command: "/quizgen", icon: "📝", desc: "Test kennis met 3 vragen", mode: "COACH" },
    { label: "Samenvatten", command: "/beurtvraag", icon: "🎤", desc: "Vat samen in eigen woorden", mode: "PRAGMATIC" },
    { label: "Rubric", command: "/rubric", icon: "📊", desc: "Beoordeel je eigen werk", mode: "SYSTEM" },
  ],
  REFLECTIE: [
    { label: "Helikopter", command: "/meta", icon: "🧠", desc: "Reflecteer op je aanpak", mode: "META" },
    { label: "Transfer", command: "/transfer", icon: "🔗", desc: "Pas toe in andere context", mode: "CREATIVE" },
    { label: "Evalueer", command: "/proces_eval", icon: "📈", desc: "Evalueer het leerproces", mode: "META" },
  ],
  PAUZE: [
    { label: "Neuro-Linker", command: "GAME_NEURO", icon: "💠", desc: "Reset je focus met een spel", mode: "DEFAULT" },
    { label: "Ademhaling", command: "/adem", icon: "🌬️", desc: "Korte ademhalingsoefening", mode: "COACH" },
  ],
};

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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, onAnalysisUpdate, sessionId: externalSessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState('START');
  const [internalSessionId] = useState(() => `session_${crypto.randomUUID()}`);
  const sessionId = externalSessionId || internalSessionId;
  
  // Idle timer refs for escalation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const nudgeLevelRef = useRef<number>(0);
  const analysisRef = useRef<EAIAnalysis | null>(null);
  const messageCounterRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastModelMsg = [...messages].reverse().find(m => m.role === 'model' && m.analysis);
      if (lastModelMsg?.analysis) {
        analysisRef.current = lastModelMsg.analysis;
      }
    }
  }, [messages]);

  // Idle timer with escalation
  useEffect(() => {
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    if (messages.length === 0 || isLoading) return;

    idleTimerRef.current = setInterval(() => {
      if (nudgeLevelRef.current >= 3) return;

      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;
      const dynamicTTL = calculateDynamicTTL(analysisRef.current);

      if (idleTime > dynamicTTL) {
        triggerProactiveNudge();
        lastInteractionRef.current = Date.now();
      }
    }, 5000);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [messages.length, isLoading]);

  const triggerProactiveNudge = () => {
    const nextLevel = Math.min(nudgeLevelRef.current + 1, 3) as 1 | 2 | 3;
    nudgeLevelRef.current = nextLevel;

    const nudges = IDLE_NUDGES[nextLevel];
    const nudgeText = nudges[Math.floor(Math.random() * nudges.length)];

    pushTrace(sessionId, {
      severity: 'INFO',
      source: 'ENGINE',
      step: 'RENDER',
      message: `Proactive nudge triggered at level ${nextLevel}`,
      data: { nudgeLevel: nextLevel, idleTimeMs: Date.now() - lastInteractionRef.current },
    });

    messageCounterRef.current += 1;
    const nudgeMessage: Message = {
      id: `nudge_${crypto.randomUUID()}`,
      role: 'model',
      text: nudgeText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, nudgeMessage]);
  };

  const resetInteraction = () => {
    lastInteractionRef.current = Date.now();
    nudgeLevelRef.current = 0;
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input.trim();
    
    if (textToSend === 'GAME_NEURO') {
      setShowToolbox(false);
      return;
    }

    if (!textToSend || isLoading) return;

    resetInteraction();
    setShowToolbox(false);

    messageCounterRef.current += 1;
    const userMessage: Message = {
      id: `msg_${crypto.randomUUID()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const userId = getOrCreateUserId();
      const response = await sendChat({
        sessionId,
        userId,
        message: userMessage.text,
        profile,
      });

      messageCounterRef.current += 1;
      const modelMessage: Message = {
        id: `msg_${crypto.randomUUID()}`,
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        analysis: response.analysis,
        mechanical: response.mechanical,
      };

      setMessages(prev => [...prev, modelMessage]);
      
      if (response.analysis && onAnalysisUpdate) {
        onAnalysisUpdate(response.analysis, response.mechanical);
      }
    } catch (error) {
      messageCounterRef.current += 1;
      const errorMessage: Message = {
        id: `msg_${crypto.randomUUID()}`,
        role: 'model',
        text: 'Er is een fout opgetreden. Probeer het opnieuw.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      resetInteraction();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    resetInteraction();
  };

  const handleClearChat = () => {
    setMessages([]);
    nudgeLevelRef.current = 0;
    analysisRef.current = null;
  };

  const currentCategoryTools = TOOL_CATEGORIES[activeToolTab] || [];

  // Build context line
  const contextLine = profile?.subject 
    ? `${profile.subject}${profile.level ? ` — ${profile.level}` : ''}`
    : 'Leersessie';

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* ═══════════════════════════════════════════════════════════════════
          CONTEXT RAIL — Fixed 48px height
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-12 px-4 flex items-center justify-between bg-slate-900/80 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-100">{contextLine}</span>
          {profile?.grade && (
            <span className="text-xs text-slate-400 font-mono">{profile.grade}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-100 transition-colors"
            title="Chat wissen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CHAT WELL — Scrollable inset work area
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-900/60 shadow-inner">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-12 h-12 border border-slate-700 bg-slate-800/40 flex items-center justify-center mb-4 mx-auto">
                <span className="text-slate-400 text-lg font-mono">EAI</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Stel een vraag over <span className="text-slate-100 font-medium">{profile.subject || 'je lesstof'}</span> en 
                ontvang begeleiding die je helpt zelf het antwoord te ontdekken.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setInput("Ik begrijp dit concept niet: ")}
                  className="px-3 py-2 border border-slate-700 bg-slate-800/40 text-slate-300 text-xs hover:border-slate-600 hover:text-slate-100 transition-colors"
                >
                  Concept uitleggen
                </button>
                <button
                  onClick={() => handleSend("/checkin")}
                  className="px-3 py-2 border border-slate-700 bg-slate-800/40 text-slate-300 text-xs hover:border-slate-600 hover:text-slate-100 transition-colors"
                >
                  Check-in starten
                </button>
                <button
                  onClick={() => setShowToolbox(true)}
                  className="px-3 py-2 border border-slate-700 bg-slate-800/40 text-slate-300 text-xs hover:border-slate-600 hover:text-slate-100 transition-colors flex items-center gap-1"
                >
                  <Grid3X3 className="w-3 h-3" />
                  Toolbox
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-3 border border-slate-700 bg-slate-800/40 max-w-2xl">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">Processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INPUT DOCK — Fixed 64px height
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-16 px-4 flex items-center gap-3 bg-slate-900 border-t border-slate-700 shrink-0">
        <button
          onClick={() => setShowToolbox(!showToolbox)}
          className="p-2 border border-slate-700 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:border-slate-600 transition-colors"
          title="Intervention Toolbox"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Werk je antwoord hier uit…"
          className="flex-1 bg-slate-950 border border-slate-700 px-3 py-2 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-slate-600"
          disabled={isLoading}
        />
        <button 
          onClick={() => handleSend()} 
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 border border-slate-600 bg-slate-800 text-slate-100 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Verstuur
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TOOLBOX MODAL
          ═══════════════════════════════════════════════════════════════════ */}
      {showToolbox && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowToolbox(false)} />
          <div className="absolute bottom-0 left-0 right-0 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:w-[640px] bg-slate-900 border border-slate-700 p-4 max-h-[70vh] lg:max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
              <h2 className="text-sm font-medium text-slate-100 uppercase tracking-wide">Intervention Toolbox</h2>
              <button 
                onClick={() => setShowToolbox(false)} 
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-3 mb-3 border-b border-slate-800">
              {Object.keys(TOOL_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveToolTab(cat)}
                  className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wide whitespace-nowrap transition-colors ${
                    activeToolTab === cat 
                      ? 'bg-slate-800 text-slate-100 border border-slate-600' 
                      : 'text-slate-400 border border-transparent hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {currentCategoryTools.map((tool) => (
                <button
                  key={tool.command}
                  onClick={() => handleSend(tool.command)}
                  className="flex items-center gap-3 p-3 border border-slate-800 bg-slate-900/60 hover:bg-slate-800/40 hover:border-slate-700 transition-colors text-left"
                >
                  <span className="text-lg shrink-0">{tool.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">{tool.label}</div>
                    <div className="text-xs text-slate-400 truncate">{tool.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
