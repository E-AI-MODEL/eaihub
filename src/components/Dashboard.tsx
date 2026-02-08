import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Target, Brain, Gauge } from 'lucide-react';
import type { EAIAnalysis, ScaffoldingState } from '@/types';
import { SSOT_DATA } from '@/data/ssot';

interface DashboardProps {
  analysis: EAIAnalysis | null;
  scaffolding?: ScaffoldingState;
}

const DIMENSION_LABELS: Record<string, { label: string; description: string }> = {
  K: { label: 'Knowledge', description: 'Kennisniveau (K1-K3)' },
  C: { label: 'Cognitive', description: 'Cognitieve belasting' },
  P: { label: 'Precision', description: 'Precisie fase' },
  TD: { label: 'Task Density', description: 'Agency / ondersteuning' },
  V: { label: 'Verification', description: 'Verificatie status' },
  E: { label: 'Epistemic', description: 'Epistemische status' },
  T: { label: 'Time', description: 'Tijdsfactor' },
  S: { label: 'Scaffolding', description: 'Ondersteuningsniveau' },
  L: { label: 'Modality', description: 'Leermodaliteit (content type)' },
  B: { label: 'Behavior', description: 'Gedragspatroon' },
};

const extractBandLevel = (bandId: string): number => {
  const match = bandId.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const getBandColor = (dimension: string, level: number): string => {
  // Specific coloring based on dimension type
  if (dimension === 'TD') {
    // Task Density: lower = more support (green), higher = more autonomy (blue)
    if (level <= 2) return 'bg-green-500';
    if (level <= 4) return 'bg-primary';
    return 'bg-blue-500';
  }
  if (dimension === 'C') {
    // Cognitive Load: C4 is overload (red)
    if (level >= 4) return 'bg-destructive';
    if (level >= 3) return 'bg-orange-500';
    return 'bg-green-500';
  }
  // Default gradient
  if (level <= 1) return 'bg-slate-500';
  if (level <= 2) return 'bg-primary/70';
  if (level <= 3) return 'bg-primary';
  return 'bg-primary/90';
};

const getMaxBands = (dimension: string): number => {
  const rubric = SSOT_DATA.rubrics.find(r => 
    r.rubric_id.toUpperCase().startsWith(dimension) || 
    r.name.toUpperCase().includes(dimension)
  );
  return rubric?.bands.length || 5;
};

export const Dashboard: React.FC<DashboardProps> = ({ analysis, scaffolding }) => {
  // Extract current bands from analysis with complete dimension parsing
  const getCurrentBands = (): Record<string, number> => {
    // Default values for all 10 dimensions
    const defaults: Record<string, number> = { K: 2, C: 2, P: 3, TD: 3, V: 2, E: 3, T: 2, S: 3, L: 2, B: 3 };
    
    if (!analysis) {
      return defaults;
    }

    const bands: Record<string, number> = { ...defaults };
    
    // Helper to extract dimension and level from band string (e.g., "K2" -> {dim: "K", level: 2})
    const parseBand = (band: string) => {
      const match = band.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        bands[match[1]] = parseInt(match[2], 10);
      }
    };
    
    // Extract from coregulation_bands (primary: K, C, P)
    analysis.coregulation_bands?.forEach(parseBand);

    // Extract from task_densities
    analysis.task_densities?.forEach(parseBand);
    
    // Extract from secondary_dimensions (V, E, T, S, L, B)
    analysis.secondary_dimensions?.forEach(parseBand);

    return bands;
  };

  const currentBands = getCurrentBands();
  const dimensions = SSOT_DATA.metadata.cycle.order;

  const TrendIcon = ({ trend }: { trend?: 'RISING' | 'STABLE' | 'FALLING' }) => {
    if (trend === 'RISING') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'FALLING') return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* 10D Rubric Visualization */}
      <div className="border border-border rounded-xl bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          10D Rubric
        </h3>
        <div className="space-y-3">
          {dimensions.map((dim) => {
            const level = currentBands[dim] || 1;
            const maxLevel = getMaxBands(dim);
            const percentage = (level / maxLevel) * 100;
            const dimInfo = DIMENSION_LABELS[dim];

            return (
              <div key={dim} className="group">
                <div className="flex items-center justify-between mb-1">
                  <span 
                    className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors cursor-help"
                    title={dimInfo?.description}
                  >
                    {dim}
                  </span>
                  <span className="text-xs font-mono text-primary">
                    {dim}{level}
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBandColor(dim, level)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agency & Scaffolding */}
      <div className="border border-border rounded-xl bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Agency & Scaffolding
        </h3>

        <div className="space-y-4">
          {/* Agency Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Agency Score</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono text-primary">
                  {scaffolding?.agency_score?.toFixed(2) || '0.50'}
                </span>
                <TrendIcon trend={scaffolding?.trend} />
              </div>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-destructive via-yellow-500 to-green-500 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.max((scaffolding?.agency_score || 0.5) * 100, 8)}%`,
                  minWidth: '8px',
                  opacity: 0.8 
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Veel ondersteuning</span>
              <span>Zelfstandig</span>
            </div>
          </div>

          {/* Task Density Balance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">TD Balance</span>
              <span className="text-sm font-mono text-primary">
                {analysis?.task_density_balance?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full border-r border-background/50" />
                <div className="w-1/2 h-full" />
              </div>
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 absolute"
                style={{
                  width: '4px',
                  left: `calc(50% + ${(analysis?.task_density_balance || 0) * 50}% - 2px)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Level */}
      <div className="border border-border rounded-xl bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Cognitieve Status
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-[10px] text-muted-foreground uppercase">Knowledge</span>
            <p className="text-lg font-mono text-primary mt-1">
              K{currentBands['K'] || 2}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-[10px] text-muted-foreground uppercase">Epistemic</span>
            <p className="text-sm font-medium text-foreground mt-1 truncate">
              {analysis?.epistemic_status || 'ONBEKEND'}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-[10px] text-muted-foreground uppercase">Cognitief</span>
            <p className="text-sm font-medium text-foreground mt-1 truncate">
              {analysis?.cognitive_mode || 'ONBEKEND'}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3">
            <span className="text-[10px] text-muted-foreground uppercase">SRL State</span>
            <p className="text-sm font-medium text-foreground mt-1 truncate">
              {analysis?.srl_state || 'UNKNOWN'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Fix Suggestion */}
      {analysis?.active_fix && (
        <div className="border border-primary/30 rounded-xl bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-muted-foreground uppercase">Actieve Fix</span>
              <p className="text-sm text-foreground font-mono">{analysis.active_fix}</p>
            </div>
          </div>
        </div>
      )}

      {/* Scaffolding Advice */}
      {scaffolding?.advice && (
        <div className="border border-border rounded-xl bg-card p-4">
          <span className="text-xs text-muted-foreground uppercase">Scaffolding Advies</span>
          <p className="text-sm text-foreground mt-1">{scaffolding.advice}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
