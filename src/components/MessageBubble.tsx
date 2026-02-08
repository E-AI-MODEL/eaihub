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

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(({ message }, ref) => {
  const isUser = message.role === 'user';

  // Check if JSON repair happened
  const wasRepaired = message.mechanical && message.mechanical.repairAttempts && message.mechanical.repairAttempts > 0;
  
  // Check G-Factor alignment
  const gFactor = message.mechanical?.semanticValidation?.gFactor;
  const hasWarning = gFactor !== undefined && gFactor < 0.8;

  // ═══════════════════════════════════════════════════════════════════
  // SYSTEM MESSAGE (EAI Core response)
  // ═══════════════════════════════════════════════════════════════════
  if (!isUser) {
    return (
      <div className="max-w-2xl mb-4 px-4 py-3 border border-slate-700 bg-slate-800/40">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              EAI CORE
            </span>

            {/* Repair Badge */}
            {wasRepaired && (
              <span 
                className="text-[9px] font-medium text-amber-300 border border-amber-500/60 px-1.5 py-0.5"
                title={`System repaired output (${message.mechanical?.repairAttempts} attempt${(message.mechanical?.repairAttempts || 0) > 1 ? 's' : ''})`}
              >
                REPAIRED
              </span>
            )}

            {/* G-Factor Warning */}
            {hasWarning && (
              <span 
                className="text-[9px] font-medium text-amber-300 border border-amber-500/60 px-1.5 py-0.5"
                title={`Semantic integrity: ${Math.round((gFactor || 0) * 100)}%`}
              >
                {Math.round((gFactor || 0) * 100)}%
              </span>
            )}
          </div>

          <span className="text-[9px] font-mono text-slate-400">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Content */}
        <div className="text-slate-100 text-sm leading-relaxed">
          {message.isError ? (
            <p className="text-red-300">{message.text}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[[rehypeKatex, { strict: false }]]}
              components={{
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1 text-slate-300" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1 text-slate-300" {...props} />,
                li: ({node, ...props}) => <li {...props} />,
                p: ({node, ...props}) => <p className="mb-3 last:mb-0 text-slate-100" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-slate-100" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-base font-semibold text-slate-100 mb-2 mt-3" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-sm font-semibold text-slate-100 mb-2 mt-2" {...props} />,

                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-3 border border-slate-700 bg-slate-900/60">
                    <table className="w-full text-left text-xs border-collapse" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-800 text-slate-300 uppercase text-[10px] tracking-wider" {...props} />,
                tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-800" {...props} />,
                tr: ({node, ...props}) => <tr className="hover:bg-slate-800/50 transition-colors" {...props} />,
                th: ({node, ...props}) => <th className="px-3 py-2 font-medium whitespace-nowrap" {...props} />,
                td: ({node, ...props}) => <td className="px-3 py-2 align-top text-slate-300" {...props} />,

                code: ({node, ...props}) => <code className="bg-slate-900 text-slate-300 px-1.5 py-0.5 font-mono text-xs border border-slate-800" {...props} />,

                pre: ({node, ...props}) => (
                  <pre className="bg-slate-900 border border-slate-700 p-3 overflow-x-auto my-3 text-xs font-mono text-slate-300" {...props} />
                ),

                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-slate-600 pl-3 italic text-slate-400 my-3" {...props} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>

        {/* Debug Info (hover state for desktop) */}
        {message.mechanical && (
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center gap-3 text-[9px] font-mono text-slate-500">
            <span>{message.mechanical.model}</span>
            <span>•</span>
            <span>{message.mechanical.latencyMs}ms</span>
            {wasRepaired && (
              <>
                <span>•</span>
                <span className="text-amber-400">{message.mechanical.repairAttempts} repair{(message.mechanical?.repairAttempts || 0) > 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // STUDENT MESSAGE (User input)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-xl ml-6 mb-4 px-4 py-3 border border-slate-800 bg-slate-900/40">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          LEERLING
        </span>
        <span className="text-[9px] font-mono text-slate-500">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Content */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
      {message.text}
    </p>
  </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
