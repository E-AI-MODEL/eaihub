// ============= OBSERVABILITY PANEL =============
// Fase 5: Edge vs Client ratio, Healing frequency, Knowledge_type distribution, Plugin usage.
// Trending charts (5.1–5.4) with day-bucketed time-series.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasActivePlugin, getActivePlugin } from '@/lib/ssotRuntime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, Activity, Layers, RotateCcw, CheckCircle, Clock,
  RefreshCw, Shield, FileText, Cpu, Zap, Brain, TrendingUp
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';

// ── Types ──

interface AnalysisSourceMetrics {
  total: number;
  edge: number;
  client: number;
  edgeRatio: number;
}

interface HealingMetrics {
  totalMessages: number;
  withHealing: number;
  healingRate: number;
  ssotHealingTotal: number;
  commandNullTotal: number;
  parseRepairTotal: number;
}

interface KnowledgeDistribution {
  K0: number;
  K1: number;
  K2: number;
  K3: number;
  total: number;
}

interface PluginUsageMetrics {
  totalPlugins: number;
  activePlugins: number;
  schools: { school_id: string; school_name: string; activeVersion: string | null; totalVersions: number }[];
  sessionsWithPlugin: number;
  sessionsWithoutPlugin: number;
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
  isFallback: boolean;
}

// ── Trend types ──

interface DailyEdgeClientTrend {
  date: string;
  edge: number;
  client: number;
}

interface DailyHealingTrend {
  date: string;
  totalHealing: number; // ssotHealing + commandNull + parseRepair
}

interface DailyBreachTrend {
  date: string;
  breaches: number;
  totalRuns: number;
  breachRate: number; // breaches / totalRuns * 100
}

interface DailyPluginCoverageTrend {
  date: string;
  withPlugin: number;
  withoutPlugin: number;
}

// ── Component ──

