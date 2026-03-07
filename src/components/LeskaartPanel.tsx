import React, { useMemo, useState } from 'react';
import { BookOpen, Target, AlertTriangle, Clock, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { getLearningPath } from '@/data/curriculum';
import type { LearnerProfile, EAIAnalysis, DidacticTheme } from '@/types';

// Learner-facing phase descriptions (no technical terms)
const PHASE_CONTEXT: Record<string, { label: string; hint: string }> = {
  P1: { label: 'Oriëntatie', hint: 'We verkennen samen het onderwerp en bepalen je startpunt.' },
  P2: { label: 'Voorkennis', hint: 'We controleren wat je al weet, zodat de uitleg goed aansluit.' },
  P3: { label: 'Uitleg & oefening', hint: 'Je krijgt uitleg en oefent stap voor stap.' },
  P4: { label: 'Toepassen', hint: 'Je past toe wat je hebt geleerd in nieuwe situaties.' },
  P5: { label: 'Reflectie', hint: 'Je kijkt terug op wat je hebt geleerd en hoe het ging.' },
};

// Intervention Toolbox Categories
const TOOL_CATEGORIES: Record<string, { label: string; command: string; icon: string; desc: string; mode: DidacticTheme }[]> = {
  START: [
    { label: "Bepaal doel", command: "/checkin", icon: "📍", desc: "Doel en rol", mode: "COACH" },
    { label: "Kernvraag", command: "/leervraag", icon: "💡", desc: "Kern van je vraag", mode: "DEFAULT" },
    { label: "Proces check", command: "/fase_check", icon: "⏱️", desc: "Waar sta je?", mode: "SYSTEM" },
  ],
  UITLEG: [
    { label: "Structureer", command: "/schema", icon: "📐", desc: "Tekst → structuur", mode: "SYSTEM" },
    { label: "Visualiseer", command: "/beeld", icon: "🎨", desc: "Uitleg via metafoor", mode: "CREATIVE" },
    { label: "Stap-voor-stap", command: "/stappenplan", icon: "📝", desc: "Kleine stappen", mode: "PRAGMATIC" },
  ],
  UITDAGEN: [
    { label: "Devil's Advocate", command: "/devil", icon: "😈", desc: "Test je idee", mode: "DEVIL" },
    { label: "Draai om", command: "/twist", icon: "🔄", desc: "Andere kant", mode: "DEVIL" },
    { label: "Edge cases", command: "/randgeval", icon: "⚡", desc: "Wat als?", mode: "META" },
  ],
  CHECK: [
    { label: "Test mij", command: "/quizgen", icon: "📝", desc: "3 vragen", mode: "COACH" },
    { label: "Samenvatten", command: "/beurtvraag", icon: "🎤", desc: "Eigen woorden", mode: "PRAGMATIC" },
    { label: "Rubric", command: "/rubric", icon: "📊", desc: "Beoordeel werk", mode: "SYSTEM" },
  ],
  REFLECTIE: [
    { label: "Helikopter", command: "/meta", icon: "🧠", desc: "Reflecteer", mode: "META" },
    { label: "Transfer", command: "/transfer", icon: "🔗", desc: "Andere context", mode: "CREATIVE" },
    { label: "Evalueer", command: "/proces_eval", icon: "📈", desc: "Leerproces", mode: "META" },
  ],
};

interface LeskaartPanelProps {
  profile: LearnerProfile;
  analysis: EAIAnalysis | null;
  onNodeChange: (nodeId: string | null) => void;
  onSendCommand: (command: string) => void;
  sessionStartTime: number;
}

const LeskaartPanel: React.FC<LeskaartPanelProps> = ({
  profile, analysis, onNodeChange, onSendCommand, sessionStartTime,
}) => {
  const autoTab = useMemo(() => {
    if (!analysis?.process_phases?.length) return 'START';
    const phase = analysis.process_phases[0];
    if (phase?.startsWith('P1')) return 'START';
    if (phase?.startsWith('P2')) return 'UITLEG';
    if (phase?.startsWith('P3')) return 'UITDAGEN';
    if (phase?.startsWith('P4')) return 'CHECK';
    if (phase?.startsWith('P5')) return 'REFLECTIE';
    return 'START';
  }, [analysis]);

  const [activeTab, setActiveTab] = useState(autoTab);

  const learningPath = useMemo(() => {
    if (!profile.subject || !profile.level) return null;
    return getLearningPath(profile.subject, profile.level);
  }, [profile.subject, profile.level]);

  const currentNode = useMemo(() => {
    if (!profile.currentNodeId || !learningPath) return null;
    return learningPath.nodes.find(n => n.id === profile.currentNodeId) || null;
  }, [profile.currentNodeId, learningPath]);

  const currentNodeIndex = useMemo(() => {
    if (!profile.currentNodeId || !learningPath) return -1;
    return learningPath.nodes.findIndex(n => n.id === profile.currentNodeId);
  }, [profile.currentNodeId, learningPath]);

  // Session timer
  const [elapsed, setElapsed] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 60000));
    }, 30000);
    setElapsed(Math.floor((Date.now() - sessionStartTime) / 60000));
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  React.useEffect(() => { setActiveTab(autoTab); }, [autoTab]);

  const navigateNode = (direction: -1 | 1) => {
    if (!learningPath) return;
    const newIdx = currentNodeIndex + direction;
    if (newIdx >= 0 && newIdx < learningPath.nodes.length) {
      onNodeChange(learningPath.nodes[newIdx].id);
    }
  };

  // Derive learner-facing phase context
  const currentPhase = analysis?.process_phases?.[0] || null;
  const phaseKey = currentPhase ? currentPhase.slice(0, 2) : null;
  const phaseContext = phaseKey ? PHASE_CONTEXT[phaseKey] : null;

  const tools = TOOL_CATEGORIES[activeTab] || [];

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Section: Leerdoel */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Leerdoel</span>
        </div>

        {currentNode ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-100">{currentNode.title}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">{currentNode.description}</p>

            {/* Mastery */}
            <div className="flex items-start gap-2 pt-1">
              <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-emerald-300">{currentNode.mastery_criteria}</p>
            </div>

            {/* Misconceptions */}
            {currentNode.common_misconceptions && currentNode.common_misconceptions.length > 0 && (
              <div className="p-2 border border-amber-500/30 bg-amber-950/20 mt-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider">Let op</span>
                </div>
                <ul className="text-[10px] text-amber-300/80 space-y-0.5">
                  {currentNode.common_misconceptions.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Study load + session time */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>~{currentNode.study_load_minutes} min</span>
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                sessie: {elapsed} min
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => navigateNode(-1)}
                disabled={currentNodeIndex <= 0}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Vorige
              </button>
              <span className="text-[9px] font-mono text-slate-600">
                {currentNodeIndex + 1}/{learningPath?.nodes.length || 0}
              </span>
              <button
                onClick={() => navigateNode(1)}
                disabled={!learningPath || currentNodeIndex >= learningPath.nodes.length - 1}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Volgende <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-600 italic">Selecteer een lesonderwerp via de header.</p>
        )}
      </div>

      {/* Section: Leercontext — learner-facing phase explanation */}
      {phaseContext && (
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Waar je nu bent</span>
          </div>
          <p className="text-[11px] text-cyan-300 font-medium mb-1">{phaseContext.label}</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">{phaseContext.hint}</p>
        </div>
      )}

      {/* Section: Inline Toolbox */}
      <div className="p-4 border-b border-slate-800 flex-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3 block">Toolbox</span>

        {/* Phase tabs */}
        <div className="flex flex-wrap gap-1 mb-3">
          {Object.keys(TOOL_CATEGORIES).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-2 py-1 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                activeTab === cat
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-500 border border-transparent hover:text-slate-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tool buttons */}
        <div className="space-y-1">
          {tools.map(tool => (
            <button
              key={tool.command}
              onClick={() => onSendCommand(tool.command)}
              className="w-full flex items-center gap-2 px-2 py-2 text-left border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 transition-colors group"
            >
              <span className="text-sm shrink-0">{tool.icon}</span>
              <div className="min-w-0">
                <span className="text-xs text-slate-300 group-hover:text-slate-100 block truncate">{tool.label}</span>
                <span className="text-[10px] text-slate-600 block truncate">{tool.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Voortgang */}
      {learningPath && currentNodeIndex >= 0 && (
        <div className="p-4">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2 block">Voortgang</span>
          <div className="h-1.5 w-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-500/60 transition-all duration-500"
              style={{ width: `${((currentNodeIndex + 1) / learningPath.nodes.length) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-slate-600 mt-1 block">
            {currentNodeIndex + 1} van {learningPath.nodes.length} onderwerpen
          </span>
        </div>
      )}
    </div>
  );
};

export default LeskaartPanel;
