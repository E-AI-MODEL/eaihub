// ============= OBSERVABILITY PANEL =============
// Fase 5: Plugin usage metrics, governance event metrics, runtime metrics.
// Data sources: school_ssot, ssot_changes.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasActivePlugin, getActivePlugin } from '@/lib/ssotRuntime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Activity, Layers, RotateCcw, CheckCircle, Clock,
  RefreshCw, TrendingUp, Shield, FileText
} from 'lucide-react';

// ── Types ──

interface PluginUsageMetrics {
  totalPlugins: number;
  activePlugins: number;
  schools: { school_id: string; school_name: string; activeVersion: string | null; totalVersions: number }[];
}

interface GovernanceMetrics {
  totalEvents: number;
  byAction: Record<string, number>;
  recentEvents: {
    id: string;
    action: string;
    plugin_id: string;
    previous_plugin_id: string | null;
    change_notes: string | null;
    created_at: string;
    school_id: string;
  }[];
}

interface RuntimeMetrics {
  hasPlugin: boolean;
  activePluginId: string | null;
  activeSchool: string | null;
  baseSSOTVersion: string | null;
  pluginVersion: string | null;
  isFallback: boolean;
}

// ── Component ──

const ObservabilityPanel: React.FC = () => {
  const [pluginMetrics, setPluginMetrics] = useState<PluginUsageMetrics | null>(null);
  const [govMetrics, setGovMetrics] = useState<GovernanceMetrics | null>(null);
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // ── 1. Plugin Usage ──
      const { data: allPlugins } = await supabase
        .from('school_ssot')
        .select('id, school_id, school_name, is_active, based_on_version, created_at')
        .order('created_at', { ascending: false });

      const plugins = allPlugins || [];
      const schoolMap = new Map<string, { school_name: string; activeVersion: string | null; totalVersions: number }>();

      for (const p of plugins) {
        const existing = schoolMap.get(p.school_id);
        if (!existing) {
          schoolMap.set(p.school_id, {
            school_name: p.school_name,
            activeVersion: p.is_active ? p.id : null,
            totalVersions: 1,
          });
        } else {
          existing.totalVersions++;
          if (p.is_active) existing.activeVersion = p.id;
        }
      }

      const pluginUsage: PluginUsageMetrics = {
        totalPlugins: plugins.length,
        activePlugins: plugins.filter(p => p.is_active).length,
        schools: Array.from(schoolMap.entries()).map(([school_id, v]) => ({
          school_id,
          ...v,
        })),
      };

      // ── 2. Governance Events ──
      const { data: events } = await supabase
        .from('ssot_changes')
        .select('id, action, plugin_id, previous_plugin_id, change_notes, created_at, school_id')
        .order('created_at', { ascending: false })
        .limit(100);

      const evts = events || [];
      const byAction: Record<string, number> = {};
      for (const e of evts) {
        byAction[e.action] = (byAction[e.action] || 0) + 1;
      }

      const govData: GovernanceMetrics = {
        totalEvents: evts.length,
        byAction,
        recentEvents: evts.slice(0, 10),
      };

      // ── 3. Runtime ──
      const active = hasActivePlugin();
      const plugin = active ? getActivePlugin() : null;

      const runtime: RuntimeMetrics = {
        hasPlugin: active,
        activePluginId: plugin?.id ?? null,
        activeSchool: plugin?.school_name ?? null,
        baseSSOTVersion: plugin?.based_on_version ?? null,
        pluginVersion: plugin?.id?.slice(0, 8) ?? null,
        isFallback: !active,
      };

      setPluginMetrics(pluginUsage);
      setGovMetrics(govData);
      setRuntimeMetrics(runtime);
    } catch (err) {
      console.error('[Observability] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Observability Dashboard</h2>
        </div>
        <Button variant="outline" size="sm" onClick={loadMetrics} disabled={isLoading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          icon={<Layers className="w-4 h-4" />}
          label="Totaal plugins"
          value={pluginMetrics?.totalPlugins ?? 0}
        />
        <KPICard
          icon={<CheckCircle className="w-4 h-4" />}
          label="Actieve plugins"
          value={pluginMetrics?.activePlugins ?? 0}
          accent="green"
        />
        <KPICard
          icon={<FileText className="w-4 h-4" />}
          label="Governance events"
          value={govMetrics?.totalEvents ?? 0}
        />
        <KPICard
          icon={<RotateCcw className="w-4 h-4" />}
          label="Rollbacks"
          value={govMetrics?.byAction['ROLLBACK'] ?? 0}
          accent={govMetrics?.byAction['ROLLBACK'] ? 'yellow' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Plugin Usage per School ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Plugin Usage per School
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pluginMetrics && pluginMetrics.schools.length > 0 ? (
              <div className="space-y-2">
                {pluginMetrics.schools.map(s => (
                  <div key={s.school_id} className="p-3 rounded border border-border bg-secondary/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{s.school_name}</span>
                      <Badge variant={s.activeVersion ? 'default' : 'secondary'} className="text-[10px]">
                        {s.activeVersion ? 'Actief' : 'Geen actief'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{s.totalVersions} versie{s.totalVersions !== 1 ? 's' : ''}</span>
                      {s.activeVersion && (
                        <span className="font-mono">actief: {s.activeVersion.slice(0, 8)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Geen plugins gevonden.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Runtime Status ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Runtime Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {runtimeMetrics && (
              <div className="space-y-3">
                <RuntimeRow label="Plugin geladen" value={runtimeMetrics.hasPlugin ? 'Ja' : 'Nee (base SSOT)'}
                  status={runtimeMetrics.hasPlugin ? 'ok' : 'warn'} />
                <RuntimeRow label="Modus" value={runtimeMetrics.isFallback ? 'Fallback / Base' : 'Plugin overlay'}
                  status={runtimeMetrics.isFallback ? 'warn' : 'ok'} />
                {runtimeMetrics.activeSchool && (
                  <RuntimeRow label="School" value={runtimeMetrics.activeSchool} />
                )}
                {runtimeMetrics.activePluginId && (
                  <RuntimeRow label="Plugin ID" value={runtimeMetrics.activePluginId.slice(0, 8)} mono />
                )}
                {runtimeMetrics.baseSSOTVersion && (
                  <RuntimeRow label="Base SSOT versie" value={`v${runtimeMetrics.baseSSOTVersion}`} mono />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Governance Event Breakdown ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Governance Events Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {govMetrics && govMetrics.totalEvents > 0 ? (
            <div className="space-y-4">
              {/* Action distribution */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(govMetrics.byAction).map(([action, count]) => (
                  <div key={action} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary/30">
                    <Badge
                      variant={action === 'ROLLBACK' ? 'destructive' : action.includes('ACTIVATED') ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {action}
                    </Badge>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </div>

              {/* Recent events timeline */}
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Laatste events
                </h4>
                <div className="space-y-1.5">
                  {govMetrics.recentEvents.map(evt => (
                    <div key={evt.id} className="flex items-start gap-2 text-[11px] p-2 rounded bg-secondary/20">
                      <Badge
                        variant={evt.action === 'ROLLBACK' ? 'destructive' : evt.action.includes('ACTIVATED') ? 'default' : 'secondary'}
                        className="text-[9px] shrink-0 mt-0.5"
                      >
                        {evt.action}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-muted-foreground">{evt.plugin_id.slice(0, 8)}</span>
                        {evt.previous_plugin_id && (
                          <span className="text-muted-foreground"> ← {evt.previous_plugin_id.slice(0, 8)}</span>
                        )}
                        {evt.change_notes && (
                          <p className="text-foreground/70 mt-0.5 truncate">{evt.change_notes}</p>
                        )}
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(evt.created_at).toLocaleDateString('nl-NL', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen governance events geregistreerd. Events verschijnen na het aanmaken, activeren of rollbacken van plugins.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Sub-components ──

function KPICard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number; accent?: 'green' | 'yellow' | 'red';
}) {
  const colorClass = accent === 'green' ? 'text-green-500' : accent === 'yellow' ? 'text-yellow-500' : accent === 'red' ? 'text-red-500' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={`flex justify-center mb-2 ${colorClass}`}>{icon}</div>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function RuntimeRow({ label, value, status, mono }: {
  label: string; value: string; status?: 'ok' | 'warn'; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
      <span className="text-sm text-foreground">{label}</span>
      <span className={`text-xs ${mono ? 'font-mono' : ''} ${
        status === 'ok' ? 'text-green-500' : status === 'warn' ? 'text-yellow-500' : 'text-muted-foreground'
      }`}>
        {value}
      </span>
    </div>
  );
}

export default ObservabilityPanel;
