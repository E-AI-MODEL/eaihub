// ============= EITL WIZARD =============
// 5-step wizard for SUPERUSER to create/edit school SSOT plugins
// Steps: 1. Metadata  2. Band overrides  3. Commands  4. SRL & Gates  5. Review + Activate

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { BASE_SSOT, getSSOTVersion, getShortKey } from '@/data/ssot';
import { validatePlugin, type PluginJson } from '@/lib/ssotValidator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronLeft, ChevronRight, Save, CheckCircle, AlertTriangle,
  Layers, FileText, Terminal, BookOpen, Eye, X
} from 'lucide-react';

// ============= TYPES =============

interface WizardState {
  schoolId: string;
  schoolName: string;
  changeNotes: string;
  bandOverrides: Record<string, { label?: string; description?: string; didactic_principle?: string; fix?: string }>;
  commandOverrides: Record<string, string>;
  srlOverrides: Record<string, { label?: string; goal?: string }>;
  gateAnnotations: Record<string, { rationale?: string; teacher_note?: string }>;
}

interface EITLWizardProps {
  existingPlugin?: {
    id: string;
    school_id: string;
    school_name: string;
    plugin_json: PluginJson;
    change_notes: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const STEP_LABELS = ['Metadata', 'Bands', 'Commands', 'SRL & Gates', 'Review'];
const STEP_ICONS = [FileText, Layers, Terminal, BookOpen, Eye];

// ============= COMPONENT =============

const EITLWizard: React.FC<EITLWizardProps> = ({ existingPlugin, onClose, onSaved }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Expanded accordion state for band editing
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  // Initialize wizard state from existing plugin or empty
  const [state, setState] = useState<WizardState>(() => {
    if (existingPlugin) {
      const pj = existingPlugin.plugin_json;
      return {
        schoolId: existingPlugin.school_id,
        schoolName: existingPlugin.school_name,
        changeNotes: '',
        bandOverrides: pj.bands ? { ...pj.bands } : {},
        commandOverrides: pj.commands ? { ...pj.commands } : {},
        srlOverrides: pj.srl_states ? { ...pj.srl_states } : {},
        gateAnnotations: pj.logic_gate_annotations ? { ...pj.logic_gate_annotations } : {},
      };
    }
    return {
      schoolId: '',
      schoolName: '',
      changeNotes: '',
      bandOverrides: {},
      commandOverrides: {},
      srlOverrides: {},
      gateAnnotations: {},
    };
  });

  // ============= DERIVED DATA =============

  const dimensions = useMemo(() =>
    BASE_SSOT.rubrics.map(r => ({
      rubric_id: r.rubric_id,
      shortKey: getShortKey(r.rubric_id),
      name: r.name,
      bands: r.bands,
    })),
    []
  );

  const commands = useMemo(() => Object.entries(BASE_SSOT.command_library.commands), []);
  const srlStates = useMemo(() => BASE_SSOT.srl_model.states, []);
  const logicGates = useMemo(() => BASE_SSOT.interaction_protocol.logic_gates, []);

  // Build plugin JSON from wizard state
  const buildPluginJson = (): PluginJson => {
    const pj: PluginJson = {};

    // Filter out empty overrides
    const bands: Record<string, any> = {};
    for (const [id, overlay] of Object.entries(state.bandOverrides)) {
      const filtered: any = {};
      if (overlay.label?.trim()) filtered.label = overlay.label.trim();
      if (overlay.description?.trim()) filtered.description = overlay.description.trim();
      if (overlay.didactic_principle?.trim()) filtered.didactic_principle = overlay.didactic_principle.trim();
      if (overlay.fix?.trim()) filtered.fix = overlay.fix.trim();
      if (Object.keys(filtered).length > 0) bands[id] = filtered;
    }
    if (Object.keys(bands).length > 0) pj.bands = bands;

    const cmds: Record<string, string> = {};
    for (const [cmd, desc] of Object.entries(state.commandOverrides)) {
      if (desc.trim()) cmds[cmd] = desc.trim();
    }
    if (Object.keys(cmds).length > 0) pj.commands = cmds;

    const srl: Record<string, any> = {};
    for (const [id, overlay] of Object.entries(state.srlOverrides)) {
      const filtered: any = {};
      if (overlay.label?.trim()) filtered.label = overlay.label.trim();
      if (overlay.goal?.trim()) filtered.goal = overlay.goal.trim();
      if (Object.keys(filtered).length > 0) srl[id] = filtered;
    }
    if (Object.keys(srl).length > 0) pj.srl_states = srl;

    const gates: Record<string, any> = {};
    for (const [id, ann] of Object.entries(state.gateAnnotations)) {
      const filtered: any = {};
      if (ann.rationale?.trim()) filtered.rationale = ann.rationale.trim();
      if (ann.teacher_note?.trim()) filtered.teacher_note = ann.teacher_note.trim();
      if (Object.keys(filtered).length > 0) gates[id] = filtered;
    }
    if (Object.keys(gates).length > 0) pj.logic_gate_annotations = gates;

    return pj;
  };

  // Validation
  const validation = useMemo(() => {
    const pj = buildPluginJson();
    return validatePlugin(pj, BASE_SSOT);
  }, [state]);

  // Count overrides for summary
  const overrideCounts = useMemo(() => {
    const pj = buildPluginJson();
    return {
      bands: pj.bands ? Object.keys(pj.bands).length : 0,
      commands: pj.commands ? Object.keys(pj.commands).length : 0,
      srl: pj.srl_states ? Object.keys(pj.srl_states).length : 0,
      gates: pj.logic_gate_annotations ? Object.keys(pj.logic_gate_annotations).length : 0,
    };
  }, [state]);

  // ============= HANDLERS =============

  const updateBandOverride = (bandId: string, field: string, value: string) => {
    setState(prev => ({
      ...prev,
      bandOverrides: {
        ...prev.bandOverrides,
        [bandId]: {
          ...prev.bandOverrides[bandId],
          [field]: value,
        },
      },
    }));
  };

  const updateCommandOverride = (cmd: string, value: string) => {
    setState(prev => ({
      ...prev,
      commandOverrides: { ...prev.commandOverrides, [cmd]: value },
    }));
  };

  const updateSRLOverride = (stateId: string, field: string, value: string) => {
    setState(prev => ({
      ...prev,
      srlOverrides: {
        ...prev.srlOverrides,
        [stateId]: { ...prev.srlOverrides[stateId], [field]: value },
      },
    }));
  };

  const updateGateAnnotation = (bandId: string, field: string, value: string) => {
    setState(prev => ({
      ...prev,
      gateAnnotations: {
        ...prev.gateAnnotations,
        [bandId]: { ...prev.gateAnnotations[bandId], [field]: value },
      },
    }));
  };

  const handleSave = async (activate: boolean) => {
    if (!user) return;
    if (!state.schoolId.trim() || !state.schoolName.trim()) {
      toast({ title: 'Vul school-ID en -naam in', variant: 'destructive' });
      return;
    }
    if (existingPlugin && !state.changeNotes.trim()) {
      toast({ title: 'Wijzigingsnotitie verplicht', description: 'Beschrijf wat er veranderd is.', variant: 'destructive' });
      return;
    }

    const pluginJson = buildPluginJson();
    const val = validatePlugin(pluginJson, BASE_SSOT);
    if (!val.valid) {
      toast({ title: 'Validatie mislukt', description: val.issues.map(i => i.message).join('; '), variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      // Capture previous active plugin id for audit trail
      let previousPluginId: string | null = null;
      if (activate) {
        const { data: prev } = await supabase
          .from('school_ssot')
          .select('id')
          .eq('school_id', state.schoolId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        previousPluginId = prev?.id ?? null;

        if (previousPluginId) {
          await supabase
            .from('school_ssot')
            .update({ is_active: false })
            .eq('id', previousPluginId);
        }
      }

      const { data: newPlugin, error } = await supabase.from('school_ssot').insert({
        school_id: state.schoolId,
        school_name: state.schoolName,
        based_on_version: getSSOTVersion(),
        plugin_json: pluginJson as any,
        is_active: activate,
        change_notes: state.changeNotes.trim() || null,
        created_by: user.id,
      }).select('id').single();
      if (error) throw error;

      // Audit log
      const { error: auditErr } = await supabase.from('ssot_changes').insert({
        plugin_id: newPlugin.id,
        previous_plugin_id: previousPluginId,
        school_id: state.schoolId,
        action: activate ? 'CREATED_AND_ACTIVATED' : 'CREATED',
        performed_by: user.id,
        change_notes: state.changeNotes.trim() || null,
      });
      if (auditErr) console.error('[EITL Wizard] Audit insert failed:', auditErr);

      if (activate && previousPluginId) {
        await supabase.from('ssot_changes').insert({
          plugin_id: newPlugin.id,
          previous_plugin_id: previousPluginId,
          school_id: state.schoolId,
          action: 'ACTIVATED',
          performed_by: user.id,
          change_notes: `Activatie: vervangt versie ${previousPluginId.slice(0, 8)}`,
        });
      }

      toast({ title: activate ? 'Plugin opgeslagen en geactiveerd' : 'Plugin opgeslagen als concept' });
      onSaved();
    } catch (err: any) {
      console.error('[EITL Wizard] Save error:', err);
      toast({ title: 'Opslaan mislukt', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ============= STEP RENDERERS =============

  const renderStep0_Metadata = () => (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">School ID *</label>
        <Input
          value={state.schoolId}
          onChange={e => setState(prev => ({ ...prev, schoolId: e.target.value }))}
          placeholder="bijv. emmaus-rotterdam"
          disabled={!!existingPlugin}
          className="font-mono"
        />
        <p className="text-[10px] text-muted-foreground mt-1">Unieke identifier, niet meer wijzigbaar na aanmaken</p>
      </div>
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">Schoolnaam *</label>
        <Input
          value={state.schoolName}
          onChange={e => setState(prev => ({ ...prev, schoolName: e.target.value }))}
          placeholder="bijv. Emmauscollege Rotterdam"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground mb-1 block">
          Wijzigingsnotitie {existingPlugin ? '*' : ''}
        </label>
        <Textarea
          value={state.changeNotes}
          onChange={e => setState(prev => ({ ...prev, changeNotes: e.target.value }))}
          placeholder={existingPlugin ? "Beschrijf wat er veranderd is (verplicht bij bewerkingen)" : "Beschrijf wat er veranderd is (optioneel)"}
          rows={3}
        />
        {existingPlugin && !state.changeNotes.trim() && (
          <p className="text-[10px] text-destructive mt-1">Wijzigingsnotitie is verplicht bij bewerkingen</p>
        )}
      </div>
      <div className="p-3 rounded bg-secondary/30 border border-border text-xs">
        <span className="text-muted-foreground">Gebaseerd op SSOT versie: </span>
        <span className="font-mono text-primary font-bold">v{getSSOTVersion()}</span>
      </div>
    </div>
  );

  const renderStep1_Bands = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Klik op een dimensie om band-labels, beschrijvingen, didactische principes en fix-teksten aan te passen.
        Laat velden leeg om de base SSOT te behouden.
      </p>
      {dimensions.map(dim => {
        const isExpanded = expandedDimension === dim.rubric_id;
        const overrideCount = dim.bands.filter(b => {
          const o = state.bandOverrides[b.band_id];
          return o && (o.label?.trim() || o.description?.trim() || o.didactic_principle?.trim() || o.fix?.trim());
        }).length;

        return (
          <div key={dim.rubric_id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedDimension(isExpanded ? null : dim.rubric_id)}
              className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {dim.shortKey}
                </span>
                <span className="text-sm font-medium text-foreground">{dim.name}</span>
                {overrideCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{overrideCount} override{overrideCount > 1 ? 's' : ''}</Badge>
                )}
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            {isExpanded && (
              <div className="p-3 space-y-4 bg-background">
                {dim.bands.map(band => {
                  const overlay = state.bandOverrides[band.band_id] || {};
                  return (
                    <div key={band.band_id} className="p-3 rounded border border-border/50 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-xs font-mono text-primary font-bold">{band.band_id}</code>
                        <span className="text-[10px] text-muted-foreground">— {band.label}</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">
                          Label <span className="opacity-50">(base: {band.label})</span>
                        </label>
                        <Input
                          value={overlay.label || ''}
                          onChange={e => updateBandOverride(band.band_id, 'label', e.target.value)}
                          placeholder={band.label}
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">
                          Beschrijving <span className="opacity-50">(base: {band.description.slice(0, 60)}…)</span>
                        </label>
                        <Textarea
                          value={overlay.description || ''}
                          onChange={e => updateBandOverride(band.band_id, 'description', e.target.value)}
                          placeholder={band.description}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">
                          Didactisch principe <span className="opacity-50">(base: {band.didactic_principle.slice(0, 60)}…)</span>
                        </label>
                        <Textarea
                          value={overlay.didactic_principle || ''}
                          onChange={e => updateBandOverride(band.band_id, 'didactic_principle', e.target.value)}
                          placeholder={band.didactic_principle}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground block mb-0.5">
                          Fix-tekst <span className="opacity-50">(base: {band.fix.slice(0, 60)}…)</span>
                        </label>
                        <Textarea
                          value={overlay.fix || ''}
                          onChange={e => updateBandOverride(band.band_id, 'fix', e.target.value)}
                          placeholder={band.fix}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep2_Commands = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pas command-beschrijvingen aan. De command-keys (bijv. /checkin) zijn niet wijzigbaar.
        Laat leeg om de base SSOT te behouden.
      </p>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {commands.map(([cmd, baseDesc]) => (
          <div key={cmd} className="p-3 rounded border border-border/50 space-y-1">
            <code className="text-xs font-mono text-primary font-bold">{cmd}</code>
            <p className="text-[10px] text-muted-foreground">{String(baseDesc)}</p>
            <Textarea
              value={state.commandOverrides[cmd] || ''}
              onChange={e => updateCommandOverride(cmd, e.target.value)}
              placeholder="Schoolspecifieke beschrijving (optioneel)"
              rows={1}
              className="text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3_SRLAndGates = () => (
    <div className="space-y-6">
      {/* SRL States */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          SRL States
        </h4>
        <div className="space-y-2">
          {srlStates.map(s => {
            const overlay = state.srlOverrides[s.id] || {};
            return (
              <div key={s.id} className="p-3 rounded border border-border/50 space-y-2">
                <code className="text-xs font-mono text-primary font-bold">{s.id}</code>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">
                      Label <span className="opacity-50">(base: {s.label})</span>
                    </label>
                    <Input
                      value={overlay.label || ''}
                      onChange={e => updateSRLOverride(s.id, 'label', e.target.value)}
                      placeholder={s.label}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">
                      Goal <span className="opacity-50">(base: {s.goal.slice(0, 40)}…)</span>
                    </label>
                    <Input
                      value={overlay.goal || ''}
                      onChange={e => updateSRLOverride(s.id, 'goal', e.target.value)}
                      placeholder={s.goal}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logic Gate Annotations */}
      <div>
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          Logic Gate Annotations
        </h4>
        <p className="text-xs text-muted-foreground mb-2">
          Voeg toelichtingen toe voor docenten. Dit wijzigt de enforcement <strong>niet</strong>.
        </p>
        <div className="space-y-2">
          {logicGates.map((gate, idx) => {
            const ann = state.gateAnnotations[gate.trigger_band] || {};
            return (
              <div key={idx} className="p-3 rounded border border-border/50 space-y-2">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-primary font-bold">{gate.trigger_band}</code>
                  <Badge variant={gate.priority === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {gate.priority}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{gate.condition} — {gate.enforcement.slice(0, 80)}…</p>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Rationale (optioneel)</label>
                  <Textarea
                    value={ann.rationale || ''}
                    onChange={e => updateGateAnnotation(gate.trigger_band, 'rationale', e.target.value)}
                    placeholder="Waarom is deze gate belangrijk voor jullie school?"
                    rows={1}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Docentnotitie (optioneel)</label>
                  <Textarea
                    value={ann.teacher_note || ''}
                    onChange={e => updateGateAnnotation(gate.trigger_band, 'teacher_note', e.target.value)}
                    placeholder="Notitie voor docenten over deze gate"
                    rows={1}
                    className="text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep4_Review = () => {
    const pj = buildPluginJson();
    const val = validatePlugin(pj, BASE_SSOT);

    return (
      <div className="space-y-4">
        {/* Validation status */}
        <div className={`p-3 rounded border flex items-center gap-2 ${
          val.valid ? 'border-green-500/30 bg-green-500/10' : 'border-destructive/30 bg-destructive/10'
        }`}>
          {val.valid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
          <span className={`text-sm ${val.valid ? 'text-green-500' : 'text-destructive'}`}>
            {val.valid ? 'Plugin is geldig' : `${val.issues.length} validatiefout(en)`}
          </span>
        </div>

        {val.issues.length > 0 && (
          <div className="space-y-1">
            {val.issues.map((issue, idx) => (
              <div key={idx} className={`p-2 rounded text-xs ${
                issue.severity === 'ERROR' ? 'bg-destructive/10 text-destructive border border-destructive/30' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}>
                [{issue.layer}] {issue.message}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{overrideCounts.bands}</p>
            <p className="text-[10px] text-muted-foreground">Band overrides</p>
          </div>
          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{overrideCounts.commands}</p>
            <p className="text-[10px] text-muted-foreground">Command overrides</p>
          </div>
          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{overrideCounts.srl}</p>
            <p className="text-[10px] text-muted-foreground">SRL overrides</p>
          </div>
          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
            <p className="text-2xl font-bold text-primary">{overrideCounts.gates}</p>
            <p className="text-[10px] text-muted-foreground">Gate annotations</p>
          </div>
        </div>

        {/* Metadata summary */}
        <div className="p-3 rounded bg-secondary/30 border border-border text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">School</span>
            <span className="text-foreground font-medium">{state.schoolName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">School ID</span>
            <span className="font-mono text-foreground">{state.schoolId || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SSOT versie</span>
            <span className="font-mono text-primary">v{getSSOTVersion()}</span>
          </div>
          {state.changeNotes && (
            <div className="pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Notitie: </span>
              <span className="text-foreground">{state.changeNotes}</span>
            </div>
          )}
        </div>

        {/* Plugin JSON preview */}
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Plugin JSON preview ▸
          </summary>
          <pre className="mt-2 p-3 rounded bg-secondary/30 border border-border text-[10px] font-mono text-foreground overflow-auto max-h-60">
            {JSON.stringify(pj, null, 2)}
          </pre>
        </details>
      </div>
    );
  };

  // ============= RENDER =============

  const stepRenderers = [renderStep0_Metadata, renderStep1_Bands, renderStep2_Commands, renderStep3_SRLAndGates, renderStep4_Review];
  const canProceed = step === 0
    ? !!(state.schoolId.trim() && state.schoolName.trim() && (!existingPlugin || state.changeNotes.trim()))
    : true;

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            EITL Plugin Wizard
            {existingPlugin && <Badge variant="secondary" className="text-[10px]">Bewerken</Badge>}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-1 mt-3">
          {STEP_LABELS.map((label, idx) => {
            const Icon = STEP_ICONS[idx];
            return (
              <button
                key={idx}
                onClick={() => idx <= step && setStep(idx)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                  idx === step
                    ? 'bg-primary/20 text-primary font-bold'
                    : idx < step
                    ? 'text-primary/70 hover:bg-primary/10 cursor-pointer'
                    : 'text-muted-foreground cursor-default'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
        <Progress value={((step + 1) / STEP_LABELS.length) * 100} className="h-1 mt-2" />
      </CardHeader>
      <CardContent>
        {/* Step content */}
        <div className="min-h-[200px]">
          {stepRenderers[step]()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Vorige
          </Button>

          <div className="flex items-center gap-2">
            {step === STEP_LABELS.length - 1 ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(false)}
                  disabled={isSaving || !validation.valid}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Opslaan als concept
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSave(true)}
                  disabled={isSaving || !validation.valid}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Opslaan & activeren
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed}
              >
                Volgende
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EITLWizard;
