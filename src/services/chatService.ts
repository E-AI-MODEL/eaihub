// Chat Service - Handles communication with EAI backend via Edge Function
// Uses Lovable AI Gateway with streaming support

import type { ChatRequest, ChatResponse, EAIAnalysis, MechanicalState, LearnerProfile } from '@/types';
import { toast } from '@/hooks/use-toast';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eai-chat`;
const HISTORY_LIMIT = 10; // Synced with edge function

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Store conversation history per session
const sessionHistory: Map<string, ChatMessage[]> = new Map();

export const sendChat = async (request: ChatRequest): Promise<ChatResponse> => {
  const startTime = Date.now();
  
  // Get or initialize history for this session
  let history = sessionHistory.get(request.sessionId) || [];
  
  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        sessionId: request.sessionId,
        userId: request.userId,
        message: request.message,
        profile: request.profile,
        history: history.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    // Handle error responses with toast notifications
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMsg = errorData.error || `HTTP ${response.status}`;
      
      // Show toast for rate limits and payment issues
      if (response.status === 429) {
        toast({
          title: "Rate Limit",
          description: "Te veel verzoeken. Wacht even en probeer opnieuw.",
          variant: "destructive",
        });
      } else if (response.status === 402) {
        toast({
          title: "Credits Op",
          description: "AI credits zijn op. Voeg credits toe aan je workspace.",
          variant: "destructive",
        });
      }
      
      throw new Error(errorMsg);
    }

    // Handle streaming response
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
          }
        } catch {
          // Incomplete JSON, put it back
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullText += content;
        } catch { /* ignore */ }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Update session history (synced with edge function limit)
    history = [
      ...history,
      { role: 'user' as const, content: request.message },
      { role: 'assistant' as const, content: fullText },
    ].slice(-HISTORY_LIMIT);
    sessionHistory.set(request.sessionId, history);

    // Generate analysis based on response content
    const analysis = generateAnalysis(request.message, fullText, request.profile);
    const mechanical: MechanicalState = {
      latencyMs,
      inputTokens: request.message.length * 2,
      outputTokens: fullText.length,
      model: 'gemini-3-flash-preview',
      temperature: 0.7,
      timestamp: new Date().toISOString(),
    };

    return {
      sessionId: request.sessionId,
      text: fullText,
      analysis,
      mechanical,
      auditId: `audit_${Date.now()}`,
    };

  } catch (error) {
    console.error('[ChatService] Error:', error);
    
    // Return error response
    return {
      sessionId: request.sessionId,
      text: `❌ Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}. Probeer het opnieuw.`,
      analysis: generateAnalysis(request.message, '', request.profile),
      mechanical: {
        latencyMs: Date.now() - startTime,
        inputTokens: request.message.length,
        outputTokens: 0,
        model: 'error',
        temperature: 0,
        timestamp: new Date().toISOString(),
      },
      auditId: null,
    };
  }
};

// Streaming version for real-time updates
export const streamChat = async ({
  request,
  onDelta,
  onDone,
}: {
  request: ChatRequest;
  onDelta: (text: string) => void;
  onDone: (response: ChatResponse) => void;
}): Promise<void> => {
  const startTime = Date.now();
  let history = sessionHistory.get(request.sessionId) || [];

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        sessionId: request.sessionId,
        userId: request.userId,
        message: request.message,
        profile: request.profile,
        history: history.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            onDelta(content); // Stream to UI
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Update history (synced with edge function limit)
    history = [
      ...history,
      { role: 'user' as const, content: request.message },
      { role: 'assistant' as const, content: fullText },
    ].slice(-HISTORY_LIMIT);
    sessionHistory.set(request.sessionId, history);

    onDone({
      sessionId: request.sessionId,
      text: fullText,
      analysis: generateAnalysis(request.message, fullText, request.profile),
      mechanical: {
        latencyMs,
        inputTokens: request.message.length * 2,
        outputTokens: fullText.length,
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        timestamp: new Date().toISOString(),
      },
      auditId: `audit_${Date.now()}`,
    });

  } catch (error) {
    console.error('[ChatService] Stream error:', error);
    onDone({
      sessionId: request.sessionId,
      text: `❌ ${error instanceof Error ? error.message : 'Fout bij verbinden'}`,
      analysis: generateAnalysis(request.message, '', request.profile),
      mechanical: {
        latencyMs: Date.now() - startTime,
        inputTokens: 0,
        outputTokens: 0,
        model: 'error',
        temperature: 0,
        timestamp: new Date().toISOString(),
      },
      auditId: null,
    });
  }
};

// Generate EAI analysis from response with content-aware heuristics
function generateAnalysis(input: string, output: string, profile: LearnerProfile): EAIAnalysis {
  const isCommand = input.startsWith('/');
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  // Content-aware knowledge level detection
  let knowledgeLevel = 'K2';
  if (lowerInput.includes('wat is') || lowerInput.includes('definitie') || lowerInput.includes('noem')) {
    knowledgeLevel = 'K1'; // Factual
  } else if (lowerInput.includes('hoe') || lowerInput.includes('stappen') || lowerInput.includes('methode')) {
    knowledgeLevel = 'K3'; // Procedural
  }
  
  // Cognitive load estimation based on response complexity
  const sentenceCount = (output.match(/[.!?]/g) || []).length;
  const hasCode = output.includes('```');
  const hasList = output.includes('- ') || output.includes('1.');
  let cognitiveLoad = 'C2';
  if (sentenceCount > 10 || hasCode) cognitiveLoad = 'C3';
  if (sentenceCount > 20) cognitiveLoad = 'C4';
  if (sentenceCount <= 3) cognitiveLoad = 'C1';
  
  // Precision phase based on conversation flow
  const hasQuestion = output.includes('?');
  let precisionPhase = 'P3';
  if (lowerOutput.includes('wat weet je al') || lowerOutput.includes('voorkennis')) precisionPhase = 'P1';
  else if (lowerOutput.includes('probeer') || lowerOutput.includes('mogelijkheden')) precisionPhase = 'P2';
  else if (lowerOutput.includes('verbind') || lowerOutput.includes('samenvat')) precisionPhase = 'P4';
  else if (lowerOutput.includes('transfer') || lowerOutput.includes('toepas')) precisionPhase = 'P5';
  
  // Task density based on scaffolding signals
  let taskDensity = 'TD3';
  const hintCount = (lowerOutput.match(/hint|tip|probeer|denk/g) || []).length;
  if (hintCount >= 3) taskDensity = 'TD2';
  if (hintCount === 0 && hasQuestion) taskDensity = 'TD4';
  if (!hasQuestion && sentenceCount <= 2) taskDensity = 'TD5';
  
  // Agency score calculation
  const agencyScore = taskDensity === 'TD1' ? 0.2 : 
                      taskDensity === 'TD2' ? 0.35 : 
                      taskDensity === 'TD3' ? 0.5 : 
                      taskDensity === 'TD4' ? 0.7 : 0.85;
  
  // Epistemic status from output - must match type: 'FEIT' | 'INTERPRETATIE' | 'SPECULATIE' | 'ONBEKEND'
  let epistemicStatus: 'FEIT' | 'INTERPRETATIE' | 'SPECULATIE' | 'ONBEKEND' = 'INTERPRETATIE';
  if (lowerOutput.includes('feit') || lowerOutput.includes('bewezen') || lowerOutput.includes('consensus')) {
    epistemicStatus = 'FEIT';
  } else if (lowerOutput.includes('speculatie') || lowerOutput.includes('misschien') || lowerOutput.includes('hypothese')) {
    epistemicStatus = 'SPECULATIE';
  } else if (lowerOutput.includes('onbekend') || output.length === 0) {
    epistemicStatus = 'ONBEKEND';
  }
  
  // SRL state detection
  let srlState: 'PLAN' | 'MONITOR' | 'REFLECT' | 'ADJUST' = 'MONITOR';
  if (lowerOutput.includes('plan') || lowerOutput.includes('eerst')) srlState = 'PLAN';
  else if (lowerOutput.includes('reflecteer') || lowerOutput.includes('terugkijk')) srlState = 'REFLECT';
  else if (lowerOutput.includes('aanpas') || lowerOutput.includes('anders')) srlState = 'ADJUST';
  
  return {
    process_phases: ['WORKING'],
    coregulation_bands: [knowledgeLevel, cognitiveLoad, precisionPhase],
    task_densities: [taskDensity],
    secondary_dimensions: [
      `V${hasQuestion ? 2 : 3}`, 
      `E${epistemicStatus === 'FEIT' ? 5 : epistemicStatus === 'SPECULATIE' ? 2 : 3}`,
      `T${sentenceCount > 10 ? 4 : sentenceCount > 5 ? 3 : 2}`,
      `S${parseInt(taskDensity.replace('TD', ''))}`,
      `L${hasList ? 3 : hasCode ? 4 : 2}`,
      `B${hasQuestion ? 3 : 2}`
    ],
    active_fix: isCommand ? input.split(' ')[0] : null,
    reasoning: `${knowledgeLevel} detected, ${cognitiveLoad} load, ${taskDensity} density`,
    current_profile: profile,
    task_density_balance: agencyScore - 0.5,
    epistemic_status: epistemicStatus,
    cognitive_mode: hasQuestion ? 'REFLECTIEF' : 'ANALYTISCH',
    srl_state: srlState,
    scaffolding: {
      agency_score: agencyScore,
      trend: agencyScore > 0.5 ? 'RISING' : agencyScore < 0.4 ? 'FALLING' : 'STABLE',
      advice: hasQuestion ? 'Beantwoord de vraag om verder te gaan.' : 
              cognitiveLoad === 'C4' ? 'Neem een pauze, veel informatie om te verwerken.' : null,
      history_window: [agencyScore - 0.1, agencyScore - 0.05, agencyScore],
    },
  };
}

export const clearSessionHistory = (sessionId: string): void => {
  sessionHistory.delete(sessionId);
};
