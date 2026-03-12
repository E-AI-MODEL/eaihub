import { useState, useEffect } from 'react';
import { Shield, Database, Cpu, Activity, CheckCircle, AlertTriangle, BookOpen, Trash2, Download, RefreshCw, HardDrive, Zap, Terminal, Eye, XCircle, MessageSquare, Users, BarChart3, ChevronDown, ChevronRight, Layers, Plus, Edit, Wrench, Info, Clock } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import EITLWizard from '@/components/EITLWizard';
import PluginVersionHistory from '@/components/PluginVersionHistory';
import ObservabilityPanel from '@/components/ObservabilityPanel';
import AdminUsersTab from '@/components/AdminUsersTab';
import RoleRequestsReviewTab from '@/components/RoleRequestsReviewTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { getSSOTVersion, getCommands, getLogicGates, getCycleOrder, getRubric, getShortKey, BASE_SSOT } from '@/data/ssot';
import { getEffectiveSSOT, getActivePlugin, hasActivePlugin, getAllGateAnnotations, clearSSOTCache } from '@/lib/ssotRuntime';
import { 
  runSystemAudit, 
  getStorageInspectorData, 
  deleteStorageItem, 
  performAdminAction,
  type SystemHealth,
  type StorageItem
} from '@/services/adminService';
import {
  fetchAllSessionsAdmin, deleteSession, deleteAllSessions, deleteOfflineSessions,
  fetchChatMessages, deleteChatMessage, deleteAllChatMessages,
  deleteTeacherMessage,
} from '@/services/adminDbService';
import { toast } from '@/hooks/use-toast';

// ── Helper components for structured expanded rows ──
const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <span className="text-muted-foreground">{label}: </span>
    <span className="text-foreground font-medium">{value || '—'}</span>
  </div>
);

