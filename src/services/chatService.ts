// Chat Service - Handles communication with EAI backend via Edge Function
// Uses Lovable AI Gateway with streaming support

import type { ChatRequest, ChatResponse, EAIAnalysis, MechanicalState, LearnerProfile } from '@/types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eai-chat`;

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

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
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

    // Update session history
    history = [
      ...history,
      { role: 'user' as const, content: request.message },
      { role: 'assistant' as const, content: fullText },
    ].slice(-20); // Keep last 20 messages
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

    // Update history
    history = [
      ...history,
      { role: 'user' as const, content: request.message },
      { role: 'assistant' as const, content: fullText },
    ].slice(-20);
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

// Generate EAI analysis from response
function generateAnalysis(input: string, output: string, profile: LearnerProfile): EAIAnalysis {
  const isCommand = input.startsWith('/');
  const hasQuestion = output.includes('?');
  
  // Determine scaffolding level based on response characteristics
  const scaffoldingLevel = hasQuestion ? 0.6 : 0.4;
  
  return {
    process_phases: ['WORKING'],
    coregulation_bands: ['K2', 'C2', 'P3'],
    task_densities: hasQuestion ? ['TD3'] : ['TD2'],
    secondary_dimensions: ['V2', 'E3', 'T2', 'S3', 'L2', 'B3'],
    active_fix: isCommand ? input.split(' ')[0] : null,
    reasoning: `Processed ${isCommand ? 'command' : 'query'}, generated ${output.length} chars`,
    current_profile: profile,
    task_density_balance: scaffoldingLevel - 0.5,
    epistemic_status: 'INTERPRETATIE',
    cognitive_mode: 'REFLECTIEF',
    srl_state: 'MONITOR',
    scaffolding: {
      agency_score: scaffoldingLevel,
      trend: 'STABLE',
      advice: hasQuestion ? 'Beantwoord de vraag om verder te gaan.' : null,
      history_window: [0.5, 0.55, scaffoldingLevel],
    },
  };
}

export const clearSessionHistory = (sessionId: string): void => {
  sessionHistory.delete(sessionId);
};
