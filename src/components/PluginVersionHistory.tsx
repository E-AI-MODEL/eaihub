// ============= PLUGIN VERSION HISTORY =============
// Displays version history for a school's plugins with rollback capability.
// SUPERUSER-only: activate previous versions, view audit trail.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { clearSSOTCache, loadEffectiveSSOT } from '@/lib/ssotRuntime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  History, RotateCcw, CheckCircle, Clock, FileText, ChevronDown, ChevronRight
} from 'lucide-react';

interface PluginVersion {
  id: string;
  school_id: string;
  school_name: string;
  is_active: boolean;
  change_notes: string | null;
  based_on_version: string;
  created_at: string;
  created_by: string;
}

interface AuditEntry {
  id: string;
  plugin_id: string;
  previous_plugin_id: string | null;
  action: string;
  change_notes: string | null;
  created_at: string;
  performed_by: string;
}

interface PluginVersionHistoryProps {
  schoolId: string;
  onRollback: () => void;
}

const PluginVersionHistory: React.FC<PluginVersionHistoryProps> = ({ schoolId, onRollback }) => {
  const { user, isSuperUser, roles } = useAuth();
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [versionsRes, auditRes] = await Promise.all([
        supabase
          .from('school_ssot')
          .select('id, school_id, school_name, is_active, change_notes, based_on_version, created_at, created_by')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false }),
        supabase
          .from('ssot_changes')
          .select('*')
          .eq('school_id', schoolId)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(res => res as any),
      ]);

      setVersions((versionsRes.data as PluginVersion[]) || []);
      setAuditLog((auditRes.data as AuditEntry[]) || []);
    } catch (err) {
      console.error('[VersionHistory] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) loadData();
  }, [schoolId, loadData]);

  const handleActivate = async (versionId: string) => {
    if (!user || !isSuperUser) return;
    setIsActivating(versionId);

    try {
      // Find current active
      const currentActive = versions.find(v => v.is_active);

      // Deactivate current
      if (currentActive) {
        await supabase
          .from('school_ssot')
          .update({ is_active: false })
          .eq('id', currentActive.id);
      }

      // Activate selected
      await supabase
        .from('school_ssot')
        .update({ is_active: true })
        .eq('id', versionId);

      // Audit: ROLLBACK
      const { error: auditErr } = await supabase.from('ssot_changes').insert({
        plugin_id: versionId,
        previous_plugin_id: currentActive?.id ?? null,
        school_id: schoolId,
        action: 'ROLLBACK',
        performed_by: user.id,
        change_notes: `Rollback naar versie ${versionId.slice(0, 8)} (was: ${currentActive?.id?.slice(0, 8) ?? 'geen'})`,
      });
      if (auditErr) console.error('[VersionHistory] Audit insert failed:', auditErr);

      // Refresh cache
      clearSSOTCache();

      // Get profile for school_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();

      await loadEffectiveSSOT(profile?.school_id ?? undefined, user.id, roles);

      toast({ title: 'Versie geactiveerd', description: `Versie ${versionId.slice(0, 8)}… is nu actief.` });
      await loadData();
      onRollback();
    } catch (err: any) {
      console.error('[VersionHistory] Activate error:', err);
      toast({ title: 'Activering mislukt', description: err.message, variant: 'destructive' });
    } finally {
      setIsActivating(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Versiegeschiedenis laden...
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Versiegeschiedenis ({versions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {versions.map((v, idx) => (
              <div
                key={v.id}
                className={`p-3 rounded border text-xs ${
                  v.is_active
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border bg-secondary/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {v.is_active ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-mono text-foreground">{v.id.slice(0, 8)}</span>
                    {v.is_active && <Badge className="text-[10px]">Actief</Badge>}
                    {idx === 0 && !v.is_active && (
                      <Badge variant="secondary" className="text-[10px]">Nieuwste</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString('nl-NL', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {isSuperUser && !v.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px]"
                        disabled={!!isActivating}
                        onClick={() => handleActivate(v.id)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {isActivating === v.id ? 'Bezig...' : 'Activeer'}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-muted-foreground">
                  <span>SSOT v{v.based_on_version}</span>
                  {v.change_notes && (
                    <span className="text-foreground/70 truncate">— {v.change_notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      {auditLog.length > 0 && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowAudit(!showAudit)}
              className="w-full flex items-center justify-between"
            >
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Audit Trail ({auditLog.length})
              </CardTitle>
              {showAudit ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
          </CardHeader>
          {showAudit && (
            <CardContent>
              <div className="space-y-1.5">
                {auditLog.map(entry => (
                  <div key={entry.id} className="flex items-start gap-2 text-[11px] p-2 rounded bg-secondary/20">
                    <Badge
                      variant={entry.action === 'ROLLBACK' ? 'destructive' : entry.action === 'ACTIVATED' ? 'default' : 'secondary'}
                      className="text-[9px] shrink-0"
                    >
                      {entry.action}
                    </Badge>
                    <div className="min-w-0">
                      <span className="font-mono text-muted-foreground">{entry.plugin_id.slice(0, 8)}</span>
                      {entry.previous_plugin_id && (
                        <span className="text-muted-foreground"> ← {entry.previous_plugin_id.slice(0, 8)}</span>
                      )}
                      {entry.change_notes && (
                        <p className="text-foreground/70 mt-0.5 truncate">{entry.change_notes}</p>
                      )}
                    </div>
                    <span className="text-muted-foreground shrink-0 ml-auto">
                      {new Date(entry.created_at).toLocaleDateString('nl-NL', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default PluginVersionHistory;
