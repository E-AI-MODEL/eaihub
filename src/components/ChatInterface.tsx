import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Zap, Brain, Palette, Users, Settings, Terminal, Lightbulb, RotateCcw, Info, Grid3X3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageBubble from '@/components/MessageBubble';
import DidacticLegend from '@/components/DidacticLegend';
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

// Theme definitions with visual properties
const THEME_BUTTONS: { id: DidacticTheme; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'DEFAULT', label: 'Standaard', icon: <Sparkles className="w-4 h-4" />, color: 'bg-primary' },
  { id: 'DEVIL', label: "Devil's Advocate", icon: <Zap className="w-4 h-4" />, color: 'bg-destructive' },
  { id: 'META', label: 'Meta-Cognitief', icon: <Brain className="w-4 h-4" />, color: 'bg-purple-500' },
  { id: 'CREATIVE', label: 'Creatief', icon: <Palette className="w-4 h-4" />, color: 'bg-pink-500' },
  { id: 'COACH', label: 'Coach', icon: <Users className="w-4 h-4" />, color: 'bg-green-500' },
  { id: 'SYSTEM', label: 'Systeem', icon: <Settings className="w-4 h-4" />, color: 'bg-slate-500' },
  { id: 'PRAGMATIC', label: 'Pragmatisch', icon: <Terminal className="w-4 h-4" />, color: 'bg-orange-500' },
];

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
  1: [ // Affectief - zachte check
    "💭 Neem je tijd. Waar denk je over na?",
    "🌱 Het is oké om even stil te staan. Wat speelt er?",
    "💡 Soms helpt het om hardop te denken. Wat zie je?",
  ],
  2: [ // Hint - inhoudelijke richting
    "🔍 Probeer de vraag in kleinere stukjes te splitsen.",
    "📐 Welke concepten ken je al die hierbij kunnen helpen?",
    "🎯 Focus op het eerste wat je moet weten om verder te komen.",
  ],
  3: [ // Scaffold - concrete ondersteuning
    "📝 Laten we samen de eerste stap zetten. Wat is het doel?",
    "🛠️ Ik kan een stappenplan maken. Wil je dat?",
    "💬 Beschrijf wat je al geprobeerd hebt, dan gaan we daarop verder.",
  ],
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, onAnalysisUpdate, sessionId: externalSessionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<DidacticTheme>('DEFAULT');
  const [showLegend, setShowLegend] = useState(false);
  const [showToolbox, setShowToolbox] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState('START');
  const [internalSessionId] = useState(() => `session_${crypto.randomUUID()}`);
  const sessionId = externalSessionId || internalSessionId;
  
  // Idle timer refs for escalation
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const nudgeLevelRef = useRef<number>(0); // 0 = None, 1 = Affective, 2 = Hint, 3 = Scaffold
  const analysisRef = useRef<EAIAnalysis | null>(null);
  const messageCounterRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Update analysis ref for idle timer
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
    // Clear existing timer
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    // Only run if we have messages and not loading
    if (messages.length === 0 || isLoading) return;

    idleTimerRef.current = setInterval(() => {
      // Stop if max level reached
      if (nudgeLevelRef.current >= 3) return;

      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;
      const dynamicTTL = calculateDynamicTTL(analysisRef.current);

      if (idleTime > dynamicTTL) {
        triggerProactiveNudge();
        lastInteractionRef.current = Date.now();
      }
    }, 5000); // Check every 5s

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
    
    // Handle special commands
    if (textToSend === 'GAME_NEURO') {
      setShowToolbox(false);
      // TODO: Trigger game modal via parent
      return;
    }

    if (!textToSend || isLoading) return;

    // Reset idle timer on interaction
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

    // Update theme based on command
    if (textToSend.startsWith('/')) {
      const tool = Object.values(TOOL_CATEGORIES).flat().find(t => t.command === textToSend.split(' ')[0]);
      if (tool) {
        setActiveTheme(tool.mode);
      }
    }

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

      // Update theme based on active_fix
      if (response.analysis?.active_fix) {
        const tool = Object.values(TOOL_CATEGORIES).flat().find(t => t.command === response.analysis?.active_fix);
        if (tool) {
          setActiveTheme(tool.mode);
        }
      }
    } catch (error) {
      messageCounterRef.current += 1;
      const errorMessage: Message = {
        id: `msg_${crypto.randomUUID()}`,
        role: 'model',
        text: '❌ Er is een fout opgetreden. Probeer het opnieuw.',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resetInteraction(); // Reset idle timer on typing
  };

  const handleClearChat = () => {
    setMessages([]);
    nudgeLevelRef.current = 0;
    analysisRef.current = null;
  };

  const currentCategoryTools = TOOL_CATEGORIES[activeToolTab] || [];

  return (
    <div className="flex flex-col h-full relative">
      {/* Neural Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 z-0" 
        style={{ 
          backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.2) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}
      />

      {/* Theme Selector */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50 backdrop-blur-sm z-10 relative">
        <span className="text-xs text-muted-foreground mr-2">Modus:</span>
        <div className="flex gap-1 flex-wrap">
          {THEME_BUTTONS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                activeTheme === theme.id
                  ? `${theme.color} text-white shadow-lg`
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
              title={theme.label}
            >
              {theme.icon}
              <span className="hidden sm:inline">{theme.label}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowLegend(true)}
            title="Didactische Legenda"
          >
            <Info className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleClearChat}
            title="Chat wissen"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Welkom bij EAI Studio
            </h3>
            <p className="text-muted-foreground max-w-md text-sm">
              Start een gesprek met je AI-coach. Stel een vraag over <strong>{profile.subject || 'je lesstof'}</strong> en 
              ontvang begeleiding die je helpt zelf het antwoord te ontdekken.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => setInput("Ik begrijp dit concept niet: ")}>
                Concept uitleggen
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSend("/checkin")}>
                Check-in starten
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowToolbox(true)}>
                <Grid3X3 className="w-4 h-4 mr-1" />
                Toolbox
              </Button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground px-4 py-2 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-mono uppercase tracking-wide">Processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm z-10 relative">
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => setShowToolbox(!showToolbox)}
            title="Intervention Toolbox"
          >
            <Grid3X3 className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Typ een bericht of gebruik /command..."
              className="w-full min-h-[44px] max-h-32 px-4 py-3 bg-secondary border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground text-[16px]"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <Button 
            onClick={() => handleSend()} 
            disabled={!input.trim() || isLoading}
            className="h-10 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Tip: Open de <button onClick={() => setShowToolbox(true)} className="text-primary hover:underline">toolbox</button> voor interventies
          </p>
          <span className="text-xs text-muted-foreground">
            {profile.level && `${profile.level} • `}
            {profile.subject || 'Geen vak geselecteerd'}
          </span>
        </div>
      </div>

      {/* Toolbox Modal */}
      {showToolbox && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowToolbox(false)} />
          <div className="absolute bottom-0 left-0 right-0 lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:bottom-auto lg:w-[640px] lg:rounded-2xl bg-card border border-border rounded-t-2xl p-4 max-h-[70vh] lg:max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-full lg:animate-none lg:zoom-in-95 duration-300 shadow-2xl">
            {/* Mobile handle */}
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4 lg:hidden" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground tracking-wide uppercase">Intervention Toolbox</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowToolbox(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide snap-x">
              {Object.keys(TOOL_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveToolTab(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border snap-center ${
                    activeToolTab === cat
                      ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.2)]'
                      : 'bg-secondary text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tools Grid */}
            <div key={activeToolTab} className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {currentCategoryTools.map((tool) => (
                  <button
                    key={tool.command}
                    onClick={() => handleSend(tool.command)}
                    className="flex items-center gap-4 p-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 hover:border-primary/50 transition-all active:scale-[0.98] group text-left"
                  >
                    <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{tool.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{tool.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{tool.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Didactic Legend Modal */}
      {showLegend && <DidacticLegend onClose={() => setShowLegend(false)} />}
    </div>
  );
};

export default ChatInterface;
