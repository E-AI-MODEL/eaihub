// SSOT Data - Single Source of Truth for EAI Didactic Engine
// This contains the 10D Matrix rubrics, commands, and logic gates
// Version 15.1 - Complete metadata for all rubrics

export interface RubricBand {
  band_id: string;
  label: string;
  description: string;
  fix?: string;
  learner_obs?: string[];
  ai_obs?: string[];
  flag?: string;
  didactic_principle?: string;
  mechanistic?: {
    timescale: string;
    fast: number;
    mid: number;
    slow: number;
  };
}

export interface Rubric {
  rubric_id: string;
  name: string;
  bands: RubricBand[];
}

export interface LogicGate {
  trigger_band: string;
  condition: string;
  enforcement: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export const SSOT_DATA = {
  version: "15.1",
  metadata: {
    system: "EAI Studio",
    cycle: {
      order: ["K", "P", "C", "TD", "V", "E", "T", "S", "L", "B"]
    }
  },
  
  command_library: {
    commands: {
      "/checkin": "Start een check-in met de leerling over hun huidige staat",
      "/meta": "Activeer meta-cognitieve reflectie over het leerproces",
      "/devil": "Devil's advocate modus - daag aannames uit",
      "/twist": "Voeg een onverwachte wending toe aan het probleem",
      "/vocab": "Focus op vakspecifieke terminologie",
      "/beeld": "Gebruik visuele analogieën en voorbeelden",
      "/quizgen": "Genereer een korte quiz over het onderwerp",
      "/fase_check": "Controleer de huidige fase van het leerproces",
      "/proces_eval": "Evalueer het leerproces tot nu toe",
      "/beurtvraag": "Stel een gerichte vraag voor de volgende beurt",
      "/scaffold_up": "Verhoog het ondersteuningsniveau",
      "/scaffold_down": "Verlaag het ondersteuningsniveau",
      "/srl_plan": "Help met planningsfase",
      "/srl_monitor": "Help met monitoring van voortgang",
      "/srl_reflect": "Stimuleer reflectie op het leerproces",
      "/hint_soft": "Geef een subtiele hint",
      "/hint_hard": "Geef een directere hint",
      "/clarify": "Vraag om verduidelijking",
      "/elaborate": "Vraag om uitwerking",
      "/connect": "Maak verbindingen met eerder geleerde concepten",
      "/apply": "Vraag om toepassing van kennis",
      "/analyze": "Vraag om analyse",
      "/evaluate": "Vraag om evaluatie",
      "/create": "Vraag om creatieve toepassing",
      "/summarize": "Vraag om samenvatting",
      "/compare": "Vraag om vergelijking",
      "/contrast": "Vraag om contrast",
      "/predict": "Vraag om voorspelling",
      "/justify": "Vraag om onderbouwing",
      "/hypothesize": "Vraag om hypothese",
      "/test": "Test begrip met een vraag",
      "/transfer": "Vraag om transfer naar nieuwe context",
      "/self_explain": "Vraag om zelf-uitleg",
      "/debug": "Help bij het debuggen van misconcepties",
      "/anchor": "Veranker aan voorkennis",
      "/chunk": "Breek informatie op in kleinere delen",
      "/sequence": "Help met sequentieel begrip",
      "/pattern": "Help patronen herkennen",
      "/abstract": "Help met abstractie",
      "/concrete": "Maak abstract concreet"
    }
  },

  rubrics: [
    // K - Knowledge Level
    {
      rubric_id: "knowledge",
      name: "Knowledge Level",
      bands: [
        { 
          band_id: "K1", 
          label: "Feitelijk", 
          description: "Basale feitenkennis, direct ophaalbaar", 
          fix: "/anchor", 
          learner_obs: ["Vraagt naar feiten", "Noemt definities", "Wat is...", "Wat betekent..."], 
          flag: "FACT_RETRIEVAL",
          didactic_principle: "Activeer bestaande feitenkennis"
        },
        { 
          band_id: "K2", 
          label: "Conceptueel", 
          description: "Begrip van relaties en structuren", 
          fix: "/connect", 
          learner_obs: ["Legt verbanden", "Vergelijkt concepten", "Waarom...", "Verband tussen..."], 
          flag: "CONCEPTUAL",
          didactic_principle: "Bouw conceptuele schema's"
        },
        { 
          band_id: "K3", 
          label: "Procedureel", 
          description: "Kennis van methoden en procedures", 
          fix: "/sequence", 
          learner_obs: ["Beschrijft stappen", "Past procedures toe", "Hoe moet ik...", "Welke stappen..."], 
          flag: "PROCEDURAL",
          didactic_principle: "Modelleer procedures stapsgewijs"
        }
      ]
    },
    // P - Precision (Learning Phase)
    {
      rubric_id: "precision",
      name: "Precision",
      bands: [
        { 
          band_id: "P1", 
          label: "Oriëntatie", 
          description: "Leerling oriënteert zich op het probleem", 
          fix: "/checkin",
          learner_obs: ["Verkent het onderwerp", "Vraagt wat er gevraagd wordt"],
          ai_obs: ["Activeert voorkennis", "Stelt oriënterende vragen"],
          didactic_principle: "Activeer voorkennis",
          flag: "ORIENTATION"
        },
        { 
          band_id: "P2", 
          label: "Exploratie", 
          description: "Leerling verkent mogelijke aanpakken", 
          fix: "/elaborate",
          learner_obs: ["Probeert verschillende aanpakken", "Vraagt om opties"],
          ai_obs: ["Biedt keuzes aan", "Stimuleert exploratie"],
          didactic_principle: "Bied keuzes aan",
          flag: "EXPLORATION"
        },
        { 
          band_id: "P3", 
          label: "Instructie", 
          description: "Gerichte instructie nodig", 
          fix: "/hint_hard",
          learner_obs: ["Vraagt om uitleg", "Zit vast"],
          ai_obs: ["Geeft directe instructie", "Modelleert oplossing"],
          didactic_principle: "Directe instructie",
          flag: "INSTRUCTION"
        },
        { 
          band_id: "P4", 
          label: "Integratie", 
          description: "Leerling integreert nieuwe kennis", 
          fix: "/connect",
          learner_obs: ["Maakt verbindingen", "Vat samen"],
          ai_obs: ["Verbindt met bestaande kennis", "Consolideert"],
          didactic_principle: "Verbind met bestaande kennis",
          flag: "INTEGRATION"
        },
        { 
          band_id: "P5", 
          label: "Verdieping", 
          description: "Leerling verdiept en transfereert", 
          fix: "/transfer",
          learner_obs: ["Past toe in nieuwe context", "Zoekt uitdaging"],
          ai_obs: ["Daagt uit met complexiteit", "Stimuleert transfer"],
          didactic_principle: "Daag uit met complexiteit",
          flag: "DEEPENING"
        }
      ]
    },
    // C - Cognitive Load
    {
      rubric_id: "cognitive_load",
      name: "Cognitive Load",
      bands: [
        { 
          band_id: "C1", 
          label: "Minimaal", 
          description: "Lage cognitieve belasting", 
          learner_obs: ["Snelle antwoorden", "Lijkt moeiteloos"],
          ai_obs: ["Korte responses", "Directe vragen"],
          flag: "LOW_LOAD",
          mechanistic: { timescale: "immediate", fast: 0.9, mid: 0.1, slow: 0.0 } 
        },
        { 
          band_id: "C2", 
          label: "Optimaal", 
          description: "Optimale zone voor leren", 
          learner_obs: ["Denkt na", "Maakt verbindingen"],
          ai_obs: ["Gebalanceerde uitleg", "Scaffolded vragen"],
          flag: "OPTIMAL_LOAD",
          mechanistic: { timescale: "working", fast: 0.6, mid: 0.3, slow: 0.1 } 
        },
        { 
          band_id: "C3", 
          label: "Verhoogd", 
          description: "Verhoogde belasting, monitor nodig", 
          fix: "/hint_soft",
          learner_obs: ["Aarzelt", "Vraagt om verduidelijking"],
          ai_obs: ["Monitort begrip", "Biedt ondersteuning"],
          flag: "ELEVATED_LOAD",
          mechanistic: { timescale: "extended", fast: 0.3, mid: 0.5, slow: 0.2 } 
        },
        { 
          band_id: "C4", 
          label: "Overbelast", 
          description: "Cognitieve overbelasting", 
          fix: "/chunk", 
          learner_obs: ["Geeft op", "Maakt fouten", "Raakt gefrustreerd"],
          ai_obs: ["Breekt op in stukken", "Verlaagt tempo"],
          flag: "OVERLOAD",
          mechanistic: { timescale: "recovery", fast: 0.1, mid: 0.3, slow: 0.6 } 
        }
      ]
    },
    // TD - Task Density (Agency)
    {
      rubric_id: "task_density",
      name: "Task Density (Agency)",
      bands: [
        { 
          band_id: "TD1", 
          label: "Maximale Ondersteuning", 
          description: "Docent-geleid, directe instructie", 
          fix: "/scaffold_up",
          learner_obs: ["Wacht op instructie", "Volgt stap voor stap"],
          ai_obs: ["Geeft stapsgewijze uitleg", "Leidt het gesprek"],
          flag: "MAX_SUPPORT"
        },
        { 
          band_id: "TD2", 
          label: "Hoge Ondersteuning", 
          description: "Veel scaffolding, gerichte vragen", 
          fix: "/hint_hard",
          learner_obs: ["Heeft hints nodig", "Probeert met hulp"],
          ai_obs: ["Stelt gerichte vragen", "Biedt hints aan"],
          flag: "HIGH_SUPPORT"
        },
        { 
          band_id: "TD3", 
          label: "Gebalanceerd", 
          description: "Evenwicht tussen sturing en autonomie", 
          fix: "/hint_soft",
          learner_obs: ["Denkt mee", "Stelt vragen"],
          ai_obs: ["Vraagt om uitleg", "Bevestigt begrip"],
          flag: "BALANCED"
        },
        { 
          band_id: "TD4", 
          label: "Lage Ondersteuning", 
          description: "Leerling neemt initiatief", 
          fix: "/elaborate",
          learner_obs: ["Neemt initiatief", "Stelt eigen vragen"],
          ai_obs: ["Stelt open vragen", "Daagt uit"],
          flag: "LOW_SUPPORT"
        },
        { 
          band_id: "TD5", 
          label: "Minimale Ondersteuning", 
          description: "Volledige leerling-autonomie", 
          fix: "/scaffold_down",
          learner_obs: ["Werkt zelfstandig", "Lost zelf op"],
          ai_obs: ["Observeert", "Valideert alleen"],
          flag: "MIN_SUPPORT"
        }
      ]
    },
    // V - Verification Status
    {
      rubric_id: "verification",
      name: "Verification Status",
      bands: [
        { 
          band_id: "V1", 
          label: "Niet Geverifieerd", 
          description: "Claim zonder verificatie",
          fix: "/clarify",
          learner_obs: ["Claimt zonder onderbouwing", "Zegt iets zonder bewijs"],
          flag: "UNVERIFIED"
        },
        { 
          band_id: "V2", 
          label: "Zelf-gerapporteerd", 
          description: "Leerling claimt begrip",
          fix: "/test",
          learner_obs: ["Zegt 'ik snap het'", "Claimt begrip", "Ik denk dat ik het begrijp"],
          flag: "SELF_REPORTED"
        },
        { 
          band_id: "V3", 
          label: "Getest", 
          description: "Begrip getest met vragen",
          fix: "/elaborate",
          learner_obs: ["Beantwoordt testvraag correct", "Legt uit na vraag"],
          ai_obs: ["Stelt controlevragen", "Verifieert begrip"],
          flag: "TESTED"
        },
        { 
          band_id: "V4", 
          label: "Toegepast", 
          description: "Begrip gedemonstreerd in toepassing",
          fix: "/transfer",
          learner_obs: ["Past toe in voorbeeld", "Lost vergelijkbaar probleem op"],
          ai_obs: ["Vraagt om toepassing", "Geeft oefenproblemen"],
          flag: "APPLIED"
        },
        { 
          band_id: "V5", 
          label: "Getransfereerd", 
          description: "Begrip in nieuwe context",
          learner_obs: ["Past toe in nieuwe context", "Maakt eigen voorbeelden"],
          ai_obs: ["Observeert transfer", "Bevestigt diepe beheersing"],
          flag: "TRANSFERRED"
        }
      ]
    },
    // E - Epistemic Status
    {
      rubric_id: "epistemic",
      name: "Epistemic Status",
      bands: [
        { 
          band_id: "E1", 
          label: "Onbekend", 
          description: "Epistemische status onduidelijk",
          fix: "/clarify",
          learner_obs: ["Onduidelijke claim", "Geen bronvermelding"],
          flag: "EPISTEMIC_UNKNOWN"
        },
        { 
          band_id: "E2", 
          label: "Mening", 
          description: "Persoonlijke opvatting",
          fix: "/justify",
          learner_obs: ["Geeft mening", "Ik vind dat...", "Volgens mij..."],
          flag: "OPINION"
        },
        { 
          band_id: "E3", 
          label: "Interpretatie", 
          description: "Beargumenteerde interpretatie",
          fix: "/elaborate",
          learner_obs: ["Beargumenteert", "Maakt interpretatie"],
          flag: "INTERPRETATION"
        },
        { 
          band_id: "E4", 
          label: "Consensus", 
          description: "Wetenschappelijke consensus",
          learner_obs: ["Refereert aan bronnen", "Noemt consensus"],
          ai_obs: ["Bevestigt consensus", "Geeft bronnen"],
          flag: "SCIENTIFIC_CONSENSUS"
        },
        { 
          band_id: "E5", 
          label: "Feit", 
          description: "Geverifieerd feit",
          learner_obs: ["Noemt bewezen feit", "Refereert aan bewijs"],
          ai_obs: ["Citeert bron", "Bevestigt feit"],
          flag: "VERIFIED_FACT"
        }
      ]
    },
    // T - Time Factor
    {
      rubric_id: "time",
      name: "Time Factor",
      bands: [
        { 
          band_id: "T1", 
          label: "Onmiddellijk", 
          description: "Directe respons verwacht",
          didactic_principle: "Quick recall",
          learner_obs: ["Antwoordt direct", "Geen bedenktijd nodig"],
          flag: "IMMEDIATE",
          mechanistic: { timescale: "immediate", fast: 1.0, mid: 0.0, slow: 0.0 }
        },
        { 
          band_id: "T2", 
          label: "Kort", 
          description: "Korte bedenktijd",
          didactic_principle: "Short processing",
          learner_obs: ["Denkt even na", "Korte pauze"],
          flag: "SHORT",
          mechanistic: { timescale: "short", fast: 0.7, mid: 0.3, slow: 0.0 }
        },
        { 
          band_id: "T3", 
          label: "Medium", 
          description: "Normale verwerking",
          didactic_principle: "Working memory",
          learner_obs: ["Neemt tijd om te denken", "Werkt stapsgewijs"],
          flag: "MEDIUM",
          mechanistic: { timescale: "working", fast: 0.4, mid: 0.5, slow: 0.1 }
        },
        { 
          band_id: "T4", 
          label: "Lang", 
          description: "Uitgebreide verwerking",
          didactic_principle: "Deep processing",
          learner_obs: ["Lange responstijd", "Complexe redenering"],
          flag: "LONG",
          mechanistic: { timescale: "extended", fast: 0.2, mid: 0.4, slow: 0.4 }
        },
        { 
          band_id: "T5", 
          label: "Reflectief", 
          description: "Diepe reflectie nodig",
          fix: "/meta",
          didactic_principle: "Metacognitive",
          learner_obs: ["Reflecteert", "Overdenkt proces"],
          flag: "REFLECTIVE",
          mechanistic: { timescale: "reflective", fast: 0.1, mid: 0.3, slow: 0.6 }
        }
      ]
    },
    // S - Scaffolding Level
    {
      rubric_id: "scaffolding",
      name: "Scaffolding Level",
      bands: [
        { 
          band_id: "S1", 
          label: "Vol", 
          description: "Maximale ondersteuning",
          fix: "/scaffold_up",
          ai_obs: ["Geeft volledige uitleg", "Modelleert complete oplossing"],
          learner_obs: ["Volgt instructie", "Kopieert voorbeeld"],
          flag: "FULL_SCAFFOLD"
        },
        { 
          band_id: "S2", 
          label: "Hoog", 
          description: "Veel ondersteuning",
          fix: "/hint_hard",
          ai_obs: ["Geeft directe hints", "Structureert probleem"],
          learner_obs: ["Heeft duidelijke hints nodig", "Vraagt om hulp"],
          flag: "HIGH_SCAFFOLD"
        },
        { 
          band_id: "S3", 
          label: "Medium", 
          description: "Gebalanceerde ondersteuning",
          fix: "/hint_soft",
          ai_obs: ["Stelt gerichte vragen", "Geeft subtiele hints"],
          learner_obs: ["Denkt mee met hints", "Maakt eigen stappen"],
          flag: "MEDIUM_SCAFFOLD"
        },
        { 
          band_id: "S4", 
          label: "Laag", 
          description: "Minimale ondersteuning",
          fix: "/scaffold_down",
          ai_obs: ["Geeft minimale hints", "Observeert grotendeels"],
          learner_obs: ["Werkt grotendeels zelfstandig", "Vraagt bevestiging"],
          flag: "LOW_SCAFFOLD"
        },
        { 
          band_id: "S5", 
          label: "Geen", 
          description: "Fading compleet",
          ai_obs: ["Observeert alleen", "Bevestigt correctheid"],
          learner_obs: ["Werkt volledig zelfstandig", "Monitort eigen voortgang"],
          flag: "NO_SCAFFOLD"
        }
      ]
    },
    // L - Learning Modality
    {
      rubric_id: "learning_modality",
      name: "Learning Modality",
      bands: [
        { 
          band_id: "L1", 
          label: "Narratief", 
          description: "Voorkeur voor doorlopende tekst en verhalen",
          ai_obs: ["Gebruikt verhaal", "Vertelt scenario", "Geeft context"],
          learner_obs: ["Vraagt om voorbeeldverhaal", "Reageert op narratief"],
          flag: "NARRATIVE_MODE"
        },
        { 
          band_id: "L2", 
          label: "Expositief", 
          description: "Standaard uitleg en instructie",
          ai_obs: ["Standaard uitleg", "Paragrafen met uitleg"],
          learner_obs: ["Leest uitleg", "Vraagt om meer uitleg"],
          flag: "EXPOSITORY_MODE"
        },
        { 
          band_id: "L3", 
          label: "Gestructureerd", 
          description: "Lijsten, stappen, opsommingen",
          ai_obs: ["Gebruikt lijsten", "Geeft stappen", "Maakt opsommingen"],
          learner_obs: ["Vraagt om stappen", "Wil overzicht"],
          flag: "STRUCTURED_MODE"
        },
        { 
          band_id: "L4", 
          label: "Technisch", 
          description: "Code, formules, formele notatie",
          ai_obs: ["Gebruikt code", "Toont formules", "Formele notatie"],
          learner_obs: ["Vraagt om code", "Wil formule zien"],
          flag: "TECHNICAL_MODE"
        }
      ]
    },
    // B - Behavior Patterns
    {
      rubric_id: "behavior",
      name: "Behavior Patterns",
      bands: [
        { 
          band_id: "B1", 
          label: "Passief", 
          description: "Afwachtend gedrag",
          fix: "/checkin",
          learner_obs: ["Wacht op instructie", "Geeft korte antwoorden", "Reageert minimaal"],
          flag: "PASSIVE"
        },
        { 
          band_id: "B2", 
          label: "Reactief", 
          description: "Reageert op stimuli",
          fix: "/elaborate",
          learner_obs: ["Beantwoordt vragen", "Volgt instructie", "Reageert op prompts"],
          flag: "REACTIVE"
        },
        { 
          band_id: "B3", 
          label: "Actief", 
          description: "Neemt initiatief",
          learner_obs: ["Stelt eigen vragen", "Neemt initiatief", "Verkent zelf"],
          flag: "ACTIVE"
        },
        { 
          band_id: "B4", 
          label: "Proactief", 
          description: "Anticipeert en plant",
          learner_obs: ["Plant vooruit", "Anticipeert", "Bedenkt volgende stappen"],
          flag: "PROACTIVE"
        }
      ]
    }
  ] as Rubric[],

  interaction_protocol: {
    logic_gates: [
      {
        trigger_band: "K1",
        condition: "WHEN epistemic_status = FEIT AND impact = SUMMATIEF",
        enforcement: "MAX_TD = TD2; REQUIRE_HUMAN_GATE",
        priority: "CRITICAL"
      },
      {
        trigger_band: "K3",
        condition: "WHEN impact = SUMMATIEF",
        enforcement: "MAX_TD = TD3; REQUIRE_HUMAN_GATE",
        priority: "CRITICAL"
      },
      {
        trigger_band: "E5",
        condition: "ALWAYS",
        enforcement: "REQUIRE_SOURCE_CITATION",
        priority: "HIGH"
      },
      {
        trigger_band: "C4",
        condition: "WHEN cognitive_load > threshold",
        enforcement: "MAX_TD = TD2; FORCE_CHUNK",
        priority: "HIGH"
      },
      {
        trigger_band: "TD5",
        condition: "WHEN K = K1",
        enforcement: "MAX_TD = TD3",
        priority: "MEDIUM"
      }
    ] as LogicGate[]
  },

  srl_model: {
    states: ["PLAN", "MONITOR", "REFLECT", "ADJUST"],
    transitions: {
      "PLAN": ["MONITOR"],
      "MONITOR": ["REFLECT", "ADJUST"],
      "REFLECT": ["PLAN", "ADJUST"],
      "ADJUST": ["MONITOR", "PLAN"]
    }
  }
};

// Helper function to get fix for a specific band
export function getFixForBand(bandId: string): string | null {
  for (const rubric of SSOT_DATA.rubrics) {
    const band = rubric.bands.find(b => b.band_id === bandId);
    if (band?.fix) return band.fix;
  }
  return null;
}

// Helper function to get flag for a specific band
export function getFlagForBand(bandId: string): string | null {
  for (const rubric of SSOT_DATA.rubrics) {
    const band = rubric.bands.find(b => b.band_id === bandId);
    if (band?.flag) return band.flag;
  }
  return null;
}

// Helper function to get learner_obs patterns for a rubric
export function getLearnerObsPatterns(rubricId: string): Map<string, RegExp> {
  const patterns = new Map<string, RegExp>();
  const rubric = SSOT_DATA.rubrics.find(r => r.rubric_id === rubricId);
  
  if (rubric) {
    for (const band of rubric.bands) {
      if (band.learner_obs && band.learner_obs.length > 0) {
        // Create regex from learner observations
        const patternStr = band.learner_obs
          .map(obs => obs.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          .join('|');
        patterns.set(band.band_id, new RegExp(patternStr, 'i'));
      }
    }
  }
  
  return patterns;
}

// Helper function to get all flags for detected bands
export function getFlagsForBands(bandIds: string[]): string[] {
  const flags: string[] = [];
  for (const bandId of bandIds) {
    const flag = getFlagForBand(bandId);
    if (flag) flags.push(flag);
  }
  return flags;
}
