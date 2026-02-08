import React, { useState, useEffect } from 'react';
import { EAIAnalysis, MechanicalState, Message, DiagnosticResult } from '../types';
import { getEAICore, SSOTBand } from '@/utils/ssotHelpers';
import { runDiagnostics } from '../utils/diagnostics';
import { calculateDynamicTTL, EAIStateLike } from '@/utils/eaiLearnAdapter';
import { 
  getTraceEvents, 
  downloadTraceJSON, 
  clearTrace,
  type TraceEvent 
} from '@/lib/reliabilityPipeline';

interface TechReportProps {
  onClose: () => void;
  lastAnalysis: EAIAnalysis | null;
  lastMechanical: MechanicalState | null;
  messages: Message[];
  eaiState: EAIStateLike;
  sessionId?: string;
}

type TabMode = 'PAPER' | 'SSOT' | 'TRACE' | 'TELEMETRY' | 'HEALTH';

const TechReport: React.FC<TechReportProps> = ({ onClose, lastAnalysis, lastMechanical, messages, eaiState, sessionId }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('PAPER');
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const core = getEAICore();

  useEffect(() => {
    if (activeTab === 'HEALTH') {
      runDiagnostics(messages.length, lastMechanical?.latencyMs).then(setDiagnostics);
    }
    if (activeTab === 'TRACE' && sessionId) {
      const events = getTraceEvents(sessionId);
      setTraceEvents(events);
    }
  }, [activeTab, messages.length, lastMechanical, sessionId]);

  const getTabClass = (mode: TabMode) => {
    const base = "px-4 py-3 sm:py-1 text-xs font-bold uppercase rounded transition-all whitespace-nowrap snap-center shrink-0 border border-transparent";
    if (activeTab === mode) {
      if (mode === 'TELEMETRY') return `${base} bg-red-900/50 text-white border-red-500/30 shadow-[0_0_10px_rgba(220,38,38,0.3)]`;
      if (mode === 'HEALTH') return `${base} bg-green-900/50 text-white border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]`;
      if (mode === 'PAPER') return `${base} bg-white/10 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]`;
      return `${base} bg-cyan-900/50 text-white border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]`;
    }
    return `${base} text-slate-500 hover:text-white hover:bg-white/5`;
  };

  const attempts = lastMechanical?.repairAttempts || 0;
  const systemStatus = attempts > 0 
    ? { text: 'HEALED', color: 'text-orange-400', bg: 'bg-orange-500' }
    : { text: 'OPTIMAL', color: 'text-green-400', bg: 'bg-green-500' };

  const getBandDef = (code: string): SSOTBand | undefined => {
    for (const r of core.rubrics) {
      const band = r.bands.find(b => b.band_id === code);
      if (band) return band;
    }
    return undefined;
  };

  const getTTLBreakdown = () => {
    if (!lastAnalysis) return null;
    
    const breakdown: { label: string; mod: string; type: 'good' | 'bad' }[] = [];
    let total = 60000;

    const bands = [
      ...(lastAnalysis.process_phases || []),
      ...(lastAnalysis.coregulation_bands || []),
      ...(lastAnalysis.task_densities || []),
      ...(lastAnalysis.secondary_dimensions || [])
    ];
    
    const tdBand = bands.find(b => b.startsWith('TD'));
    const kBand = bands.find(b => b.startsWith('K'));

    if (tdBand === 'TD1' || tdBand === 'TD2') {
      breakdown.push({ label: 'Deep Work (TD1/TD2)', mod: '+60s', type: 'good' });
      total += 60000;
    }
    if (kBand === 'K3') {
      breakdown.push({ label: 'Metacognition (K3)', mod: '+45s', type: 'good' });
      total += 45000;
    }
    if (tdBand === 'TD4' || tdBand === 'TD5') {
      breakdown.push({ label: 'Passive/Instruction (TD4/TD5)', mod: '-20s', type: 'bad' });
      total -= 20000;
    }
    if (kBand === 'K1') {
      breakdown.push({ label: 'Fact Recall (K1)', mod: '-15s', type: 'bad' });
      total -= 15000;
    }
    
    const clamped = Math.max(30000, Math.min(180000, total));
    
    return { base: 60000, breakdown, total, clamped, isClamped: total !== clamped };
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050914] text-slate-300 font-mono flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-cyan-900/50 bg-[#0b1120] shrink-0 gap-4 sm:gap-0">
        <div className="flex items-center justify-between sm:justify-start gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-3 h-3 ${systemStatus.bg} rounded-full animate-pulse shadow-[0_0_10px_currentColor]`}></div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-widest uppercase truncate">EAI CONSOLE v{core.metadata.version}</h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                <span className="text-cyan-500 hidden sm:inline">Engineering & Diagnostics</span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className={systemStatus.color}>SYS: {systemStatus.text}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="sm:hidden text-xs uppercase tracking-wider text-slate-500 hover:text-white border border-slate-800 px-3 py-2 rounded">
            CLOSE
          </button>
        </div>
        
        <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex sm:bg-black/40 sm:rounded-lg sm:p-1 sm:border sm:border-white/5 overflow-x-auto scrollbar-hide gap-2 sm:gap-0 snap-x">
            <button onClick={() => setActiveTab('PAPER')} className={getTabClass('PAPER')}>Final Audit</button>
            <button onClick={() => setActiveTab('SSOT')} className={getTabClass('SSOT')}>SSOT Kernel</button>
            <button onClick={() => setActiveTab('TRACE')} className={getTabClass('TRACE')}>Live Trace</button>
            <button onClick={() => setActiveTab('TELEMETRY')} className={getTabClass('TELEMETRY')}>Telemetry</button>
            <button onClick={() => setActiveTab('HEALTH')} className={getTabClass('HEALTH')}>Sys Health</button>
          </div>
        </div>

        <button onClick={onClose} className="hidden sm:block text-xs uppercase tracking-wider text-slate-500 hover:text-cyan-400 transition-colors border border-slate-800 hover:border-cyan-500 px-3 py-1 rounded ml-4 shrink-0">
          CLOSE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-0 scrollbar-hide relative bg-gradient-to-br from-[#050914] to-[#0b1120]">
        
        {/* TAB: LIVE TRACE */}
        {activeTab === 'TRACE' && (
          <div className="max-w-4xl mx-auto py-8 px-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Reliability Pipeline Trace</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">PARSE → REPAIR → HEAL → GUARD → VALIDATE</p>
              </div>
              <div className="flex gap-2">
                {sessionId && (
                  <>
                    <button 
                      onClick={() => downloadTraceJSON(sessionId)}
                      className="text-xs bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-800 text-cyan-300 px-3 py-1.5 rounded transition-colors"
                    >
                      Export JSON
                    </button>
                    <button 
                      onClick={() => {
                        clearTrace(sessionId);
                        setTraceEvents([]);
                      }}
                      className="text-xs bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 px-3 py-1.5 rounded transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Pipeline Trace Events */}
            {traceEvents.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                {traceEvents.slice().reverse().map((event, idx) => {
                  const severityColors = {
                    INFO: 'border-slate-700 bg-slate-900/50 text-slate-300',
                    WARNING: 'border-yellow-800 bg-yellow-900/20 text-yellow-300',
                    REPAIR: 'border-orange-800 bg-orange-900/20 text-orange-300',
                    GATE: 'border-purple-800 bg-purple-900/20 text-purple-300',
                    ERROR: 'border-red-800 bg-red-900/20 text-red-300',
                  };
                  const stepColors = {
                    PROMPT_ASSEMBLY: 'text-blue-400',
                    MODEL_CALL: 'text-cyan-400',
                    PARSE: 'text-green-400',
                    REPAIR: 'text-orange-400',
                    SCHEMA_VALIDATE: 'text-purple-400',
                    SSOT_HEAL: 'text-yellow-400',
                    EPISTEMIC_GUARD: 'text-pink-400',
                    LOGIC_GATE_CHECK: 'text-red-400',
                    RENDER: 'text-emerald-400',
                  };
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded border ${severityColors[event.severity]} transition-all hover:bg-white/5`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${stepColors[event.step] || 'text-slate-400'}`}>
                            [{event.step}]
                          </span>
                          <span className="text-slate-500">{event.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            event.severity === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                            event.severity === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                            event.severity === 'REPAIR' ? 'bg-orange-500/20 text-orange-400' :
                            event.severity === 'GATE' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {event.severity}
                          </span>
                          <span className="text-slate-600 text-[10px]">
                            {event.ts.split('T')[1]?.replace('Z', '')}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-200">{event.message}</p>
                      {event.data && (
                        <pre className="mt-2 text-[10px] text-slate-500 bg-black/30 p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      )}
                      {event.durationMs && (
                        <span className="text-[10px] text-slate-500 mt-1 block">Duration: {event.durationMs}ms</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600 border border-dashed border-slate-800 rounded-xl bg-black/20">
                <p className="text-sm font-bold uppercase tracking-widest mb-2">No Trace Events</p>
                <p className="text-xs">Start a conversation to capture pipeline traces.</p>
                <p className="text-xs text-slate-500 mt-2">Events: PARSE → REPAIR → SSOT_HEAL → EPISTEMIC_GUARD → VALIDATE</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: SSOT KERNEL */}
        {activeTab === 'SSOT' && (
          <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">SSOT Kernel Visualization</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">VERSION: {core.metadata.version}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 border-b border-cyan-900 pb-2">Active Pedagogical Rubrics</h3>
                {core.rubrics.map((rubric) => (
                  <div key={rubric.rubric_id} className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">{rubric.name}</h4>
                      <code className="text-[10px] bg-black/30 px-2 py-0.5 rounded text-slate-400">{rubric.rubric_id}</code>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {rubric.bands.map(band => (
                        <div key={band.band_id} className="p-4 hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <code className="text-xs font-bold text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded border border-green-900/30">{band.band_id}</code>
                            <span className="text-xs font-bold text-white">{band.label}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{band.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-4 border-b border-cyan-900 pb-2">Command Injection Matrix</h3>
                <div className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden">
                  {core.commands.map((cmd) => (
                    <div key={cmd.command} className="p-3 border-b border-slate-800 last:border-0 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-xs font-bold text-pink-400 bg-pink-900/20 px-1.5 py-0.5 rounded border border-pink-900/30">{cmd.command}</code>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{cmd.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HEALTH */}
        {activeTab === 'HEALTH' && (
          <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">System Health Check</h2>
                <p className="text-xs text-slate-400 font-mono mt-1">REAL-TIME DIAGNOSTICS // TIMESTAMP: {Date.now()}</p>
              </div>
            </div>

            <div className="grid gap-4">
              {diagnostics.length === 0 && (
                <div className="text-center py-10 text-slate-500 animate-pulse font-mono text-xs">Running system probe...</div>
              )}
              {diagnostics.map((res) => {
                let styleClass = 'bg-[#1e0505] border-red-900/50 hover:bg-[#2e0808]';
                let iconClass = 'bg-red-500/20 text-red-400';
                let textClass = 'text-red-300';
                let badgeClass = 'border-red-800 text-red-500 bg-red-900/30';

                if (res.status === 'OK') {
                  styleClass = 'bg-[#061e16] border-green-900/50 hover:bg-[#0a2e22]';
                  iconClass = 'bg-green-500/20 text-green-400';
                  textClass = 'text-green-300';
                  badgeClass = 'border-green-800 text-green-500 bg-green-900/30';
                } else if (res.status === 'WARNING') {
                  styleClass = 'bg-[#1e1505] border-orange-900/50 hover:bg-[#2e2108]';
                  iconClass = 'bg-orange-500/20 text-orange-400';
                  textClass = 'text-orange-300';
                  badgeClass = 'border-orange-800 text-orange-500 bg-orange-900/30';
                }

                return (
                  <div key={res.id} className={`p-4 rounded-lg border flex items-center justify-between transition-all duration-300 ${styleClass}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-xs shrink-0 ${iconClass}`}>
                        {res.category}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${textClass}`}>{res.label}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{res.message}</p>
                      </div>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded border tracking-wider shrink-0 ml-4 ${badgeClass}`}>
                      {res.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: TELEMETRY */}
        {activeTab === 'TELEMETRY' && (
          <div className="p-4 sm:p-8 max-w-6xl mx-auto h-full flex flex-col min-h-[500px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-xl relative overflow-hidden">
                <h3 className="text-red-400 font-bold uppercase mb-6 text-sm tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Mechanical Telemetry
                </h3>
                {lastMechanical ? (
                  <div className="space-y-4 text-xs font-mono relative z-10">
                    <div className="grid grid-cols-2 border-b border-white/5 pb-2">
                      <span className="text-slate-500 uppercase tracking-wide">Inference Engine</span>
                      <span className="text-white font-bold text-right">{lastMechanical.model}</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-white/5 pb-2">
                      <span className="text-slate-500 uppercase tracking-wide">End-to-End Latency</span>
                      <span className={`font-bold text-right ${lastMechanical.latencyMs > 2000 ? 'text-orange-400' : 'text-green-400'}`}>{lastMechanical.latencyMs}ms</span>
                    </div>
                    <div className="grid grid-cols-2 border-b border-white/5 pb-2">
                      <span className="text-slate-500 uppercase tracking-wide">Self-Healing</span>
                      <span className={`font-bold text-right ${(lastMechanical.repairAttempts || 0) > 0 ? 'text-orange-400' : 'text-slate-400'}`}>
                        {(lastMechanical.repairAttempts || 0) > 0 ? `${lastMechanical.repairAttempts} REPAIR(S)` : '0 (CLEAN)'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-600 italic border border-dashed border-slate-800 rounded bg-black/20">
                    <span>No active telemetry stream.</span>
                    <span className="text-[10px] mt-2">Initiate chat session to capture data.</span>
                  </div>
                )}
              </div>

              {/* TTL Breakdown */}
              {(() => {
                const breakdown = getTTLBreakdown();
                return (
                  <div className="bg-[#1a1405] border border-yellow-900/50 p-6 rounded-xl relative overflow-hidden">
                    <h3 className="text-yellow-400 font-bold uppercase mb-6 text-sm tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                      Temporal Scaffolding (Live TTL)
                    </h3>
                    {breakdown ? (
                      <div className="relative z-10 font-mono">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Calculation Logic</div>
                        <div className="bg-black/30 rounded p-3 border border-yellow-900/20 space-y-2 mb-4">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Base System Latency</span>
                            <span>60.0s</span>
                          </div>
                          {breakdown.breakdown.map((item, idx) => (
                            <div key={idx} className={`flex justify-between text-xs font-bold ${item.type === 'good' ? 'text-green-400' : 'text-orange-400'}`}>
                              <span>{item.label}</span>
                              <span>{item.mod}</span>
                            </div>
                          ))}
                          <div className="h-px bg-white/10 my-2"></div>
                          <div className="flex justify-between text-sm font-bold text-white">
                            <span>CALCULATED TTL</span>
                            <span>{breakdown.total / 1000}s</span>
                          </div>
                          {breakdown.isClamped && (
                            <div className="flex justify-between text-[10px] text-slate-500 italic">
                              <span>(Safety Clamped)</span>
                              <span>{breakdown.clamped / 1000}s</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          * System will passively wait for <strong>{breakdown.clamped / 1000} seconds</strong> of silence before triggering a proactive didactic nudge.
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-600 italic border border-dashed border-yellow-900/30 rounded bg-black/20">
                        <span>Awaiting didactic stream.</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB: PAPER (Final Audit) */}
        {activeTab === 'PAPER' && (
          <div className="max-w-5xl mx-auto py-8 px-4 sm:px-8 space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="border-l-4 border-cyan-500 pl-6 py-2 bg-gradient-to-r from-cyan-900/10 to-transparent">
              <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">STRATEGIC AUDIT REPORT v4.0 (DEFINITIVE)</h1>
              <div className="text-sm text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Scope</span>
                  <span className="text-white">Router Upgrade / Repair Hardening / Logic Integrity</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Target Architecture</span>
                  <span className="text-cyan-400">Gemini 3.0 Native</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed border-b border-slate-800 pb-6">
              This report acknowledges the existing structural validation mechanisms while highlighting the critical gap between "valid JSON" and "didactic integrity".
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-cyan-400 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                    1. The Validation Illusion
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Current State:</strong> The system robustly ensures the output <em>structure</em> matches the SSOT schema.<br/><br/>
                    <strong>The Gap:</strong> It fails to validate <em>semantic integrity</em>. If the AI outputs code <code className="bg-slate-800 px-1 rounded">K1</code> (Facts) but writes a conceptual essay, the validator approves it.
                  </p>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-cyan-400 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                    2. Intent-Based Routing
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Current State:</strong> Routing relies on message length.<br/><br/>
                    <strong>The Flaw:</strong> Short queries ("Why?") can be didactically deep. Long queries can be trivial.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-orange-400 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                    3. The "Repair" Trap
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Risk:</strong> Falling back to Flash to repair broken Pro JSON is dangerous. Flash strips complex didactic nuances.
                  </p>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-700/50">
                  <h3 className="text-red-400 font-bold uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    4. Security & Persistence
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Client-Side:</strong> SSOT and Prompts are exposed in the browser bundle.<br/>
                    <strong>Memory:</strong> No persistence (F5 = reset).
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-8 opacity-50">
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-600">Generated by EAI Audit Core • v{core.metadata.version}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechReport;
