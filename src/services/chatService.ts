// Chat Service - Handles communication with EAI backend
// Currently uses mock responses; ready for Edge Function integration

import type { ChatRequest, ChatResponse, EAIAnalysis, MechanicalState, LearnerProfile } from '@/types';

// Mock response generator for development
const generateMockResponse = (message: string, profile: LearnerProfile): { text: string; analysis: EAIAnalysis; mechanical: MechanicalState } => {
  const isCommand = message.startsWith('/');
  const command = isCommand ? message.split(' ')[0] : null;

  // Command responses
  const commandResponses: Record<string, string> = {
    '/help': `**Beschikbare commando's:**

| Commando | Functie |
|----------|---------|
| \`/checkin\` | Start een check-in gesprek |
| \`/meta\` | Activeer meta-reflectie |
| \`/devil\` | Devil's advocate modus |
| \`/twist\` | Voeg een onverwachte wending toe |
| \`/hint_soft\` | Krijg een subtiele hint |
| \`/hint_hard\` | Krijg een directe hint |
| \`/scaffold_up\` | Meer ondersteuning |
| \`/scaffold_down\` | Minder ondersteuning |
| \`/summarize\` | Samenvatting van het gesprek |`,

    '/checkin': `Hé ${profile.name || 'daar'}! 👋

Laten we even checken hoe het gaat met **${profile.subject || 'je studie'}**.

1. **Energie-level:** Hoe voel je je nu? (1-5)
2. **Focus:** Waar wil je vandaag aan werken?
3. **Blokkades:** Loop je ergens tegenaan?

*Neem je tijd om te antwoorden.*`,

    '/meta': `🔮 **Meta-Reflectie Modus**

Laten we even uit de inhoud stappen en naar het *proces* kijken.

- Hoe pak je dit probleem tot nu toe aan?
- Welke strategie gebruik je?
- Werkt die strategie? Waarom wel/niet?

*Dit is geen toets - het gaat om inzicht in je eigen leerproces.*`,

    '/devil': `😈 **Devil's Advocate Modus Geactiveerd**

Oké, ik ga nu kritisch zijn. Niet gemeen, maar scherp.

Jouw laatste bewering... waarom zou die NIET kloppen? Wat zou iemand die het oneens is met je zeggen?

*Overtuig me.*`,

    '/twist': `🌀 **Plot Twist!**

Stel dat alles wat je tot nu toe hebt aangenomen... verkeerd is. 

Wat als we het probleem vanuit een compleet andere hoek bekijken? Denk aan:
- Het tegenovergestelde perspectief
- Een andere context
- Een extreme versie van het probleem

*Waar leidt dat je?*`,
  };

  let responseText = commandResponses[command || ''];
  
  if (!responseText) {
    // Generate contextual response based on input
    const lowercaseMsg = message.toLowerCase();
    
    if (lowercaseMsg.includes('snap') || lowercaseMsg.includes('begrijp') || lowercaseMsg.includes('uitleg')) {
      responseText = `Interessant dat je daar mee worstelt. Laten we dit stap voor stap bekijken.

**Wat weet je al?** Voordat ik uitleg geef, wil ik weten wat je zelf al hebt begrepen. Dat helpt me om precies aan te sluiten bij jouw niveau.

Kun je in je eigen woorden vertellen wat je *wel* begrijpt van dit onderwerp?

---
*TIP: Het hoeft niet perfect te zijn. Door hardop na te denken leer je beter.*`;
    } else if (lowercaseMsg.includes('help') || lowercaseMsg.includes('hulp')) {
      responseText = `Ik ben er om te helpen! 🙌

Maar ik ga je niet zomaar het antwoord geven - dat helpt je niet echt leren. In plaats daarvan ga ik:

1. **Vragen stellen** om te begrijpen waar je vastloopt
2. **Hints geven** die je in de goede richting sturen
3. **Je uitdagen** om zelf na te denken

Wat is precies het probleem waar je tegenaan loopt?`;
    } else {
      responseText = `Bedankt voor je vraag over "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}".

Voordat ik antwoord geef, wil ik je uitdagen om eerst zelf na te denken:

**Wat denk jij dat het antwoord zou kunnen zijn?**

Even speculeren is oké - het gaat om het denkproces, niet om het "goede" antwoord. Door eerst zelf te proberen, onthoud je het beter.

*Probeer het maar!*`;
    }
  }

  const analysis: EAIAnalysis = {
    process_phases: ['ORIËNTATIE'],
    coregulation_bands: ['K2', 'C2', 'P3'],
    task_densities: ['TD3'],
    secondary_dimensions: ['V2', 'E3', 'T2', 'S3', 'L2', 'B3'],
    active_fix: isCommand ? command : null,
    reasoning: `Responded to ${isCommand ? 'command' : 'query'}: ${message.substring(0, 30)}...`,
    current_profile: profile,
    task_density_balance: 0.1,
    epistemic_status: 'INTERPRETATIE',
    cognitive_mode: 'REFLECTIEF',
    srl_state: 'MONITOR',
    scaffolding: {
      agency_score: 0.55,
      trend: 'STABLE',
      advice: 'Blijf vragen stellen om het begrip te verdiepen.',
      history_window: [0.5, 0.52, 0.55],
    },
  };

  const mechanical: MechanicalState = {
    latencyMs: Math.floor(Math.random() * 500) + 200,
    inputTokens: message.length * 2,
    outputTokens: responseText.length,
    model: 'mock-gemini-flash',
    temperature: 0.7,
    timestamp: new Date().toISOString(),
  };

  return { text: responseText, analysis, mechanical };
};

export const sendChat = async (request: ChatRequest): Promise<ChatResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  const { text, analysis, mechanical } = generateMockResponse(request.message, request.profile);

  return {
    sessionId: request.sessionId,
    text,
    analysis,
    mechanical,
    auditId: `audit_${Date.now()}`,
  };
};

export const sendNudge = async (
  sessionId: string,
  level: number,
  profile: LearnerProfile
): Promise<{ text: string }> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const nudges = [
    "Waar loop je vast? Beschrijf het zo specifiek mogelijk.",
    "Wat is het laatste dat je wel begreep?",
    "Probeer je vraag in je eigen woorden te formuleren.",
  ];

  return { text: nudges[level % nudges.length] };
};
