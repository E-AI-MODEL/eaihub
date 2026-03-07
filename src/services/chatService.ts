// Chat Service - Handles communication with EAI backend via Edge Function
// Uses Lovable AI Gateway with streaming support
// Version 15.0 - Uses authoritative SSOT v15.0.0 JSON with dynamic prompt
// Includes reliability pipeline: parse/repair, SSOT-healing, epistemic guard

import type { ChatRequest, ChatResponse, EAIAnalysis, MechanicalState, LearnerProfile, SessionContext } from '@/types';
import { toast } from '@/hooks/use-toast';
import { 
  getFixForBand, 
  getFlagsForBands, 
  getLearnerObsPatterns,
  getBand,
  getLogicGatesForBand,
  SSOT_DATA
} from '@/data/ssot';
import { generateSystemPrompt } from '@/utils/ssotHelpers';
import { 
  executePipeline, 
  pushTrace, 
  getTraceEvents,
  type TraceEvent 
} from '@/lib/reliabilityPipeline';
import { persistChatMessage } from '@/services/adminDbService';
import { getNodeById, CURRICULUM_PATHS } from '@/data/curriculum';
import { updateMastery } from '@/services/masteryService';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/eai-chat`;
const HISTORY_LIMIT = 10;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const sessionHistory: Map<string, ChatMessage[]> = new Map();

// ═══ SESSION CONTEXT TRACKER ═══
const sessionContexts: Map<string, SessionContext> = new Map();

export function getSessionContext(sessionId: string): SessionContext {
  if (!sessionContexts.has(sessionId)) {
    sessionContexts.set(sessionId, {
      topics_covered: [],
      fixes_applied: [],
      last_fix: null,
      turn_count: 0,
      current_topic: null,
      knowledge_trajectory: [],
    });
  }
  return sessionContexts.get(sessionId)!;
}

function updateSessionContext(sessionId: string, analysis: EAIAnalysis, profile: LearnerProfile) {
  const ctx = getSessionContext(sessionId);
  ctx.turn_count += 1;

  // Track knowledge trajectory
  const kBand = analysis.coregulation_bands?.find(b => b.startsWith('K')) || null;
  if (kBand && (ctx.knowledge_trajectory.length === 0 || ctx.knowledge_trajectory[ctx.knowledge_trajectory.length - 1] !== kBand)) {
    ctx.knowledge_trajectory.push(kBand);
  }

  // Track applied fixes
  if (analysis.active_fix && !ctx.fixes_applied.includes(analysis.active_fix)) {
    ctx.fixes_applied.push(analysis.active_fix);
  }
  ctx.last_fix = analysis.active_fix;

  // Track current topic from profile
  if (profile.currentNodeId && !ctx.topics_covered.includes(profile.currentNodeId)) {
    ctx.topics_covered.push(profile.currentNodeId);
  }
  ctx.current_topic = profile.currentNodeId || null;
}

// ═══ MASTERY STATE-MACHINE UPDATE ═══
// Veilige fase 1: INTRO → WORKING → CHECKING (geen auto-MASTERED)
// Returns progress percentage (0-100) for session sync
function triggerMasteryUpdate(profile: LearnerProfile, analysis: EAIAnalysis, sessionId: string, userId: string): number {
  if (!profile.currentNodeId || !profile.subject || !profile.level) return 0;

  const pathId = `${profile.subject}_${profile.level}`.toUpperCase().replace(/\s/g, '');
  const ctx = getSessionContext(sessionId);
  const turnCount = ctx.turn_count;

  // Determine status based on conversation depth and analysis signals
  let status: 'INTRO' | 'WORKING' | 'CHECKING' | 'MASTERED';
  if (analysis.mastery_check === true) {
    status = 'CHECKING';
  } else if (turnCount <= 1) {
    status = 'INTRO';
  } else {
    status = 'WORKING';
  }

  // Fire-and-forget mastery update
  updateMastery({
    userId,
    pathId,
    currentNodeId: profile.currentNodeId,
    status,
    evidence: {
      nodeId: profile.currentNodeId,
      evidence: analysis.reasoning,
      score: analysis.scaffolding?.agency_score ?? undefined,
    },
  }).catch(err => console.error('[Mastery] Update failed:', err));

  // Calculate progress: count nodes with CHECKING or MASTERED status from localStorage
  const path = CURRICULUM_PATHS.find(p => p.id === pathId);
  if (!path) return 0;
  
  const masteryKey = `eai_mastery_local_${userId}_${pathId}`;
  const stored = localStorage.getItem(masteryKey);
  if (!stored) return 0;
  
  try {
    const mastery = JSON.parse(stored);
    const completedNodes = new Set<string>();
    for (const entry of mastery.history || []) {
      if (entry.nodeId) completedNodes.add(entry.nodeId);
    }
    // Progress = unique nodes with evidence / total nodes in path
    return Math.round((completedNodes.size / path.nodes.length) * 100);
  } catch {
    return 0;
  }
}

// Cache learner observation patterns from SSOT v15 for all 10 dimensions
const kPatterns = getLearnerObsPatterns('K_KennisType');
const pPatterns = getLearnerObsPatterns('P_Procesfase');
const cPatterns = getLearnerObsPatterns('C_CoRegulatie');
const tdPatterns = getLearnerObsPatterns('TD_Taakdichtheid');
const vPatterns = getLearnerObsPatterns('V_Vaardigheidspotentieel');
const tPatterns = getLearnerObsPatterns('T_TechnologischeIntegratieVisibility');
const sPatterns = getLearnerObsPatterns('S_SocialeInteractie');
const lPatterns = getLearnerObsPatterns('L_LeercontinuiteitTransfer');
const bPatterns = getLearnerObsPatterns('B_BiasCorrectie');

// ═══ DIDACTISCH-GEDREVEN MODEL ROUTER ═══
type TaskType = 'chat' | 'deep' | 'image';

import type { RouterDecision } from '@/types';

function buildRouterDecision(message: string, sessionContext: SessionContext): RouterDecision {
  const lastK = sessionContext.knowledge_trajectory.length > 0
    ? sessionContext.knowledge_trajectory[sessionContext.knowledge_trajectory.length - 1]
    : null;

  // K3 metacognitie + voldoende conversatie-diepte → deep model
  if (lastK === 'K3' && sessionContext.turn_count > 3) {
    return {
      target_model: 'gemini-2.5-pro',
      thinking_budget: 8192,
      intent_category: 'SLOW',
      reasoning: `K3 metacognitie + turn_count=${sessionContext.turn_count} > 3 → deep model voor complexe redenering`,
    };
  }

  // Default: snelle flash voor standaard didactiek
  return {
    target_model: 'gemini-3-flash-preview',
    thinking_budget: 1024,
    intent_category: 'FAST',
    reasoning: `${lastK || 'K0'} kennistype, turn_count=${sessionContext.turn_count} → flash voor standaard didactiek`,
  };
}

function determineTaskType(message: string, sessionContext: SessionContext): TaskType {
  const decision = buildRouterDecision(message, sessionContext);
  return decision.intent_category === 'SLOW' ? 'deep' : 'chat';
}

// ═══ [BEELD:] TAG POST-PROCESSING ═══
// Scant AI-output op [BEELD: beschrijving] tags en vervangt ze door gegenereerde afbeeldingen
const BEELD_TAG_REGEX = /\[BEELD:\s*(.+?)\]/g;

function buildCurriculumContext(profile: LearnerProfile) {
  if (!profile.currentNodeId) return undefined;
  const node = getNodeById(profile.currentNodeId);
  if (!node) return undefined;
  return {
    title: node.title,
    description: node.description,
    didactic_focus: node.didactic_focus,
    mastery_criteria: node.mastery_criteria,
    common_misconceptions: node.common_misconceptions,
  };
}

async function processBeeldTags(
  text: string, 
  sessionId: string, 
  profile: LearnerProfile
): Promise<string> {
  const matches = [...text.matchAll(BEELD_TAG_REGEX)];
  if (matches.length === 0) return text;

  let result = text;
  for (const match of matches) {
    const fullTag = match[0];
    const beschrijving = match[1].trim();
    
    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          sessionId,
          userId: 'system',
          message: beschrijving,
          profile,
          taskType: 'image',
          curriculumContext: buildCurriculumContext(profile),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.imageUrl || '';
        if (imageUrl) {
          result = result.replace(fullTag, `![${beschrijving}](${imageUrl})`);
        } else {
          // No image generated, remove the tag cleanly
          result = result.replace(fullTag, '');
        }
      } else {
        console.warn('[ChatService] Image generation failed for tag:', beschrijving);
        result = result.replace(fullTag, '');
      }
    } catch (err) {
      console.error('[ChatService] Error processing [BEELD:] tag:', err);
      result = result.replace(fullTag, '');
    }
  }
  return result;
}

// Model names for mechanical state reporting
const MODEL_NAMES: Record<TaskType, string> = {
  chat: 'gemini-3-flash-preview',
  deep: 'gemini-2.5-pro',
  image: 'gemini-2.5-flash-image',
};

export const sendChat = async (request: ChatRequest): Promise<ChatResponse> => {
  const startTime = Date.now();
  let history = sessionHistory.get(request.sessionId) || [];
  
  // Log pipeline start
  pushTrace(request.sessionId, {
    severity: 'INFO',
    source: 'ENGINE',
    step: 'PROMPT_ASSEMBLY',
    message: 'Starting chat request',
    data: { messageLength: request.message.length, historyLength: history.length },
  });
  
  try {
    // Generate dynamic system prompt from SSOT
    const sessionCtx = getSessionContext(request.sessionId);
    const systemPrompt = generateSystemPrompt(request.profile, sessionCtx);
    
    // Determine model based on didactic conditions
    const routerDecision = buildRouterDecision(request.message, sessionCtx);
    const taskType = routerDecision.intent_category === 'SLOW' ? 'deep' as TaskType : 'chat' as TaskType;
    
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
        systemPrompt,
        history: history.map(m => ({ role: m.role, content: m.content })),
        taskType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      const errorMsg = errorData.error || `HTTP ${response.status}`;
      
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

    // ═══ IMAGE RESPONSE (non-streaming JSON) ═══
    if (taskType === 'image') {
      const data = await response.json();
      const fullText = data.text || 'Afbeelding kon niet worden gegenereerd.';
      const latencyMs = Date.now() - startTime;

      history = [
        ...history,
        { role: 'user' as const, content: request.message },
        { role: 'assistant' as const, content: fullText },
      ].slice(-HISTORY_LIMIT);
      sessionHistory.set(request.sessionId, history);

      const rawAnalysis = generateAnalysis(request.message, fullText, request.profile);
      const imageRouterDecision: RouterDecision = {
        target_model: MODEL_NAMES.image,
        thinking_budget: 0,
        intent_category: 'FAST',
        reasoning: 'Image generation via [BEELD:] tag',
      };
      const rawMechanical: MechanicalState = {
        latencyMs,
        inputTokens: request.message.length * 2,
        outputTokens: fullText.length,
        model: MODEL_NAMES.image,
        temperature: 0.8,
        timestamp: new Date().toISOString(),
        routerDecision: imageRouterDecision,
      };
      const pipelineResult = executePipeline(rawAnalysis, rawMechanical, request.sessionId);
      updateSessionContext(request.sessionId, pipelineResult.analysis, request.profile);

      persistChatMessage({ sessionId: request.sessionId, role: 'user', content: request.message });
      persistChatMessage({
        sessionId: request.sessionId, role: 'model', content: fullText,
        analysis: pipelineResult.analysis, mechanical: pipelineResult.mechanical,
      });

      return {
        sessionId: request.sessionId,
        text: fullText,
        analysis: pipelineResult.analysis,
        mechanical: pipelineResult.mechanical,
        auditId: `audit_${Date.now()}`,
      };
    }

    // ═══ STREAMING RESPONSE (chat / deep) ═══
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
          if (content) fullText += content;
        } catch {
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

    history = [
      ...history,
      { role: 'user' as const, content: request.message },
      { role: 'assistant' as const, content: fullText },
    ].slice(-HISTORY_LIMIT);
    sessionHistory.set(request.sessionId, history);

    // Generate initial analysis
    const rawAnalysis = generateAnalysis(request.message, fullText, request.profile);
    const rawMechanical: MechanicalState = {
      latencyMs,
      inputTokens: request.message.length * 2,
      outputTokens: fullText.length,
      model: MODEL_NAMES[taskType],
      temperature: taskType === 'deep' ? 0.5 : 0.7,
      timestamp: new Date().toISOString(),
      routerDecision,
    };

    const pipelineResult = executePipeline(rawAnalysis, rawMechanical, request.sessionId);
    updateSessionContext(request.sessionId, pipelineResult.analysis, request.profile);

    // Update mastery state based on analysis — returns progress for session sync
    const masteryProgress = triggerMasteryUpdate(request.profile, pipelineResult.analysis, request.sessionId, request.userId);

    // Persist messages to DB (fire-and-forget)

    // Persist messages to DB (fire-and-forget)
    persistChatMessage({ sessionId: request.sessionId, role: 'user', content: request.message });
    persistChatMessage({
      sessionId: request.sessionId,
      role: 'model',
      content: fullText,
      analysis: pipelineResult.analysis,
      mechanical: pipelineResult.mechanical,
    });

    // Post-process [BEELD:] tags in AI output
    const processedText = await processBeeldTags(fullText, request.sessionId, request.profile);

    return {
      sessionId: request.sessionId,
      text: processedText,
      analysis: pipelineResult.analysis,
      mechanical: pipelineResult.mechanical,
      auditId: `audit_${Date.now()}`,
    };

  } catch (error) {
    console.error('[ChatService] Error:', error);
    
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
    const sessionCtx = getSessionContext(request.sessionId);
    const systemPrompt = generateSystemPrompt(request.profile, sessionCtx);
    const streamRouterDecision = buildRouterDecision(request.message, sessionCtx);
    const taskType: TaskType = streamRouterDecision.intent_category === 'SLOW' ? 'deep' : 'chat';
    
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
        systemPrompt,
        history: history.map(m => ({ role: m.role, content: m.content })),
        taskType,
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
            onDelta(content);
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    history = [
      ...history,
      { role: 'user' as const, content: request.message },
      { role: 'assistant' as const, content: fullText },
    ].slice(-HISTORY_LIMIT);
    sessionHistory.set(request.sessionId, history);

    // Generate initial analysis and run pipeline
    const rawAnalysis = generateAnalysis(request.message, fullText, request.profile);
    const rawMechanical: MechanicalState = {
      latencyMs,
      inputTokens: request.message.length * 2,
      outputTokens: fullText.length,
      model: MODEL_NAMES[taskType],
      temperature: taskType === 'deep' ? 0.5 : 0.7,
      timestamp: new Date().toISOString(),
      routerDecision: streamRouterDecision,
    };
    
    // Execute reliability pipeline
    const pipelineResult = executePipeline(rawAnalysis, rawMechanical, request.sessionId);

    // Update mastery state based on analysis
    triggerMasteryUpdate(request.profile, pipelineResult.analysis, request.sessionId, request.userId);

    // Post-process [BEELD:] tags in AI output
    const processedText = await processBeeldTags(fullText, request.sessionId, request.profile);

    onDone({
      sessionId: request.sessionId,
      text: processedText,
      analysis: pipelineResult.analysis,
      mechanical: pipelineResult.mechanical,
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

// ============= SSOT-BASED DETECTION FUNCTIONS =============

/**
 * Detect knowledge type using SSOT K_KennisType patterns
 * K0 = Ongedefinieerd, K1 = Feitenkennis, K2 = Procedureel, K3 = Metacognitie
 */
function detectKnowledgeType(input: string): string {
  const lowerInput = input.toLowerCase();
  
  // Use SSOT patterns
  if (kPatterns.get('K3')?.test(lowerInput)) return 'K3'; // Metacognitie
  if (kPatterns.get('K2')?.test(lowerInput)) return 'K2'; // Procedureel
  if (kPatterns.get('K1')?.test(lowerInput)) return 'K1'; // Feitenkennis
  
  // Fallback patterns based on SSOT learner_obs
  if (/wanneer gebruik|welke aanpak|hoe bepaal|strategie/.test(lowerInput)) return 'K3';
  if (/hoe|stappen|procedure|methode|uitvoeren/.test(lowerInput)) return 'K2';
  if (/wat is|definitie|noem|betekent|eigenschappen/.test(lowerInput)) return 'K1';
  
  return 'K0'; // Ongedefinieerd
}

/**
 * Detect process phase using SSOT P_Procesfase patterns
 * P0-P5: Ongedefinieerd -> Oriëntatie -> Voorkennis -> Instructie -> Toepassing -> Evaluatie
 */
function detectProcessPhase(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  // Check output for AI behavior patterns
  if (pPatterns.get('P5')?.test(lowerOutput)) return 'P5'; // Evaluatie
  if (pPatterns.get('P4')?.test(lowerOutput)) return 'P4'; // Toepassing
  if (pPatterns.get('P3')?.test(lowerOutput)) return 'P3'; // Instructie
  if (pPatterns.get('P2')?.test(lowerOutput)) return 'P2'; // Voorkennis
  if (pPatterns.get('P1')?.test(lowerOutput)) return 'P1'; // Oriëntatie
  
  // Fallback
  if (/wat weet je al|voorkennis|noem 3/.test(lowerOutput)) return 'P1';
  if (/maak.*lijst|conceptmap|ordenen/.test(lowerOutput)) return 'P2';
  if (/uitleg|instructie|demonstr/.test(lowerOutput)) return 'P3';
  if (/pas toe|oefen|casus/.test(lowerOutput)) return 'P4';
  if (/evaluer|terugkijk|reflecteer/.test(lowerOutput)) return 'P5';
  
  return 'P0';
}

/**
 * Detect co-regulation level using SSOT C_CoRegulatie patterns
 * C0-C5: Ongedefinieerd -> AI-monoloog -> AI-geleid -> Gedeelde start -> Gedeelde regie -> Leerling-geankerd
 */
function detectCoRegulation(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  const hasQuestion = output.includes('?');
  const inputLength = input.length;
  
  // Check for learner initiative patterns
  if (cPatterns.get('C5')?.test(lowerInput)) return 'C5'; // Leerling stuurt volledig
  if (cPatterns.get('C4')?.test(lowerInput)) return 'C4'; // Leerling verantwoordt keuzes
  if (cPatterns.get('C3')?.test(lowerInput)) return 'C3'; // Leerling doet voorstel
  
  // Based on output patterns
  if (/advocaat van de duivel|randgeval|tegenwerping/.test(lowerOutput)) return 'C5';
  if (/waarom.*keuze|rationale|alternatief/.test(lowerOutput)) return 'C4';
  if (/proces.*check|bevestig.*initiatief/.test(lowerOutput)) return 'C3';
  if (/route a.*b|kies.*optie/.test(lowerOutput)) return 'C2';
  if (!hasQuestion && output.length > 500) return 'C1'; // AI monologue
  
  return 'C2'; // Default: AI-geleid
}

/**
 * Detect task density using SSOT TD_Taakdichtheid patterns
 * TD0-TD5: Ongedefinieerd -> Leerling-geleid -> Gedeeld -> Gestuurd -> AI-geleid -> AI-dominant
 */
function detectTaskDensity(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  // Check learner observations
  if (tdPatterns.get('TD1')?.test(lowerInput)) return 'TD1'; // Leerling leidt
  if (tdPatterns.get('TD5')?.test(lowerInput)) return 'TD5'; // Vraagt kant-en-klaar
  
  // Based on AI behavior
  const hintCount = (lowerOutput.match(/hint|tip|probeer|denk/g) || []).length;
  const hasQuestion = output.includes('?');
  const hasModelStep = /ik doe.*voor|demonstr|voorbeeld.*stap/.test(lowerOutput);
  
  if (hasModelStep) return 'TD4'; // AI modeling
  if (hintCount >= 4) return 'TD3'; // Gestuurd
  if (hintCount >= 2 && hasQuestion) return 'TD2'; // Gedeeld
  if (hasQuestion && hintCount === 0) return 'TD1'; // Leerling-geleid
  
  return 'TD2'; // Default: Gedeeld
}

/**
 * Detect skill potential using SSOT V_Vaardigheidspotentieel patterns
 * V0-V5: Ongedefinieerd -> Verkennen -> Verbinden -> Toepassen -> Herzien -> Creëren
 */
function detectSkillPotential(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  if (vPatterns.get('V5')?.test(lowerInput)) return 'V5'; // Creëren
  if (vPatterns.get('V4')?.test(lowerInput)) return 'V4'; // Herzien
  if (vPatterns.get('V3')?.test(lowerInput)) return 'V3'; // Toepassen
  if (vPatterns.get('V2')?.test(lowerInput)) return 'V2'; // Verbinden
  if (vPatterns.get('V1')?.test(lowerInput)) return 'V1'; // Verkennen
  
  // Fallback
  if (/creëer|ontwerp|eigen.*maak/.test(lowerInput)) return 'V5';
  if (/feedback|verbeter|revis/.test(lowerInput)) return 'V4';
  if (/pas toe|gebruik.*in|casus/.test(lowerInput)) return 'V3';
  if (/vergelijk|patroon|verband/.test(lowerInput)) return 'V2';
  if (/wat|welke|verken/.test(lowerInput)) return 'V1';
  
  return 'V0';
}

/**
 * Detect epistemic reliability using SSOT E_EpistemischeBetrouwbaarheid
 */
function detectEpistemicStatus(output: string): string {
  const lowerOutput = output.toLowerCase();
  
  if (/bewezen|wetenschappelijk|consensus|peer-reviewed/.test(lowerOutput)) return 'E5';
  if (/onderzoek.*toont|studies.*wijzen/.test(lowerOutput)) return 'E4';
  if (/interpretatie|perspectief|beargument/.test(lowerOutput)) return 'E3';
  if (/mening|ik denk|misschien|speculatie/.test(lowerOutput)) return 'E2';
  if (/onzeker|niet zeker|kan niet verifi/.test(lowerOutput)) return 'E1';
  
  return 'E0';
}

/**
 * Detect tool awareness using SSOT T_TechnologischeIntegratieVisibility patterns
 * T0-T5: Ongedefinieerd -> Onzichtbaar -> Verborgen -> Zichtbaar -> Actief -> Meta
 */
function detectToolAwareness(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  if (tPatterns.get('T5')?.test(lowerInput)) return 'T5'; // Meta-reflectie op AI
  if (tPatterns.get('T4')?.test(lowerInput)) return 'T4'; // Actief AI-gebruik
  if (tPatterns.get('T3')?.test(lowerInput)) return 'T3'; // Zichtbare tool
  if (tPatterns.get('T2')?.test(lowerInput)) return 'T2'; // Verborgen tool
  if (tPatterns.get('T1')?.test(lowerInput)) return 'T1'; // Onzichtbaar
  
  // Fallback based on explicit AI awareness
  if (/jij als ai|ai-tutor|hoe werkt de ai|prompt/.test(lowerInput)) return 'T5';
  if (/gebruik ai|met hulp van|tool|chatbot/.test(lowerInput)) return 'T4';
  if (/hulp|assistent|systeem/.test(lowerInput)) return 'T3';
  
  return 'T2'; // Default: verborgen
}

/**
 * Detect social interaction using SSOT S_SocialeInteractie patterns
 * S0-S5: Ongedefinieerd -> Solitair -> Parallel -> Coöperatief -> Collaboratief -> Collectief
 */
function detectSocialInteraction(input: string): string {
  const lowerInput = input.toLowerCase();
  
  if (sPatterns.get('S5')?.test(lowerInput)) return 'S5'; // Collectief leren
  if (sPatterns.get('S4')?.test(lowerInput)) return 'S4'; // Collaboratief
  if (sPatterns.get('S3')?.test(lowerInput)) return 'S3'; // Coöperatief
  if (sPatterns.get('S2')?.test(lowerInput)) return 'S2'; // Parallel
  if (sPatterns.get('S1')?.test(lowerInput)) return 'S1'; // Solitair
  
  // Fallback
  if (/wij|samen|team|groep|klas/.test(lowerInput)) return 'S4';
  if (/anderen|klasgenoot|peer/.test(lowerInput)) return 'S3';
  if (/ik alleen|zelfstandig|individueel/.test(lowerInput)) return 'S1';
  
  return 'S1'; // Default: solitair (1-op-1 met AI)
}

/**
 * Detect learning continuity using SSOT L_LeercontinuiteitTransfer patterns
 * L0-L5: Ongedefinieerd -> Geïsoleerd -> Verbonden -> Contextueel -> Transferabel -> Duurzaam
 */
function detectLearningContinuity(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  if (lPatterns.get('L5')?.test(lowerInput)) return 'L5'; // Duurzaam
  if (lPatterns.get('L4')?.test(lowerInput)) return 'L4'; // Transferabel
  if (lPatterns.get('L3')?.test(lowerInput)) return 'L3'; // Contextueel
  if (lPatterns.get('L2')?.test(lowerInput)) return 'L2'; // Verbonden
  if (lPatterns.get('L1')?.test(lowerInput)) return 'L1'; // Geïsoleerd
  
  // Fallback
  if (/toekoms|blijvend|lange termijn|portfolio/.test(lowerInput)) return 'L5';
  if (/andere context|transfer|toepas elders/.test(lowerInput)) return 'L4';
  if (/verband met|link naar|relatie/.test(lowerInput)) return 'L3';
  if (/vorige les|eerder|voortbouwend/.test(lowerInput)) return 'L2';
  
  return 'L1'; // Default: geïsoleerd
}

/**
 * Detect bias correction using SSOT B_BiasCorrectie patterns
 * B0-B5: Ongedefinieerd -> Onbewust -> Herkenning -> Analyse -> Correctie -> Meta
 */
function detectBiasCorrection(input: string, output: string): string {
  const lowerInput = input.toLowerCase();
  const lowerOutput = output.toLowerCase();
  
  if (bPatterns.get('B5')?.test(lowerInput)) return 'B5'; // Meta-bias awareness
  if (bPatterns.get('B4')?.test(lowerInput)) return 'B4'; // Actieve correctie
  if (bPatterns.get('B3')?.test(lowerInput)) return 'B3'; // Analyse
  if (bPatterns.get('B2')?.test(lowerInput)) return 'B2'; // Herkenning
  if (bPatterns.get('B1')?.test(lowerInput)) return 'B1'; // Onbewust
  
  // Fallback based on critical thinking patterns
  if (/systeem.*bias|structurel|machts/.test(lowerInput)) return 'B5';
  if (/corrigeer|pas aan|inclusiever/.test(lowerInput)) return 'B4';
  if (/waarom.*perspectief|ontbreekt|eenzijdig/.test(lowerInput)) return 'B3';
  if (/bias|vooroordeel|aanname/.test(lowerInput)) return 'B2';
  
  return 'B1'; // Default: onbewust
}

/**
 * Detect SRL state based on SSOT srl_model
 */
function detectSRLState(input: string, output: string): 'PLAN' | 'MONITOR' | 'REFLECT' | 'ADJUST' {
  const combined = (input + ' ' + output).toLowerCase();
  
  if (/plan|doel|eerst|begin|strategie/.test(combined)) return 'PLAN';
  if (/check|voortgang|hoe gaat|monitor/.test(combined)) return 'MONITOR';
  if (/reflecteer|terugkijk|evalueer|wat heb/.test(combined)) return 'REFLECT';
  if (/aanpas|anders|wijzig|verbeter/.test(combined)) return 'ADJUST';
  
  return 'MONITOR'; // Default
}

/**
 * Check logic gates and determine enforced constraints
 */
function checkLogicGates(knowledgeType: string): { maxTD: string | null; enforcement: string | null } {
  const gates = getLogicGatesForBand(knowledgeType);
  
  for (const gate of gates) {
    if (gate.priority === 'CRITICAL') {
      // Parse enforcement for TD constraints
      const tdMatch = gate.enforcement.match(/MAX_TD\s*=\s*(TD\d)/);
      if (tdMatch) {
        return { 
          maxTD: tdMatch[1], 
          enforcement: gate.enforcement 
        };
      }
    }
  }
  
  return { maxTD: null, enforcement: null };
}

// ============= MAIN ANALYSIS FUNCTION =============

function generateAnalysis(input: string, output: string, profile: LearnerProfile): EAIAnalysis {
  const isCommand = input.startsWith('/');
  
  // Detect all dimensions using SSOT patterns
  const knowledgeType = detectKnowledgeType(input);
  const processPhase = detectProcessPhase(input, output);
  const coRegulation = detectCoRegulation(input, output);
  let taskDensity = detectTaskDensity(input, output);
  const skillPotential = detectSkillPotential(input, output);
  const epistemicBand = detectEpistemicStatus(output);
  
  // Check logic gates and enforce constraints
  const { maxTD, enforcement } = checkLogicGates(knowledgeType);
  if (maxTD && parseInt(taskDensity.replace('TD', '')) > parseInt(maxTD.replace('TD', ''))) {
    taskDensity = maxTD; // Enforce logic gate constraint
  }
  
  // Calculate agency score from TD level
  const tdLevel = parseInt(taskDensity.replace('TD', ''));
  const agencyScore = tdLevel === 1 ? 0.85 : 
                      tdLevel === 2 ? 0.65 : 
                      tdLevel === 3 ? 0.5 : 
                      tdLevel === 4 ? 0.35 : 0.15;
  
  // Detect SRL state
  const srlState = detectSRLState(input, output);
  
  // Get epistemic status for type
  const epistemicLevel = parseInt(epistemicBand.replace('E', ''));
  const epistemicStatus: 'FEIT' | 'INTERPRETATIE' | 'SPECULATIE' | 'ONBEKEND' = 
    epistemicLevel >= 4 ? 'FEIT' : 
    epistemicLevel === 3 ? 'INTERPRETATIE' : 
    epistemicLevel === 2 ? 'SPECULATIE' : 'ONBEKEND';
  // Detect remaining 4 dimensions (T, S, L, B)
  const toolAwareness = detectToolAwareness(input, output);
  const socialInteraction = detectSocialInteraction(input);
  const learningContinuity = detectLearningContinuity(input, output);
  const biasCorrection = detectBiasCorrection(input, output);
  
  // Collect all 10 detected bands
  const allBands = [
    knowledgeType,
    processPhase, 
    coRegulation,
    taskDensity,
    skillPotential,
    epistemicBand,
    toolAwareness,
    socialInteraction,
    learningContinuity,
    biasCorrection
  ];
  
  // Get flags from SSOT
  const activeFlags = getFlagsForBands(allBands);
  
  // Determine active fix
  let activeFix: string | null = null;
  if (isCommand) {
    activeFix = input.split(' ')[0];
  } else {
    // Get fix based on most relevant dimension
    activeFix = getFixForBand(knowledgeType) || getFixForBand(coRegulation) || getFixForBand(taskDensity);
  }
  
  // Get cognitive mode
  const hasQuestion = output.includes('?');
  const cognitiveMode = hasQuestion ? 'REFLECTIEF' : 
                        knowledgeType === 'K3' ? 'SYSTEMISCH' : 'ANALYTISCH';
  
  return {
    process_phases: [processPhase],
    coregulation_bands: [knowledgeType, coRegulation, processPhase],
    task_densities: [taskDensity],
    // Include all secondary dimensions for full 10D coverage
    secondary_dimensions: [skillPotential, epistemicBand, toolAwareness, socialInteraction, learningContinuity, biasCorrection],
    active_fix: activeFix,
    active_flags: activeFlags,
    reasoning: `SSOT v15: ${knowledgeType} (${getBand(knowledgeType)?.label || 'n/a'}), ${coRegulation} co-reg, ${taskDensity} density. ${enforcement ? `Gate: ${enforcement}` : ''}`,
    current_profile: profile,
    task_density_balance: agencyScore - 0.5,
    epistemic_status: epistemicStatus,
    cognitive_mode: cognitiveMode as any,
    srl_state: srlState,
    scaffolding: {
      agency_score: agencyScore,
      trend: agencyScore > 0.5 ? 'RISING' : agencyScore < 0.4 ? 'FALLING' : 'STABLE',
      advice: hasQuestion ? 'Beantwoord de vraag om verder te gaan.' : 
              tdLevel >= 4 ? 'Neem de regie terug - te veel AI-dominantie.' : null,
      history_window: [agencyScore - 0.1, agencyScore - 0.05, agencyScore],
    },
  };
}

export const clearSessionHistory = (sessionId: string): void => {
  sessionHistory.delete(sessionId);
};

// Re-export trace functions for UI access
export { getTraceEvents, pushTrace, downloadTraceJSON, clearTrace } from '@/lib/reliabilityPipeline';
export type { TraceEvent, TraceSeverity, TraceSource, PipelineStep } from '@/lib/reliabilityPipeline';
