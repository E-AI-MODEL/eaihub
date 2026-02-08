import React from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MessageBubbleProps {
  message: Message;
  themeClasses?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, themeClasses }) => {
  const isUser = message.role === 'user';

  const userStyle = themeClasses || 'bg-primary/10 border border-primary/30 text-foreground backdrop-blur-sm';
  const modelStyle = 'bg-card/80 border border-border text-foreground backdrop-blur-sm shadow-sm';
  const errorStyle = 'bg-destructive/20 border border-destructive/50 text-destructive backdrop-blur-sm';

  // Check if JSON repair happened
  const wasRepaired = message.mechanical && message.mechanical.repairAttempts && message.mechanical.repairAttempts > 0;
  
  // Check G-Factor alignment
  const gFactor = message.mechanical?.semanticValidation?.gFactor;
  const hasWarning = gFactor !== undefined && gFactor < 0.8;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed relative group transition-all duration-300 ${
          message.isError ? errorStyle : (isUser ? userStyle : modelStyle)
        }`}
      >
        {/* Header with role, badges, timestamp */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {isUser ? 'OPERATOR' : 'EAI CORE'}
            </span>

            {/* Repair Badge */}
            {wasRepaired && (
              <div 
                className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded px-1.5 py-0.5" 
                title={`System automatically repaired malformed output (${message.mechanical?.repairAttempts} attempt${(message.mechanical?.repairAttempts || 0) > 1 ? 's' : ''})`}
              >
                <span className="text-[9px] font-bold text-green-400">⚡ FIXED</span>
              </div>
            )}

            {/* G-Factor Warning Badge */}
            {hasWarning && (
              <div 
                className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded px-1.5 py-0.5" 
                title={`Semantic integrity: ${Math.round((gFactor || 0) * 100)}%`}
              >
                <span className="text-[9px] font-bold text-yellow-400">⚠️ {Math.round((gFactor || 0) * 100)}%</span>
              </div>
            )}
          </div>

          <span className="text-[9px] font-mono text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="markdown-body">
          {isUser ? (
            <p className="whitespace-pre-wrap font-sans text-base font-light">{message.text}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[[rehypeKatex, { strict: false }]]}
              components={{
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1 text-muted-foreground" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1 text-muted-foreground" {...props} />,
                li: ({node, ...props}) => <li className="" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 last:mb-0 text-foreground" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-lg font-bold text-foreground mb-2 mt-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-bold text-foreground mb-2 mt-3" {...props} />,

                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-4 rounded-xl bg-card">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-muted text-primary uppercase font-bold tracking-wider" {...props} />,
                tbody: ({node, ...props}) => <tbody className="divide-y divide-border" {...props} />,
                tr: ({node, ...props}) => <tr className="hover:bg-muted/50 transition-colors" {...props} />,
                th: ({node, ...props}) => <th className="px-4 py-3 font-mono whitespace-nowrap text-[10px] sm:text-xs" {...props} />,
                td: ({node, ...props}) => <td className="px-4 py-3 align-top border-l border-border first:border-l-0 text-muted-foreground" {...props} />,

                code: ({node, ...props}) => <code className="bg-card text-primary px-1.5 py-0.5 rounded font-mono text-xs mx-0.5" {...props} />,

                pre: ({node, ...props}) => (
                  <pre className="bg-card rounded-xl p-4 overflow-x-auto my-4 text-xs font-mono text-muted-foreground" {...props} />
                ),

                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground my-4" {...props} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>

        {/* Debug Info on Hover */}
        {!isUser && message.mechanical && (
          <div className="hidden group-hover:flex absolute -bottom-6 right-0 text-[9px] text-muted-foreground font-mono bg-card/90 backdrop-blur-md px-2 py-0.5 rounded border border-border gap-2 z-10">
            <span>{message.mechanical.model}</span>
            <span>•</span>
            <span>{message.mechanical.latencyMs}ms</span>
            {message.mechanical.repairAttempts ? (
              <>
                <span>•</span>
                <span className="text-green-400">{message.mechanical.repairAttempts} repair{message.mechanical.repairAttempts > 1 ? 's' : ''}</span>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
