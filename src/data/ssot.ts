// SSOT Data - Single Source of Truth for EAI Didactic Engine
// This contains the 10D Matrix rubrics, commands, and logic gates

export const SSOT_DATA = {
  version: "15.0",
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
    {
      rubric_id: "knowledge",
      name: "Knowledge Level",
      bands: [
        { band_id: "K1", label: "Feitelijk", description: "Basale feitenkennis, direct ophaalbaar", fix: "/anchor", learner_obs: ["Vraagt naar feiten", "Noemt definities"], flag: "FACT_RETRIEVAL" },
        { band_id: "K2", label: "Conceptueel", description: "Begrip van relaties en structuren", fix: "/connect", learner_obs: ["Legt verbanden", "Vergelijkt concepten"], flag: "CONCEPTUAL" },
        { band_id: "K3", label: "Procedureel", description: "Kennis van methoden en procedures", fix: "/sequence", learner_obs: ["Beschrijft stappen", "Past procedures toe"], flag: "PROCEDURAL" }
      ]
    },
    {
      rubric_id: "precision",
      name: "Precision",
      bands: [
        { band_id: "P1", label: "Oriëntatie", description: "Leerling oriënteert zich op het probleem", didactic_principle: "Activeer voorkennis" },
        { band_id: "P2", label: "Exploratie", description: "Leerling verkent mogelijke aanpakken", didactic_principle: "Bied keuzes aan" },
        { band_id: "P3", label: "Instructie", description: "Gerichte instructie nodig", didactic_principle: "Directe instructie" },
        { band_id: "P4", label: "Integratie", description: "Leerling integreert nieuwe kennis", didactic_principle: "Verbind met bestaande kennis" },
        { band_id: "P5", label: "Verdieping", description: "Leerling verdiept en transfereert", didactic_principle: "Daag uit met complexiteit" }
      ]
    },
    {
      rubric_id: "cognitive_load",
      name: "Cognitive Load",
      bands: [
        { band_id: "C1", label: "Minimaal", description: "Lage cognitieve belasting", mechanistic: { timescale: "immediate", fast: 0.9, mid: 0.1, slow: 0.0 } },
        { band_id: "C2", label: "Optimaal", description: "Optimale zone voor leren", mechanistic: { timescale: "working", fast: 0.6, mid: 0.3, slow: 0.1 } },
        { band_id: "C3", label: "Verhoogd", description: "Verhoogde belasting, monitor nodig", mechanistic: { timescale: "extended", fast: 0.3, mid: 0.5, slow: 0.2 } },
        { band_id: "C4", label: "Overbelast", description: "Cognitieve overbelasting", fix: "/chunk", mechanistic: { timescale: "recovery", fast: 0.1, mid: 0.3, slow: 0.6 } }
      ]
    },
    {
      rubric_id: "task_density",
      name: "Task Density (Agency)",
      bands: [
        { band_id: "TD1", label: "Maximale Ondersteuning", description: "Docent-geleid, directe instructie", ai_obs: ["Geeft stapsgewijze uitleg", "Leidt het gesprek"] },
        { band_id: "TD2", label: "Hoge Ondersteuning", description: "Veel scaffolding, gerichte vragen", ai_obs: ["Stelt gerichte vragen", "Biedt hints aan"] },
        { band_id: "TD3", label: "Gebalanceerd", description: "Evenwicht tussen sturing en autonomie", ai_obs: ["Vraagt om uitleg", "Bevestigt begrip"] },
        { band_id: "TD4", label: "Lage Ondersteuning", description: "Leerling neemt initiatief", ai_obs: ["Stelt open vragen", "Daagt uit"] },
        { band_id: "TD5", label: "Minimale Ondersteuning", description: "Volledige leerling-autonomie", ai_obs: ["Observeert", "Valideert alleen"] }
      ]
    },
    {
      rubric_id: "verification",
      name: "Verification Status",
      bands: [
        { band_id: "V1", label: "Niet Geverifieerd", description: "Claim zonder verificatie" },
        { band_id: "V2", label: "Zelf-gerapporteerd", description: "Leerling claimt begrip" },
        { band_id: "V3", label: "Getest", description: "Begrip getest met vragen" },
        { band_id: "V4", label: "Toegepast", description: "Begrip gedemonstreerd in toepassing" },
        { band_id: "V5", label: "Getransfereerd", description: "Begrip in nieuwe context" }
      ]
    },
    {
      rubric_id: "epistemic",
      name: "Epistemic Status",
      bands: [
        { band_id: "E1", label: "Onbekend", description: "Epistemische status onduidelijk" },
        { band_id: "E2", label: "Mening", description: "Persoonlijke opvatting" },
        { band_id: "E3", label: "Interpretatie", description: "Beargumenteerde interpretatie" },
        { band_id: "E4", label: "Consensus", description: "Wetenschappelijke consensus" },
        { band_id: "E5", label: "Feit", description: "Geverifieerd feit" }
      ]
    },
    {
      rubric_id: "time",
      name: "Time Factor",
      bands: [
        { band_id: "T1", label: "Onmiddellijk", description: "Directe respons verwacht" },
        { band_id: "T2", label: "Kort", description: "Korte bedenktijd" },
        { band_id: "T3", label: "Medium", description: "Normale verwerking" },
        { band_id: "T4", label: "Lang", description: "Uitgebreide verwerking" },
        { band_id: "T5", label: "Reflectief", description: "Diepe reflectie nodig" }
      ]
    },
    {
      rubric_id: "scaffolding",
      name: "Scaffolding Level",
      bands: [
        { band_id: "S1", label: "Vol", description: "Maximale ondersteuning" },
        { band_id: "S2", label: "Hoog", description: "Veel ondersteuning" },
        { band_id: "S3", label: "Medium", description: "Gebalanceerde ondersteuning" },
        { band_id: "S4", label: "Laag", description: "Minimale ondersteuning" },
        { band_id: "S5", label: "Geen", description: "Fading compleet" }
      ]
    },
    {
      rubric_id: "learning_style",
      name: "Learning Style",
      bands: [
        { band_id: "L1", label: "Visueel", description: "Voorkeur voor visuele info" },
        { band_id: "L2", label: "Auditief", description: "Voorkeur voor uitleg" },
        { band_id: "L3", label: "Lezen/Schrijven", description: "Voorkeur voor tekst" },
        { band_id: "L4", label: "Kinesthetisch", description: "Voorkeur voor doen" }
      ]
    },
    {
      rubric_id: "behavior",
      name: "Behavior Patterns",
      bands: [
        { band_id: "B1", label: "Passief", description: "Afwachtend gedrag" },
        { band_id: "B2", label: "Reactief", description: "Reageert op stimuli" },
        { band_id: "B3", label: "Actief", description: "Neemt initiatief" },
        { band_id: "B4", label: "Proactief", description: "Anticipeert en plant" }
      ]
    }
  ],

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
    ]
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
