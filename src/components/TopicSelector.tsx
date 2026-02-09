// TopicSelector - Allows students to select their current lesson topic from curriculum
// Injects curriculum context (learning nodes, misconceptions, mastery criteria) into AI prompt

import React, { useMemo } from 'react';
import { CURRICULUM_PATHS, getLearningPath, type LearningNode, type LearningPath } from '@/data/curriculum';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Target, AlertTriangle, Clock } from 'lucide-react';

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
  // Get available learning path for current subject/level
  const learningPath = useMemo(() => {
    if (!subject || !level) return null;
    return getLearningPath(subject, level);
  }, [subject, level]);

  // Get current node details
  const currentNode = useMemo(() => {
    if (!currentNodeId || !learningPath) return null;
    return learningPath.nodes.find(n => n.id === currentNodeId) || null;
  }, [currentNodeId, learningPath]);

  // No path available for this subject/level
  if (!learningPath) {
    return (
      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
        Geen curriculum beschikbaar voor {subject || 'onbekend vak'}
      </div>
    );
  }

  // Handle value conversion (Radix doesn't allow empty string as value)
  const selectValue = currentNodeId || '__none__';
  const handleValueChange = (val: string) => {
    onNodeChange(val === '__none__' ? null : val);
  };

  if (compact) {
    return (
      <Select value={selectValue} onValueChange={handleValueChange}>
        <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-slate-300 text-xs">
          <SelectValue placeholder="Selecteer onderwerp..." />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 z-50">
          <SelectItem value="__none__" className="text-slate-400 text-xs">
            Geen specifiek onderwerp
          </SelectItem>
          {learningPath.nodes.map((node) => (
            <SelectItem 
              key={node.id} 
              value={node.id}
              className="text-slate-200 text-xs"
            >
              {node.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-3">
      {/* Topic Selector Dropdown */}
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Lesonderwerp
        </label>
        <Select value={selectValue} onValueChange={handleValueChange}>
          <SelectTrigger className="h-9 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Selecteer je huidige lesonderwerp..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 max-h-64 z-50">
            <SelectItem value="__none__" className="text-slate-400">
              Geen specifiek onderwerp
            </SelectItem>
            {learningPath.nodes.map((node, idx) => (
              <SelectItem 
                key={node.id} 
                value={node.id}
                className="text-slate-200"
              >
                <span className="text-slate-500 mr-2">{idx + 1}.</span>
                {node.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Current Node Details */}
      {currentNode && (
        <div className="border border-slate-700 bg-slate-800/50 p-3 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium text-slate-200">{currentNode.title}</span>
          </div>
          
          {/* Description */}
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {currentNode.description}
          </p>

          {/* Mastery Criteria */}
          <div className="flex items-start gap-2 pt-1">
            <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider">Beheersingsdoel</span>
              <p className="text-[10px] text-emerald-300">{currentNode.mastery_criteria}</p>
            </div>
          </div>

          {/* Common Misconceptions */}
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

          {/* Study Load */}
          <div className="flex items-center gap-2 pt-1 text-[9px] text-slate-500">
            <Clock className="w-3 h-3" />
            <span>~{currentNode.study_load_minutes} min</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicSelector;