const ObservabilityPanel: React.FC = () => {
  const [sourceMetrics, setSourceMetrics] = useState<AnalysisSourceMetrics | null>(null);
  const [healingMetrics, setHealingMetrics] = useState<HealingMetrics | null>(null);
  const [knowledgeDist, setKnowledgeDist] = useState<KnowledgeDistribution | null>(null);
  const [pluginMetrics, setPluginMetrics] = useState<PluginUsageMetrics | null>(null);
  const [govMetrics, setGovMetrics] = useState<GovernanceMetrics | null>(null);
  const [runtimeMetrics, setRuntimeMetrics] = useState<RuntimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Trend state
  const [edgeClientTrend, setEdgeClientTrend] = useState<DailyEdgeClientTrend[]>([]);
  const [healingTrend, setHealingTrend] = useState<DailyHealingTrend[]>([]);
  const [breachTrend, setBreachTrend] = useState<DailyBreachTrend[]>([]);
  const [pluginCoverageTrend, setPluginCoverageTrend] = useState<DailyPluginCoverageTrend[]>([]);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [messagesRes, sessionsRes, pluginsRes, eventsRes] = await Promise.all([
        supabase.from('chat_messages').select('analysis, mechanical, role, created_at').eq('role', 'assistant').limit(1000),
        supabase.from('student_sessions').select('analysis, plugin_id, last_active_at').limit(1000),
        supabase.from('school_ssot').select('id, school_id, school_name, is_active, based_on_version, created_at').order('created_at', { ascending: false }),
        supabase.from('ssot_changes').select('id, action, plugin_id, previous_plugin_id, change_notes, created_at, school_id').order('created_at', { ascending: false }).limit(100),
      ]);

      const messages = messagesRes.data || [];
      const sessions = sessionsRes.data || [];
      const plugins = pluginsRes.data || [];
      const events = eventsRes.data || [];

      // ── 1. Edge vs Client Source (snapshot) ──
      let edgeCount = 0;
      let clientCount = 0;
      for (const m of messages) {
        const mech = m.mechanical as Record<string, unknown> | null;
        if (!mech) continue;
        const src = mech.analysisSource as string | undefined;
        if (src === 'edge') edgeCount++;
        else if (src === 'client') clientCount++;
      }
      const totalSourced = edgeCount + clientCount;
      setSourceMetrics({
        total: messages.length,
        edge: edgeCount,
        client: clientCount,
        edgeRatio: totalSourced > 0 ? Math.round((edgeCount / totalSourced) * 100) : 0,
      });

      // ── 2. Healing Frequency (snapshot) ──
      let withHealing = 0;
      let ssotH = 0, cmdN = 0, parseR = 0;
      for (const m of messages) {
        const mech = m.mechanical as Record<string, unknown> | null;
        if (!mech) continue;
        const sh = (mech.ssotHealingCount as number) || 0;
        const cn = (mech.commandNullCount as number) || 0;
        const pr = (mech.parseRepairCount as number) || 0;
        if (sh > 0 || cn > 0 || pr > 0) withHealing++;
        ssotH += sh;
        cmdN += cn;
        parseR += pr;
      }
      setHealingMetrics({
        totalMessages: messages.length,
        withHealing,
        healingRate: messages.length > 0 ? Math.round((withHealing / messages.length) * 100) : 0,
        ssotHealingTotal: ssotH,
        commandNullTotal: cmdN,
        parseRepairTotal: parseR,
      });

      // ── 3. Knowledge Type Distribution ──
      const kDist: KnowledgeDistribution = { K0: 0, K1: 0, K2: 0, K3: 0, total: 0 };
      for (const s of sessions) {
        const a = s.analysis as Record<string, unknown> | null;
        if (!a) continue;
        let kt = a.knowledge_type as string | undefined;
        if (!kt) {
          const bands = a.coregulation_bands as string[] | undefined;
          kt = bands?.find(b => typeof b === 'string' && b.startsWith('K'));
        }
        if (kt && kt in kDist) {
          kDist[kt as keyof Omit<KnowledgeDistribution, 'total'>]++;
          kDist.total++;
        }
      }
      setKnowledgeDist(kDist);

      // ── 4. Plugin Usage (snapshot) ──
      const schoolMap = new Map<string, { school_name: string; activeVersion: string | null; totalVersions: number }>();
      for (const p of plugins) {
        const existing = schoolMap.get(p.school_id);
        if (!existing) {
          schoolMap.set(p.school_id, { school_name: p.school_name, activeVersion: p.is_active ? p.id : null, totalVersions: 1 });
        } else {
          existing.totalVersions++;
          if (p.is_active) existing.activeVersion = p.id;
        }
      }
      const sessWithPlugin = sessions.filter(s => s.plugin_id).length;
      setPluginMetrics({
        totalPlugins: plugins.length,
        activePlugins: plugins.filter(p => p.is_active).length,
        schools: Array.from(schoolMap.entries()).map(([school_id, v]) => ({ school_id, ...v })),
        sessionsWithPlugin: sessWithPlugin,
        sessionsWithoutPlugin: sessions.length - sessWithPlugin,
      });

      // ── 5. Governance Events ──
      const byAction: Record<string, number> = {};
      for (const e of events) byAction[e.action] = (byAction[e.action] || 0) + 1;
      setGovMetrics({
        totalEvents: events.length,
        byAction,
        recentEvents: events.slice(0, 10),
      });

      // ── 6. Runtime ──
      const active = hasActivePlugin();
      const plugin = active ? getActivePlugin() : null;
      setRuntimeMetrics({
        hasPlugin: active,
        activePluginId: plugin?.id ?? null,
        activeSchool: plugin?.school_name ?? null,
        baseSSOTVersion: plugin?.based_on_version ?? null,
        isFallback: !active,
      });

      // ════════════════════════════════════════════
      // ── TRENDING: Day-bucketed time-series ──
      // ════════════════════════════════════════════

      // Helper: date string → "yyyy-MM-dd"
      const toDay = (iso: string | null) => {
        if (!iso) return null;
        try { return format(new Date(iso), 'yyyy-MM-dd'); } catch { return null; }
      };

      // -- 5.1 Edge vs Client trend --
      const ecMap = new Map<string, { edge: number; client: number }>();
      for (const m of messages) {
        const day = toDay(m.created_at);
        if (!day) continue;
        const mech = m.mechanical as Record<string, unknown> | null;
        const src = mech?.analysisSource as string | undefined;
        if (!src) continue;
        const bucket = ecMap.get(day) || { edge: 0, client: 0 };
        if (src === 'edge') bucket.edge++;
        else if (src === 'client') bucket.client++;
        ecMap.set(day, bucket);
      }
      setEdgeClientTrend(
        Array.from(ecMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))
      );

      // -- 5.3 Logic gate breach rate trend + 5.4 Healing trend --
      const brMap = new Map<string, { breaches: number; totalRuns: number }>();
      const hlMap = new Map<string, number>();
      for (const m of messages) {
        const day = toDay(m.created_at);
        if (!day) continue;
        const mech = m.mechanical as Record<string, unknown> | null;
        if (!mech) continue;

        // Breach counting
        const brBucket = brMap.get(day) || { breaches: 0, totalRuns: 0 };
        brBucket.totalRuns++;
        if (mech.logicGateBreach) brBucket.breaches++;
        brMap.set(day, brBucket);

        // Healing: total signal = ssotHealingCount + commandNullCount + parseRepairCount
        const totalHeal =
          ((mech.ssotHealingCount as number) || 0) +
          ((mech.commandNullCount as number) || 0) +
          ((mech.parseRepairCount as number) || 0);
        hlMap.set(day, (hlMap.get(day) || 0) + totalHeal);
      }
      setBreachTrend(
        Array.from(brMap.entries())
          .map(([date, v]) => ({
            date,
            breaches: v.breaches,
            totalRuns: v.totalRuns,
            breachRate: v.totalRuns > 0 ? Math.round((v.breaches / v.totalRuns) * 1000) / 10 : 0,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );
      setHealingTrend(
        Array.from(hlMap.entries())
          .map(([date, totalHealing]) => ({ date, totalHealing }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

      // -- 5.2 Plugin coverage trend (active session coverage based on last_active_at) --
      const pcMap = new Map<string, { withPlugin: number; withoutPlugin: number }>();
      for (const s of sessions) {
        const day = toDay(s.last_active_at);
        if (!day) continue;
        const bucket = pcMap.get(day) || { withPlugin: 0, withoutPlugin: 0 };
        if (s.plugin_id) bucket.withPlugin++;
        else bucket.withoutPlugin++;
        pcMap.set(day, bucket);
      }
      setPluginCoverageTrend(
        Array.from(pcMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date))
      );

    } catch (err) {
      console.error('[Observability] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Short date formatter for chart X-axis
  const fmtDate = (d: string) => {
    try { return format(new Date(d), 'dd/MM'); } catch { return d; }
  };

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

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard icon={<Zap className="w-4 h-4" />} label="Edge ratio" value={`${sourceMetrics?.edgeRatio ?? 0}%`} accent={sourceMetrics && sourceMetrics.edgeRatio >= 50 ? 'green' : 'yellow'} />
        <KPICard icon={<Cpu className="w-4 h-4" />} label="Healing rate" value={`${healingMetrics?.healingRate ?? 0}%`} accent={healingMetrics && healingMetrics.healingRate <= 10 ? 'green' : 'yellow'} />
        <KPICard icon={<Brain className="w-4 h-4" />} label="K-type samples" value={knowledgeDist?.total ?? 0} />
        <KPICard icon={<Layers className="w-4 h-4" />} label="Actieve plugins" value={pluginMetrics?.activePlugins ?? 0} accent="green" />
        <KPICard icon={<FileText className="w-4 h-4" />} label="Governance events" value={govMetrics?.totalEvents ?? 0} />
        <KPICard icon={<RotateCcw className="w-4 h-4" />} label="Rollbacks" value={govMetrics?.byAction['ROLLBACK'] ?? 0} accent={govMetrics?.byAction['ROLLBACK'] ? 'yellow' : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Edge vs Client Ratio (snapshot) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Edge vs Client Analyse-Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sourceMetrics && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Edge</span>
                      <span className="font-mono text-foreground">{sourceMetrics.edge}</span>
                    </div>
                    <Progress value={sourceMetrics.edgeRatio} className="h-3" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Client (fallback)</span>
                      <span className="font-mono text-foreground">{sourceMetrics.client}</span>
                    </div>
                    <Progress value={sourceMetrics.total > 0 ? 100 - sourceMetrics.edgeRatio : 0} className="h-3" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{sourceMetrics.total}</span> totaal berichten geanalyseerd.
                  {sourceMetrics.total - sourceMetrics.edge - sourceMetrics.client > 0 && (
                    <> <span className="font-medium text-foreground">{sourceMetrics.total - sourceMetrics.edge - sourceMetrics.client}</span> zonder bron-tag (legacy).</>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Healing Frequency (snapshot) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Healing Frequentie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healingMetrics && (
              <div className="space-y-3">
                <div className="text-center p-4 rounded-lg bg-secondary/30">
                  <span className={`text-3xl font-bold ${healingMetrics.healingRate <= 10 ? 'text-green-500' : healingMetrics.healingRate <= 30 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {healingMetrics.healingRate}%
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">van {healingMetrics.totalMessages} berichten had repair nodig</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <HealingBucket label="SSOT Healing" count={healingMetrics.ssotHealingTotal} />
                  <HealingBucket label="Command Null" count={healingMetrics.commandNullTotal} />
                  <HealingBucket label="Parse Repair" count={healingMetrics.parseRepairTotal} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Knowledge Type Distribution ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              Knowledge Type Distributie
            </CardTitle>
          </CardHeader>
          <CardContent>
            {knowledgeDist && knowledgeDist.total > 0 ? (
              <div className="space-y-3">
                {(['K0', 'K1', 'K2', 'K3'] as const).map(k => {
                  const count = knowledgeDist[k];
                  const pct = Math.round((count / knowledgeDist.total) * 100);
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">{k} — {K_LABELS[k]}</span>
                        <span className="font-mono text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground mt-2">{knowledgeDist.total} sessies met knowledge_type classificatie</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen knowledge_type data. Data verschijnt na actieve chat-sessies.</p>
            )}
          </CardContent>
        </Card>

        {/* ── Plugin Usage per School (snapshot) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Plugin Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pluginMetrics && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/30 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Sessies met plugin</span>
                    <span className="font-mono text-foreground">{pluginMetrics.sessionsWithPlugin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessies op base SSOT</span>
                    <span className="font-mono text-foreground">{pluginMetrics.sessionsWithoutPlugin}</span>
                  </div>
                </div>
                {pluginMetrics.schools.length > 0 ? (
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
                          {s.activeVersion && <span className="font-mono">id: {s.activeVersion.slice(0, 8)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen plugins gevonden.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* ── TRENDING CHARTS (5.1 – 5.4) ──          */}
      {/* ════════════════════════════════════════════ */}

      <div className="flex items-center gap-2 mt-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Trending over tijd</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── 5.1 Edge vs Client Trending ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              5.1 Edge vs Client per dag
            </CardTitle>
          </CardHeader>
          <CardContent>
            {edgeClientTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={edgeClientTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip labelFormatter={v => `Datum: ${v}`} />
                  <Area type="monotone" dataKey="edge" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.3)" name="Edge" />
                  <Area type="monotone" dataKey="client" stackId="1" stroke="hsl(45 93% 47%)" fill="hsl(45 93% 47% / 0.3)" name="Client" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen dagdata beschikbaar.</p>
            )}
          </CardContent>
        </Card>

        {/* ── 5.2 Plugin Coverage Trending ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              5.2 Plugin-sessie coverage per dag
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Actieve sessies (op basis van last_active_at)</p>
          </CardHeader>
          <CardContent>
            {pluginCoverageTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pluginCoverageTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip labelFormatter={v => `Datum: ${v}`} />
                  <Bar dataKey="withPlugin" stackId="1" fill="hsl(var(--primary))" name="Met plugin" />
                  <Bar dataKey="withoutPlugin" stackId="1" fill="hsl(var(--muted-foreground) / 0.4)" name="Base SSOT" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen dagdata beschikbaar.</p>
            )}
          </CardContent>
        </Card>

        {/* ── 5.3 Logic Gate Breach Rate Trending ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              5.3 Logic Gate Breach Rate per dag
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Breach rate = breaches / pipeline-runs die dag. Tooltip toont absoluut aantal.</p>
          </CardHeader>
          <CardContent>
            {breachTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={breachTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis unit="%" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    labelFormatter={v => `Datum: ${v}`}
                    formatter={(value: number, name: string, props: { payload: DailyBreachTrend }) => {
                      if (name === 'Breach rate') return [`${value}%`, `Rate (${props.payload.breaches} / ${props.payload.totalRuns})`];
                      return [value, name];
                    }}
                  />
                  <Line type="monotone" dataKey="breachRate" stroke="hsl(0 84% 60%)" strokeWidth={2} dot={{ r: 3 }} name="Breach rate" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen breach-data beschikbaar.</p>
            )}
          </CardContent>
        </Card>

        {/* ── 5.4 Healing Trending (total signal) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              5.4 Totaal Healing-signaal per dag
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">ssotHealing + commandNull + parseRepair</p>
          </CardHeader>
          <CardContent>
            {healingTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={healingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip labelFormatter={v => `Datum: ${v}`} />
                  <Area type="monotone" dataKey="totalHealing" stroke="hsl(45 93% 47%)" fill="hsl(45 93% 47% / 0.3)" name="Healing events" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Nog geen healing-data beschikbaar.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <RuntimeRow label="Plugin geladen" value={runtimeMetrics.hasPlugin ? 'Ja' : 'Nee (base SSOT)'} status={runtimeMetrics.hasPlugin ? 'ok' : 'warn'} />
              <RuntimeRow label="Modus" value={runtimeMetrics.isFallback ? 'Fallback / Base' : 'Plugin overlay'} status={runtimeMetrics.isFallback ? 'warn' : 'ok'} />
              {runtimeMetrics.activeSchool && <RuntimeRow label="School" value={runtimeMetrics.activeSchool} />}
              {runtimeMetrics.activePluginId && <RuntimeRow label="Plugin ID" value={runtimeMetrics.activePluginId.slice(0, 8)} mono />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Governance Events ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Governance Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {govMetrics && govMetrics.totalEvents > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {Object.entries(govMetrics.byAction).map(([action, count]) => (
                  <div key={action} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-secondary/30">
                    <Badge variant={action === 'ROLLBACK' ? 'destructive' : action.includes('ACTIVATED') ? 'default' : 'secondary'} className="text-[10px]">
                      {action}
                    </Badge>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Laatste events
                </h4>
                <div className="space-y-1.5">
                  {govMetrics.recentEvents.map(evt => (
                    <div key={evt.id} className="flex items-start gap-2 text-[11px] p-2 rounded bg-secondary/20">
                      <Badge variant={evt.action === 'ROLLBACK' ? 'destructive' : evt.action.includes('ACTIVATED') ? 'default' : 'secondary'} className="text-[9px] shrink-0 mt-0.5">
                        {evt.action}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-muted-foreground">{evt.plugin_id.slice(0, 8)}</span>
                        {evt.previous_plugin_id && <span className="text-muted-foreground"> ← {evt.previous_plugin_id.slice(0, 8)}</span>}
                        {evt.change_notes && <p className="text-foreground/70 mt-0.5 truncate">{evt.change_notes}</p>}
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(evt.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen governance events geregistreerd.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Constants ──

const K_LABELS: Record<string, string> = {
  K0: 'Ongedefinieerd',
  K1: 'Reproductie',
  K2: 'Toepassing',
  K3: 'Metacognitie',
};

// ── Sub-components ──

function KPICard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: number | string; accent?: 'green' | 'yellow' | 'red';
}) {
  const colorClass = accent === 'green' ? 'text-green-500' : accent === 'yellow' ? 'text-yellow-500' : accent === 'red' ? 'text-red-500' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={`flex justify-center mb-2 ${colorClass}`}>{icon}</div>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function HealingBucket({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-2 rounded bg-secondary/50 text-center">
      <p className={`text-lg font-bold ${count > 0 ? 'text-yellow-500' : 'text-green-500'}`}>{count}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
    </div>
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
