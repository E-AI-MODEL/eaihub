// Curriculum Data - Learning Paths for EAI Hub

export interface LearningNode {
  id: string;
  title: string;
  description: string;
  didactic_focus: string;
  mastery_criteria: string;
  common_misconceptions?: string[];
  study_load_minutes: number;
}

export interface LearningPath {
  id: string;
  subject: string;
  level: string;
  nodes: LearningNode[];
}

export const CURRICULUM_PATHS: LearningPath[] = [
  {
    id: "BIO_VWO",
    subject: "Biologie",
    level: "VWO",
    nodes: [
      {
        id: "BIO_VWO_GEN_01",
        title: "DNA Structuur",
        description: "Begrijp de dubbele helix structuur van DNA",
        didactic_focus: "Visuele representatie en analogieën",
        mastery_criteria: "Kan de componenten van DNA benoemen en tekenen",
        common_misconceptions: ["DNA en RNA verwarren", "Waterstofbruggen niet begrijpen"],
        study_load_minutes: 30
      },
      {
        id: "BIO_VWO_GEN_02",
        title: "DNA Replicatie",
        description: "Het proces van DNA kopiëren",
        didactic_focus: "Stapsgewijze procedurele uitleg",
        mastery_criteria: "Kan de stappen van replicatie beschrijven",
        common_misconceptions: ["Richting van synthese", "Rol van enzymen"],
        study_load_minutes: 45
      },
      {
        id: "BIO_VWO_GEN_03",
        title: "Transcriptie",
        description: "Van DNA naar mRNA",
        didactic_focus: "Vergelijking met replicatie",
        mastery_criteria: "Kan transcriptie uitleggen en vergelijken met replicatie",
        common_misconceptions: ["Template vs coding strand"],
        study_load_minutes: 40
      },
      {
        id: "BIO_VWO_GEN_04",
        title: "Translatie",
        description: "Van mRNA naar eiwit",
        didactic_focus: "Codon tabel gebruiken",
        mastery_criteria: "Kan een aminozuursequentie afleiden van mRNA",
        common_misconceptions: ["Start/stop codons", "Anticodon richting"],
        study_load_minutes: 50
      }
    ]
  },
  {
    id: "WISB_VWO",
    subject: "Wiskunde B",
    level: "VWO",
    nodes: [
      {
        id: "WISB_VWO_DIFF_01",
        title: "Afgeleide - Concept",
        description: "Introductie van de afgeleide als helling",
        didactic_focus: "Grafische interpretatie",
        mastery_criteria: "Kan de afgeleide interpreteren als hellingsfunctie",
        common_misconceptions: ["Verwarring met gemiddelde snelheid"],
        study_load_minutes: 35
      },
      {
        id: "WISB_VWO_DIFF_02",
        title: "Rekenregels Differentiëren",
        description: "Somregel, productregel, kettingregel",
        didactic_focus: "Procedureel leren met voorbeelden",
        mastery_criteria: "Kan basisregels correct toepassen",
        common_misconceptions: ["Kettingregel overslaan", "Productregel foutief"],
        study_load_minutes: 60
      },
      {
        id: "WISB_VWO_DIFF_03",
        title: "Extremen Berekenen",
        description: "Maxima en minima vinden",
        didactic_focus: "Probleemoplossend werken",
        mastery_criteria: "Kan extremen vinden en karakteriseren",
        common_misconceptions: ["Randwaarden vergeten", "Tweede afgeleide test"],
        study_load_minutes: 45
      }
    ]
  },
  {
    id: "ECO_HAVO",
    subject: "Economie",
    level: "HAVO",
    nodes: [
      {
        id: "ECO_HAVO_MARKT_01",
        title: "Vraag en Aanbod",
        description: "Basisprincipes van marktwerking",
        didactic_focus: "Grafische analyse",
        mastery_criteria: "Kan vraag- en aanbodcurves tekenen en interpreteren",
        common_misconceptions: ["Verschuiving vs beweging langs curve"],
        study_load_minutes: 30
      },
      {
        id: "ECO_HAVO_MARKT_02",
        title: "Prijselasticiteit",
        description: "Hoe gevoelig is vraag voor prijsverandering",
        didactic_focus: "Berekeningen en interpretatie",
        mastery_criteria: "Kan elasticiteit berekenen en interpreteren",
        common_misconceptions: ["Elasticiteit vs helling"],
        study_load_minutes: 40
      },
      {
        id: "ECO_HAVO_MARKT_03",
        title: "Marktvormen",
        description: "Volkomen concurrentie vs monopolie",
        didactic_focus: "Vergelijkende analyse",
        mastery_criteria: "Kan marktvormen vergelijken op efficiëntie",
        common_misconceptions: ["Oligopolie gedrag"],
        study_load_minutes: 35
      },
      {
        id: "ECO_HAVO_MARKT_04",
        title: "Marktfalen",
        description: "Externe effecten en overheidsinterventie",
        didactic_focus: "Casusanalyse",
        mastery_criteria: "Kan marktfalen herkennen en oplossingen benoemen",
        common_misconceptions: ["Positieve vs negatieve externe effecten"],
        study_load_minutes: 45
      }
    ]
  }
];

export const getLearningPath = (subject: string, level: string): LearningPath | undefined => {
  return CURRICULUM_PATHS.find(
    p => p.subject.toLowerCase() === subject.toLowerCase() && 
         p.level.toLowerCase() === level.toLowerCase()
  );
};

export const getNodeById = (nodeId: string): LearningNode | undefined => {
  for (const path of CURRICULUM_PATHS) {
    const node = path.nodes.find(n => n.id === nodeId);
    if (node) return node;
  }
  return undefined;
};
