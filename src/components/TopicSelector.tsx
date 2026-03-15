// TopicSelector - Allows students to select their current lesson topic from curriculum
// Updated: Uses pilot_core JSON data with leergebied → path → node hierarchy

import React, { useMemo, useState } from 'react';
import { getAllSubjects, getPathsBySubject, getNodeById, getPathForNode } from '@/data/curriculumLoader';
import type { LearningNode, LearningPath } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Target, AlertTriangle, Lightbulb, List } from 'lucide-react';

interface TopicSelectorProps {
  subject: string | null;
  level: string | null;
  currentNodeId: string | null;
  onNodeChange: (nodeId: string | null) => void;
  compact?: boolean;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  subject,
  level,
  currentNodeId,
  onNodeChange,
  compact = false,
}) => {
  const subjects = useMemo(() => getAllSubjects(), []);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(() => {
    // Derive initial subject from currentNodeId or profile subject
    if (currentNodeId) {
      const pathInfo = getPathForNode(currentNodeId);
      if (pathInfo) return pathInfo.path.subject;
    }
    return subject || null;
  });

  const [selectedPathTopic, setSelectedPathTopic] = useState<string | null>(null);

  // Get paths for selected subject
  const paths = useMemo(() => {
    if (!selectedSubject) return [];
    return getPathsBySubject(selectedSubject);
  }, [selectedSubject]);

  // Get current node details
  const currentNode = useMemo(() => {
    if (!currentNodeId) return null;
    return getNodeById(currentNodeId) || null;
  }, [currentNodeId]);

  // Get nodes for selected path
  const availableNodes = useMemo(() => {
    if (!selectedPathTopic) return [];
    const path = paths.find(p => p.topic === selectedPathTopic);
    return path?.nodes || [];
  }, [selectedPathTopic, paths]);

  const handleSubjectChange = (val: string) => {
    const subj = val === '__none__' ? null : val;
    setSelectedSubject(subj);
    setSelectedPathTopic(null);
    onNodeChange(null);
  };

  const handlePathChange = (val: string) => {
    const topic = val === '__none__' ? null : val;
    setSelectedPathTopic(topic);
    if (!topic) onNodeChange(null);
  };

  const handleNodeChange = (val: string) => {
    onNodeChange(val === '__none__' ? null : val);
  };

  if (subjects.length === 0) {
    return (
      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
        Geen curriculum beschikbaar
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex gap-1.5">
        <Select value={selectedSubject || '__none__'} onValueChange={handleSubjectChange}>
          <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-slate-300 text-xs flex-1">
            <SelectValue placeholder="Leergebied..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 z-50">
            <SelectItem value="__none__" className="text-slate-400 text-xs">Alle</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.code} value={s.name} className="text-slate-200 text-xs">
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {paths.length > 0 && (
          <Select value={selectedPathTopic || '__none__'} onValueChange={handlePathChange}>
            <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-slate-300 text-xs flex-1">
              <SelectValue placeholder="Kerndoel..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 z-50 max-h-64">
              <SelectItem value="__none__" className="text-slate-400 text-xs">Kies kerndoel</SelectItem>
              {paths.map(p => (
                <SelectItem key={p.topic} value={p.topic} className="text-slate-200 text-xs">
                  {p.topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Step 1: Leergebied */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Leergebied
        </label>
        <Select value={selectedSubject || '__none__'} onValueChange={handleSubjectChange}>
          <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Kies leergebied..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 max-h-64 z-50">
            <SelectItem value="__none__" className="text-slate-400">Alle leergebieden</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.code} value={s.name} className="text-slate-200">
                {s.name}
                <span className="text-slate-500 ml-2 text-[10px]">{s.pathCount} kerndoelen</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Kerndoel (path) */}
      {selectedSubject && paths.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Kerndoel
          </label>
          <Select value={selectedPathTopic || '__none__'} onValueChange={handlePathChange}>
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-200">
              <SelectValue placeholder="Kies kerndoel..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 max-h-64 z-50">
              <SelectItem value="__none__" className="text-slate-400">Geen specifiek kerndoel</SelectItem>
              {paths.map((p, idx) => (
                <SelectItem key={p.topic} value={p.topic} className="text-slate-200">
                  <span className="text-slate-500 mr-2">{idx + 1}.</span>
                  {p.topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Step 3: Specifiek leerdoel (node) — only when path is selected */}
      {selectedPathTopic && availableNodes.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Leerdoel
          </label>
          <Select value={currentNodeId || '__none__'} onValueChange={handleNodeChange}>
            <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-200">
              <SelectValue placeholder="Kies leerdoel..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 max-h-64 z-50">
              <SelectItem value="__none__" className="text-slate-400">Geen specifiek leerdoel</SelectItem>
              {availableNodes.map((node, idx) => (
                <SelectItem key={node.id} value={node.id} className="text-slate-200">
                  <span className="text-slate-500 mr-2">{idx + 1}.</span>
                  {node.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Current Node Details */}
      {currentNode && (
        <div className="border border-slate-700 bg-slate-800/50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-slate-200">{currentNode.title}</span>
            {currentNode.slo_ref && (
              <span className="text-[8px] font-mono text-slate-500 border border-slate-700 px-1.5 py-0.5">{currentNode.slo_ref}</span>
            )}
          </div>
          
          <p className="text-[11px] text-slate-400 leading-relaxed">{currentNode.description}</p>

          {/* Mastery Criteria */}
          <div className="flex items-start gap-2 pt-1">
            <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider">Beheersingsdoel</span>
              <p className="text-[10px] text-emerald-300">{currentNode.mastery_criteria}</p>
            </div>
          </div>

          {/* Microsteps */}
          {currentNode.micro_steps && currentNode.micro_steps.length > 0 && (
            <div className="flex items-start gap-2 pt-1">
              <List className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Stappen</span>
                <ul className="text-[10px] text-cyan-300/80 space-y-0.5">
                  {currentNode.micro_steps.slice(0, 4).map((step, i) => (
                    <li key={i}>• {step}</li>
                  ))}
                  {currentNode.micro_steps.length > 4 && (
                    <li className="text-slate-500">+ {currentNode.micro_steps.length - 4} meer</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Misconceptions */}
          {currentNode.common_misconceptions && currentNode.common_misconceptions.length > 0 && (
            <div className="flex items-start gap-2 pt-1">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Let op</span>
                <ul className="text-[10px] text-amber-300 space-y-0.5">
                  {currentNode.common_misconceptions.map((misc, i) => (
                    <li key={i}>• {misc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Illustrations */}
          {currentNode.illustrations && currentNode.illustrations.length > 0 && (
            <div className="flex items-start gap-2 pt-1">
              <Lightbulb className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Voorbeelden</span>
                <ul className="text-[10px] text-indigo-300/80 space-y-0.5">
                  {currentNode.illustrations.slice(0, 3).map((ill, i) => (
                    <li key={i}>• {ill}</li>
                  ))}
                  {currentNode.illustrations.length > 3 && (
                    <li className="text-slate-500">+ {currentNode.illustrations.length - 3} meer</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
