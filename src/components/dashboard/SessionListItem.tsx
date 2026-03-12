import React from 'react';
import { MessageSquare } from 'lucide-react';
import { translatePhase, translateFix, translateTrend, getTeacherStatusLine, getUrgencyLevel } from '@/utils/teacherTranslations';
import { getNodeById } from '@/data/curriculum';
import type { EAIAnalysis } from '@/types';
import type { EAIStateLike } from '@/utils/eaiLearnAdapter';
import type { StudentSessionRow } from '@/services/sessionSyncService';

export interface SessionListItemProps {
  session: StudentSessionRow;
  isSelected: boolean;
  onSelect: (session: StudentSessionRow) => void;
  getTimeSince: (dateStr: string) => string;
}

const SessionListItem: React.FC<SessionListItemProps> = ({ session, isSelected, onSelect, getTimeSince }) => {
  const analysis = session.analysis as EAIAnalysis | null;
  const eai = session.eai_state as EAIStateLike | null;
  const isOnline = session.status === 'ONLINE';
  const urgency = getUrgencyLevel(session);
  const node = session.current_node_id ? getNodeById(session.current_node_id) : null;

  return (
    <button
      onClick={() => onSelect(session)}
      className={`w-full text-left px-3 py-2.5 border-b border-slate-800/50 transition-colors ${
        isSelected ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-900/60'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${urgency.dot} ${isOnline ? '' : 'opacity-40'}`} title={urgency.level === 'high' ? 'Hulp nodig' : urgency.level === 'medium' ? 'Even checken' : 'Gaat goed'} />
          <span className="text-[11px] font-medium text-slate-200 truncate max-w-[140px]">
            {session.name || 'Anoniem'}
          </span>
          {urgency.level === 'high' && (
            <span className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 font-mono uppercase">
              Hulp
            </span>
          )}
        </div>
        <span className="text-[9px] font-mono text-slate-600">{getTimeSince(session.last_active_at)}</span>
      </div>
      <div className="flex items-center gap-2 text-[9px] text-slate-500">
        <span>{session.subject || '—'} {session.level || ''}</span>
        <span className="text-slate-700">·</span>
        <span>{node?.title || '—'}</span>
      </div>
      <div className="flex items-center gap-3 mt-1">
        {analysis?.process_phases?.[0] && (
          <span className="text-[8px] font-mono px-1.5 py-0.5 border border-slate-700 bg-slate-900 text-cyan-400">
            {translatePhase(analysis.process_phases[0])}
          </span>
        )}
        {analysis?.active_fix && (
          <span className="text-[8px] px-1.5 py-0.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300" title={analysis.active_fix}>
            {translateFix(analysis.active_fix)}
          </span>
        )}
        {eai?.scaffolding?.trend && eai.scaffolding.trend !== 'STABLE' && (
          <span className={`text-[8px] ${urgency.color}`}>
            {translateTrend(eai.scaffolding.trend)}
          </span>
        )}
        <span className="text-[8px] font-mono text-slate-600 ml-auto">
          <MessageSquare className="w-2.5 h-2.5 inline mr-0.5" />{session.messages_count}
        </span>
      </div>
      <div className="mt-1">
        <span className={`text-[8px] italic ${urgency.color}`}>
          {getTeacherStatusLine(session)}
        </span>
      </div>
    </button>
  );
};

export default SessionListItem;