const CollapsibleSection = ({ title, defaultOpen = false, nested = false, children }: { title: string; defaultOpen?: boolean; nested?: boolean; children: React.ReactNode }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={nested ? 'mt-1.5' : 'rounded border border-border bg-background p-2'}>
      <CollapsibleTrigger className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer w-full">
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const AdminPanel = () => {
  const { isSuperUser, user } = useAuth();
  const [adminSchoolId, setAdminSchoolId] = useState<string | null>(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [selectedStorageItem, setSelectedStorageItem] = useState<StorageItem | null>(null);
  // Database tab state
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  const [dbMessages, setDbMessages] = useState<any[]>([]);
  const [dbFilter, setDbFilter] = useState('');
  const [dbLoading, setDbLoading] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  // EITL Wizard state
  const [showWizard, setShowWizard] = useState(false);

  // Resolve admin's school_id for version history
  useEffect(() => {
    const resolveSchoolId = async () => {
      if (!user) return;
      // Try active plugin first
      if (hasActivePlugin()) {
        setAdminSchoolId(getActivePlugin()!.school_id);
        return;
      }
      // Fallback: profile school_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.school_id) {
        setAdminSchoolId(profile.school_id);
        return;
      }
      // Fallback: any school_ssot record (superuser)
      if (isSuperUser) {
        const { data } = await supabase
          .from('school_ssot')
          .select('school_id')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) setAdminSchoolId(data.school_id);
      }
    };
    resolveSchoolId();
  }, [user, isSuperUser]);

  // Fetch pending role request count
  const fetchPendingCount = async () => {
    const { count } = await supabase
      .from('role_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING');
    setPendingRequestCount(count ?? 0);
  };

  useEffect(() => { fetchPendingCount(); }, []);

  // Load system data on mount
  useEffect(() => {
    loadSystemData();
  }, []);

  const loadSystemData = async () => {
    setIsLoading(true);
    try {
      const [health, storage] = await Promise.all([
        runSystemAudit(),
        Promise.resolve(getStorageInspectorData())
      ]);
      setSystemHealth(health);
      setStorageItems(storage);
    } catch (error) {
      console.error('Failed to load system data:', error);
      toast({
        title: 'Fout bij laden',
        description: 'Kon systeemdata niet ophalen.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminAction = async (action: 'CLEAR_CACHE' | 'EXPORT_LOGS' | 'RESET_IDENTITY' | 'FIX_CORRUPTION') => {
    setIsRunningAction(true);
    try {
      const result = await performAdminAction(action);
      toast({
        title: result.success ? 'Actie voltooid' : 'Actie mislukt',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
      // Reload data after action
      await loadSystemData();
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Actie kon niet worden uitgevoerd.',
        variant: 'destructive'
      });
    } finally {
      setIsRunningAction(false);
    }
  };

  const handleDeleteStorageItem = (key: string) => {
    deleteStorageItem(key);
    setStorageItems(prev => prev.filter(item => item.key !== key));
    setSelectedStorageItem(null);
    toast({
      title: 'Verwijderd',
      description: `Key "${key}" verwijderd uit localStorage.`
    });
  };

  // Database tab loaders
  const loadDbData = async () => {
    setDbLoading(true);
    try {
      const [sessions, messages] = await Promise.all([
        fetchAllSessionsAdmin(),
        fetchChatMessages(dbFilter || undefined),
      ]);
      setDbSessions(sessions);
      setDbMessages(messages);
    } catch (e) {
      console.error('DB load error:', e);
    } finally {
      setDbLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast({ title: 'Sessie verwijderd', description: `Sessie ${sessionId.slice(0, 8)}... en bijbehorende berichten verwijderd.` });
      loadDbData();
    } catch { toast({ title: 'Fout', variant: 'destructive' }); }
  };

  const handleBulkAction = async (action: 'all' | 'offline' | 'messages') => {
    setIsRunningAction(true);
    try {
      if (action === 'all') await deleteAllSessions();
      else if (action === 'offline') await deleteOfflineSessions();
      else if (action === 'messages') await deleteAllChatMessages();
      toast({ title: 'Voltooid', description: `${action} verwijderd.` });
      loadDbData();
    } catch { toast({ title: 'Fout', variant: 'destructive' }); }
    finally { setIsRunningAction(false); }
  };


  const effectiveSSOT = getEffectiveSSOT();
  const ssotDimensions = effectiveSSOT.rubrics.map(rubric => ({
    code: rubric.bands[0]?.band_id?.replace(/\d+/g, '') || rubric.rubric_id.toUpperCase().slice(0, 2),
    name: rubric.name,
    description: rubric.bands.map(b => b.label).join(' → '),
    bandCount: rubric.bands.length,
    bands: rubric.bands
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL': return 'text-green-500';
      case 'COMPROMISED': return 'text-red-500';
      case 'OK': return 'text-green-500';
      case 'WARNING': return 'text-yellow-500';
      case 'CRITICAL': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStorageTypeColor = (type: StorageItem['type']) => {
    switch (type) {
      case 'PROFILE': return 'bg-blue-500/20 text-blue-400';
      case 'MASTERY': return 'bg-green-500/20 text-green-400';
      case 'SESSION': return 'bg-purple-500/20 text-purple-400';
      case 'SYSTEM': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Systeembeheer, Diagnostics & SSOT Browser</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSystemData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <Shield className="w-3 h-3 text-green-500" />
              <span className="text-xs font-mono text-green-500 hidden sm:inline">Admin Access</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-secondary border border-border w-full overflow-x-auto flex justify-start">
            {/* Bestuurlijk */}
            <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">
              <Users className="w-3 h-3 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Gebruikers</span><span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm whitespace-nowrap">
              <Clock className="w-3 h-3 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">Aanvragen</span><span className="sm:hidden">Reqs</span>
            </TabsTrigger>
            <span className="self-center mx-1 text-border">│</span>
            {/* Technisch */}
            <TabsTrigger value="monitoring" className="text-xs sm:text-sm whitespace-nowrap"><span className="hidden sm:inline">System </span>Health</TabsTrigger>
            <TabsTrigger value="database" onClick={loadDbData} className="text-xs sm:text-sm whitespace-nowrap">Database</TabsTrigger>
            <TabsTrigger value="pipeline" onClick={loadDbData} className="text-xs sm:text-sm whitespace-nowrap">Pipeline</TabsTrigger>
            <TabsTrigger value="storage" className="text-xs sm:text-sm whitespace-nowrap">Storage<span className="hidden sm:inline"> Inspector</span></TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm whitespace-nowrap"><span className="hidden sm:inline">Admin </span>Actions</TabsTrigger>
            <TabsTrigger value="ssot" className="text-xs sm:text-sm whitespace-nowrap">SSOT<span className="hidden sm:inline"> Browser</span></TabsTrigger>
            <TabsTrigger value="eitl" className="text-xs sm:text-sm whitespace-nowrap">EITL<span className="hidden sm:inline"> Plugin</span></TabsTrigger>
            <TabsTrigger value="observability" className="text-xs sm:text-sm whitespace-nowrap"><span className="hidden sm:inline">Observ</span>ability</TabsTrigger>
          </TabsList>

          {/* Users Tab — bestuurlijk */}
          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>

          {/* Role Requests Tab — bestuurlijk */}
          <TabsContent value="requests">
            <RoleRequestsReviewTab />
          </TabsContent>

          {/* System Monitoring Tab */}
          <TabsContent value="monitoring">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Integrity Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      System Integrity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <span className={`text-5xl font-bold ${
                        systemHealth.integrityScore >= 80 ? 'text-green-500' :
                        systemHealth.integrityScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {systemHealth.integrityScore}%
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">Integrity Score</p>
                    </div>
                    <Progress 
                      value={systemHealth.integrityScore} 
                      className="h-2 mb-4"
                    />
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.activeRubrics}</p>
                        <p className="text-[10px] text-muted-foreground">Rubrics</p>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.activeCommands}</p>
                        <p className="text-[10px] text-muted-foreground">Commands</p>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.activeGates}</p>
                        <p className="text-[10px] text-muted-foreground">Logic Gates</p>
                      </div>
                      <div className="p-2 rounded bg-secondary/50">
                        <p className="text-lg font-bold text-foreground">{systemHealth.curriculumNodes}</p>
                        <p className="text-[10px] text-muted-foreground">Curriculum Nodes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Runtime Telemetry */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary" />
                      Runtime Telemetry
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Logic Engine</span>
                        </div>
                        <span className={`text-xs font-mono ${getStatusColor(systemHealth.telemetry.logicEngineStatus)}`}>
                          {systemHealth.telemetry.logicEngineStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Terminal className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Gateway bereikbaar</span>
                        </div>
                        <span className={`text-xs font-mono ${systemHealth.telemetry.edgeFunctionReachable ? 'text-green-500' : 'text-yellow-500'}`}>
                          {systemHealth.telemetry.edgeFunctionReachable ? 'REACHABLE' : 'UNREACHABLE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Fallback Mode</span>
                        </div>
                        <span className={`text-xs font-mono ${systemHealth.telemetry.isFallbackActive ? 'text-yellow-500' : 'text-green-500'}`}>
                          {systemHealth.telemetry.isFallbackActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="w-4 h-4 text-primary" />
                          <span className="text-sm text-foreground">Last Self-Test</span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {new Date(systemHealth.telemetry.lastSelfTest).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Browser Environment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      Browser Environment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform</span>
                        <span className="text-foreground">{systemHealth.browser.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Screen</span>
                        <span className="text-foreground">{systemHealth.browser.screen}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connection</span>
                        <span className="text-foreground">{systemHealth.browser.connection}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Memory</span>
                        <span className="text-foreground">{systemHealth.browser.memory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU Cores</span>
                        <span className="text-foreground">{systemHealth.browser.hardwareConcurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cookies</span>
                        <span className={systemHealth.browser.cookiesEnabled ? 'text-green-500' : 'text-red-500'}>
                          {systemHealth.browser.cookiesEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                      System Issues ({systemHealth.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {systemHealth.issues.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Geen problemen gedetecteerd</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {systemHealth.issues.map((issue, idx) => (
                          <div 
                            key={idx}
                            className={`p-2 rounded text-xs ${
                              issue.includes('CRITICAL') 
                                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                            }`}
                          >
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    Database Beheer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Button variant="outline" size="sm" onClick={loadDbData} disabled={dbLoading}>
                      <RefreshCw className={`w-3 h-3 mr-1 ${dbLoading ? 'animate-spin' : ''}`} /> Vernieuw
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleBulkAction('all')} disabled={isRunningAction}>
                      <Trash2 className="w-3 h-3 mr-1" /> Wis alle sessies
                    </Button>
                    <Button variant="outline" size="sm" className="border-destructive/50 text-destructive" onClick={() => handleBulkAction('offline')} disabled={isRunningAction}>
                      <Trash2 className="w-3 h-3 mr-1" /> Wis offline sessies
                    </Button>
                    <Button variant="outline" size="sm" className="border-destructive/50 text-destructive" onClick={() => handleBulkAction('messages')} disabled={isRunningAction}>
                      <MessageSquare className="w-3 h-3 mr-1" /> Wis alle chatberichten
                    </Button>
                  </div>
                  <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                    <Users className="w-3 h-3" /> Sessies ({dbSessions.length})
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded mb-6">
                    <table className="w-full text-[10px]">
                      <thead className="bg-secondary/50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Naam</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Vak</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Status</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Berichten</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Laatst actief</th>
                          <th className="px-2 py-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbSessions.map((s: any) => (
                          <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                            <td className="px-2 py-1.5 text-foreground">{s.name || 'Anoniem'}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{s.subject || '—'} {s.level || ''}</td>
                            <td className="px-2 py-1.5">
                              <Badge className={`text-[8px] ${s.status === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>{s.status}</Badge>
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground">{s.messages_count}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">
                              {s.last_active_at ? new Date(s.last_active_at).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '—'}
                            </td>
                            <td className="px-2 py-1.5">
                              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive" onClick={() => handleDeleteSession(s.session_id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        {dbSessions.length === 0 && (
                          <tr><td colSpan={6} className="px-2 py-4 text-center text-muted-foreground">Geen sessies</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" /> Chatberichten ({dbMessages.length})
                  </h3>
                  <div className="max-h-[300px] overflow-y-auto border border-border rounded">
                     <table className="w-full text-[10px]">
                      <thead className="bg-secondary/50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Rol</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Inhoud</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Phase</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">TD</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">K</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">gF</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Epist.</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Rep.</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Tijd</th>
                          <th className="px-2 py-1"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbMessages.slice(0, 100).map((m: any) => {
                          const analysis = m.analysis as any;
                          const mechanical = m.mechanical as any;
                          const phase = analysis?.process_phases?.[0] ?? null;
                          const td = analysis?.task_densities?.[0] ?? null;
                          const kLevel = analysis?.coregulation_bands?.find((b: string) => b?.startsWith('K')) ?? null;
                          const gFactor = mechanical?.semanticValidation?.gFactor ?? null;
                          const epistemic = analysis?.epistemic_status ?? null;
                          const repairs = mechanical?.repairAttempts ?? null;
                          const isExpanded = expandedMessageId === m.id;
                          return (
                            <tr key={m.id} className="border-t border-border hover:bg-secondary/30 cursor-pointer" onClick={() => setExpandedMessageId(isExpanded ? null : m.id)}>
                              <td className="px-2 py-1.5">
                                <Badge className={`text-[8px] ${m.role === 'user' ? 'bg-blue-500/20 text-blue-400' : m.role === 'model' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-400'}`}>{m.role}</Badge>
                              </td>
                              <td className="px-2 py-1.5 text-foreground max-w-[200px] truncate">{m.content}</td>
                              <td className="px-2 py-1.5">{phase ? <Badge variant="outline" className="text-[8px]">{phase}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{td ? <Badge variant="outline" className="text-[8px]">{td}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{kLevel ? <Badge variant="outline" className="text-[8px]">{kLevel}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{gFactor !== null ? <span className={`text-[9px] font-mono ${gFactor >= 0.8 ? 'text-green-500' : gFactor >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>{(gFactor * 100).toFixed(0)}%</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{epistemic ? <Badge variant="outline" className="text-[8px]">{epistemic}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{repairs !== null && repairs > 0 ? <Badge className="text-[8px] bg-yellow-500/20 text-yellow-400">{repairs}</Badge> : <span className="text-muted-foreground">0</span>}</td>
                              <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                                {new Date(m.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-2 py-1.5 flex items-center gap-1">
                                {(analysis || mechanical) && (isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />)}
                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-destructive/20 hover:text-destructive" onClick={async (e) => { e.stopPropagation(); await deleteChatMessage(m.id); loadDbData(); }}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Expanded JSON preview row */}
                        {dbMessages.slice(0, 100).map((m: any) => {
                          if (expandedMessageId !== m.id || (!m.analysis && !m.mechanical)) return null;
                          const mech = m.mechanical || {};
                          const anal = m.analysis || {};
                          const ssotHealing = mech.ssotHealingCount ?? 0;
                          const cmdNull = mech.commandNullCount ?? 0;
                          const parseRepair = mech.parseRepairCount ?? 0;
                          const totalRepairs = ssotHealing + cmdNull + parseRepair;
                          const penalties: string[] = mech.semanticValidation?.penalties ?? [];
                          const hasLogicBreach = !!mech.logicGateBreach;

                          return (
                            <tr key={`${m.id}-expand`} className="border-t border-border bg-secondary/20">
                              <td colSpan={10} className="px-3 py-3">
                                <div className="space-y-2">
                                  {/* ── Repair Summary (always visible when relevant) ── */}
                                  {(totalRepairs > 0 || hasLogicBreach || penalties.length > 0) && (
                                    <div className="rounded border border-border bg-background p-2 space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">
                                        <Wrench className="w-3 h-3" /> Repair Summary
                                      </div>
                                      <div className="flex flex-wrap gap-1.5">
                                        <Badge className={`text-[8px] ${ssotHealing > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                          SSOT Healing: {ssotHealing}
                                        </Badge>
                                        <Badge className={`text-[8px] ${cmdNull > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                          Command Null: {cmdNull}
                                        </Badge>
                                        <Badge className={`text-[8px] ${parseRepair > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                                          Parse Repair: {parseRepair}
                                        </Badge>
                                        {hasLogicBreach && (
                                          <Badge className="text-[8px] bg-red-500/20 text-red-400">
                                            Logic Gate Breach: {mech.logicGateBreach?.trigger_band} ({mech.logicGateBreach?.priority})
                                          </Badge>
                                        )}
                                      </div>
                                      {penalties.length > 0 && (
                                        <div className="mt-1">
                                          <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Redenen:</p>
                                          <ul className="list-disc list-inside text-[9px] text-muted-foreground space-y-0.5">
                                            {penalties.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* ── Analysis (collapsible) ── */}
                                  {m.analysis && (
                                    <CollapsibleSection title="Analysis" defaultOpen={false}>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[9px]">
                                        <Field label="Fases" value={anal.process_phases?.join(', ')} />
                                        <Field label="Active Fix" value={anal.active_fix} />
                                        <Field label="Epistemic" value={anal.epistemic_status} />
                                        <Field label="Confidence" value={anal.confidence != null ? `${(anal.confidence * 100).toFixed(0)}%` : null} />
                                        <Field label="Knowledge Type" value={anal.knowledge_type} />
                                        <Field label="Cognitive Mode" value={anal.cognitive_mode} />
                                        <Field label="SRL" value={anal.srl_state} />
                                        <Field label="Secondary" value={anal.secondary_dimensions?.join(', ')} />
                                      </div>
                                      {anal.borderline_dimensions?.length > 0 && (
                                        <p className="text-[9px] text-yellow-400 mt-1">Borderline: {anal.borderline_dimensions.join(', ')}</p>
                                      )}
                                      <CollapsibleSection title="Toon JSON" defaultOpen={false} nested>
                                        <pre className="text-[8px] font-mono text-muted-foreground bg-background p-1.5 rounded max-h-32 overflow-auto">{JSON.stringify(m.analysis, null, 2)}</pre>
                                      </CollapsibleSection>
                                    </CollapsibleSection>
                                  )}

                                  {/* ── Mechanical (collapsible) ── */}
                                  {m.mechanical && (
                                    <CollapsibleSection title="Mechanical" defaultOpen={false}>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[9px]">
                                        <Field label="Model" value={mech.model} />
                                        <Field label="Latency" value={mech.latencyMs != null ? `${mech.latencyMs}ms` : null} />
                                        <Field label="Tokens" value={mech.inputTokens != null ? `${mech.inputTokens}→${mech.outputTokens}` : null} />
                                        <Field label="Source" value={mech.analysisSource} />
                                        <Field label="Router" value={mech.routerDecision ? `${mech.routerDecision.target_model} (${mech.routerDecision.intent_category})` : null} />
                                        <Field label="Epistemic Guard" value={mech.epistemicGuardResult ? `${mech.epistemicGuardResult.label} (${(mech.epistemicGuardResult.confidence * 100).toFixed(0)}%)` : null} />
                                        <Field label="G-Factor" value={mech.semanticValidation?.gFactor != null ? `${(mech.semanticValidation.gFactor * 100).toFixed(0)}%` : null} />
                                        <Field label="Alignment" value={mech.semanticValidation?.alignment_status} />
                                      </div>
                                      <CollapsibleSection title="Toon JSON" defaultOpen={false} nested>
                                        <pre className="text-[8px] font-mono text-muted-foreground bg-background p-1.5 rounded max-h-32 overflow-auto">{JSON.stringify(m.mechanical, null, 2)}</pre>
                                      </CollapsibleSection>
                                    </CollapsibleSection>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {dbMessages.length === 0 && (
                          <tr><td colSpan={10} className="px-2 py-4 text-center text-muted-foreground">Geen berichten</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline / Reliability Tab */}
          <TabsContent value="pipeline">
            <div className="space-y-6">
              {/* Aggregated Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const modelMsgs = dbMessages.filter((m: any) => m.role === 'model');
                  const withMech = modelMsgs.filter((m: any) => m.mechanical);
                  const withAnalysis = modelMsgs.filter((m: any) => m.analysis);

                  const repairCount = withMech.filter((m: any) => (m.mechanical?.repairAttempts ?? 0) > 0).length;
                  const gFactors = withMech.map((m: any) => m.mechanical?.semanticValidation?.gFactor).filter((g: any) => g != null) as number[];
                  const avgGFactor = gFactors.length > 0 ? gFactors.reduce((a: number, b: number) => a + b, 0) / gFactors.length : null;

                  const alignments = withMech.map((m: any) => m.mechanical?.semanticValidation?.alignment_status).filter(Boolean);
                  const optimalCount = alignments.filter((a: string) => a === 'OPTIMAL').length;
                  const driftCount = alignments.filter((a: string) => a === 'DRIFT').length;
                  const criticalCount = alignments.filter((a: string) => a === 'CRITICAL').length;

                  const epistemics = withAnalysis.map((m: any) => m.analysis?.epistemic_status).filter(Boolean);
                  const feitCount = epistemics.filter((e: string) => e === 'FEIT').length;
                  const interpCount = epistemics.filter((e: string) => e === 'INTERPRETATIE').length;
                  const specCount = epistemics.filter((e: string) => e === 'SPECULATIE').length;
                  const onbekendCount = epistemics.filter((e: string) => e === 'ONBEKEND').length;

                  // Nuance field aggregates
                  const withConfidence = withAnalysis.filter((m: any) => m.analysis?.confidence != null);
                  const avgConfidence = withConfidence.length > 0 ? withConfidence.reduce((sum: number, m: any) => sum + m.analysis.confidence, 0) / withConfidence.length : null;
                  const withBorderline = withAnalysis.filter((m: any) => (m.analysis?.borderline_dimensions?.length ?? 0) > 0);
                  const withSecondary = withAnalysis.filter((m: any) => m.analysis?.secondary_bands && Object.keys(m.analysis.secondary_bands).length > 0);

                  const guardLabels = withMech.map((m: any) => m.mechanical?.epistemicGuardResult?.label).filter(Boolean);
                  const guardOk = guardLabels.filter((l: string) => l === 'OK').length;
                  const guardCaution = guardLabels.filter((l: string) => l === 'CAUTION').length;
                  const guardVerify = guardLabels.filter((l: string) => l === 'VERIFY').length;

                  return (
                    <>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-foreground">{modelMsgs.length}</p>
                          <p className="text-[10px] text-muted-foreground">Model berichten</p>
                          <p className="text-xs text-muted-foreground mt-1">{withMech.length} met mechanical data</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className={`text-3xl font-bold ${repairCount === 0 ? 'text-green-500' : 'text-yellow-500'}`}>{repairCount}</p>
                          <p className="text-[10px] text-muted-foreground">Repairs</p>
                          <p className="text-xs text-muted-foreground mt-1">van {withMech.length} berichten</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className={`text-3xl font-bold ${avgGFactor === null ? 'text-muted-foreground' : avgGFactor >= 0.8 ? 'text-green-500' : avgGFactor >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {avgGFactor !== null ? `${(avgGFactor * 100).toFixed(0)}%` : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Gem. gFactor</p>
                          <p className="text-xs text-muted-foreground mt-1">{gFactors.length} metingen</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <div className="flex justify-center gap-2">
                            <Badge className="text-[8px] bg-green-500/20 text-green-400">{optimalCount} OPT</Badge>
                            <Badge className="text-[8px] bg-yellow-500/20 text-yellow-400">{driftCount} DRF</Badge>
                            <Badge className="text-[8px] bg-red-500/20 text-red-400">{criticalCount} CRT</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">Alignment</p>
                        </CardContent>
                      </Card>

                      {/* Second row: epistemic breakdown */}
                      <Card className="col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase tracking-wider">Epistemic Status (analysis)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[9px]">FEIT: {feitCount}</Badge>
                            <Badge variant="outline" className="text-[9px]">INTERPRETATIE: {interpCount}</Badge>
                            <Badge variant="outline" className="text-[9px]">SPECULATIE: {specCount}</Badge>
                            <Badge variant="outline" className="text-[9px]">ONBEKEND: {onbekendCount}</Badge>
                          </div>
                          {epistemics.length === 0 && <p className="text-xs text-muted-foreground mt-2">Geen epistemic data beschikbaar</p>}
                        </CardContent>
                      </Card>
                      <Card className="col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs uppercase tracking-wider">Epistemic Guard (mechanical)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="text-[9px] bg-green-500/20 text-green-400">OK: {guardOk}</Badge>
                            <Badge className="text-[9px] bg-yellow-500/20 text-yellow-400">CAUTION: {guardCaution}</Badge>
                            <Badge className="text-[9px] bg-red-500/20 text-red-400">VERIFY: {guardVerify}</Badge>
                          </div>
                          {guardLabels.length === 0 && <p className="text-xs text-muted-foreground mt-2">Geen guard data (pas beschikbaar na patch 2 deploy)</p>}
                        </CardContent>
                      </Card>

                      {/* Nuance fields aggregate row */}
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className={`text-3xl font-bold ${avgConfidence === null ? 'text-muted-foreground' : avgConfidence >= 0.7 ? 'text-green-500' : avgConfidence >= 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {avgConfidence !== null ? `${(avgConfidence * 100).toFixed(0)}%` : '—'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Gem. Confidence</p>
                          <p className="text-xs text-muted-foreground mt-1">{withConfidence.length} van {withAnalysis.length} analyses</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-foreground">{withBorderline.length}</p>
                          <p className="text-[10px] text-muted-foreground">Met Borderline</p>
                          <p className="text-xs text-muted-foreground mt-1">van {withAnalysis.length} analyses</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-foreground">{withSecondary.length}</p>
                          <p className="text-[10px] text-muted-foreground">Met Secondary Bands</p>
                          <p className="text-xs text-muted-foreground mt-1">van {withAnalysis.length} analyses</p>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              {/* Per-message detail table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Pipeline Detail per Bericht
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[400px] overflow-y-auto border border-border rounded">
                    <table className="w-full text-[10px]">
                      <thead className="bg-secondary/50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Tijd</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Model</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Latency</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">gFactor</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Alignment</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Repairs</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Healing</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Epist. Status</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Guard</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Conf.</th>
                          <th className="text-left px-2 py-1 text-muted-foreground font-mono">Border.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbMessages.filter((m: any) => m.role === 'model').slice(0, 100).map((m: any) => {
                          const mech = m.mechanical as any;
                          const anal = m.analysis as any;
                          return (
                            <tr key={m.id} className="border-t border-border hover:bg-secondary/30">
                              <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                                {new Date(m.created_at).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                              </td>
                              <td className="px-2 py-1.5 text-foreground font-mono">{mech?.model ?? '—'}</td>
                              <td className="px-2 py-1.5 text-muted-foreground">{mech?.latencyMs != null ? `${mech.latencyMs}ms` : '—'}</td>
                              <td className="px-2 py-1.5">
                                {mech?.semanticValidation?.gFactor != null
                                  ? <span className={`font-mono ${mech.semanticValidation.gFactor >= 0.8 ? 'text-green-500' : mech.semanticValidation.gFactor >= 0.5 ? 'text-yellow-500' : 'text-red-500'}`}>{(mech.semanticValidation.gFactor * 100).toFixed(0)}%</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-2 py-1.5">
                                {mech?.semanticValidation?.alignment_status
                                  ? <Badge variant="outline" className={`text-[8px] ${mech.semanticValidation.alignment_status === 'OPTIMAL' ? 'border-green-500/50 text-green-400' : mech.semanticValidation.alignment_status === 'DRIFT' ? 'border-yellow-500/50 text-yellow-400' : 'border-red-500/50 text-red-400'}`}>{mech.semanticValidation.alignment_status}</Badge>
                                  : <span className="text-muted-foreground">—</span>}
                              </td>
                              <td className="px-2 py-1.5">{(mech?.repairAttempts ?? 0) > 0 ? <Badge className="text-[8px] bg-yellow-500/20 text-yellow-400">{mech.repairAttempts}</Badge> : '0'}</td>
                              <td className="px-2 py-1.5">{(mech?.healingEventCount ?? 0) > 0 ? <Badge className="text-[8px] bg-orange-500/20 text-orange-400">{mech.healingEventCount}</Badge> : '0'}</td>
                              <td className="px-2 py-1.5">{anal?.epistemic_status ? <Badge variant="outline" className="text-[8px]">{anal.epistemic_status}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{mech?.epistemicGuardResult?.label ? <Badge variant="outline" className={`text-[8px] ${mech.epistemicGuardResult.label === 'OK' ? 'border-green-500/50 text-green-400' : mech.epistemicGuardResult.label === 'CAUTION' ? 'border-yellow-500/50 text-yellow-400' : 'border-red-500/50 text-red-400'}`}>{mech.epistemicGuardResult.label}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{anal?.confidence != null ? <span className={`text-[9px] font-mono ${anal.confidence >= 0.7 ? 'text-green-500' : anal.confidence >= 0.4 ? 'text-yellow-500' : 'text-red-500'}`}>{(anal.confidence * 100).toFixed(0)}%</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-2 py-1.5">{anal?.borderline_dimensions?.length > 0 ? <Badge variant="outline" className="text-[8px] border-amber-500/40 text-amber-400">{anal.borderline_dimensions.join(', ')}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                            </tr>
                          );
                        })}
                        {dbMessages.filter((m: any) => m.role === 'model').length === 0 && (
                          <tr><td colSpan={11} className="px-2 py-4 text-center text-muted-foreground">Geen model berichten gevonden</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Storage Inspector Tab */}
          <TabsContent value="storage">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Storage Stats */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-primary" />
                    Storage Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {systemHealth && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Quota Usage</span>
                          <span className="text-foreground">{systemHealth.storage.quotaEstimate.toFixed(2)}%</span>
                        </div>
                        <Progress value={systemHealth.storage.quotaEstimate} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{systemHealth.storage.keyCount}</p>
                          <p className="text-[10px] text-muted-foreground">Total Keys</p>
                        </div>
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{(systemHealth.storage.usedBytes / 1024).toFixed(1)}KB</p>
                          <p className="text-[10px] text-muted-foreground">Used Space</p>
                        </div>
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{systemHealth.storage.profilesFound}</p>
                          <p className="text-[10px] text-muted-foreground">Profiles</p>
                        </div>
                        <div className="p-2 rounded bg-secondary/50">
                          <p className="text-lg font-bold text-foreground">{systemHealth.storage.sessionsFound}</p>
                          <p className="text-[10px] text-muted-foreground">Sessions</p>
                        </div>
                      </div>
                      {systemHealth.storage.corruptKeys.length > 0 && (
                        <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
                          <p className="text-xs text-red-400">
                            {systemHealth.storage.corruptKeys.length} corrupt keys detected
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Storage Items */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    LocalStorage Items ({storageItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {storageItems.map((item) => (
                      <div 
                        key={item.key}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStorageItem?.key === item.key 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border bg-secondary/30 hover:bg-secondary/50'
                        } ${item.isCorrupt ? 'border-red-500/50' : ''}`}
                        onClick={() => setSelectedStorageItem(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge className={`text-[9px] ${getStorageTypeColor(item.type)}`}>
                              {item.type}
                            </Badge>
                            <span className="text-xs font-mono text-foreground truncate">{item.key}</span>
                            {item.isCorrupt && (
                              <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-muted-foreground">{item.size}b</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStorageItem(item.key);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {selectedStorageItem?.key === item.key && (
                          <pre className="mt-2 p-2 rounded bg-background text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-32">
                            {JSON.stringify(item.value, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    {storageItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">LocalStorage is leeg</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Admin Actions Tab */}
          <TabsContent value="actions">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-destructive" />
                    Destructive Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={() => handleAdminAction('CLEAR_CACHE')}
                    disabled={isRunningAction}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Cache
                    <span className="ml-auto text-xs opacity-70">Wist alle localStorage</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => handleAdminAction('RESET_IDENTITY')}
                    disabled={isRunningAction}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Identity
                    <span className="ml-auto text-xs opacity-70">Nieuwe gebruiker-ID</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => handleAdminAction('FIX_CORRUPTION')}
                    disabled={isRunningAction}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Fix Corruption
                    <span className="ml-auto text-xs opacity-70">Verwijdert corrupte keys</span>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" />
                    Export & Debug
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleAdminAction('EXPORT_LOGS')}
                    disabled={isRunningAction}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Audit Log
                    <span className="ml-auto text-xs opacity-70">JSON download</span>
                  </Button>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h4 className="text-xs font-bold text-foreground mb-2">SSOT Version</h4>
                    <p className="text-sm font-mono text-primary">{systemHealth?.version || 'Loading...'}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h4 className="text-xs font-bold text-foreground mb-2">Study Load</h4>
                    <p className="text-sm font-mono text-muted-foreground">
                      {systemHealth?.totalStudyTime || 0} minuten ({((systemHealth?.totalStudyTime || 0) / 60).toFixed(1)} uur)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SSOT Browser Tab */}
          <TabsContent value="ssot">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    10D Matrix - Rubrics (v{getSSOTVersion()})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ssotDimensions.map((dim) => (
                      <div 
                        key={dim.code}
                        className="p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-10 h-10 rounded bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                            {dim.code}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-foreground block">{dim.name}</span>
                            <span className="text-[10px] text-muted-foreground">{dim.bandCount} bands</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{dim.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {dim.bands.map((band) => (
                            <span 
                              key={band.band_id} 
                              className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono"
                              title={band.description}
                            >
                              {band.band_id}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Commands Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Command Library ({Object.keys(getCommands()).length} commands)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {Object.entries(getCommands()).map(([cmd, desc]) => (
                      <div 
                        key={cmd}
                        className="p-2 rounded bg-secondary/30 border border-border"
                      >
                        <code className="text-xs text-primary font-mono">{cmd}</code>
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{String(desc)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Logic Gates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    Logic Gates ({getLogicGates().length} rules)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {getLogicGates().map((gate, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded border ${
                          gate.priority === 'CRITICAL' ? 'border-destructive/50 bg-destructive/5' :
                          gate.priority === 'HIGH' ? 'border-orange-500/50 bg-orange-500/5' :
                          'border-border bg-secondary/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <code className="text-xs font-mono text-foreground">{gate.trigger_band}</code>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            gate.priority === 'CRITICAL' ? 'bg-destructive/20 text-destructive' :
                            gate.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {gate.priority}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{gate.condition}</p>
                        <p className="text-[10px] text-primary mt-1">{gate.enforcement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EITL Plugin Tab */}
          <TabsContent value="eitl">
            <div className="space-y-6">
              {/* SUPERUSER: Wizard toggle */}
              {isSuperUser && !showWizard && (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setShowWizard(true)}>
                    {hasActivePlugin() ? (
                      <><Edit className="w-4 h-4 mr-1" />Plugin bewerken</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-1" />Nieuwe plugin aanmaken</>
                    )}
                  </Button>
                </div>
              )}

              {/* Wizard (SUPERUSER only) */}
              {isSuperUser && showWizard && (
                <EITLWizard
                  existingPlugin={hasActivePlugin() ? (() => {
                    const p = getActivePlugin()!;
                    return {
                      id: p.id,
                      school_id: p.school_id,
                      school_name: p.school_name,
                      plugin_json: p.plugin_json,
                      change_notes: p.change_notes,
                    };
                  })() : null}
                  onClose={() => setShowWizard(false)}
                  onSaved={() => {
                    setShowWizard(false);
                    // Force re-render by reloading system data
                    loadSystemData();
                  }}
                />
              )}

              {/* Plugin Status (visible to all admins) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    School Plugin Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasActivePlugin() ? (() => {
                    const plugin = getActivePlugin()!;
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-foreground">Plugin Actief</span>
                          </div>
                          {isSuperUser && (
                            <Switch
                              checked={plugin.is_active}
                              onCheckedChange={async (checked) => {
                                try {
                                  await supabase
                                    .from('school_ssot')
                                    .update({ is_active: checked })
                                    .eq('id', plugin.id);
                                  await supabase
                                    .from('ssot_changes')
                                    .insert({
                                      plugin_id: plugin.id,
                                      school_id: plugin.school_id,
                                      performed_by: user!.id,
                                      action: checked ? 'ACTIVATED' : 'DEACTIVATED',
                                      change_notes: checked ? 'Plugin geactiveerd' : 'Plugin gedeactiveerd',
                                    });
                                  clearSSOTCache();
                                  toast({
                                    title: checked ? 'Plugin geactiveerd' : 'Plugin gedeactiveerd',
                                    description: checked ? 'School plugin is nu actief.' : 'Base SSOT wordt nu gebruikt.',
                                  });
                                  loadSystemData();
                                } catch {
                                  toast({ title: 'Fout', description: 'Kon plugin status niet wijzigen.', variant: 'destructive' });
                                }
                              }}
                            />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded bg-secondary/30 border border-border">
                            <span className="text-muted-foreground">School</span>
                            <p className="font-medium text-foreground mt-1">{plugin.school_name}</p>
                          </div>
                          <div className="p-3 rounded bg-secondary/30 border border-border">
                            <span className="text-muted-foreground">School ID</span>
                            <p className="font-mono font-medium text-foreground mt-1">{plugin.school_id}</p>
                          </div>
                          <div className="p-3 rounded bg-secondary/30 border border-border">
                            <span className="text-muted-foreground">Gebaseerd op</span>
                            <p className="font-mono text-foreground mt-1">SSOT v{plugin.based_on_version}</p>
                          </div>
                          <div className="p-3 rounded bg-secondary/30 border border-border">
                            <span className="text-muted-foreground">Laatst bijgewerkt</span>
                            <p className="text-foreground mt-1">{new Date(plugin.updated_at).toLocaleDateString('nl-NL')}</p>
                          </div>
                        </div>
                        {plugin.change_notes && (
                          <div className="p-3 rounded bg-secondary/30 border border-border text-xs">
                            <span className="text-muted-foreground">Notities:</span>
                            <p className="text-foreground mt-1">{plugin.change_notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="text-center py-8">
                      <Layers className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Geen school plugin actief</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">De base SSOT v{getSSOTVersion()} wordt gebruikt</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Version History + Audit Trail (SUPERUSER sees rollback, ADMIN sees read-only) */}
              {(hasActivePlugin() ? getActivePlugin()!.school_id : adminSchoolId) && (
                <PluginVersionHistory
                  schoolId={(hasActivePlugin() ? getActivePlugin()!.school_id : adminSchoolId)!}
                  onRollback={() => { loadSystemData(); if (!hasActivePlugin() && adminSchoolId) setAdminSchoolId(adminSchoolId); }}
                />
              )}

              {/* Effective SSOT Diff */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-primary" />
                    Base vs Effective SSOT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasActivePlugin() ? (
                    <p className="text-sm text-muted-foreground">Geen plugin actief — effective SSOT is identiek aan base.</p>
                  ) : (() => {
                    const plugin = getActivePlugin()!;
                    const pj = plugin.plugin_json;
                    const bandOverrides = pj.bands ? Object.keys(pj.bands) : [];
                    const cmdOverrides = pj.commands ? Object.keys(pj.commands) : [];
                    const srlOverrides = pj.srl_states ? Object.keys(pj.srl_states) : [];
                    const gateAnnotations = pj.logic_gate_annotations ? Object.keys(pj.logic_gate_annotations) : [];

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
                            <p className="text-2xl font-bold text-primary">{bandOverrides.length}</p>
                            <p className="text-[10px] text-muted-foreground">Band overrides</p>
                          </div>
                          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
                            <p className="text-2xl font-bold text-primary">{cmdOverrides.length}</p>
                            <p className="text-[10px] text-muted-foreground">Command overrides</p>
                          </div>
                          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
                            <p className="text-2xl font-bold text-primary">{srlOverrides.length}</p>
                            <p className="text-[10px] text-muted-foreground">SRL overrides</p>
                          </div>
                          <div className="p-3 rounded bg-secondary/30 border border-border text-center">
                            <p className="text-2xl font-bold text-primary">{gateAnnotations.length}</p>
                            <p className="text-[10px] text-muted-foreground">Gate annotations</p>
                          </div>
                        </div>

                        {/* Band diff detail */}
                        {bandOverrides.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-foreground mb-2">Band Overrides</h4>
                            <div className="space-y-2">
                              {bandOverrides.map(bandId => {
                                const overlay = pj.bands![bandId];
                                const baseBand = BASE_SSOT.rubrics.flatMap(r => r.bands).find(b => b.band_id === bandId);
                                return (
                                  <div key={bandId} className="p-3 rounded bg-secondary/20 border border-border text-xs">
                                    <code className="font-mono text-primary font-bold">{bandId}</code>
                                    {overlay.label && (
                                      <div className="mt-1">
                                        <span className="text-muted-foreground">Label: </span>
                                        <span className="text-destructive line-through mr-2">{baseBand?.label}</span>
                                        <span className="text-green-500">{overlay.label}</span>
                                      </div>
                                    )}
                                    {overlay.description && (
                                      <div className="mt-1">
                                        <span className="text-muted-foreground">Beschrijving: </span>
                                        <span className="text-green-500">{overlay.description.slice(0, 80)}…</span>
                                      </div>
                                    )}
                                    {overlay.didactic_principle && (
                                      <div className="mt-1">
                                        <span className="text-muted-foreground">Principe: </span>
                                        <span className="text-green-500">{overlay.didactic_principle.slice(0, 80)}…</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Command diff detail */}
                        {cmdOverrides.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-foreground mb-2">Command Overrides</h4>
                            <div className="space-y-1">
                              {cmdOverrides.map(cmd => (
                                <div key={cmd} className="p-2 rounded bg-secondary/20 border border-border text-xs">
                                  <code className="font-mono text-primary">{cmd}</code>
                                  <span className="text-muted-foreground ml-2">→</span>
                                  <span className="text-green-500 ml-2">{String(pj.commands![cmd]).slice(0, 100)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Gate annotations */}
                        {gateAnnotations.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-foreground mb-2">Logic Gate Annotations</h4>
                            <div className="space-y-1">
                              {gateAnnotations.map(bandId => {
                                const ann = pj.logic_gate_annotations![bandId];
                                return (
                                  <div key={bandId} className="p-2 rounded bg-secondary/20 border border-border text-xs">
                                    <code className="font-mono text-primary font-bold">{bandId}</code>
                                    {ann.rationale && <p className="text-muted-foreground mt-1">Rationale: {ann.rationale}</p>}
                                    {ann.teacher_note && <p className="text-muted-foreground mt-1">Docentnotitie: {ann.teacher_note}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          {/* Observability Tab */}
          <TabsContent value="observability">
            <ObservabilityPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
