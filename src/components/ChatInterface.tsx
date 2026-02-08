import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Zap, Brain, Palette, Users, Settings, Terminal, Lightbulb, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageBubble from '@/components/MessageBubble';
import DidacticLegend from '@/components/DidacticLegend';
import type { Message, DidacticTheme, LearnerProfile, EAIAnalysis, ChatResponse } from '@/types';
import { sendChat } from '@/services/chatService';
import { getOrCreateUserId } from '@/services/identity';

interface ChatInterfaceProps {
  profile: LearnerProfile;
  onAnalysisUpdate?: (analysis: EAIAnalysis) => void;
}

const THEMES: { id: DidacticTheme; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'DEFAULT', label: 'Standaard', icon: <Sparkles className="w-4 h-4" />, color: 'bg-primary' },
  { id: 'DEVIL', label: "Devil's Advocate", icon: <Zap className="w-4 h-4" />, color: 'bg-destructive' },
  { id: 'META', label: 'Meta-Cognitief', icon: <Brain className="w-4 h-4" />, color: 'bg-purple-500' },
  { id: 'CREATIVE', label: 'Creatief', icon: <Palette className="w-4 h-4" />, color: 'bg-pink-500' },
  { id: 'COACH', label: 'Coach', icon: <Users className="w-4 h-4" />, color: 'bg-green-500' },
  { id: 'SYSTEM', label: 'Systeem', icon: <Settings className="w-4 h-4" />, color: 'bg-slate-500' },
  { id: 'PRAGMATIC', label: 'Pragmatisch', icon: <Terminal className="w-4 h-4" />, color: 'bg-orange-500' },
];

const IDLE_NUDGES = [
  "Waar loop je vast? Beschrijf je probleem zo specifiek mogelijk.",
  "Wat is het laatste dat je wel begreep?",
  "Probeer je vraag in eigen woorden te formuleren.",
  "Welk onderdeel van de stof vind je het moeilijkst?",
  "Kun je een voorbeeld geven van wat je niet snapt?",
];

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ profile, onAnalysisUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<DidacticTheme>('DEFAULT');
  const [showLegend, setShowLegend] = useState(false);
  const [sessionId] = useState(() => `session_${crypto.randomUUID()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageCounterRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Idle nudge timer with proper cleanup
  useEffect(() => {
    // Clear any existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    
    // Only set timer if we have messages and not loading
    if (messages.length > 0 && !isLoading) {
      idleTimerRef.current = setTimeout(() => {
        const nudge = IDLE_NUDGES[Math.floor(Math.random() * IDLE_NUDGES.length)];
        messageCounterRef.current += 1;
        const nudgeMessage: Message = {
          id: `nudge_${crypto.randomUUID()}`,
          role: 'model',
          text: `💡 *Tip:* ${nudge}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, nudgeMessage]);
      }, 120000); // 2 minutes
    }

    // Cleanup function
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [messages.length, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    messageCounterRef.current += 1;
    const userMessage: Message = {
      id: `msg_${crypto.randomUUID()}`,
      role: 'user',
      text: input.trim(),
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
        onAnalysisUpdate(response.analysis);
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const getThemeCommand = (theme: DidacticTheme): string | null => {
    const commands: Record<DidacticTheme, string | null> = {
      DEFAULT: null,
      DEVIL: '/devil',
      META: '/meta',
      CREATIVE: '/twist',
      COACH: '/checkin',
      SYSTEM: '/fase_check',
      PRAGMATIC: '/proces_eval',
    };
    return commands[theme];
  };

  const handleThemeSelect = (theme: DidacticTheme) => {
    setActiveTheme(theme);
    const command = getThemeCommand(theme);
    if (command !== null && messages.length > 0) {
      setInput(command + ' ');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Theme Selector */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50">
        <span className="text-xs text-muted-foreground mr-2">Modus:</span>
        <div className="flex gap-1 flex-wrap">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all ${
                activeTheme === theme.id
                  ? `${theme.color} text-white`
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
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
              <Button variant="outline" size="sm" onClick={() => setInput("Kun je me helpen met: ")}>
                Hulpvraag stellen
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInput("/checkin")}>
                Check-in starten
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
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">EAI denkt na...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel je vraag of gebruik een /command..."
            className="flex-1 bg-secondary"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            Verstuur
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            Tip: Gebruik <code className="bg-secondary px-1 rounded">/help</code> voor beschikbare commando's
          </p>
          <span className="text-xs text-muted-foreground">
            {profile.level && `${profile.level} • `}
            {profile.subject || 'Geen vak geselecteerd'}
          </span>
        </div>
      </div>

      {/* Didactic Legend Modal */}
      {showLegend && <DidacticLegend onClose={() => setShowLegend(false)} />}
    </div>
  );
};

export default ChatInterface;
