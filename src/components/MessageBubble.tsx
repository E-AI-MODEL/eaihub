import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MessageBubbleProps {
  message: Message;
}

// Presentation Guard
const FORBIDDEN_PATTERNS = [
  /\/?(?:intro|devil|schema|beeld|flits|chunk|checkin|fase_check|hint|anchor|reflectie|model|exit|quiz|meta|pauze|recap)\b/gi,
  /inventarisatie/gi,
  /diagnose/gi,
  /strategie/gi,
  /volgens mijn analyse/gi,
  /om je te helpen/gi,
  /ik ga je/gi,
  /laten we beginnen met/gi,
];

const sanitizeForPresentation = (text: string): string => {
  let cleaned = text;
  FORBIDDEN_PATTERNS.forEach(pattern => { cleaned = cleaned.replace(pattern, '').trim(); });
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const wasRepaired = message.mechanical?.repairAttempts && message.mechanical.repairAttempts > 0;
  const gFactor = message.mechanical?.semanticValidation?.gFactor;
  const hasWarning = gFactor !== undefined && gFactor < 0.8;
  const displayText = isUser ? message.text : sanitizeForPresentation(message.text);

  // ═══════════════════════════════════════════════════════════
  // SYSTEM MESSAGE — 3px indigo accent stripe
  // ═══════════════════════════════════════════════════════════
  if (!isUser) {
    return (
      <div className="max-w-2xl mb-4">
        <div className="border border-slate-700 bg-slate-800/40 flex">
          {/* Accent stripe */}
          <div className="w-[3px] bg-indigo-500/60 shrink-0" />

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="h-7 px-3 flex items-center justify-between border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">EAI CORE</span>
                {wasRepaired && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40">REPAIRED</span>
                )}
                {hasWarning && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/40">G:{Math.round((gFactor || 0) * 100)}%</span>
                )}
              </div>
              <span className="text-[9px] font-mono text-slate-600">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Content */}
            <div className="px-5 py-3 text-slate-100 text-sm leading-relaxed">
              {message.isError ? (
                <p className="text-red-300">{displayText}</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  components={{
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-3 space-y-1.5 text-slate-300" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-3 space-y-1.5 text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li className="text-slate-300" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 last:mb-0 text-slate-100" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-slate-50" {...props} />,
                    em: ({node, ...props}) => <em className="text-slate-200 italic" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-base font-semibold text-slate-50 mb-2 mt-4 first:mt-0" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-sm font-semibold text-slate-50 mb-2 mt-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-medium text-slate-100 mb-1 mt-2" {...props} />,
                    table: ({node, ...props}) => (
                      <div className="overflow-x-auto my-3 border border-slate-700 bg-slate-900/60">
                        <table className="w-full text-left text-xs border-collapse" {...props} />
                      </div>
                    ),
                    thead: ({node, ...props}) => <thead className="bg-slate-800 text-slate-300 uppercase text-[10px] tracking-wider" {...props} />,
                    tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-800" {...props} />,
                    tr: ({node, ...props}) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />,
                    th: ({node, ...props}) => <th className="px-3 py-2 font-medium whitespace-nowrap text-slate-300" {...props} />,
                    td: ({node, ...props}) => <td className="px-3 py-2 align-top text-slate-400" {...props} />,
                    code: ({node, className, ...props}) => {
                      const isInline = !className;
                      if (isInline) return <code className="bg-slate-900 text-slate-300 px-1.5 py-0.5 font-mono text-xs border border-slate-800" {...props} />;
                      return <code className={className} {...props} />;
                    },
                    pre: ({node, ...props}) => <pre className="bg-slate-950 border border-slate-700 p-3 overflow-x-auto my-3 text-xs font-mono text-slate-300" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-indigo-500/60 pl-3 italic text-slate-400 my-3 bg-slate-900/30 py-2" {...props} />,
                    a: ({node, ...props}) => <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" {...props} />,
                    hr: ({node, ...props}) => <hr className="border-slate-700 my-4" {...props} />,
                  }}
                >
                  {displayText}
                </ReactMarkdown>
              )}
            </div>

            {/* Mechanical footer */}
            {message.mechanical && (
              <div className="h-6 px-3 flex items-center gap-3 border-t border-slate-800 bg-slate-900/40">
                <span className="text-[9px] font-mono text-slate-600">{message.mechanical.model}</span>
                <span className="text-slate-700">|</span>
                <span className="text-[9px] font-mono text-slate-600">{message.mechanical.latencyMs}ms</span>
                {wasRepaired && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span className="text-[9px] font-mono text-amber-500">{message.mechanical.repairAttempts} repair{(message.mechanical?.repairAttempts || 0) > 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STUDENT MESSAGE — Clean right-aligned bubble, hover timestamp
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="max-w-xl ml-auto mb-4 group">
      <div className="border border-slate-800 bg-slate-900/50 px-4 py-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {message.text}
        </p>
      </div>
      <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-mono text-slate-700">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
